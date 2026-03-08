/**
 * MemoryRouter - Decide onde armazenar cada memória na árvore
 * Roteamento baseado em tipo, contexto e estrutura existente
 */

import type { MemoryId, MemoryType, MemoryNode, MemorySummary } from '../core/types.js';
import { MemoryTree } from '../core/memory-tree.js';
import type { EncodedMemory } from '../encoder/memory-encoder.js';
import type { MemoryRouterConfig } from '../config/types.js';
import { DEFAULT_CONFIG } from '../config/types.js';

export interface RouterOptions {
  config?: Partial<MemoryRouterConfig>;
}

export interface RoutingDecision {
  targetParentId: MemoryId;
  reason: string;
  confidence: number;
  alternativePaths?: string[];
}

export class MemoryRouter {
  private tree: MemoryTree;
  private config: MemoryRouterConfig;

  constructor(tree: MemoryTree, options?: RouterOptions) {
    this.tree = tree;
    this.config = {
      ...DEFAULT_CONFIG.router,
      ...options?.config,
    };
  }

  /**
   * Decide onde armazenar uma memória codificada
   */
  async route(memory: EncodedMemory): Promise<RoutingDecision> {
    // Estratégia de roteamento baseada em tipo
    switch (memory.type) {
      case 'episodic':
        return this.routeEpisodic(memory);
      case 'semantic':
        return this.routeSemantic(memory);
      case 'procedural':
        return this.routeProcedural(memory);
      default:
        return this.routeDefault(memory);
    }
  }

  /**
   * Roteamento para memória episódica
   * Organiza por contexto temporal ou de projeto
   */
  private async routeEpisodic(memory: EncodedMemory): Promise<RoutingDecision> {
    const { summary } = memory;

    // Tentar encontrar categoria por keywords
    for (const keyword of summary.keywords) {
      const existingNode = this.findNodeByKeyword(keyword);
      if (existingNode && existingNode.type === 'episodic') {
        return {
          targetParentId: existingNode.id,
          reason: `Matched existing episodic category: ${keyword}`,
          confidence: 0.9,
        };
      }
    }

    // Criar nova categoria episódica
    if (this.config.autoCreateCategories) {
      const category = summary.keywords[0] || 'general';
      const categoryNode = this.getOrCreateTypeRoot('episodic');
      
      return {
        targetParentId: categoryNode.id,
        reason: `Created new episodic category: ${category}`,
        confidence: 0.7,
      };
    }

    // Fallback: raiz episódica
    const root = this.getOrCreateTypeRoot('episodic');
    return {
      targetParentId: root.id,
      reason: 'Default episodic root (no category match)',
      confidence: 0.5,
    };
  }

  /**
   * Roteamento para memória semantic
   * Organiza por conceitos e fatos
   */
  private async routeSemantic(memory: EncodedMemory): Promise<RoutingDecision> {
    const { summary } = memory;

    // Procurar por conceitos relacionados
    const conceptNode = this.findConceptNode(summary.title);
    if (conceptNode) {
      return {
        targetParentId: conceptNode.id,
        reason: `Found related concept: ${summary.title}`,
        confidence: 0.85,
      };
    }

    // Procurar por keywords em nós existentes
    for (const keyword of summary.keywords) {
      const existingNode = this.findNodeByKeyword(keyword);
      if (existingNode && existingNode.type === 'semantic') {
        return {
          targetParentId: existingNode.id,
          reason: `Matched existing semantic node: ${keyword}`,
          confidence: 0.8,
        };
      }
    }

    // Criar novo conceito
    if (this.config.autoCreateCategories) {
      const root = this.getOrCreateTypeRoot('semantic');
      return {
        targetParentId: root.id,
        reason: `New semantic concept: ${summary.title}`,
        confidence: 0.6,
      };
    }

    const root = this.getOrCreateTypeRoot('semantic');
    return {
      targetParentId: root.id,
      reason: 'Default semantic root',
      confidence: 0.5,
    };
  }

  /**
   * Roteamento para memória procedural
   * Organiza por workflows e procedimentos
   */
  private async routeProcedural(memory: EncodedMemory): Promise<RoutingDecision> {
    const { summary } = memory;

    // Procurar procedimentos relacionados
    const workflowNode = this.findWorkflowNode(summary.keywords);
    if (workflowNode) {
      return {
        targetParentId: workflowNode.id,
        reason: `Found related workflow: ${workflowNode.summary.title}`,
        confidence: 0.85,
      };
    }

    // Criar novo workflow
    if (this.config.autoCreateCategories) {
      const root = this.getOrCreateTypeRoot('procedural');
      return {
        targetParentId: root.id,
        reason: `New procedural workflow: ${summary.title}`,
        confidence: 0.6,
      };
    }

    const root = this.getOrCreateTypeRoot('procedural');
    return {
      targetParentId: root.id,
      reason: 'Default procedural root',
      confidence: 0.5,
    };
  }

  /**
   * Roteamento default/fallback
   */
  private async routeDefault(memory: EncodedMemory): Promise<RoutingDecision> {
    const root = this.getOrCreateTypeRoot('semantic');
    return {
      targetParentId: root.id,
      reason: 'Fallback to semantic root',
      confidence: 0.4,
    };
  }

  /**
   * Obtém ou cria raiz de um tipo
   */
  private getOrCreateTypeRoot(type: MemoryType): MemoryNode {
    const rootId = `${this.config.typeRootPrefix}:${type}`;
    let node = this.tree.getNode(rootId);

    if (!node && this.config.autoCreateCategories) {
      // Criar raiz do tipo
      const rootNode = this.tree.getNode(this.config.typeRootPrefix);
      if (rootNode) {
        node = this.tree.addNode(rootNode.id, 'semantic', {
          type: 'text',
          value: `${type} memory root`,
        }, {
          title: type,
          keywords: [type],
          importance: 10,
        });
      }
    }

    if (!node) {
      throw new Error(`Could not get or create type root: ${type}`);
    }

    return node;
  }

  /**
   * Encontra nó por keyword
   */
  private findNodeByKeyword(keyword: string): MemoryNode | null {
    const nodes = this.tree.getAllNodes();
    for (const node of nodes) {
      if (node.summary.keywords.includes(keyword.toLowerCase())) {
        return node;
      }
    }
    return null;
  }

  /**
   * Encontra nó de conceito por título
   */
  private findConceptNode(title: string): MemoryNode | null {
    const nodes = this.tree.getAllNodes();
    const titleLower = title.toLowerCase();

    for (const node of nodes) {
      // Match exato ou parcial no título
      if (node.summary.title.toLowerCase().includes(titleLower)) {
        return node;
      }

      // Match nas keywords
      for (const keyword of node.summary.keywords) {
        if (keyword.includes(titleLower) || titleLower.includes(keyword)) {
          return node;
        }
      }
    }

    return null;
  }

  /**
   * Encontra nó de workflow por keywords
   */
  private findWorkflowNode(keywords: string[]): MemoryNode | null {
    const nodes = this.tree.getAllNodes();

    for (const node of nodes) {
      if (node.type !== 'procedural') continue;

      // Verificar sobreposição de keywords
      const overlap = keywords.filter(k =>
        node.summary.keywords.includes(k.toLowerCase())
      );

      if (overlap.length > 0) {
        return node;
      }
    }

    return null;
  }

  /**
   * Sugere sub-categorização quando um nó tem muitos filhos
   */
  suggestSubcategorization(nodeId: MemoryId): { shouldSplit: boolean; suggestion?: string } {
    const node = this.tree.getNode(nodeId);
    if (!node) return { shouldSplit: false };

    const children = this.tree.getChildren(nodeId);

    if (children.length >= this.config.maxSiblings) {
      // Analisar keywords dos filhos para sugerir categorias
      const keywordFrequency = new Map<string, number>();

      for (const child of children) {
        for (const keyword of child.summary.keywords) {
          keywordFrequency.set(
            keyword,
            (keywordFrequency.get(keyword) || 0) + 1
          );
        }
      }

      // Encontrar keywords mais frequentes
      const topKeywords = Array.from(keywordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([keyword]) => keyword);

      return {
        shouldSplit: true,
        suggestion: `Consider creating sub-categories: ${topKeywords.join(', ')}`,
      };
    }

    return { shouldSplit: false };
  }

  /**
   * Move um nó para outro pai (refatoração de memória)
   */
  moveNode(nodeId: MemoryId, newParentId: MemoryId): boolean {
    const node = this.tree.getNode(nodeId);
    const newParent = this.tree.getNode(newParentId);

    if (!node || !newParent) return false;

    // Remover do pai antigo
    if (node.parent) {
      const oldParent = this.tree.getNode(node.parent);
      if (oldParent) {
        oldParent.children = oldParent.children.filter(id => id !== nodeId);
      }
    }

    // Atualizar pai e path
    node.parent = newParentId;
    node.path = `${newParent.path}/${nodeId}`;

    // Adicionar ao novo pai
    newParent.children.push(nodeId);

    return true;
  }
}
