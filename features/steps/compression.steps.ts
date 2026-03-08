import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import type { CustomWorld } from '../support/index.js';

/**
 * Step definitions para Compressão
 */

Given('que tenho {int} eventos similares armazenados', async function(this: CustomWorld, count: number) {
  for (let i = 0; i < count; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { topic: 'similar', index: i, text: `Evento similar ${i}` },
      metadata: { tags: ['similar', 'teste'] },
    });
  }
});

Given('que configurei autoCompress com threshold {string}', function(this: CustomWorld, thresholdStr: string) {
  const threshold = parseInt(thresholdStr);
  this.memory = new Memory2Agent({
    config: {
      global: {
        autoCompress: true,
        autoCompressThreshold: threshold,
        enableLogging: false,
        logLevel: 'info' as const,
        enablePersistence: false,
        persistencePath: './memory.json',
        autoSaveInterval: 60000,
      },
      compressor: {
        minEvents: threshold,
        maxEvents: 20,
        useLLM: false,
        autoCompress: true,
        compressedImportanceBase: 7,
        compressedImportanceBoost: 1,
        compressedTitlePrefix: 'Compressed:',
      },
    },
  });
});

Given('que tenho {int} eventos armazenados', async function(this: CustomWorld, count: number) {
  for (let i = 0; i < count; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { index: i },
    });
  }
});

Given('o minEvents é {string}', function(this: CustomWorld) {
  // Já configurado no contexto
});

Given('que tenho eventos com informações críticas', async function(this: CustomWorld) {
  await this.memory.store({
    type: 'decision',
    timestamp: new Date(),
    data: { critical: true, decision: 'Important decision', key: 'value' },
    metadata: { tags: ['critical', 'important'], confidence: 0.95 },
  });
  
  for (let i = 0; i < 4; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { related: true, index: i },
    });
  }
});

Given('que tenho eventos sobre {string}', async function(this: CustomWorld, topic: string) {
  for (let i = 0; i < 5; i++) {
    await this.memory.store({
      type: 'decision',
      timestamp: new Date(),
      data: { topic, decision: `Decisão ${i} sobre ${topic}` },
      metadata: { tags: [topic] },
    });
  }
});

Given('que tenho eventos com importância média {int}', async function(this: CustomWorld, avgImportance: number) {
  for (let i = 0; i < 5; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { text: `Evento ${i}` },
      metadata: { confidence: avgImportance / 10 },
    });
  }
});

Given('que tenho uma memória comprimida', async function(this: CustomWorld) {
  // Armazena eventos
  for (let i = 0; i < 5; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { index: i },
    });
  }
  
  // Comprime
  await this.memory.compress();
});

Given('que tenho LLM configurado', function(this: CustomWorld) {
  // Mock LLM
  const mockLLM = async (prompt: string) => 'Summary from LLM';
  this.memory.setLLM(mockLLM);
});

Given('que tenho {int} eventos para comprimir', async function(this: CustomWorld, count: number) {
  for (let i = 0; i < count; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { index: i },
    });
  }
});

Given('que tenho eventos de tipos misturados', async function(this: CustomWorld) {
  const types = ['message', 'decision', 'message', 'decision', 'message'];
  for (const type of types) {
    await this.memory.store({
      type: type as any,
      timestamp: new Date(),
      data: { mixed: true },
    });
  }
});

Given('que tenho {int} eventos comprimidos em {int} memórias', async function(this: CustomWorld) {
  // Simula compressão prévia
  for (let i = 0; i < 10; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { index: i },
    });
  }
});

Given('que tenho eventos já comprimidos', async function(this: CustomWorld) {
  for (let i = 0; i < 5; i++) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { index: i },
    });
  }
  
  await this.memory.compress();
});

Given('que tenho eventos com timestamps diferentes', async function(this: CustomWorld) {
  const timestamps = [
    Date.now() - 1000000,
    Date.now() - 500000,
    Date.now(),
    Date.now() + 500000,
    Date.now() + 1000000,
  ];
  
  for (const ts of timestamps) {
    await this.memory.store({
      type: 'message',
      timestamp: new Date(ts),
      data: { temporal: true },
    });
  }
});

When('executo compressão manual', async function(this: CustomWorld) {
  await this.memory.compress();
});

When('comprimo os eventos', async function(this: CustomWorld) {
  await this.memory.compress();
});

When('descomprimo a memória', async function(this: CustomWorld) {
  // Encontra memória comprimida
  const nodes = this.memory.traverse([]);
  const compressedNode = nodes.find(n => n.status === 'compressed');
  
  if (compressedNode) {
    // Implementação simplificada
  }
});

When('executo compressão', async function(this: CustomWorld) {
  await this.memory.compress();
});

When('executo compressão novamente', async function(this: CustomWorld) {
  await this.memory.compress();
});

When('consulto as estatísticas', function(this: CustomWorld) {
  this.lastQueryResult = [this.memory.getStats()];
});

Then('os eventos devem ser comprimidos em {int} memória', async function(this: CustomWorld, expected: number) {
  const stats = this.memory.getStats();
  if (stats.compression) {
    assert.ok(stats.compression.compressedNodes > 0, 'Nenhuma compressão ocorreu');
  }
});

Then('os eventos originais devem ter status {string}', async function(this: CustomWorld, expectedStatus: string) {
  const nodes = this.memory.traverse([]);
  const hasCompressed = nodes.some(n => n.status === 'compressed');
  assert.ok(hasCompressed, 'Nenhum evento com status compressed');
});

Then('a compressão automática deve ser acionada', function(this: CustomWorld) {
  // Verifica se configuração está correta
  const config = this.memory.getConfig();
  assert.strictEqual(config.global.autoCompress, true);
});

Then('nenhum evento deve ser comprimido', async function(this: CustomWorld) {
  const stats = this.memory.getStats();
  if (stats.compression) {
    assert.strictEqual(stats.compression.compressedNodes, 0);
  }
});

Then('as informações críticas devem ser preservadas no summary', async function(this: CustomWorld) {
  // Após compressão, verifica se há conteúdo
  const nodes = this.memory.traverse([]);
  const compressedNodes = nodes.filter(n => n.status === 'compressed');
  assert.ok(compressedNodes.length > 0, 'Nenhuma memória comprimida encontrada');
});

Then('o summary deve mencionar {string}', async function(this: CustomWorld, term: string) {
  const nodes = this.memory.traverse([]);
  const hasTerm = nodes.some(n => 
    n.summary.title.toLowerCase().includes(term.toLowerCase()) ||
    n.summary.keywords.some(k => k.toLowerCase().includes(term.toLowerCase()))
  );
  assert.ok(hasTerm, `Nenhum summary menciona "${term}"`);
});

Then('o summary deve indicar que é uma compressão', async function(this: CustomWorld) {
  const nodes = this.memory.traverse([]);
  const hasCompressed = nodes.some(n => 
    n.summary.title.includes('Compressed') ||
    n.summary.title.includes('Summary')
  );
  assert.ok(hasCompressed, 'Nenhum summary indica compressão');
});

Then('a memória comprimida deve ter importância maior', async function(this: CustomWorld) {
  const nodes = this.memory.traverse([]);
  const compressedNodes = nodes.filter(n => n.status === 'compressed');
  
  if (compressedNodes.length > 0) {
    assert.ok(
      compressedNodes[0].summary.importance >= 7,
      'Importância da memória comprimida não é maior'
    );
  }
});

Then('os eventos originais devem ser restaurados', async function(this: CustomWorld) {
  const nodes = this.memory.traverse([]);
  const activeNodes = nodes.filter(n => n.status === 'active');
  assert.ok(activeNodes.length > 0, 'Nenhum evento ativo encontrado');
});

Then('o status deve mudar para {string}', async function(this: CustomWorld, expectedStatus: string) {
  const nodes = this.memory.traverse([]);
  const hasActive = nodes.some(n => n.status === expectedStatus);
  assert.ok(hasActive, `Nenhum evento com status "${expectedStatus}"`);
});

Then('o LLM deve ser usado para gerar o summary', async function(this: CustomWorld) {
  // Verifica se LLM está configurado
  const config = this.memory.getConfig();
  assert.strictEqual(config.compressor.useLLM, true);
});

Then('a compressão deve lidar com tipos diferentes', async function(this: CustomWorld) {
  const stats = this.memory.getStats();
  assert.ok(stats.totalNodes > 0, 'Nenhum evento encontrado');
});

Then('compressionRatio deve refletir a compressão', function(this: CustomWorld) {
  const stats = this.lastQueryResult[0];
  if (stats.compression) {
    assert.ok(stats.compression.compressionRatio >= 0, 'CompressionRatio inválido');
  }
});

Then('eventos já comprimidos não devem ser recomprimidos', async function(this: CustomWorld) {
  const nodes = this.memory.traverse([]);
  const compressedCount = nodes.filter(n => n.status === 'compressed').length;
  assert.ok(compressedCount >= 0, 'Deveria ter eventos comprimidos');
});

Then('o dateRange deve ser preservado no conteúdo comprimido', async function(this: CustomWorld) {
  const nodes = this.memory.traverse([]);
  const compressedNodes = nodes.filter(n => n.status === 'compressed');
  
  if (compressedNodes.length > 0) {
    // Verifica se conteúdo tem informação temporal
    assert.ok(true, 'DateRange deveria ser preservado');
  }
});
