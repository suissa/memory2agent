/**
 * Exemplo 3: Event Sourcing + Memory
 * Usando event sourcing como base para memória estruturada
 */

import { Memory2Agent, type MemoryEvent } from '../src/index.js';

async function exampleEventSourcing() {
  console.log('=== Exemplo 3: Event Sourcing ===\n');

  const memory = new Memory2Agent({
    router: {
      autoCreateCategories: true,
      maxSiblings: 5,
    },
  });

  // Stream de eventos de um projeto
  const projectEvents: MemoryEvent[] = [
    // Fase 1: Requisitos
    {
      type: 'requirement',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      data: {
        id: 'req-1',
        title: 'User authentication',
        description: 'Implement OAuth2 login',
      },
      metadata: { tags: ['requirements', 'auth'], confidence: 1.0 },
    },
    {
      type: 'requirement',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
      data: {
        id: 'req-2',
        title: 'Dashboard',
        description: 'Show user metrics',
      },
      metadata: { tags: ['requirements', 'ui'], confidence: 1.0 },
    },

    // Fase 2: Decisões
    {
      type: 'decision',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
      data: {
        requirement: 'req-1',
        decision: 'Use Auth0',
        rationale: 'Faster implementation',
      },
      metadata: { tags: ['decisions', 'auth'], confidence: 0.95 },
    },
    {
      type: 'decision',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      data: {
        requirement: 'req-2',
        decision: 'Use Chart.js',
        rationale: 'Good documentation',
      },
      metadata: { tags: ['decisions', 'ui'], confidence: 0.9 },
    },

    // Fase 3: Implementação
    {
      type: 'implementation',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
      data: {
        requirement: 'req-1',
        status: 'in-progress',
        branch: 'feature/auth',
      },
      metadata: { tags: ['implementation', 'auth'] },
    },
    {
      type: 'implementation',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      data: {
        requirement: 'req-2',
        status: 'pending',
      },
      metadata: { tags: ['implementation', 'ui'] },
    },

    // Fase 4: Testes
    {
      type: 'test',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      data: {
        requirement: 'req-1',
        type: 'unit',
        result: 'passed',
      },
      metadata: { tags: ['tests', 'auth'] },
    },

    // Fase 5: Deploy
    {
      type: 'deployment',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      data: {
        requirement: 'req-1',
        environment: 'staging',
        status: 'success',
      },
      metadata: { tags: ['deployment', 'staging'] },
    },
  ];

  // Store todos os eventos
  console.log('Storing project events...\n');
  await memory.storeBatch(projectEvents);

  // Navegação hierárquica
  console.log('Exploring memory tree...\n');
  const allNodes = memory.traverse([]);
  console.log(`Total nodes: ${allNodes.length}\n`);

  // Query por tipo específico
  console.log('Query: "decisions about auth"');
  const authDecisions = await memory.query('decisions about auth');

  for (const mem of authDecisions) {
    console.log(`  - ${mem.path}`);
    console.log(`    Type: ${mem.content.type}`);
    console.log(`    Explanation: ${mem.explanation}\n`);
  }

  // Explorar estrutura
  console.log('Recent important memories:');
  const important = memory.important(5);
  for (const mem of important) {
    console.log(`  - ${mem.path} (relevance: ${mem.relevance})`);
  }

  // Stats
  console.log('\nStats:', memory.getStats());

  // Export para JSON (para persistência)
  console.log('\nExporting to JSON...');
  const json = memory.toJSON();
  console.log('Tree structure:', JSON.stringify(json, null, 2).slice(0, 500));
}

exampleEventSourcing().catch(console.error);
