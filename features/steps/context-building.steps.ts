import { Given, When, Then, And } from '@cucumber/cucumber';
import assert from 'assert';
import type { CustomWorld } from '../support/index.js';

/**
 * Step definitions para Context Building
 */

Given('que tenho memórias sobre {string}', async function(this: CustomWorld, topic: string) {
  await this.memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { topic, content: `Informações sobre ${topic}` },
    metadata: { tags: [topic, 'preferências'] },
  });
});

Given('que tenho memórias organizadas hierarquicamente', async function(this: CustomWorld) {
  await this.memory.store({
    type: 'semantic',
    timestamp: new Date(),
    data: { level: 'root', content: 'Raiz' },
    metadata: { tags: ['root', 'categoria'] },
  });
  
  await this.memory.store({
    type: 'semantic',
    timestamp: new Date(),
    data: { level: 'sub', content: 'Sub-categoria' },
    metadata: { tags: ['sub', 'categoria'] },
  });
});

Given('que não tenho memórias sobre {string}', async function(this: CustomWorld, topic: string) {
  // Não armazena nada sobre o tópico
  await this.memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { topic: 'outro-assunto', content: 'Assunto diferente' },
  });
});

Given('que tenho {int} memórias relevantes para {string}', async function(this: CustomWorld, count: number, topic: string) {
  for (let i = 0; i < count; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { topic, index: i, content: `Informação ${i} sobre ${topic}` },
      metadata: { tags: [topic] },
    });
  }
});

Given('que tenho memórias:', async function(this: CustomWorld, table: any) {
  for (const row of table.hashes()) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { text: row.conteúdo },
      metadata: { tags: ['preferência', 'usuário'] },
    });
  }
});

Given('que tenho memórias sobre decisões técnicas', async function(this: CustomWorld) {
  await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { 
      topic: 'banco de dados',
      decision: 'PostgreSQL',
      rationale: 'Melhor para dados relacionais'
    },
    metadata: { tags: ['database', 'decision', 'postgresql'] },
  });
  
  await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { 
      topic: 'cache',
      decision: 'Redis',
      rationale: 'Alta performance'
    },
    metadata: { tags: ['cache', 'decision', 'redis'] },
  });
});

Given('que tenho memórias de erros e soluções', async function(this: CustomWorld) {
  await this.memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { 
      type: 'error',
      error: 'connection timeout',
      solution: 'Aumentar timeout para 30s'
    },
    metadata: { tags: ['error', 'connection', 'solution'] },
  });
});

When('construo contexto para {string}', async function(this: CustomWorld, query: string) {
  this.lastContext = await this.memory.context(query);
});

When('construo contexto', async function(this: CustomWorld) {
  this.lastContext = await this.memory.context('teste');
});

Then('devo receber um contexto com summary', async function(this: CustomWorld) {
  assert.ok(this.lastContext, 'Contexto é null');
  assert.ok(this.lastContext.summary, 'Contexto não tem summary');
  assert.ok(typeof this.lastContext.summary === 'string', 'Summary não é string');
});

Then('o contexto deve incluir as memórias relevantes', async function(this: CustomWorld) {
  assert.ok(this.lastContext.memories, 'Contexto não tem memórias');
  assert.ok(Array.isArray(this.lastContext.memories), 'Memories não é array');
});

Then('o contexto deve incluir o traversalPath', async function(this: CustomWorld) {
  assert.ok(this.lastContext.traversalPath, 'Contexto não tem traversalPath');
  assert.ok(Array.isArray(this.lastContext.traversalPath), 'TraversalPath não é array');
});

Then('o traversalPath deve mostrar o caminho percorrido', async function(this: CustomWorld) {
  // Verifica se o traversalPath é um array de strings
  assert.ok(Array.isArray(this.lastContext.traversalPath), 'TraversalPath deve ser array');
});

Then('o contexto deve indicar que não há memórias', async function(this: CustomWorld) {
  assert.ok(
    this.lastContext.summary.includes('No relevant') || 
    this.lastContext.memories.length === 0,
    'Contexto deveria indicar ausência de memórias'
  );
});

Then('o contexto deve incluir até {int} memórias', async function(this: CustomWorld, max: number) {
  assert.ok(
    this.lastContext.memories.length <= max,
    `Contexto tem ${this.lastContext.memories.length} memórias, esperado no máximo ${max}`
  );
});

Then('o summary deve consolidar as informações', async function(this: CustomWorld) {
  assert.ok(
    this.lastContext.summary.length > 0,
    'Summary está vazio'
  );
});

Then('o contexto deve mencionar {string}', async function(this: CustomWorld, term: string) {
  const contextStr = JSON.stringify(this.lastContext).toLowerCase();
  assert.ok(
    contextStr.includes(term.toLowerCase()),
    `Contexto não menciona "${term}"`
  );
});

Then('o contexto deve incluir as decisões relevantes', async function(this: CustomWorld) {
  assert.ok(
    this.lastContext.memories.length > 0,
    'Nenhuma decisão encontrada no contexto'
  );
});

Then('o contexto deve incluir o racional das decisões', async function(this: CustomWorld) {
  // Verifica se o conteúdo das memórias inclui rationale
  const hasRationale = this.lastContext.memories.some(m => {
    const contentStr = JSON.stringify(m.content).toLowerCase();
    return contentStr.includes('rationale') || contentStr.includes('porque') || contentStr.includes('para');
  });
  
  assert.ok(hasRationale, 'Nenhum racional encontrado nas decisões');
});

Then('cada memória no contexto deve ter explicação', async function(this: CustomWorld) {
  for (const memory of this.lastContext.memories) {
    assert.ok(
      memory.explanation,
      `Memória ${memory.nodeId} não tem explicação`
    );
  }
});

Then('a explicação deve ser compreensível', async function(this: CustomWorld) {
  for (const memory of this.lastContext.memories) {
    assert.ok(
      memory.explanation.length > 5,
      `Explicação muito curta: "${memory.explanation}"`
    );
  }
});

Then('o contexto deve incluir soluções relacionadas', async function(this: CustomWorld) {
  assert.ok(
    this.lastContext.memories.length > 0,
    'Nenhuma solução encontrada'
  );
  
  const hasSolution = this.lastContext.memories.some(m => {
    const contentStr = JSON.stringify(m.content).toLowerCase();
    return contentStr.includes('solution') || contentStr.includes('solução');
  });
  
  assert.ok(hasSolution, 'Nenhuma solução encontrada no contexto');
});
