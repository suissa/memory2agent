/**
 * Exemplo de configuração TypeScript para memory2agent
 * Use este arquivo como base para criar sua própria configuração
 */

import type { Memory2AgentFullConfig } from './src/config/types.js';

/**
 * Configuração customizada para agente de suporte
 */
export const supportAgentConfig: Memory2AgentFullConfig = {
  name: 'support-agent',
  version: '1.0.0',

  tree: {
    rootId: 'support',
    rootTitle: 'Support Agent Memory',
    rootType: 'semantic',
    rootImportance: 10,
    rootKeywords: ['support', 'customer', 'help'],
  },

  encoder: {
    autoKeywords: true,
    autoImportance: true,
    maxKeywords: 5,
    baseImportance: 5,
    proceduralImportanceBoost: 2,
    decisionImportanceBoost: 2,
    stopWords: [
      'the', 'a', 'an', 'is', 'are', 'was', 'were',
      'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da',
    ],
    eventTypeToMemoryType: {
      message: 'episodic',
      ticket: 'episodic',
      resolution: 'semantic',
      procedure: 'procedural',
      faq: 'semantic',
    },
    idPrefix: 'mem',
  },

  router: {
    autoCreateCategories: true,
    maxSiblings: 10,
    useLLM: false,
    typeRootPrefix: 'support',
    defaultRoutingConfidence: 0.5,
    typeParentMapping: {
      episodic: 'support',
      semantic: 'support',
      procedural: 'support',
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
    autoCompress: true,
    compressedImportanceBase: 7,
    compressedImportanceBoost: 1,
    compressedTitlePrefix: 'Ticket Summary:',
  },

  global: {
    autoCompress: true,
    autoCompressThreshold: 50,
    enableLogging: true,
    logLevel: 'info',
    enablePersistence: true,
    persistencePath: './data/support-memory.json',
    autoSaveInterval: 60000,
  },
};

/**
 * Configuração para desenvolvimento/debug
 */
export const debugConfig: Memory2AgentFullConfig = {
  ...supportAgentConfig,
  name: 'debug',
  global: {
    ...supportAgentConfig.global,
    enableLogging: true,
    logLevel: 'debug',
    enablePersistence: false,
  },
  retriever: {
    ...supportAgentConfig.retriever,
    maxResults: 20,
    includeTraversalPath: true,
  },
};

export default supportAgentConfig;
