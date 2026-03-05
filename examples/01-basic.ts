/**
 * Exemplo 1: Uso Básico
 * Agente de suporte ao cliente
 */

import { Memory2Agent } from '../src/index.js';

async function exampleBasic() {
  console.log('=== Exemplo Básico: Agente de Suporte ===\n');

  // Criar instância da memória
  const memory = new Memory2Agent();

  // Store: Armazenar eventos do usuário
  await memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { message: 'I prefer dark mode' },
    metadata: { tags: ['preference', 'ui'] },
  });

  await memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { message: 'I use macOS' },
    metadata: { tags: ['preference', 'os'] },
  });

  await memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { message: 'I work with Kubernetes' },
    metadata: { tags: ['preference', 'tools'] },
  });

  // Query: Buscar memórias relevantes
  console.log('Query: "user preferences"');
  const preferences = await memory.query('user preferences');
  console.log(`Found ${preferences.length} memories:\n`);

  for (const mem of preferences) {
    console.log(`  - ${mem.path}`);
    console.log(`    Relevance: ${mem.relevance}`);
    console.log(`    Explanation: ${mem.explanation}\n`);
  }

  // Context: Obter contexto para LLM
  console.log('Context: "suggest tools for user"');
  const context = await memory.context('suggest tools for user');
  console.log(context.summary);
  console.log(`Traversal path: ${context.traversalPath.join(' → ')}\n`);

  // Stats
  console.log('Stats:', memory.getStats());
}

exampleBasic().catch(console.error);
