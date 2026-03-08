/**
 * Memory2Agent - Configuração Centralizada
 * Everything-as-Code: Todas as configurações externalizadas
 */

/**
 * Configuração do Memory Tree
 */
export interface MemoryTreeConfig {
  /** ID do nó raiz */
  rootId: string;
  /** Título do nó raiz */
  rootTitle: string;
  /** Tipo default do nó raiz */
  rootType: 'episodic' | 'semantic' | 'procedural';
  /** Importância default do nó raiz */
  rootImportance: number;
  /** Keywords iniciais do root */
  rootKeywords: string[];
  /** Prefixo para IDs gerados */
  idPrefix: string;
}

/**
 * Configuração do Memory Encoder
 */
export interface MemoryEncoderConfig {
  /** Extrair keywords automaticamente */
  autoKeywords: boolean;
  /** Calcular importância automaticamente */
  autoImportance: boolean;
  /** Máximo de keywords */
  maxKeywords: number;
  /** Importância base */
  baseImportance: number;
  /** Boost de importância para procedural */
  proceduralImportanceBoost: number;
  /** Boost de importância para decisões */
  decisionImportanceBoost: number;
  /** Stop words para extração de keywords */
  stopWords: string[];
  /** Mapeamento de tipo de evento para tipo de memória */
  eventTypeToMemoryType: Record<string, 'episodic' | 'semantic' | 'procedural'>;
  /** Prefixo para IDs gerados */
  idPrefix: string;
  /** Função LLM para encoding */
  llm?: (prompt: string) => Promise<string>;
}

/**
 * Configuração do Memory Router
 */
export interface MemoryRouterConfig {
  /** Criar automaticamente categorias se não existirem */
  autoCreateCategories: boolean;
  /** Máximo de irmãos antes de sugerir sub-categorização */
  maxSiblings: number;
  /** Usar LLM para decisões de roteamento */
  useLLM: boolean;
  /** Prefixo para IDs de tipo */
  typeRootPrefix: string;
  /** Confiança default para routing */
  defaultRoutingConfidence: number;
  /** Mapeamento de tipo para categoria pai */
  typeParentMapping: {
    episodic: string;
    semantic: string;
    procedural: string;
  };
}

/**
 * Configuração do Memory Retriever
 */
export interface MemoryRetrieverConfig {
  /** Máximo de resultados */
  maxResults: number;
  /** Profundidade máxima de traversal */
  maxDepth: number;
  /** Incluir caminho de traversal no resultado */
  includeTraversalPath: boolean;
  /** Mínimo de importância para considerar */
  minImportance: number;
  /** Usar LLM para matching semântico */
  useLLM: boolean;
  /** Peso para match no título */
  titleMatchWeight: number;
  /** Peso para match nas keywords */
  keywordMatchWeight: number;
  /** Peso para match no conteúdo */
  contentMatchWeight: number;
  /** Relevância default para path exato */
  exactPathRelevance: number;
  /** Relevância default para type match */
  typeMatchRelevance: number;
  /** Função LLM para reasoning */
  llm?: (prompt: string) => Promise<string>;
}

/**
 * Configuração do Memory Compressor
 */
export interface MemoryCompressorConfig {
  /** Número mínimo de eventos para compressão */
  minEvents: number;
  /** Número máximo de eventos para comprimir de uma vez */
  maxEvents: number;
  /** Usar LLM para sumarização */
  useLLM: boolean;
  /** Auto-comprimir quando threshold for atingido */
  autoCompress: boolean;
  /** Importância base para memórias comprimidas */
  compressedImportanceBase: number;
  /** Boost de importância para memórias comprimidas */
  compressedImportanceBoost: number;
  /** Prefixo para títulos comprimidos */
  compressedTitlePrefix: string;
  /** Função LLM para sumarização */
  llm?: (prompt: string) => Promise<string>;
}

/**
 * Configuração Global do Memory2Agent
 */
export interface Memory2AgentGlobalConfig {
  /** Auto-comprimir memórias periodicamente */
  autoCompress: boolean;
  /** Threshold para auto-compressão (número de eventos) */
  autoCompressThreshold: number;
  /** Habilitar logs */
  enableLogging: boolean;
  /** Nível de log (debug, info, warn, error) */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Habilitar persistência automática */
  enablePersistence: boolean;
  /** Path para arquivo de persistência */
  persistencePath: string;
  /** Intervalo de auto-save em ms */
  autoSaveInterval: number;
}

/**
 * Configuração Completa do Memory2Agent
 */
export interface Memory2AgentFullConfig {
  /** Nome da configuração (para identificação) */
  name?: string;
  /** Versão da configuração */
  version?: string;
  /** Configuração do tree */
  tree: MemoryTreeConfig;
  /** Configuração do encoder */
  encoder: MemoryEncoderConfig;
  /** Configuração do router */
  router: MemoryRouterConfig;
  /** Configuração do retriever */
  retriever: MemoryRetrieverConfig;
  /** Configuração do compressor */
  compressor: MemoryCompressorConfig;
  /** Configuração global */
  global: Memory2AgentGlobalConfig;
}

/**
 * Configuração padrão (defaults)
 */
export const DEFAULT_CONFIG: Memory2AgentFullConfig = {
  name: 'default',
  version: '1.0.0',
  
  tree: {
    rootId: 'root',
    rootTitle: 'Root',
    rootType: 'semantic',
    rootImportance: 10,
    rootKeywords: [],
    idPrefix: 'mem',
  },

  encoder: {
    autoKeywords: true,
    autoImportance: true,
    maxKeywords: 5,
    baseImportance: 5,
    proceduralImportanceBoost: 2,
    decisionImportanceBoost: 2,
    stopWords: [
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'to', 'of', 'and', 'in', 'that', 'for', 'on', 'with', 'at',
      'by', 'from', 'as', 'or', 'what', 'how', 'which', 'about',
      'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'em', 
      'no', 'na', 'que', 'para', 'com', 'como', 'por', 'ou', 'se', 
      'não', 'sim',
    ],
    eventTypeToMemoryType: {
      message: 'episodic',
      interaction: 'episodic',
      conversation: 'episodic',
      user_action: 'episodic',
      procedure: 'procedural',
      instruction: 'procedural',
      howto: 'procedural',
      workflow: 'procedural',
      decision: 'semantic',
      fact: 'semantic',
      concept: 'semantic',
      requirement: 'semantic',
      test: 'episodic',
      deployment: 'episodic',
      implementation: 'episodic',
    },
    idPrefix: 'mem',
  },

  router: {
    autoCreateCategories: true,
    maxSiblings: 10,
    useLLM: false,
    typeRootPrefix: 'root',
    defaultRoutingConfidence: 0.5,
    typeParentMapping: {
      episodic: 'root',
      semantic: 'root',
      procedural: 'root',
    },
  },

  retriever: {
    maxResults: 10,
    maxDepth: 5,
    includeTraversalPath: true,
    minImportance: 3,
    useLLM: false,
    titleMatchWeight: 3,
    keywordMatchWeight: 2,
    contentMatchWeight: 1,
    exactPathRelevance: 0.9,
    typeMatchRelevance: 0.7,
  },

  compressor: {
    minEvents: 5,
    maxEvents: 20,
    useLLM: false,
    autoCompress: false,
    compressedImportanceBase: 7,
    compressedImportanceBoost: 1,
    compressedTitlePrefix: 'Compressed:',
  },

  global: {
    autoCompress: false,
    autoCompressThreshold: 50,
    enableLogging: false,
    logLevel: 'info',
    enablePersistence: false,
    persistencePath: './memory2agent-data.json',
    autoSaveInterval: 60000, // 1 minuto
  },
};

/**
 * Merge de configurações (deep merge)
 */
export function mergeConfig(
  base: Memory2AgentFullConfig,
  override: Partial<Memory2AgentFullConfig>
): Memory2AgentFullConfig {
  const result = { ...base };

  if (override.tree) {
    result.tree = { ...base.tree, ...override.tree };
  }

  if (override.encoder) {
    result.encoder = { ...base.encoder, ...override.encoder };
  }

  if (override.router) {
    result.router = { ...base.router, ...override.router };
  }

  if (override.retriever) {
    result.retriever = { ...base.retriever, ...override.retriever };
  }

  if (override.compressor) {
    result.compressor = { ...base.compressor, ...override.compressor };
  }

  if (override.global) {
    result.global = { ...base.global, ...override.global };
  }

  return result;
}

/**
 * Presets de configuração para casos de uso comuns
 */
export const PRESETS = {
  /**
   * Minimal: Configuração mínima para uso básico
   */
  minimal: {
    ...DEFAULT_CONFIG,
    name: 'minimal',
    encoder: {
      ...DEFAULT_CONFIG.encoder,
      autoKeywords: false,
      autoImportance: false,
    },
    retriever: {
      ...DEFAULT_CONFIG.retriever,
      maxResults: 5,
    },
  } as Memory2AgentFullConfig,

  /**
   * Advanced: Configuração avançada com LLM
   */
  advanced: {
    ...DEFAULT_CONFIG,
    name: 'advanced',
    encoder: {
      ...DEFAULT_CONFIG.encoder,
      autoKeywords: true,
      autoImportance: true,
      maxKeywords: 10,
    },
    router: {
      ...DEFAULT_CONFIG.router,
      useLLM: true,
    },
    retriever: {
      ...DEFAULT_CONFIG.retriever,
      useLLM: true,
      maxResults: 15,
    },
    compressor: {
      ...DEFAULT_CONFIG.compressor,
      useLLM: true,
      minEvents: 3,
    },
  } as Memory2AgentFullConfig,

  /**
   * EventSourcing: Otimizado para event sourcing
   */
  eventSourcing: {
    ...DEFAULT_CONFIG,
    name: 'eventSourcing',
    encoder: {
      ...DEFAULT_CONFIG.encoder,
      eventTypeToMemoryType: {
        ...DEFAULT_CONFIG.encoder.eventTypeToMemoryType,
        event: 'episodic',
        command: 'episodic',
        query: 'episodic',
        snapshot: 'semantic',
      },
    },
    compressor: {
      ...DEFAULT_CONFIG.compressor,
      minEvents: 10,
      autoCompress: true,
    },
    global: {
      ...DEFAULT_CONFIG.global,
      enablePersistence: true,
      autoSaveInterval: 30000,
    },
  } as Memory2AgentFullConfig,

  /**
   * Debug: Configuração para debugging
   */
  debug: {
    ...DEFAULT_CONFIG,
    name: 'debug',
    global: {
      ...DEFAULT_CONFIG.global,
      enableLogging: true,
      logLevel: 'debug',
    },
    retriever: {
      ...DEFAULT_CONFIG.retriever,
      includeTraversalPath: true,
      maxResults: 20,
    },
  } as Memory2AgentFullConfig,
};
