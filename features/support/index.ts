/**
 * Cucumber Support - Importa todos os steps e hooks
 */

import { setWorldConstructor, World, Before, After } from '@cucumber/cucumber';
import { Memory2Agent, type Memory2AgentFullConfig, type MemoryEvent } from '../../src/index.js';

/**
 * Contexto compartilhado entre os steps
 */
export interface CustomWorld extends World {
  memory: Memory2Agent;
  lastStoredId: string;
  lastQueryResult: any[];
  lastContext: any;
  config: Partial<Memory2AgentFullConfig>;
  events: MemoryEvent[];
  errorMessage: string | null;
}

/**
 * Classe World customizada
 */
class WorldClass implements CustomWorld {
  memory: Memory2Agent;
  lastStoredId: string;
  lastQueryResult: any[];
  lastContext: any;
  config: Partial<Memory2AgentFullConfig>;
  events: MemoryEvent[];
  errorMessage: string | null;

  constructor() {
    this.memory = new Memory2Agent();
    this.lastStoredId = '';
    this.lastQueryResult = [];
    this.lastContext = null;
    this.config = {};
    this.events = [];
    this.errorMessage = null;
  }
}

setWorldConstructor(WorldClass);

/**
 * Hook antes de cada cenário
 */
Before(function(this: CustomWorld) {
  this.memory = new Memory2Agent();
  this.lastStoredId = '';
  this.lastQueryResult = [];
  this.lastContext = null;
  this.config = {};
  this.events = [];
  this.errorMessage = null;
});

/**
 * Hook depois de cada cenário
 */
After(function(this: CustomWorld) {
  // Limpar memória
  if (this.memory) {
    this.memory.clear();
  }
});

export { WorldClass };
