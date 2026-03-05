# memory2agent

> **Vectorless Agent Memory** - Memória estruturada para agentes com retrieval explicável

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

```typescript
const memory = new Memory2Agent({
  encoder: {
    autoKeywords: true,      // Extrair keywords automaticamente
    autoImportance: true,    // Calcular importância
    maxKeywords: 5,
  },
  router: {
    autoCreateCategories: true,  // Criar categorias automaticamente
    maxSiblings: 10,             // Máximo de irmãos antes de sub-categorizar
  },
  retriever: {
    maxResults: 10,
    maxDepth: 5,
    minImportance: 3,
    useLLM: false,           // Usar LLM para matching semântico
  },
  compressor: {
    minEvents: 5,            // Mínimo de eventos para compressão
    useLLM: false,           // Usar LLM para sumarização
    autoCompress: false,     // Auto-comprimir periodicamente
  },
  autoCompress: false,
  autoCompressThreshold: 50,
});
```

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
