/**
 * MemoryRetriever - Retrieval vectorless baseado em navegação na árvore
 * Usa reasoning sobre a estrutura para encontrar memórias relevantes
 */

import type {
  MemoryId,
  MemoryNode,
  MemoryContext,
  MemoryRetrievalResult,
  MemoryType,
} from '../core/types.js';
import { MemoryTree } from '../core/memory-tree.js';

export interface RetrieverConfig {
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
  /** LLM function para reasoning */
  llm?: (prompt: string) => Promise<string>;
}

export interface RetrievalQuery {
  query: string;
  type?: MemoryType;
  keywords?: string[];
  path?: string[];
}

export class MemoryRetriever {
  private tree: MemoryTree;
  private config: RetrieverConfig;

  constructor(tree: MemoryTree, config?: Partial<RetrieverConfig>) {
    this.tree = tree;
    this.config = {
      maxResults: 10,
      maxDepth: 5,
      includeTraversalPath: true,
      minImportance: 3,
      useLLM: false,
      ...config,
    };
  }

  /**
   * Query principal - encontra memórias relevantes
   */
  async query(query: string | RetrievalQuery): Promise<MemoryRetrievalResult[]> {
    const normalizedQuery = this.normalizeQuery(query);

    // Extrair keywords da query
    const keywords = await this.extractKeywords(normalizedQuery.query);

    // Estratégia de retrieval baseada na query
    const results: MemoryRetrievalResult[] = [];

    // 1. Keyword matching
    const keywordMatches = this.findByKeywords(keywords);
    results.push(...keywordMatches);

    // 2. Path-based retrieval se especificado
    if (normalizedQuery.path) {
      const pathMatches = this.findByPath(normalizedQuery.path);
      results.push(...pathMatches);
    }

    // 3. Type-filtered retrieval
    if (normalizedQuery.type) {
      const typeMatches = this.findByType(normalizedQuery.type);
      results.push(...typeMatches);
    }

    // 4. Semantic matching com LLM (opcional)
    if (this.config.useLLM && this.config.llm) {
      const semanticMatches = await this.findBySemantic(normalizedQuery.query);
      results.push(...semanticMatches);
    }

    // Deduplicar e ordenar por relevância
    const unique = this.deduplicate(results);
    const sorted = unique.sort((a, b) => b.relevance - a.relevance);

    return sorted.slice(0, this.config.maxResults);
  }

  /**
   * Constrói contexto para LLM a partir da query
   */
  async context(query: string): Promise<MemoryContext> {
    const results = await this.query(query);

    // Construir caminho de traversal
    const traversalPath = this.buildTraversalPath(results);

    // Criar summary do contexto
    const summary = this.buildContextSummary(results, query);

    return {
      query,
      memories: results,
      traversalPath,
      summary,
    };
  }

  /**
   * Navega por um caminho específico na árvore
   */
  traverse(path: string[]): MemoryNode[] {
    return this.tree.traverse(path);
  }

  /**
   * Explora uma parte da árvore (para discovery)
   */
  explore(nodeId: MemoryId, depth: number = 2): MemoryNode[] {
    const result: MemoryNode[] = [];
    const queue: Array<{ id: MemoryId; depth: number }> = [
      { id: nodeId, depth: 0 },
    ];

    while (queue.length > 0) {
      const { id, depth: currentDepth } = queue.shift()!;
      const node = this.tree.getNode(id);

      if (!node || currentDepth > depth) continue;

      result.push(node);

      // Adicionar filhos à fila
      for (const childId of node.children) {
        queue.push({ id: childId, depth: currentDepth + 1 });
      }
    }

    return result;
  }

  /**
   * Busca por keywords
   */
  private findByKeywords(keywords: string[]): MemoryRetrievalResult[] {
    const results: MemoryRetrievalResult[] = [];
    const nodes = this.tree.getAllNodes();

    for (const node of nodes) {
      if (node.summary.importance < this.config.minImportance) continue;

      // Calcular score de matching
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        const kwLower = keyword.toLowerCase();

        // Match no título
        if (node.summary.title.toLowerCase().includes(kwLower)) {
          score += 3;
          matchedKeywords.push(`title:${keyword}`);
        }

        // Match nas keywords
        for (const nodeKeyword of node.summary.keywords) {
          if (nodeKeyword.includes(kwLower) || kwLower.includes(nodeKeyword)) {
            score += 2;
            matchedKeywords.push(`keyword:${nodeKeyword}`);
          }
        }

        // Match no conteúdo (se for texto)
        if (node.content.type === 'text') {
          if (node.content.value.toLowerCase().includes(kwLower)) {
            score += 1;
            matchedKeywords.push('content');
          }
        }
      }

      if (score > 0) {
        results.push({
          nodeId: node.id,
          path: node.path,
          content: node.content,
          relevance: Math.min(1, score / 10),
          explanation: `Matched keywords: ${matchedKeywords.join(', ')}`,
        });
      }
    }

    return results;
  }

  /**
   * Busca por caminho
   */
  private findByPath(path: string[]): MemoryRetrievalResult[] {
    const results: MemoryRetrievalResult[] = [];
    const nodes = this.tree.traverse(path);

    for (const node of nodes) {
      results.push({
        nodeId: node.id,
        path: node.path,
        content: node.content,
        relevance: 0.9, // Alta relevância para path exato
        explanation: `Path traversal: ${path.join(' → ')}`,
      });
    }

    return results;
  }

  /**
   * Busca por tipo de memória
   */
  private findByType(type: MemoryType): MemoryRetrievalResult[] {
    const results: MemoryRetrievalResult[] = [];
    const nodes = this.tree.getAllNodes();

    for (const node of nodes) {
      if (node.type === type && node.summary.importance >= this.config.minImportance) {
        results.push({
          nodeId: node.id,
          path: node.path,
          content: node.content,
          relevance: 0.7,
          explanation: `Type match: ${type}`,
        });
      }
    }

    return results;
  }

  /**
   * Busca semântica com LLM (matching mais inteligente)
   */
  private async findBySemantic(query: string): Promise<MemoryRetrievalResult[]> {
    if (!this.config.llm) return [];

    const results: MemoryRetrievalResult[] = [];
    const nodes = this.tree.getAllNodes();

    // Criar resumo de todos os nós para o LLM
    const nodesSummary = nodes
      .filter(n => n.summary.importance >= this.config.minImportance)
      .map(n => `${n.id}: ${n.summary.title} [${n.summary.keywords.join(', ')}]`)
      .join('\n');

    const prompt = `Find the most relevant memories for this query: "${query}"

Available memories:
${nodesSummary}

Return up to 5 most relevant memory IDs with brief reasoning.`;

    try {
      const response = await this.config.llm(prompt);
      const matchedIds = this.extractMemoryIdsFromResponse(response);

      for (const nodeId of matchedIds) {
        const node = this.tree.getNode(nodeId);
        if (node) {
          results.push({
            nodeId: node.id,
            path: node.path,
            content: node.content,
            relevance: 0.85,
            explanation: `Semantic match via LLM reasoning`,
          });
        }
      }
    } catch {
      // Fallback para keyword matching
    }

    return results;
  }

  /**
   * Normaliza query (string ou objeto)
   */
  private normalizeQuery(
    query: string | RetrievalQuery
  ): RetrievalQuery {
    if (typeof query === 'string') {
      return { query };
    }
    return query;
  }

  /**
   * Extrai keywords da query
   */
  private async extractKeywords(query: string): Promise<string[]> {
    // Se LLM disponível, usar para extrair keywords
    if (this.config.llm && this.config.useLLM) {
      try {
        const response = await this.config.llm(
          `Extract 3-5 keywords from: "${query}". Return comma-separated only.`
        );
        return response.split(',').map(k => k.trim()).filter(k => k.length > 0);
      } catch {
        // Fallback
      }
    }

    // Fallback: palavras simples (remover stop words)
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'to', 'of', 'and', 'in', 'that', 'for', 'on', 'with', 'at',
      'by', 'from', 'as', 'or', 'what', 'how', 'which', 'about',
      'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'em', 'no', 'na',
      'que', 'para', 'com', 'como', 'por', 'ou', 'se', 'não', 'sim',
    ]);

    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Deduplica resultados
   */
  private deduplicate(results: MemoryRetrievalResult[]): MemoryRetrievalResult[] {
    const seen = new Set<MemoryId>();
    return results.filter(r => {
      if (seen.has(r.nodeId)) return false;
      seen.add(r.nodeId);
      return true;
    });
  }

  /**
   * Constrói caminho de traversal a partir dos resultados
   */
  private buildTraversalPath(results: MemoryRetrievalResult[]): string[] {
    const paths = results.map(r => r.path);
    
    // Encontrar caminho comum
    if (paths.length === 0) return [];
    if (paths.length === 1) return paths[0].split('/').filter(Boolean);

    // Encontrar prefixo comum
    const splitPaths = paths.map(p => p.split('/').filter(Boolean));
    const common: string[] = [];

    for (let i = 0; i < splitPaths[0].length; i++) {
      const segment = splitPaths[0][i];
      if (splitPaths.every(p => p[i] === segment)) {
        common.push(segment);
      } else {
        break;
      }
    }

    return common;
  }

  /**
   * Constrói summary do contexto
   */
  private buildContextSummary(
    results: MemoryRetrievalResult[],
    query: string
  ): string {
    if (results.length === 0) {
      return `No relevant memories found for: "${query}"`;
    }

    const memories = results
      .slice(0, 5)
      .map(r => `- ${r.path}: ${this.contentToString(r.content)}`)
      .join('\n');

    return `Found ${results.length} relevant memories:\n${memories}`;
  }

  /**
   * Converte conteúdo para string
   */
  private contentToString(content: any): string {
    if (content.type === 'text') return content.value;
    if (content.type === 'structured') return JSON.stringify(content.data);
    if (content.type === 'event') return JSON.stringify(content.event.data);
    return '[unknown content]';
  }

  /**
   * Extrai IDs de memória da resposta do LLM
   */
  private extractMemoryIdsFromResponse(response: string): MemoryId[] {
    // Tentar extrair IDs do formato "mem_timestamp_xxx"
    const idPattern = /mem_\d+_[a-z0-9]+/g;
    const matches = response.match(idPattern);
    return matches || [];
  }

  /**
   * Busca memórias por pai (para navegação hierárquica)
   */
  findByParent(parentId: MemoryId): MemoryRetrievalResult[] {
    const children = this.tree.getChildren(parentId);
    
    return children.map(child => ({
      nodeId: child.id,
      path: child.path,
      content: child.content,
      relevance: 0.8,
      explanation: `Child of ${parentId}`,
    }));
  }

  /**
   * Busca memórias recentes (por createdAt)
   */
  findRecent(limit: number = 10): MemoryRetrievalResult[] {
    const nodes = this.tree.getAllNodes()
      .filter(n => n.summary.importance >= this.config.minImportance)
      .sort((a, b) => 
        b.summary.createdAt.getTime() - a.summary.createdAt.getTime()
      )
      .slice(0, limit);

    return nodes.map(node => ({
      nodeId: node.id,
      path: node.path,
      content: node.content,
      relevance: 0.6,
      explanation: `Recent memory (${node.summary.createdAt.toISOString()})`,
    }));
  }

  /**
   * Busca memórias por importância
   */
  findImportant(limit: number = 10): MemoryRetrievalResult[] {
    const nodes = this.tree.getAllNodes()
      .filter(n => n.summary.importance >= this.config.minImportance)
      .sort((a, b) => b.summary.importance - a.summary.importance)
      .slice(0, limit);

    return nodes.map(node => ({
      nodeId: node.id,
      path: node.path,
      content: node.content,
      relevance: node.summary.importance / 10,
      explanation: `High importance: ${node.summary.importance}/10`,
    }));
  }
}
