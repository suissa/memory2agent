# Testes BDD - memory2agent

Este diretório contém os testes de **Behavior-Driven Development (BDD)** para a lib memory2agent.

## 📋 Estrutura

```
features/
├── support/
│   └── world.ts          # Contexto compartilhado dos testes
├── steps/
│   ├── store-events.steps.ts      # Steps para store de eventos
│   ├── query-retrieval.steps.ts   # Steps para query e retrieval
│   ├── context-building.steps.ts  # Steps para context building
│   ├── config.steps.ts            # Steps para configuração
│   └── compression.steps.ts       # Steps para compressão
└── *.feature             # Features em Gherkin (Português)
```

## 🎯 Features

### 1. store-events.feature
Testa o armazenamento de eventos na memória:
- Armazenar evento simples
- Armazenar múltiplos eventos
- Eventos com metadata
- Tipos diferentes de memória
- Batch de eventos

**Cenários:** 8

### 2. query-retrieval.feature
Testa o retrieval vectorless de memórias:
- Query por keyword
- Query por título
- Query por tipo
- Retrieval explicável
- Ordenação por relevância
- Limites e filtros

**Cenários:** 12

### 3. context-building.feature
Testa a construção de contexto para LLMs:
- Contexto básico
- Contexto com traversal path
- Contexto vazio
- Múltiplas memórias
- Explicabilidade

**Cenários:** 8

### 4. config.feature
Testa o sistema Everything-as-Code:
- Presets (minimal, advanced, debug)
- Configuração via JSON
- Configuração via TypeScript
- Validação de configuração
- Merge de configurações

**Cenários:** 16

### 5. compression.feature
Testa a compressão de memórias:
- Compressão manual
- Compressão automática
- Thresholds
- Descompressão
- Estatísticas

**Cenários:** 12

## 🚀 Rodando os Testes

### Todos os testes BDD
```bash
npm run test:bdd
```

### Com relatório HTML
```bash
npm run test:bdd:report
```

### Todos os testes (unitários + BDD)
```bash
npm run test:all
```

## 📊 Relatórios

Os relatórios são gerados em:
- `reports/cucumber-report.html` - Relatório HTML formatado
- `reports/cucumber-report.json` - Relatório JSON para integração

## 📝 Escrevendo Novos Testes

### 1. Crie uma Feature (.feature)

```gherkin
# language: pt
Funcionalidade: Nova Funcionalidade
  Descrição da funcionalidade

  Cenário: Cenário de teste
    Dado que tenho uma condição inicial
    Quando executo uma ação
    Então devo esperar um resultado
```

### 2. Implemente os Steps

```typescript
// features/steps/nova-feature.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import type { CustomWorld } from '../support/world.js';

Given('que tenho uma condição inicial', async function(this: CustomWorld) {
  // Setup
});

When('executo uma ação', async function(this: CustomWorld) {
  // Ação
});

Then('devo esperar um resultado', function(this: CustomWorld) {
  // Assert
});
```

## 🔧 Configuração

### cucumber.mjs
```javascript
export default {
  default: {
    import: ['features/steps/*.ts'],
    require: ['features/steps/*.ts', 'features/support/*.ts'],
    loader: 'ts-node/esm',
    format: ['@cucumber/pretty-formatter'],
  },
};
```

### tsconfig.test.json
Configuração TypeScript específica para testes.

## 🌍 World Context

O `CustomWorld` fornece:
- `memory`: Instância de Memory2Agent
- `lastStoredId`: Último ID armazenado
- `lastQueryResult`: Último resultado de query
- `lastContext`: Último contexto construído
- `config`: Configuração atual
- `events`: Lista de eventos
- `errorMessage`: Mensagem de erro

## ✅ Hooks

- `Before`: Limpa memória e reseta estado antes de cada cenário
- `After`: Limpa memória após cada cenário

## 📈 Cobertura

| Módulo | Features | Cenários | Steps |
|--------|----------|----------|-------|
| Store | 1 | 8 | 15 |
| Query | 1 | 12 | 20 |
| Context | 1 | 8 | 15 |
| Config | 1 | 16 | 25 |
| Compression | 1 | 12 | 20 |
| **Total** | **5** | **56** | **95** |

## 🎨 Padrões de Step

### Given (Dado)
- Setup de estado inicial
- Pré-condições
- Configuração de memória

### When (Quando)
- Ações do usuário
- Chamadas de API
- Execução de comandos

### Then (Então)
- Asserts de resultado
- Validações
- Verificações de estado

### And (E)
- Continuação de Given/When/Then
- Múltiplas condições

## 🔍 Debug

Para debug, use:
```bash
npm run test:bdd -- --tags @debug
```

E marque cenários com `@debug`:
```gherkin
@debug
Cenário: Cenário para debug
  ...
```

## 📚 Gherkin em Português

Palavras-chave suportadas:
- `Funcionalidade` (Feature)
- `Cenário` (Scenario)
- `Dado` (Given)
- `Quando` (When)
- `Então` (Then)
- `E` (And)
- `Mas` (But)

## 🤝 Integração Contínua

Os testes BDD são executados automaticamente no CI/CD:
```yaml
- name: Run BDD Tests
  run: npm run test:bdd
```

## 📖 Referências

- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)
