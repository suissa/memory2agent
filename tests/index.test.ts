/**
 * Testes básicos da Memory2Agent
 */

import { Memory2Agent } from '../src/index.js';

async function runTests() {
  console.log('=== Memory2Agent Tests ===\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Store e Query básico
  try {
    console.log('Test 1: Store e Query básico...');
    const memory = new Memory2Agent();

    await memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { message: 'User prefers dark mode' },
      metadata: { tags: ['preference', 'ui'] },
    });

    const results = await memory.query('dark mode');
    
    if (results.length > 0) {
      console.log('  ✓ PASS: Query retornou resultados\n');
      passed++;
    } else {
      console.log('  ✗ FAIL: Query não retornou resultados\n');
      failed++;
    }
  } catch (error) {
    console.log('  ✗ FAIL:', error, '\n');
    failed++;
  }

  // Test 2: Múltiplos tipos de memória
  try {
    console.log('Test 2: Múltiplos tipos de memória...');
    const memory = new Memory2Agent();

    await memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { message: 'User login' },
      metadata: { tags: ['auth'] },
    });

    await memory.store({
      type: 'decision',
      timestamp: new Date(),
      data: { decision: 'Use OAuth2' },
      metadata: { tags: ['auth', 'security'] },
    });

    await memory.store({
      type: 'procedure',
      timestamp: new Date(),
      data: { steps: ['Step 1', 'Step 2'] },
      metadata: { tags: ['workflow'] },
    });

    const stats = memory.getStats();
    
    if (stats.totalNodes >= 4) { // root + 3 memories
      console.log('  ✓ PASS: Múltiplos tipos armazenados\n');
      passed++;
    } else {
      console.log('  ✗ FAIL: Esperado 4+ nós, got', stats.totalNodes, '\n');
      failed++;
    }
  } catch (error) {
    console.log('  ✗ FAIL:', error, '\n');
    failed++;
  }

  // Test 3: Context building
  try {
    console.log('Test 3: Context building...');
    const memory = new Memory2Agent();

    await memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { message: 'I use macOS' },
      metadata: { tags: ['os', 'preference'] },
    });

    await memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { message: 'I work with Kubernetes' },
      metadata: { tags: ['tools', 'preference'] },
    });

    const context = await memory.context('suggest tools');
    
    if (context.query && context.memories && context.summary) {
      console.log('  ✓ PASS: Context construído corretamente\n');
      passed++;
    } else {
      console.log('  ✗ FAIL: Context incompleto\n');
      failed++;
    }
  } catch (error) {
    console.log('  ✗ FAIL:', error, '\n');
    failed++;
  }

  // Test 4: Tree traversal
  try {
    console.log('Test 4: Tree traversal...');
    const memory = new Memory2Agent();

    await memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { message: 'Test message' },
      metadata: { tags: ['test'] },
    });

    // Explorar a partir da raiz
    const nodes = memory.explore('root', 2);
    
    if (nodes.length >= 1) {
      console.log('  ✓ PASS: Traversal funcionou\n');
      passed++;
    } else {
      console.log('  ✗ FAIL: Traversal não retornou nós\n');
      failed++;
    }
  } catch (error) {
    console.log('  ✗ FAIL:', error, '\n');
    failed++;
  }

  // Test 5: Recent and Important
  try {
    console.log('Test 5: Recent and Important...');
    const memory = new Memory2Agent();

    for (let i = 0; i < 5; i++) {
      await memory.store({
        type: 'message',
        timestamp: new Date(),
        data: { message: `Message ${i}` },
        metadata: { tags: ['test'], confidence: 0.9 },
      });
    }

    const recent = memory.recent(3);
    const important = memory.important(3);
    
    if (recent.length > 0 && important.length > 0) {
      console.log('  ✓ PASS: Recent e Important funcionaram\n');
      passed++;
    } else {
      console.log('  ✗ FAIL: Resultados vazios\n');
      failed++;
    }
  } catch (error) {
    console.log('  ✗ FAIL:', error, '\n');
    failed++;
  }

  // Test 6: Clear memory
  try {
    console.log('Test 6: Clear memory...');
    const memory = new Memory2Agent();

    await memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { message: 'Test' },
    });

    const before = memory.getStats().totalNodes;
    memory.clear();
    const after = memory.getStats().totalNodes;
    
    if (after < before) {
      console.log('  ✓ PASS: Clear funcionou\n');
      passed++;
    } else {
      console.log('  ✗ FAIL: Clear não reduziu nós\n');
      failed++;
    }
  } catch (error) {
    console.log('  ✗ FAIL:', error, '\n');
    failed++;
  }

  // Test 7: JSON export
  try {
    console.log('Test 7: JSON export...');
    const memory = new Memory2Agent();

    await memory.store({
      type: 'message',
      timestamp: new Date(),
      data: { message: 'Test' },
      metadata: { tags: ['test'] },
    });

    const json = memory.toJSON();
    
    if (json && typeof json === 'object') {
      console.log('  ✓ PASS: JSON export funcionou\n');
      passed++;
    } else {
      console.log('  ✗ FAIL: JSON export inválido\n');
      failed++;
    }
  } catch (error) {
    console.log('  ✗ FAIL:', error, '\n');
    failed++;
  }

  // Summary
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed.');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
