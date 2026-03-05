/**
 * memory2agent - Core Types
 * Tipos fundamentais para memória vectorless de agentes
 */

/** Identificador único de memória */
export type MemoryId = string;

/** Tipo de memória baseado em ciência cognitiva */
export type MemoryType = 
  | 'episodic'    // Eventos específicos com contexto temporal
  | 'semantic'    // Conhecimento factual e conceitos
  | 'procedural'; // Habilidades e procedimentos

/** Status de uma memória */
export type MemoryStatus = 
  | 'active'      // Memória ativa e relevante
  | 'archived'    // Memória arquivada (pouco usada)
  | 'compressed'; // Memória comprimida (múltiplos eventos)

/** Resumo estruturado da memória */
export interface MemorySummary {
  title: string;
  keywords: string[];
  importance: number; // 0-10
  createdAt: Date;
  updatedAt: Date;
}

/** Conteúdo da memória (pode ser texto ou estruturado) */
export type MemoryContent = 
  | { type: 'text'; value: string }
  | { type: 'structured'; data: Record<string, unknown> }
  | { type: 'event'; event: MemoryEvent };

/** Evento de memória (event sourcing) */
export interface MemoryEvent {
  type: string;
  timestamp: Date;
  data: Record<string, unknown>;
  metadata?: {
    source?: string;
    confidence?: number;
    tags?: string[];
  };
}

/** Nó de memória na árvore */
export interface MemoryNode {
  id: MemoryId;
  type: MemoryType;
  status: MemoryStatus;
  summary: MemorySummary;
  content: MemoryContent;
  parent?: MemoryId;
  children: MemoryId[];
  path: string; // Caminho navegável ex: "/projects/clientA/decisions/1"
  depth: number;
}

/** Resultado de retrieval */
export interface MemoryRetrievalResult {
  nodeId: MemoryId;
  path: string;
  content: MemoryContent;
  relevance: number;
  explanation: string; // Explicabilidade do retrieval
}

/** Contexto construído para o LLM */
export interface MemoryContext {
  query: string;
  memories: MemoryRetrievalResult[];
  traversalPath: string[]; // Caminho percorrido na árvore
  summary: string;
}
