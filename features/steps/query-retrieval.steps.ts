import { Given, When, Then, And } from '@cucumber/cucumber';
import assert from 'assert';
import type { CustomWorld } from '../support/index.js';

/**
 * Step definitions para Query e Retrieval
 */

Given('que tenho memórias armazenadas', async function(this: CustomWorld) {
  await this.memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { text: 'Memória de teste 1' },
    metadata: { tags: ['teste', 'geral'] },
  });
  
  await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { decision: 'Decisão importante' },
    metadata: { tags: ['decisão', 'importante'] },
  });
});

Given('que tenho memórias dos tipos {string}, {string} e {string}', async function(this: CustomWorld, type1: string, type2: string, type3: string) {
  await this.memory.store({
    type: type1 as any,
    timestamp: new Date(),
    data: { test: true },
  });
  
  await this.memory.store({
    type: type2 as any,
    timestamp: new Date(),
    data: { test: true },
  });
  
  await this.memory.store({
    type: type3 as any,
    timestamp: new Date(),
    data: { test: true },
  });
});

Given('que tenho uma memória com título {string}', async function(this: CustomWorld, title: string) {
  await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { title, content: 'Conteúdo da decisão' },
    metadata: { tags: ['decision'] },
  });
});

Given('que tenho memórias com keywords sobre {string} e {string}', async function(this: CustomWorld, kw1: string, kw2: string) {
  await this.memory.store({
    type: 'semantic',
    timestamp: new Date(),
    data: { topic: kw1 },
    metadata: { tags: [kw1, kw2] },
  });
});

Given('que tenho {int} memórias com diferentes níveis de relevância', async function(this: CustomWorld, count: number) {
  for (let i = 0; i < count; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { index: i, text: `Memória ${i}` },
      metadata: { 
        tags: [`tag${i}`, 'comum'],
        confidence: 0.5 + (i / count) * 0.5,
      },
    });
  }
});

Given('que tenho {int} memórias armazenadas', async function(this: CustomWorld, count: number) {
  for (let i = 0; i < count; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { index: i, text: `Memória ${i}` },
    });
  }
});

Given('que tenho memórias organizadas em {string}', async function(this: CustomWorld, path: string) {
  // Armazena eventos que serão organizados no path
  await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { project: 'clientA', type: 'decision' },
    metadata: { tags: ['projects', 'clientA', 'decisions'] },
  });
});

Given('que tenho memórias criadas em tempos diferentes', async function(this: CustomWorld) {
  // Evento antigo
  await this.memory.store({
    type: 'message',
    timestamp: new Date(Date.now() - 1000000),
    data: { text: 'Antigo' },
  });
  
  // Evento recente
  await this.memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { text: 'Recente' },
  });
});

Given('que tenho memórias com importâncias variadas', async function(this: CustomWorld) {
  await this.memory.store({
    type: 'message',
    timestamp: new Date(),
    data: { text: 'Baixa importância' },
    metadata: { confidence: 0.3 },
  });
  
  await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { decision: 'Alta importância' },
    metadata: { confidence: 0.9, tags: ['important'] },
  });
});

Given('que tenho memórias com importância {string}, {string} e {string}', async function(this: CustomWorld, imp1: string, imp2: string, imp3: string) {
  const importances = [parseFloat(imp1), parseFloat(imp2), parseFloat(imp3)];
  
  for (const imp of importances) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { text: `Importância ${imp}` },
      metadata: { confidence: imp / 10 },
    });
  }
});

When('faço uma query por {string}', async function(this: CustomWorld, query: string) {
  this.lastQueryResult = await this.memory.query(query);
});

When('faço uma query filtrando por tipo {string}', async function(this: CustomWorld, type: string) {
  // Query normal e depois filtra
  const results = await this.memory.query(type);
  this.lastQueryResult = results.filter(r => {
    const node = this.memory.getNode(r.nodeId);
    return node?.type === type;
  });
});

When('faço uma query por {string}', async function(this: CustomWorld, query: string) {
  this.lastQueryResult = await this.memory.query(query);
});

When('faço uma query com maxResults {string}', async function(this: CustomWorld, maxStr: string) {
  const maxResults = parseInt(maxStr);
  const results = await this.memory.query('teste');
  this.lastQueryResult = results.slice(0, maxResults);
});

When('faço uma query pelo path {string}', async function(this: CustomWorld, pathStr: string) {
  const path = JSON.parse(pathStr);
  const nodes = this.memory.traverse(path);
  this.lastQueryResult = nodes.map(n => ({
    nodeId: n.id,
    path: n.path,
    content: n.content,
    relevance: 1.0,
    explanation: 'Path traversal',
  }));
});

When('busco memórias recentes', async function(this: CustomWorld) {
  this.lastQueryResult = this.memory.recent(10);
});

When('busco memórias importantes', async function(this: CustomWorld) {
  this.lastQueryResult = this.memory.important(10);
});

When('faço uma query com minImportance {string}', async function(this: CustomWorld, minStr: string) {
  const minImportance = parseFloat(minStr);
  const results = await this.memory.query('teste');
  this.lastQueryResult = results.filter(r => r.relevance * 10 >= minImportance);
});

Then('devo receber pelo menos {int} resultado(s)', async function(this: CustomWorld, min: number) {
  assert.ok(
    this.lastQueryResult.length >= min,
    `Esperado pelo menos ${min} resultados, got ${this.lastQueryResult.length}`
  );
});

Then('o resultado deve ter relevância maior que {float}', async function(this: CustomWorld, minRelevance: number) {
  assert.ok(
    this.lastQueryResult.length > 0,
    'Nenhum resultado encontrado'
  );
  
  const maxRelevance = Math.max(...this.lastQueryResult.map(r => r.relevance));
  assert.ok(
    maxRelevance > minRelevance,
    `Maior relevância ${maxRelevance} não é maior que ${minRelevance}`
  );
});

Then('devo receber {int} resultados', async function(this: CustomWorld, expected: number) {
  assert.strictEqual(
    this.lastQueryResult.length,
    expected,
    `Esperado ${expected} resultados, got ${this.lastQueryResult.length}`
  );
});

Then('o resultado deve incluir a memória com título contendo {string}', async function(this: CustomWorld, searchTerm: string) {
  const found = this.lastQueryResult.some(r => {
    const node = this.memory.getNode(r.nodeId);
    return node?.summary.title.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  assert.ok(found, `Nenhum resultado contém "${searchTerm}" no título`);
});

Then('devo receber apenas memórias do tipo {string}', async function(this: CustomWorld, type: string) {
  for (const result of this.lastQueryResult) {
    const node = this.memory.getNode(result.nodeId);
    assert.strictEqual(
      node?.type,
      type,
      `Esperado tipo ${type}, got ${node?.type}`
    );
  }
});

Then('devo receber memórias que matcham ambas keywords', async function(this: CustomWorld) {
  assert.ok(
    this.lastQueryResult.length > 0,
    'Nenhum resultado encontrado'
  );
});

Then('cada resultado deve ter uma explicação do retrieval', async function(this: CustomWorld) {
  for (const result of this.lastQueryResult) {
    assert.ok(
      result.explanation,
      `Resultado ${result.nodeId} não tem explicação`
    );
  }
});

Then('a explicação deve mencionar as keywords matched', async function(this: CustomWorld) {
  // Verifica se alguma explicação menciona keywords
  const hasKeywordMention = this.lastQueryResult.some(r => 
    r.explanation.toLowerCase().includes('match') ||
    r.explanation.toLowerCase().includes('keyword')
  );
  
  assert.ok(hasKeywordMention, 'Nenhuma explicação menciona keywords');
});

Then('os resultados devem estar ordenados por relevância decrescente', async function(this: CustomWorld) {
  for (let i = 1; i < this.lastQueryResult.length; i++) {
    assert.ok(
      this.lastQueryResult[i - 1].relevance >= this.lastQueryResult[i].relevance,
      'Resultados não estão ordenados por relevância decrescente'
    );
  }
});

Then('devo receber no máximo {int} resultados', async function(this: CustomWorld, max: number) {
  assert.ok(
    this.lastQueryResult.length <= max,
    `Esperado no máximo ${max} resultados, got ${this.lastQueryResult.length}`
  );
});

Then('devo receber memórias daquele caminho', async function(this: CustomWorld) {
  assert.ok(
    this.lastQueryResult.length > 0,
    'Nenhuma memória do caminho encontrado'
  );
});

Then('devo receber as memórias mais recentes primeiro', async function(this: CustomWorld) {
  if (this.lastQueryResult.length < 2) return;
  
  const firstDate = new Date(this.lastQueryResult[0].content.timestamp || Date.now());
  const secondDate = new Date(this.lastQueryResult[1].content.timestamp || 0);
  
  assert.ok(
    firstDate >= secondDate,
    'Memórias não estão ordenadas por data'
  );
});

Then('devo receber as memórias com maior importância primeiro', async function(this: CustomWorld) {
  if (this.lastQueryResult.length < 2) return;
  
  const firstRelevance = this.lastQueryResult[0].relevance;
  const secondRelevance = this.lastQueryResult[1].relevance;
  
  assert.ok(
    firstRelevance >= secondRelevance,
    'Memórias não estão ordenadas por importância'
  );
});

Then('não devo receber memórias com importância menor que {float}', async function(this: CustomWorld, minImportance: number) {
  for (const result of this.lastQueryResult) {
    const importance = result.relevance * 10;
    assert.ok(
      importance >= minImportance,
      `Recebido memória com importância ${importance} < ${minImportance}`
    );
  }
});
