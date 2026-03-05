/**
 * MemoryCompressor - Compressão de eventos em memórias consolidadas
 * Transforma múltiplos eventos relacionados em uma única memória estruturada
 */

import type { MemoryId, MemoryNode, MemoryContent, MemorySummary, MemoryEvent } from '../core/types.js';
import { MemoryTree } from '../core/memory-tree.js';

export interface CompressorConfig {
  /** Número mínimo de eventos para compressão */
  minEvents: number;
  /** Número máximo de eventos para comprimir de uma vez */
  maxEvents: number;
  /** Usar LLM para sumarização */
  useLLM: boolean;
  /** LLM function */
  llm?: (prompt: string) => Promise<string>;
  /** Auto-comprimir quando threshold for atingido */
  autoCompress: boolean;
}

export interface CompressionGroup {
  parentId: MemoryId;
  events: MemoryEvent[];
  nodeIds: MemoryId[];
  suggestedSummary: MemorySummary;
  confidence: number;
}

export interface CompressionResult {
  success: boolean;
  compressedNodeId?: MemoryId;
  originalNodeIds: MemoryId[];
  reason: string;
}

export class MemoryCompressor {
  private tree: MemoryTree;
  private config: CompressorConfig;

  constructor(tree: MemoryTree, config?: Partial<CompressorConfig>) {
    this.tree = tree;
    this.config = {
      minEvents: 5,
      maxEvents: 20,
      useLLM: false,
      autoCompress: false,
      ...config,
    };
  }

  /**
   * Identifica grupos de nós que podem ser comprimidos
   */
  findCompressionCandidates(): CompressionGroup[] {
    const groups: CompressionGroup[] = [];
    const nodes = this.tree.getAllNodes();

    // Agrupar por pai
    const parentMap = new Map<MemoryId, MemoryNode[]>();

    for (const node of nodes) {
      if (!node.parent) continue;

      const siblings = parentMap.get(node.parent) || [];
      siblings.push(node);
      parentMap.set(node.parent, siblings);
    }

    // Encontrar grupos com muitos eventos
    for (const [parentId, siblings] of parentMap.entries()) {
      if (siblings.length >= this.config.minEvents) {
        const group = this.createCompressionGroup(parentId, siblings);
        if (group) {
          groups.push(group);
        }
      }
    }

    return groups;
  }

  /**
   * Comprime um grupo de nós em uma única memória
   */
  async compress(group: CompressionGroup): Promise<CompressionResult> {
    // Validar grupo
    if (group.events.length < this.config.minEvents) {
      return {
        success: false,
        originalNodeIds: group.nodeIds,
        reason: `Insufficient events: ${group.events.length} < ${this.config.minEvents}`,
      };
    }

    if (group.events.length > this.config.maxEvents) {
      return {
        success: false,
        originalNodeIds: group.nodeIds,
        reason: `Too many events: ${group.events.length} > ${this.config.maxEvents}`,
      };
    }

    // Gerar summary comprimido
    const summary = await this.generateCompressedSummary(group);

    // Criar conteúdo comprimido
    const content = await this.generateCompressedContent(group);

    // Adicionar nó comprimido na árvore
    const compressedNode = this.tree.addNode(
      group.parentId,
      'semantic', // Memórias comprimidas são tratadas como semantic
      content,
      {
        title: summary.title,
        keywords: summary.keywords,
        importance: Math.min(10, summary.importance + 1), // Comprimidas têm maior importância
      }
    );

    // Marcar nós originais como comprimidos
    for (const nodeId of group.nodeIds) {
      this.tree.updateNode(nodeId, {
        status: 'compressed',
      });
    }

    return {
      success: true,
      compressedNodeId: compressedNode.id,
      originalNodeIds: group.nodeIds,
      reason: `Compressed ${group.events.length} events into 1 memory`,
    };
  }

  /**
   * Compressão automática baseada em threshold
   */
  async autoCompress(): Promise<CompressionResult[]> {
    const candidates = this.findCompressionCandidates();
    const results: CompressionResult[] = [];

    for (const group of candidates) {
      const result = await this.compress(group);
      results.push(result);
    }

    return results;
  }

  /**
   * Descomprime uma memória (restaura nós originais)
   */
  decompress(compressedNodeId: MemoryId): boolean {
    const node = this.tree.getNode(compressedNodeId);
    if (!node) return false;

    // Encontrar nós comprimidos filhos
    const children = this.tree.getChildren(compressedNodeId);
    let restored = 0;

    for (const child of children) {
      if (child.status === 'compressed') {
        this.tree.updateNode(child.id, {
          status: 'active',
        });
        restored++;
      }
    }

    // Remover nó comprimido
    if (restored > 0) {
      this.tree.removeNode(compressedNodeId);
    }

    return restored > 0;
  }

  /**
   * Cria grupo de compressão a partir de siblings
   */
  private createCompressionGroup(
    parentId: MemoryId,
    siblings: MemoryNode[]
  ): CompressionGroup | null {
    // Filtrar apenas nós ativos
    const activeSiblings = siblings.filter(n => n.status === 'active');

    if (activeSiblings.length < this.config.minEvents) {
      return null;
    }

    // Extrair eventos dos nós
    const events: MemoryEvent[] = [];
    const nodeIds: MemoryId[] = [];

    for (const sibling of activeSiblings.slice(0, this.config.maxEvents)) {
      nodeIds.push(sibling.id);

      if (sibling.content.type === 'event') {
        events.push(sibling.content.event);
      } else if (sibling.content.type === 'text') {
        // Converter texto em evento
        events.push({
          type: 'text_event',
          timestamp: sibling.summary.createdAt,
          data: { text: sibling.content.value },
        });
      }
    }

    // Gerar summary sugerido
    const suggestedSummary = this.generateSuggestedSummary(events, siblings);

    return {
      parentId,
      events,
      nodeIds,
      suggestedSummary,
      confidence: this.calculateCompressionConfidence(events, siblings),
    };
  }

  /**
   * Gera summary para memória comprimida
   */
  private async generateCompressedSummary(
    group: CompressionGroup
  ): Promise<MemorySummary> {
    // Se LLM disponível, usar para gerar summary
    if (this.config.llm && this.config.useLLM) {
      const eventsText = group.events
        .map(e => JSON.stringify(e.data))
        .join('\n');

      const prompt = `Summarize these ${group.events.length} events into a concise title and 5 keywords:
${eventsText}

Return JSON: { title: string, keywords: string[], importance: number }`;

      try {
        const response = await this.config.llm(prompt);
        const parsed = JSON.parse(response);
        return {
          title: parsed.title || 'Compressed Memory',
          keywords: parsed.keywords || [],
          importance: parsed.importance || 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch {
        // Fallback para método determinístico
      }
    }

    // Método determinístico
    return {
      title: `Compressed: ${group.events.length} events`,
      keywords: this.extractCommonKeywords(group.events),
      importance: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Gera conteúdo comprimido
   */
  private async generateCompressedContent(
    group: CompressionGroup
  ): Promise<MemoryContent> {
    // Se LLM disponível, criar resumo estruturado
    if (this.config.llm && this.config.useLLM) {
      const eventsText = group.events
        .map(e => JSON.stringify(e.data))
        .join('\n');

      const prompt = `Create a structured summary of these events:
${eventsText}

Return a concise paragraph summarizing the key points.`;

      try {
        const response = await this.config.llm(prompt);
        return {
          type: 'text',
          value: response,
        };
      } catch {
        // Fallback
      }
    }

    // Fallback: lista estruturada de eventos
    return {
      type: 'structured',
      data: {
        compressionType: 'event_list',
        eventCount: group.events.length,
        dateRange: {
          start: group.events[0]?.timestamp,
          end: group.events[group.events.length - 1]?.timestamp,
        },
        events: group.events.map(e => ({
          type: e.type,
          timestamp: e.timestamp,
        })),
      },
    };
  }

  /**
   * Gera summary sugerido (sem LLM)
   */
  private generateSuggestedSummary(
    events: MemoryEvent[],
    nodes: MemoryNode[]
  ): MemorySummary {
    // Extrair keywords comuns
    const keywords = this.extractCommonKeywords(events);

    // Calcular importância média
    const avgImportance =
      nodes.reduce((sum, n) => sum + n.summary.importance, 0) / nodes.length;

    // Criar título baseado no tipo de evento mais comum
    const typeCount = new Map<string, number>();
    for (const event of events) {
      typeCount.set(event.type, (typeCount.get(event.type) || 0) + 1);
    }

    const mostCommonType = Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'event';

    return {
      title: `${events.length} ${mostCommonType}(s) - ${keywords.slice(0, 2).join(', ')}`,
      keywords,
      importance: Math.round(avgImportance * 10) / 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Extrai keywords comuns dos eventos
   */
  private extractCommonKeywords(events: MemoryEvent[]): string[] {
    const keywordCount = new Map<string, number>();

    for (const event of events) {
      // Adicionar tipo
      keywordCount.set(event.type, (keywordCount.get(event.type) || 0) + 1);

      // Adicionar tags se existirem
      if (event.metadata?.tags) {
        for (const tag of event.metadata.tags) {
          keywordCount.set(tag, (keywordCount.get(tag) || 0) + 1);
        }
      }

      // Extrair palavras do data
      const dataStr = JSON.stringify(event.data).toLowerCase();
      const words = dataStr.split(/\W+/).filter(w => w.length > 3);

      for (const word of words.slice(0, 10)) {
        keywordCount.set(word, (keywordCount.get(word) || 0) + 1);
      }
    }

    // Retornar keywords mais frequentes
    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  /**
   * Calcula confiança da compressão
   */
  private calculateCompressionConfidence(
    events: MemoryEvent[],
    nodes: MemoryNode[]
  ): number {
    let confidence = 0.7; // Base

    // Eventos similares aumentam confiança
    const uniqueTypes = new Set(events.map(e => e.type));
    if (uniqueTypes.size === 1) {
      confidence += 0.2; // Todos mesmos tipo
    } else if (uniqueTypes.size <= 3) {
      confidence += 0.1; // Poucos tipos diferentes
    }

    // Keywords sobrepostas aumentam confiança
    const allKeywords = nodes.flatMap(n => n.summary.keywords);
    const keywordSet = new Set(allKeywords);
    const overlapRatio = allKeywords.length / keywordSet.size;

    if (overlapRatio > 2) {
      confidence += 0.1; // Muitas keywords repetidas
    }

    return Math.min(1, confidence);
  }

  /**
   * Estatísticas de compressão
   */
  getCompressionStats(): {
    totalNodes: number;
    compressedNodes: number;
    compressionRatio: number;
  } {
    const nodes = this.tree.getAllNodes();
    const compressed = nodes.filter(n => n.status === 'compressed');

    return {
      totalNodes: nodes.length,
      compressedNodes: compressed.length,
      compressionRatio: compressed.length / nodes.length,
    };
  }
}
