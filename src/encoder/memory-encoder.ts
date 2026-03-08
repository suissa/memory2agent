/**
 * MemoryEncoder - Transforma eventos em memória estruturada
 * Usa LLM para extrair significado e criar summaries
 */

import type { MemoryEvent, MemoryContent, MemorySummary, MemoryType } from '../core/types.js';
import type { MemoryEncoderConfig } from '../config/types.js';
import { DEFAULT_CONFIG } from '../config/types.js';

export interface EncoderOptions {
  config?: Partial<MemoryEncoderConfig>;
  llm?: (prompt: string) => Promise<string>;
}

export interface EncodedMemory {
  type: MemoryType;
  content: MemoryContent;
  summary: MemorySummary;
  confidence: number;
}

export class MemoryEncoder {
  private config: MemoryEncoderConfig;
  private llm?: (prompt: string) => Promise<string>;

  constructor(options?: EncoderOptions) {
    this.config = {
      ...DEFAULT_CONFIG.encoder,
      ...options?.config,
    };
    this.llm = options?.llm;
  }

  /**
   * Codifica um evento bruto em memória estruturada
   */
  async encode(event: MemoryEvent): Promise<EncodedMemory> {
    // Extrair tipo de memória baseado no evento
    const memoryType = this.classifyMemoryType(event);

    // Criar conteúdo
    const content = this.createContent(event);

    // Gerar summary
    const summary = await this.generateSummary(event, memoryType);

    // Calcular confiança
    const confidence = this.calculateConfidence(event);

    return {
      type: memoryType,
      content,
      summary,
      confidence,
    };
  }

  /**
   * Codifica múltiplos eventos de uma vez (batch)
   */
  async encodeBatch(events: MemoryEvent[]): Promise<EncodedMemory[]> {
    return Promise.all(events.map(event => this.encode(event)));
  }

  /**
   * Classifica o tipo de memória baseado no evento
   */
  private classifyMemoryType(event: MemoryEvent): MemoryType {
    const eventType = event.type.toLowerCase();
    const dataStr = JSON.stringify(event.data).toLowerCase();

    // Usar mapeamento da config
    if (this.config.eventTypeToMemoryType[eventType]) {
      return this.config.eventTypeToMemoryType[eventType];
    }

    // Fallback para padrões
    if (['message', 'interaction', 'conversation', 'user_action'].includes(eventType)) {
      return 'episodic';
    }

    // Procedural: procedimentos, instruções, como fazer
    if (['procedure', 'instruction', 'howto', 'workflow'].includes(eventType) ||
        dataStr.includes('how to') || dataStr.includes('steps')) {
      return 'procedural';
    }

    // Semantic: fatos, conceitos, informações
    return 'semantic';
  }

  /**
   * Cria conteúdo estruturado a partir do evento
   */
  private createContent(event: MemoryEvent): MemoryContent {
    // Se o evento já tem conteúdo estruturado
    if (event.data.content && typeof event.data.content === 'object') {
      return {
        type: 'structured',
        data: event.data.content as Record<string, unknown>,
      };
    }

    // Se é um evento de mensagem/texto
    if (event.data.message || event.data.text) {
      return {
        type: 'text',
        value: String(event.data.message || event.data.text),
      };
    }

    // Caso contrário, retorna o evento completo
    return {
      type: 'event',
      event,
    };
  }

  /**
   * Gera summary para a memória
   */
  private async generateSummary(
    event: MemoryEvent,
    type: MemoryType
  ): Promise<MemorySummary> {
    const title = await this.extractTitle(event);
    const keywords = this.config.autoKeywords
      ? await this.extractKeywords(event, title)
      : [];
    const importance = this.config.autoImportance
      ? this.calculateImportance(event, type)
      : 5;

    return {
      title,
      keywords,
      importance,
      createdAt: event.timestamp,
      updatedAt: new Date(),
    };
  }

  /**
   * Extrai título do evento
   */
  private async extractTitle(event: MemoryEvent): Promise<string> {
    // Se o LLM está configurado, usar para extrair título
    if (this.config.llm) {
      const prompt = `Extract a short title (max 10 words) from this event:
Type: ${event.type}
Data: ${JSON.stringify(event.data)}
Return ONLY the title.`;

      try {
        const response = await this.config.llm(prompt);
        return response.trim().slice(0, 100);
      } catch {
        // Fallback para método determinístico
      }
    }

    // Método determinístico
    const type = event.type.replace(/_/g, ' ').toUpperCase();
    const dataPreview = JSON.stringify(event.data).slice(0, 50);
    return `${type}: ${dataPreview}...`;
  }

  /**
   * Extrai keywords do evento
   */
  private async extractKeywords(
    event: MemoryEvent,
    title: string
  ): Promise<string[]> {
    // Se o LLM está configurado
    if (this.llm) {
      const prompt = `Extract ${this.config.maxKeywords} keywords from:
${title}
${JSON.stringify(event.data)}
Return comma-separated keywords only.`;

      try {
        const response = await this.llm(prompt);
        return response
          .split(',')
          .map(k => k.trim().toLowerCase())
          .filter(k => k.length > 0)
          .slice(0, this.config.maxKeywords);
      } catch {
        // Fallback
      }
    }

    // Método determinístico: extrair do type e tags
    const keywords: string[] = [];

    // Adicionar tipo
    keywords.push(event.type.toLowerCase());

    // Adicionar tags se existirem
    if (event.metadata?.tags) {
      keywords.push(...event.metadata.tags.slice(0, this.config.maxKeywords - 1));
    }

    return keywords.slice(0, this.config.maxKeywords);
  }

  /**
   * Calcula importância da memória (0-10)
   */
  private calculateImportance(event: MemoryEvent, type: MemoryType): number {
    let importance = this.config.baseImportance; // Base da config

    // Metadata confidence
    if (event.metadata?.confidence) {
      importance = event.metadata.confidence * 10;
    }

    // Tipo influencia importância (boost da config)
    if (type === 'procedural') {
      importance = Math.min(10, importance + this.config.proceduralImportanceBoost);
    }

    // Events com decisões são mais importantes (boost da config)
    const dataStr = JSON.stringify(event.data).toLowerCase();
    if (dataStr.includes('decision') || dataStr.includes('important')) {
      importance = Math.min(10, importance + this.config.decisionImportanceBoost);
    }

    return Math.round(importance * 10) / 10;
  }

  /**
   * Calcula confiança do encoding
   */
  private calculateConfidence(event: MemoryEvent): number {
    let confidence = 0.8; // Base

    // Metadata confidence
    if (event.metadata?.confidence) {
      confidence = event.metadata.confidence;
    }

    // Dados estruturados aumentam confiança
    if (event.data && Object.keys(event.data).length > 0) {
      confidence = Math.min(1, confidence + 0.1);
    }

    return confidence;
  }

  /**
   * Extrai entidades nomeadas do evento (para memória semantic)
   */
  async extractEntities(event: MemoryEvent): Promise<Record<string, string[]>> {
    const entities: Record<string, string[]> = {
      persons: [],
      organizations: [],
      locations: [],
      concepts: [],
    };

    // Se LLM disponível
    if (this.llm) {
      const prompt = `Extract named entities from:
${JSON.stringify(event.data)}
Return JSON: { persons: [], organizations: [], locations: [], concepts: [] }`;

      try {
        const response = await this.llm(prompt);
        return JSON.parse(response);
      } catch {
        // Fallback
      }
    }

    // Fallback: retornar vazio
    return entities;
  }
}
