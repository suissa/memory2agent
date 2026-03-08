/**
 * Memory2Agent - API Principal
 * Integra todos os módulos em uma interface unificada
 * Everything-as-Code: Configuração centralizada
 */

import { MemoryTree } from './core/memory-tree.js';
import { MemoryEncoder, type EncoderOptions } from './encoder/memory-encoder.js';
import { MemoryRouter, type RouterOptions } from './router/memory-router.js';
import { MemoryRetriever, type RetrieverOptions } from './retriever/memory-retriever.js';
import { MemoryCompressor, type CompressorOptions } from './compressor/memory-compressor.js';
import type {
  MemoryEvent,
  MemoryContext,
  MemoryRetrievalResult,
  MemoryId,
  MemoryNode,
  MemoryType,
} from './core/types.js';
import type {
  Memory2AgentFullConfig,
  Memory2AgentGlobalConfig,
} from './config/types.js';
import { DEFAULT_CONFIG, mergeConfig, PRESETS } from './config/types.js';

export interface Memory2AgentOptions {
  /** Nome da configuração (para identificação) */
  name?: string;
  /** Usar preset específico */
  preset?: keyof typeof PRESETS;
  /** Configuração completa (override) */
  config?: Partial<Memory2AgentFullConfig>;
  /** Configuração global */
  global?: Partial<Memory2AgentGlobalConfig>;
  /** Função LLM opcional */
  llm?: (prompt: string) => Promise<string>;
}

/**
 * Classe principal Memory2Agent
 * 
 * @example
 * ```typescript
 * // Uso básico
 * const memory = new Memory2Agent();
 * 
 * // Com preset
 * const memory = new Memory2Agent({ preset: 'advanced' });
 * 
 * // Com config customizada
 * const memory = new Memory2Agent({
 *   config: {
 *     encoder: { maxKeywords: 10 },
 *     retriever: { maxResults: 20 },
 *   }
 * });
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
  private config: Memory2AgentFullConfig;
  private eventCount: number = 0;
  private llm?: (prompt: string) => Promise<string>;

  constructor(options?: Memory2AgentOptions) {
    // Carregar configuração base
    let baseConfig = { ...DEFAULT_CONFIG };

    // Aplicar preset se especificado
    if (options?.preset) {
      const preset = PRESETS[options.preset];
      if (preset) {
        baseConfig = mergeConfig(baseConfig, preset);
      }
    }

    // Aplicar config customizada
    if (options?.config) {
      baseConfig = mergeConfig(baseConfig, options.config);
    }

    // Atualizar nome se especificado
    if (options?.name) {
      baseConfig.name = options.name;
    }

    this.config = baseConfig;
    this.llm = options?.llm;

    // Inicializar componentes com configs
    const treeOptions = { config: this.config.tree };
    this.tree = new MemoryTree(treeOptions);

    const encoderOptions: EncoderOptions = {
      config: this.config.encoder,
      llm: this.llm,
    };
    this.encoder = new MemoryEncoder(encoderOptions);

    const routerOptions: RouterOptions = {
      config: this.config.router,
    };
    this.router = new MemoryRouter(this.tree, routerOptions);

    const retrieverOptions: RetrieverOptions = {
      config: this.config.retriever,
      llm: this.llm,
    };
    this.retriever = new MemoryRetriever(this.tree, retrieverOptions);

    const compressorOptions: CompressorOptions = {
      config: this.config.compressor,
      llm: this.llm,
    };
    this.compressor = new MemoryCompressor(this.tree, compressorOptions);
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
    if (this.config.global.autoCompress && this.eventCount >= this.config.global.autoCompressThreshold) {
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

    if (this.config.global.autoCompress) {
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
   * Obtém configuração atual
   */
  getConfig(): Memory2AgentFullConfig {
    return { ...this.config };
  }

  /**
   * Define função LLM para encoding/retrieval
   */
  setLLM(llm: (prompt: string) => Promise<string>): void {
    this.llm = llm;

    // Re-inicializar componentes com LLM
    this.encoder = new MemoryEncoder({
      config: this.config.encoder,
      llm: this.llm,
    });

    this.retriever = new MemoryRetriever(this.tree, {
      config: this.config.retriever,
      llm: this.llm,
    });

    this.compressor = new MemoryCompressor(this.tree, {
      config: this.config.compressor,
      llm: this.llm,
    });
  }
}

// Exportar tipos e configs
export * from './core/types.js';
export * from './encoder/memory-encoder.js';
export * from './router/memory-router.js';
export * from './retriever/memory-retriever.js';
export * from './compressor/memory-compressor.js';
export * from './config/types.js';
export * from './config/loader.js';
