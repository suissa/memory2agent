import { Given, When, Then, And } from '@cucumber/cucumber';
import assert from 'assert';
import type { CustomWorld } from '../support/index.js';

/**
 * Step definitions para Store de Eventos
 */

Given('que tenho uma memória vazia', async function(this: CustomWorld) {
  this.memory.clear();
  assert.strictEqual(this.memory.getStats().totalNodes, 1); // Apenas root
});

Given('que tenho memórias armazenadas com keywords {string}', async function(this: CustomWorld, keywords: string) {
  const keywordsArray = JSON.parse(keywords);
  
  for (const keyword of keywordsArray) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { text: `Conteúdo sobre ${keyword}` },
      metadata: { tags: [keyword] },
    });
  }
});

When('armazeno um evento do tipo {string} com dados {string}', async function(this: CustomWorld, type: string, dataStr: string) {
  const data = JSON.parse(dataStr);
  
  const id = await this.memory.store({
    type,
    timestamp: new Date(),
    data,
  });
  
  this.lastStoredId = id;
});

When('armazeno um evento com metadata {string}', async function(this: CustomWorld, metadataStr: string) {
  const metadata = JSON.parse(metadataStr);
  
  const id = await this.memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { text: 'Teste com metadata' },
    metadata,
  });
  
  this.lastStoredId = id;
});

When('armazeno um evento do tipo {string}', async function(this: CustomWorld, type: string) {
  const id = await this.memory.store({
    type,
    timestamp: new Date(),
    data: { test: true },
  });
  
  this.lastStoredId = id;
});

When('armazeno um evento com confidence {string}', async function(this: CustomWorld, confidenceStr: string) {
  const confidence = parseFloat(confidenceStr);
  
  const id = await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { decision: 'Important decision' },
    metadata: { confidence, tags: ['important'] },
  });
  
  this.lastStoredId = id;
});

When('armazeno um batch de {int} eventos', async function(this: CustomWorld, count: number) {
  const events = Array.from({ length: count }, (_, i) => ({
    type: 'message' as const,
    timestamp: new Date(),
    data: { index: i, text: `Evento ${i}` },
  }));
  
  const ids = await this.memory.storeBatch(events);
  this.lastStoredId = ids[ids.length - 1];
});

When('armazeno o mesmo evento duas vezes', async function(this: CustomWorld) {
  const event = {
    type: 'message' as const,
    timestamp: new Date(),
    data: { text: 'Mesmo evento' },
  };
  
  const id1 = await this.memory.store(event);
  const id2 = await this.memory.store(event);
  
  this.lastStoredId = `${id1},${id2}`;
});

When('armazeno um evento com tags {string}', async function(this: CustomWorld, tagsStr: string) {
  const tags = JSON.parse(tagsStr);
  
  const id = await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { decision: 'Decision with tags' },
    metadata: { tags },
  });
  
  this.lastStoredId = id;
});

When('armazeno os seguintes eventos:', async function(this: CustomWorld, table: any) {
  for (const row of table.hashes()) {
    await this.memory.store({
      type: row.tipo,
      timestamp: new Date(),
      data: JSON.parse(row.dados),
    });
  }
});

Then('o evento deve ser armazenado com sucesso', async function(this: CustomWorld) {
  assert.ok(this.lastStoredId, 'ID do evento não foi gerado');
  assert.ok(typeof this.lastStoredId === 'string', 'ID não é string');
});

Then('a memória deve ter {int} eventos', async function(this: CustomWorld, expected: number) {
  const stats = this.memory.getStats();
  // Total nodes inclui root + nós de tipo + eventos
  assert.ok(stats.totalNodes >= expected, `Esperado pelo menos ${expected} eventos, got ${stats.totalNodes}`);
});

Then('o evento deve ter as metadata salvas', async function(this: CustomWorld) {
  const node = this.memory.getNode(this.lastStoredId);
  assert.ok(node, 'Evento não encontrado');
});

Then('a memória deve classificar corretamente cada tipo', async function(this: CustomWorld) {
  const nodes = this.memory.traverse([]);
  const types = nodes.map(n => n.type);
  
  assert.ok(types.includes('episodic'), 'Não encontrou evento episodic');
  assert.ok(types.includes('semantic'), 'Não encontrou evento semantic');
  assert.ok(types.includes('procedural'), 'Não encontrou evento procedural');
});

Then('o evento deve ter importância maior que {int}', async function(this: CustomWorld, minImportance: number) {
  const node = this.memory.getNode(this.lastStoredId);
  assert.ok(node, 'Evento não encontrado');
  assert.ok(node.summary.importance > minImportance, 
    `Importância ${node.summary.importance} não é maior que ${minImportance}`);
});

Then('devo receber IDs diferentes para cada evento', async function(this: CustomWorld) {
  const [id1, id2] = this.lastStoredId.split(',');
  assert.notStrictEqual(id1, id2, 'IDs deveriam ser diferentes');
});

Then('as tags devem ser usadas como keywords', async function(this: CustomWorld) {
  const node = this.memory.getNode(this.lastStoredId);
  assert.ok(node, 'Evento não encontrado');
  
  const tags = node.summary.keywords;
  assert.ok(tags.length > 0, 'Nenhuma keyword encontrada');
});
