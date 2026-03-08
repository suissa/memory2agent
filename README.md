# memory2agent

> **Vectorless Agent Memory** - Memória estruturada para agentes com retrieval explicável
>
> **Everything-as-Code**: Configuração centralizada e externalizada

[![npm version](https://img.shields.io/npm/v/memory2agent.svg)](https://www.npmjs.com/package/memory2agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 Por que memory2agent?

A maioria das arquiteturas de agentes usa **vector databases como memória de longo prazo**. Isso cria problemas:

- ❌ Contexto fragmentado
- ❌ Pouca explicabilidade
- ❌ Memória sem estrutura

**memory2agent** resolve isso organizando conhecimento em **estruturas navegáveis** (árvores), onde o LLM faz **reasoning sobre a estrutura**.

---

## ✨ Diferenciais

| Feature | Vector DB | memory2agent |
|---------|-----------|--------------|
| **Retrieval** | Similaridade por embedding | Navegação estruturada |
| **Explicabilidade** | Black box | Caminho explícito na árvore |
| **Estrutura** | Plana | Hierárquica (árvore) |
| **Determinismo** | Não | Sim |
| **Tipos Semânticos** | Não | Sim (episodic/semantic/procedural) |
| **Configuração** | Hardcoded | **Everything-as-Code** |

---

## 📦 Instalação

```bash
npm install memory2agent
```

---

## 🚀 Quick Start

```typescript
import { Memory2Agent } from 'memory2agent';

// Criar instância
const memory = new Memory2Agent();

// Store: Armazenar eventos
await memory.store({
  type: 'message',
  timestamp: new Date(),
  data: { message: 'User prefers dark mode' },
  metadata: { tags: ['preference', 'ui'] },
});

await memory.store({
  type: 'message',
  timestamp: new Date(),
  data: { message: 'I use macOS' },
  metadata: { tags: ['preference', 'os'] },
});

// Query: Buscar memórias relevantes
const results = await memory.query('user preferences');
console.log(results);

// Context: Obter contexto para LLM
const context = await memory.context('suggest tools for user');
console.log(context.summary);
```

---

## ⚙️ Everything-as-Code

Todas as configurações são externalizadas e podem ser definidas via:

### 1. Presets

```typescript
import { Memory2Agent, PRESETS } from 'memory2agent';

// Usar preset avançado
const memory = new Memory2Agent({ preset: 'advanced' });

// Presets disponíveis:
// - 'minimal': Configuração mínima
// - 'advanced': Com LLM habilitado
// - 'eventSourcing': Otimizado para event sourcing
// - 'debug': Com logs detalhados
```

### 2. Configuração JSON

```typescript
import { Memory2Agent, loadConfig } from 'memory2agent';

// Carregar de arquivo JSON
const { config } = await loadConfig({
  configPath: './memory2agent.config.json'
});

const memory = new Memory2Agent({ config });
```

### 3. Configuração TypeScript

```typescript
import { Memory2Agent, createConfig } from 'memory2agent';

// Criar configuração customizada
const config = createConfig({
  encoder: { maxKeywords: 10 },
  retriever: { maxResults: 20 },
  compressor: { minEvents: 3 },
});

const memory = new Memory2Agent({ config });
```

### 4. Configuração Completa

```typescript
const memory = new Memory2Agent({
  name: 'my-agent',
  config: {
    tree: {
      rootId: 'agent',
      rootTitle: 'My Agent Memory',
      idPrefix: 'mem',
    },
    encoder: {
      autoKeywords: true,
      maxKeywords: 7,
      baseImportance: 5,
    },
    retriever: {
      maxResults: 15,
      titleMatchWeight: 3,
    },
    global: {
      autoCompress: true,
      autoCompressThreshold: 50,
    }
  }
});
```

---

## 📚 Arquitetura

```
Agent Event
     ↓
Memory Encoder → Transforma eventos em memória estruturada
     ↓
Memory Router  → Decide onde armazenar na árvore
     ↓
Memory Tree    → Estrutura hierárquica navegável
     ↓
Memory Retriever → Retrieval vectorless com explicabilidade
     ↓
Memory Compressor → Compressão de eventos relacionados
```

---

## 🧠 Tipos de Memória

Inspirado em ciência cognitiva:

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Episodic** | Eventos específicos com contexto temporal | "User asked about OAuth" |
| **Semantic** | Conhecimento factual e conceitos | "OAuth2 uses JWT tokens" |
| **Procedural** | Habilidades e procedimentos | "How to deploy to production" |

---

## 📖 API

### Classe Principal

```typescript
const memory = new Memory2Agent(config?: Memory2AgentConfig);
```

### Métodos

| Método | Descrição | Retorna |
|--------|-----------|---------|
| `store(event)` | Armazena um evento | `Promise<MemoryId>` |
| `storeBatch(events)` | Armazena múltiplos eventos | `Promise<MemoryId[]>` |
| `query(question)` | Busca memórias relevantes | `Promise<MemoryRetrievalResult[]>` |
| `context(question)` | Obtém contexto para LLM | `Promise<MemoryContext>` |
| `traverse(path)` | Navega por caminho na árvore | `MemoryNode[]` |
| `explore(nodeId, depth)` | Explora memórias de um nó | `MemoryNode[]` |
| `recent(limit)` | Memórias recentes | `MemoryRetrievalResult[]` |
| `important(limit)` | Memórias importantes | `MemoryRetrievalResult[]` |
| `compress()` | Comprime memórias manualmente | `Promise<void>` |
| `getStats()` | Estatísticas da memória | `object` |
| `clear()` | Limpa toda a memória | `void` |

---

## 🔧 Configuração

### Estrutura de Configuração

```typescript
interface Memory2AgentFullConfig {
  name?: string;
  version?: string;
  tree: MemoryTreeConfig;       // Configuração da árvore
  encoder: MemoryEncoderConfig; // Configuração do encoder
  router: MemoryRouterConfig;   // Configuração do router
  retriever: MemoryRetrieverConfig; // Configuração do retriever
  compressor: MemoryCompressorConfig; // Configuração do compressor
  global: Memory2AgentGlobalConfig;   // Configuração global
}
```

### Opções de Configuração

#### Tree Config

| Opção | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `rootId` | string | 'root' | ID do nó raiz |
| `rootTitle` | string | 'Root' | Título do nó raiz |
| `rootType` | string | 'semantic' | Tipo do nó raiz |
| `rootImportance` | number | 10 | Importância do root |
| `idPrefix` | string | 'mem' | Prefixo para IDs |

#### Encoder Config

| Opção | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `autoKeywords` | boolean | true | Extrair keywords automaticamente |
| `autoImportance` | boolean | true | Calcular importância |
| `maxKeywords` | number | 5 | Máximo de keywords |
| `baseImportance` | number | 5 | Importância base |
| `proceduralImportanceBoost` | number | 2 | Boost para procedural |
| `decisionImportanceBoost` | number | 2 | Boost para decisões |

#### Retriever Config

| Opção | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `maxResults` | number | 10 | Máximo de resultados |
| `maxDepth` | number | 5 | Profundidade máxima |
| `minImportance` | number | 3 | Importância mínima |
| `titleMatchWeight` | number | 3 | Peso para título |
| `keywordMatchWeight` | number | 2 | Peso para keywords |
| `contentMatchWeight` | number | 1 | Peso para conteúdo |

#### Compressor Config

| Opção | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `minEvents` | number | 5 | Mínimo para compressão |
| `maxEvents` | number | 20 | Máximo para compressão |
| `autoCompress` | boolean | false | Auto-comprimir |
| `compressedImportanceBase` | number | 7 | Importância base |

#### Global Config

| Opção | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `autoCompress` | boolean | false | Auto-comprimir |
| `autoCompressThreshold` | number | 50 | Threshold |
| `enablePersistence` | boolean | false | Habilitar persistência |
| `persistencePath` | string | './memory.json' | Path do arquivo |
| `autoSaveInterval` | number | 60000 | Intervalo em ms |

---

## 🤝 Integração com LLM

```typescript
// Função LLM (ex: OpenAI, Anthropic, etc.)
async function callLLM(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content;
}

// Set LLM na memória
memory.setLLM(callLLM);
```

Com LLM habilitado:
- ✅ Keywords extraídas semanticamente
- ✅ Summaries mais inteligentes
- ✅ Retrieval semântico avançado
- ✅ Compressão com sumarização

---

## 📝 Exemplos

### Exemplo 1: Agente de Suporte

```typescript
const memory = new Memory2Agent();

// Armazenar preferências do usuário
await memory.store({
  type: 'message',
  timestamp: new Date(),
  data: { message: 'I prefer dark mode' },
  metadata: { tags: ['preference', 'ui'] },
});

await memory.store({
  type: 'message',
  timestamp: new Date(),
  data: { message: 'I work with Kubernetes' },
  metadata: { tags: ['preference', 'tools'] },
});

// Query contextual
const context = await memory.context('suggest tools');
// → Retorna memórias sobre Kubernetes e preferências
```

### Exemplo 2: Event Sourcing de Projeto

```typescript
// Eventos de decisão
await memory.store({
  type: 'decision',
  timestamp: new Date(),
  data: { topic: 'OAuth', decision: 'Use OAuth2' },
  metadata: { tags: ['oauth', 'security'] },
});

await memory.store({
  type: 'decision',
  timestamp: new Date(),
  data: { topic: 'Token', decision: 'Use JWT' },
  metadata: { tags: ['jwt', 'tokens'] },
});

// Query por decisões
const decisions = await memory.query('what did we decide about OAuth?');
```

### Exemplo 3: Navegação Hierárquica

```typescript
// Explorar árvore
const nodes = memory.traverse(['projects', 'clientA', 'decisions']);

// Explorar a partir de um nó
const explored = memory.explore(nodeId, depth: 2);

// Ver estrutura completa
const tree = memory.toJSON();
```

---

## 🗂️ Estrutura da Árvore

```
AgentMemory
 ├─ episodic
 │   ├─ messages
 │   │   ├─ mem_123_user_prefers_dark_mode
 │   │   └─ mem_456_user_uses_macos
 │   └─ interactions
 │
 ├─ semantic
 │   ├─ concepts
 │   │   ├─ oauth2_flow
 │   │   └─ kubernetes_basics
 │   └─ facts
 │
 └─ procedural
     ├─ workflows
     │   ├─ deployment_process
     │   └─ code_review_steps
     └─ howtos
```

---

## 📊 Explicabilidade

Cada resultado de retrieval inclui:

```typescript
{
  nodeId: "mem_123",
  path: "/semantic/concepts/oauth2_flow",
  content: { type: "text", value: "..." },
  relevance: 0.85,
  explanation: "Matched keywords: oauth, authentication"
}
```

Isso permite **debug completo** do retrieval.

---

## 🔄 Compressão de Memória

Quando muitos eventos relacionados são armazenados:

```typescript
// Após 5+ eventos similares...
await memory.compress();

// 10 eventos → 1 memória consolidada
// Status dos originais: "compressed"
```

---

## 📁 Persistência

```typescript
// Exportar
const json = memory.toJSON();
fs.writeFileSync('memory.json', JSON.stringify(json));

// Importar (futuro)
// memory.fromJSON(json);
```

---

## 🧪 Testes

```bash
npm test
```

---

## 📦 Módulos

| Módulo | Descrição |
|--------|-----------|
| `memory-core` | Estrutura base (Node, Tree, Types) |
| `memory-encoder` | Transforma eventos em memória |
| `memory-router` | Classifica e direciona memória |
| `memory-retriever` | Retrieval vectorless |
| `memory-compressor` | Compressão de eventos |

---

## 🧪 Testes

### Testes Unitários

```bash
npm run test
```

### Testes BDD (Behavior-Driven Development)

```bash
# Rodar todos os testes BDD
npm run test:bdd

# Com relatório HTML
npm run test:bdd:report

# Todos os testes (unitários + BDD)
npm run test:all
```

#### Features BDD

| Feature | Cenários | Descrição |
|---------|----------|-----------|
| `store-events.feature` | 8 | Armazenamento de eventos |
| `query-retrieval.feature` | 12 | Query e retrieval vectorless |
| `context-building.feature` | 8 | Construção de contexto para LLM |
| `config.feature` | 16 | Configuração Everything-as-Code |
| `compression.feature` | 12 | Compressão de memórias |
| **Total** | **56** | **185 steps** |

Veja mais detalhes em [features/README.md](features/README.md).

---

## 🛠️ Desenvolvimento

```bash
# Clone
git clone https://github.com/youruser/memory2agent

# Install
npm install

# Build
npm run build

# Dev watch
npm run dev

# Test (unitários)
npm run test

# Test (BDD)
npm run test:bdd

# Test (todos)
npm run test:all
```

---

## 📄 License

MIT © 2024

---

## 🔗 Links

- [npm](https://www.npmjs.com/package/memory2agent)
- [GitHub](https://github.com/youruser/memory2agent)

---

## 🙏 Inspiração

- [PageIndex - Vectorless Retrieval](https://docs.pageindex.ai/)
- [AAAI - Long-Term Memory in LLM Agents](https://ojs.aaai.org/index.php/AAAI-SS/article/download/27688/27461/31739)
- Ciência Cognitiva (memória episódica/semântica/procedural)
