/**
 * Exemplo 2: Uso Avançado com LLM
 * Memory2Agent com LLM para encoding e retrieval semântico
 */

import { Memory2Agent, type MemoryEvent } from '../src/index.js';

// Mock de LLM (substituir por chamada real à API)
async function mockLLM(prompt: string): Promise<string> {
  console.log('LLM Prompt:', prompt.slice(0, 100), '...\n');

  // Simular resposta do LLM
  if (prompt.includes('title')) {
    return 'OAuth Flow Decision';
  }
  if (prompt.includes('keywords')) {
    return 'oauth, authentication, security, decision, api';
  }
  if (prompt.includes('Summarize')) {
    return 'User decided to use OAuth2 with JWT tokens for API authentication.';
  }
  return 'Response from LLM';
}

async function exampleAdvanced() {
  console.log('=== Exemplo Avançado: Com LLM ===\n');

  // Criar instância com LLM
  const memory = new Memory2Agent({
    encoder: {
      autoKeywords: true,
      autoImportance: true,
    },
    retriever: {
      useLLM: true,
      maxResults: 5,
    },
    compressor: {
      minEvents: 3,
      useLLM: true,
    },
    autoCompress: true,
    autoCompressThreshold: 5,
  });

  // Set LLM function
  memory.setLLM(mockLLM);

  // Eventos de decisão sobre OAuth
  const events: MemoryEvent[] = [
    {
      type: 'decision',
      timestamp: new Date(),
      data: { topic: 'OAuth flow', decision: 'Use OAuth2' },
      metadata: { tags: ['oauth', 'security'], confidence: 0.9 },
    },
    {
      type: 'decision',
      timestamp: new Date(),
      data: { topic: 'Token type', decision: 'Use JWT' },
      metadata: { tags: ['jwt', 'tokens'], confidence: 0.9 },
    },
    {
      type: 'decision',
      timestamp: new Date(),
      data: { topic: 'Token expiry', decision: '15 minutes' },
      metadata: { tags: ['tokens', 'security'], confidence: 0.8 },
    },
    {
      type: 'message',
      timestamp: new Date(),
      data: { message: 'Client needs refresh token rotation' },
      metadata: { tags: ['refresh', 'security'] },
    },
    {
      type: 'message',
      timestamp: new Date(),
      data: { message: 'Store tokens in memory only' },
      metadata: { tags: ['security', 'storage'] },
    },
  ];

  // Store batch
  console.log('Storing events...\n');
  const ids = await memory.storeBatch(events);
  console.log(`Stored ${ids.length} events\n`);

  // Query semântica
  console.log('Query: "what did we decide about OAuth?"');
  const oauthDecisions = await memory.query('what did we decide about OAuth?');

  for (const mem of oauthDecisions) {
    console.log(`  - ${mem.path}`);
    console.log(`    Relevance: ${mem.relevance}`);
    console.log(`    Explanation: ${mem.explanation}\n`);
  }

  // Compressão automática deve ocorrer após 5 eventos
  console.log('Compression stats:', memory.getStats().compression);

  // Contexto para LLM
  console.log('\nContext: "OAuth implementation"');
  const context = await memory.context('OAuth implementation');
  console.log(context.summary);
}

exampleAdvanced().catch(console.error);
