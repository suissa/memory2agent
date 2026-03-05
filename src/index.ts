/**
 * Memory2Agent - API Principal
 * Integra todos os módulos em uma interface unificada
 */

import { MemoryTree } from './core/memory-tree.js';
import { MemoryEncoder, type EncoderConfig } from './encoder/memory-encoder.js';
import { MemoryRouter, type RouterConfig } from './router/memory-router.js';
import { MemoryRetriever, type RetrieverConfig } from './retriever/memory-retriever.js';
import { MemoryCompressor, type CompressorConfig } from './compressor/memory-compressor.js';
import type {
  MemoryEvent,
  MemoryContext,
  MemoryRetrievalResult,
  MemoryId,
  MemoryNode,
  MemoryType,
} from './core/types.js';

export interface Memory2AgentConfig {
  /** Configuração do encoder */
  encoder?: Partial<EncoderConfig>;
  /** Configuração do router */
  router?: Partial<RouterConfig>;
  /** Configuração do retriever */
  retriever?: Partial<RetrieverConfig>;
  /** Configuração do compressor */
  compressor?: Partial<CompressorConfig>;
  /** Auto-comprimir memórias periodicamente */
  autoCompress: boolean;
  /** Threshold para auto-compressão */
  autoCompressThreshold: number;
}

/**
 * Classe principal Memory2Agent
 * 
 * @example
 * ```typescript
 * const memory = new Memory2Agent();
 * 
 * // Store event
 * await memory.store({
 *   type: 'message',
 *   timestamp: new Date(),
 *   data: { message: 'User prefers dark mode' }
 * });
 * 
 * // Query
 * const result = await memory.query('user preferences');
 * 
 * // Get context for LLM
 * const context = await memory.context('suggest UI settings');
 * ```
 */
export class Memory2Agent {
  private tree: MemoryTree;
  private encoder: MemoryEncoder;
  private router: MemoryRouter;
  private retriever: MemoryRetriever;
  private compressor: MemoryCompressor;
  private config: Memory2AgentConfig;
  private eventCount: number = 0;

  constructor(config?: Partial<Memory2AgentConfig>) {
    this.config = {
      autoCompress: false,
      autoCompressThreshold: 50,
      ...config,
    };

    // Inicializar componentes
    this.tree = new MemoryTree();
    this.encoder = new MemoryEncoder(config?.encoder);
    this.router = new MemoryRouter(this.tree, config?.router);
    this.retriever = new MemoryRetriever(this.tree, config?.retriever);
    this.compressor = new MemoryCompressor(this.tree, config?.compressor);
  }

  /**
   * Armazena um evento na memória
   */
  async store(event: MemoryEvent): Promise<MemoryId> {
    // Codificar evento
    const encoded = await this.encoder.encode(event);

    // Rotear para posição na árvore
    const routing = await this.router.route(encoded);

    // Adicionar nó na árvore
    const node = this.tree.addNode(
      routing.targetParentId,
      encoded.type,
      encoded.content,
      {
        title: encoded.summary.title,
        keywords: encoded.summary.keywords,
        importance: encoded.summary.importance,
      }
    );

    // Incrementar contador
    this.eventCount++;

    // Auto-compressão se habilitado
    if (this.config.autoCompress && this.eventCount >= this.config.autoCompressThreshold) {
      await this.compressor.autoCompress();
      this.eventCount = 0;
    }

    return node.id;
  }

  /**
   * Armazena múltiplos eventos
   */
  async storeBatch(events: MemoryEvent[]): Promise<MemoryId[]> {
    const ids: MemoryId[] = [];

    for (const event of events) {
      const id = await this.store(event);
      ids.push(id);
    }

    return ids;
  }

  /**
   * Query por memórias relevantes
   */
  async query(query: string): Promise<MemoryRetrievalResult[]> {
    return this.retriever.query(query);
  }

  /**
   * Obtém contexto para LLM
   */
  async context(query: string): Promise<MemoryContext> {
    return this.retriever.context(query);
  }

  /**
   * Navega por um caminho na árvore
   */
  traverse(path: string[]): MemoryNode[] {
    return this.retriever.traverse(path);
  }

  /**
   * Explora memórias a partir de um nó
   */
  explore(nodeId: MemoryId, depth?: number): MemoryNode[] {
    return this.retriever.explore(nodeId, depth);
  }

  /**
   * Busca memórias recentes
   */
  recent(limit?: number): MemoryRetrievalResult[] {
    return this.retriever.findRecent(limit);
  }

  /**
   * Busca memórias importantes
   */
  important(limit?: number): MemoryRetrievalResult[] {
    return this.retriever.findImportant(limit);
  }

  /**
   * Comprime memórias manualmente
   */
  async compress(): Promise<void> {
    await this.compressor.autoCompress();
  }

  /**
   * Obtém estatísticas da memória
   */
  getStats(): {
    totalNodes: number;
    eventCount: number;
    compression?: {
      totalNodes: number;
      compressedNodes: number;
      compressionRatio: number;
    };
  } {
    const nodes = this.tree.getAllNodes();
    const stats = {
      totalNodes: nodes.length,
      eventCount: this.eventCount,
    };

    if (this.config.autoCompress) {
      return {
        ...stats,
        compression: this.compressor.getCompressionStats(),
      };
    }

    return stats;
  }

  /**
   * Exporta memória para JSON
   */
  toJSON(): Record<string, unknown> {
    return this.tree.toJSON();
  }

  /**
   * Limpa toda a memória
   */
  clear(): void {
    this.tree.clear();
    this.eventCount = 0;
  }

  /**
   * Remove uma memória por ID
   */
  remove(id: MemoryId): boolean {
    return this.tree.removeNode(id);
  }

  /**
   * Obtém um nó por ID
   */
  getNode(id: MemoryId): MemoryNode | undefined {
    return this.tree.getNode(id);
  }

  /**
   * Atualiza configurações
   */
  updateConfig(config: Partial<Memory2AgentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Define função LLM para encoding/retrieval
   */
  setLLM(llm: (prompt: string) => Promise<string>): void {
    this.encoder = new MemoryEncoder({ ...this.config.encoder, llm });
    this.router = new MemoryRouter(this.tree, this.config.router);
    this.retriever = new MemoryRetriever(this.tree, {
      ...this.config.retriever,
      llm,
      useLLM: true,
    });
    this.compressor = new MemoryCompressor(this.tree, {
      ...this.config.compressor,
      llm,
      useLLM: true,
    });
  }
}

// Exportar tipos
export * from './core/types.js';
export * from './encoder/memory-encoder.js';
export * from './router/memory-router.js';
export * from './retriever/memory-retriever.js';
export * from './compressor/memory-compressor.js';
