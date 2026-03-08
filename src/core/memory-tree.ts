/**
 * MemoryTree - Estrutura de árvore para memória vectorless
 * Permite navegação semântica e retrieval explicável
 */

import type { MemoryId, MemoryNode, MemoryType, MemoryContent, MemorySummary, MemoryStatus } from './types.js';
import type { MemoryTreeConfig } from '../config/types.js';
import { DEFAULT_CONFIG } from '../config/types.js';

export interface MemoryTreeOptions {
  config?: Partial<MemoryTreeConfig>;
}

export class MemoryTree {
  private nodes: Map<MemoryId, MemoryNode> = new Map();
  private config: MemoryTreeConfig;
  private rootId: MemoryId;

  constructor(options?: MemoryTreeOptions) {
    this.config = {
      ...DEFAULT_CONFIG.tree,
      ...options?.config,
    };
    this.rootId = this.config.rootId;

    // Criar nó raiz
    this.nodes.set(this.rootId, {
      id: this.rootId,
      type: this.config.rootType,
      status: 'active',
      summary: {
        title: this.config.rootTitle,
        keywords: this.config.rootKeywords,
        importance: this.config.rootImportance,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      content: { type: 'text', value: 'Memory tree root' },
      parent: undefined,
      children: [],
      path: '/',
      depth: 0,
    });
  }

  /**
   * Adiciona um novo nó na árvore
   */
  addNode(
    parentId: MemoryId,
    type: MemoryType,
    content: MemoryContent,
    summary: Omit<MemorySummary, 'createdAt' | 'updatedAt'>
  ): MemoryNode {
    const parent = this.nodes.get(parentId);
    if (!parent) {
      throw new Error(`Parent node not found: ${parentId}`);
    }

    const id = this.generateId();
    const node: MemoryNode = {
      id,
      type,
      status: 'active',
      summary: {
        ...summary,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      content,
      parent: parentId,
      children: [],
      path: `${parent.path}/${id}`,
      depth: parent.depth + 1,
    };

    this.nodes.set(id, node);
    parent.children.push(id);
    this.nodes.set(parentId, parent);

    return node;
  }

  /**
   * Adiciona nó na raiz de um tipo específico
   */
  addNodeByType(
    type: MemoryType,
    content: MemoryContent,
    summary: Omit<MemorySummary, 'createdAt' | 'updatedAt'>
  ): MemoryNode {
    let typeRootId = `${this.rootId}:${type}`;
    
    // Criar raiz do tipo se não existir
    if (!this.nodes.has(typeRootId)) {
      const typeRoot = this.addNode(
        this.rootId,
        'semantic',
        { type: 'text', value: `${type} memory root` },
        { title: type, keywords: [type], importance: 10 }
      );
      typeRootId = typeRoot.id;
    }

    return this.addNode(typeRootId, type, content, summary);
  }

  /**
   * Busca um nó por ID
   */
  getNode(id: MemoryId): MemoryNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Busca nós por caminho (path traversal)
   */
  getNodeByPath(path: string): MemoryNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.path === path) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Lista filhos de um nó
   */
  getChildren(parentId: MemoryId): MemoryNode[] {
    const parent = this.nodes.get(parentId);
    if (!parent) return [];

    return parent.children
      .map(childId => this.nodes.get(childId))
      .filter((node): node is MemoryNode => node !== undefined);
  }

  /**
   * Navega até um nó específico pelo caminho
   */
  traverse(path: string[]): MemoryNode[] {
    const result: MemoryNode[] = [];
    let currentId: MemoryId = this.rootId;

    for (const segment of path) {
      const node = this.nodes.get(currentId);
      if (!node) break;

      result.push(node);

      // Encontrar filho com segmento no path ou keywords
      const childId = node.children.find(childId => {
        const child = this.nodes.get(childId);
        return child?.path.includes(segment) || 
               child?.summary.keywords.includes(segment);
      });

      if (!childId) break;
      currentId = childId;
    }

    return result;
  }

  /**
   * Atualiza um nó existente
   */
  updateNode(id: MemoryId, updates: Partial<MemoryNode>): MemoryNode | undefined {
    const node = this.nodes.get(id);
    if (!node) return undefined;

    const updated = { ...node, ...updates };
    updated.summary = {
      ...node.summary,
      ...updates.summary,
      updatedAt: new Date(),
    };

    this.nodes.set(id, updated);
    return updated;
  }

  /**
   * Remove um nó e seus filhos
   */
  removeNode(id: MemoryId): boolean {
    const node = this.nodes.get(id);
    if (!node || id === this.rootId) return false;

    // Remover filhos recursivamente
    for (const childId of node.children) {
      this.removeNode(childId);
    }

    // Remover do parent
    if (node.parent) {
      const parent = this.nodes.get(node.parent);
      if (parent) {
        parent.children = parent.children.filter(cid => cid !== id);
        this.nodes.set(node.parent, parent);
      }
    }

    return this.nodes.delete(id);
  }

  /**
   * Retorna todos os nós (para inspeção)
   */
  getAllNodes(): MemoryNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Exporta árvore para JSON
   */
  toJSON(): Record<string, unknown> {
    const buildTree = (nodeId: MemoryId): Record<string, unknown> => {
      const node = this.nodes.get(nodeId);
      if (!node) return {};

      return {
        id: node.id,
        type: node.type,
        summary: node.summary,
        children: node.children.map(childId => buildTree(childId)),
      };
    };

    return buildTree(this.rootId);
  }

  /**
   * Importa árvore de JSON
   */
  fromJSON(data: Record<string, unknown>): void {
    // Implementação futura para persistência
    console.log('Import from JSON:', data);
  }

  /**
   * Gera ID único para memória usando prefixo da config
   */
  private generateId(): MemoryId {
    const prefix = this.config.idPrefix;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpa toda a árvore
   */
  clear(): void {
    this.nodes.clear();
    // Recriar raiz com config
    this.nodes.set(this.rootId, {
      id: this.rootId,
      type: this.config.rootType,
      status: 'active',
      summary: {
        title: this.config.rootTitle,
        keywords: this.config.rootKeywords,
        importance: this.config.rootImportance,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      content: { type: 'text', value: 'Memory tree root' },
      parent: undefined,
      children: [],
      path: '/',
      depth: 0,
    });
  }
}
