# language: pt
Funcionalidade: Configuração Everything-as-Code
  Como um desenvolvedor de agentes
  Quero configurar todos os aspectos da memória via código/JSON
  Para ter controle total sobre o comportamento

Cenário: Criar memória com configuração padrão
  Quando crio uma memória sem configuração
  Então deve usar a configuração DEFAULT_CONFIG

Cenário: Criar memória com preset
  Quando crio uma memória com preset "minimal"
  Então a configuração deve ter autoKeywords false
  E maxResults deve ser 5

Cenário: Criar memória com preset advanced
  Quando crio uma memória com preset "advanced"
  Então useLLM deve ser true
  E maxResults deve ser 15

Cenário: Configurar encoder via JSON
  Dado uma configuração JSON com encoder.maxKeywords "10"
  Quando crio a memória com esta configuração
  Então o encoder deve usar maxKeywords 10

Cenário: Configurar retriever via JSON
  Dado uma configuração JSON com retriever.maxResults "20"
  Quando crio a memória com esta configuração
  Então o retriever deve usar maxResults 20

Cenário: Configurar compressor via JSON
  Dado uma configuração JSON com compressor.minEvents "3"
  Quando crio a memória com esta configuração
  Então o compressor deve usar minEvents 3

Cenário: Configurar tree root customizado
  Dado uma configuração JSON com tree.rootTitle "Agent Memory"
  Quando crio a memória com esta configuração
  Então o nó raiz deve ter título "Agent Memory"

Cenário: Configurar idPrefix
  Dado uma configuração JSON com tree.idPrefix "custom"
  Quando armazeno um evento
  Então o ID gerado deve começar com "custom"

Cenário: Configurar autoCompress
  Dado uma configuração JSON com global.autoCompress true
  E autoCompressThreshold "5"
  Quando armazeno 5 eventos
  Então a compressão automática deve ser acionada

Cenário: Configurar pesos de matching
  Dado uma configuração JSON com retriever.titleMatchWeight "5"
  Quando faço uma query
  Então matches no título devem ter peso 5

Cenário: Configurar stop words customizadas
  Dado uma configuração JSON com encoder.stopWords ["palavra1", "palavra2"]
  Quando extraio keywords
  Então as stop words não devem ser incluídas

Cenário: Configurar eventTypeToMemoryType
  Dado uma configuração JSON com mapeamento customizado de tipos
  Quando armazeno um evento do tipo customizado
  Então o evento deve ser classificado conforme mapeamento

Cenário: Carregar configuração de arquivo
  Dado um arquivo de configuração "memory2agent.config.json"
  Quando carrego a configuração do arquivo
  Então a configuração deve ser aplicada corretamente

Cenário: Merge de configurações
  Dado uma configuração base
  E uma configuração customizada parcial
  Quando faço merge das configurações
  Então os valores customizados devem sobrescrever os base

Cenário: Validar configuração inválida
  Dado uma configuração com maxKeywords "0"
  Quando valido a configuração
  Então deve retornar um erro de validação

Cenário: Validar configuração com valores fora de range
  Dado uma configuração com importance "15"
  Quando valido a configuração
  Então deve retornar um erro pois importance deve ser 0-10
