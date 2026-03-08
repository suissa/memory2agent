# language: pt
Funcionalidade: Context Building para LLM
  Como um desenvolvedor de agentes
  Quero construir contexto para LLMs
  Para que o agente tenha informações relevantes ao responder

Cenário: Construir contexto básico
  Dado que tenho memórias sobre "preferências do usuário"
  Quando construo contexto para "quais são as preferências"
  Então devo receber um contexto com summary
  E o contexto deve incluir as memórias relevantes

Cenário: Contexto com caminho de traversal
  Dado que tenho memórias organizadas hierarquicamente
  Quando construo contexto
  Então o contexto deve incluir o traversalPath
  E o traversalPath deve mostrar o caminho percorrido

Cenário: Contexto vazio quando sem resultados
  Dado que não tenho memórias sobre "assunto inexistente"
  Quando construo contexto para "assunto inexistente"
  Então o contexto deve indicar que não há memórias

Cenário: Contexto com múltiplas memórias
  Dado que tenho 5 memórias relevantes para "oauth"
  Quando construo contexto para "oauth"
  Então o contexto deve incluir até 5 memórias
  E o summary deve consolidar as informações

Cenário: Contexto para suggestão de ferramentas
  Dado que tenho memórias:
    | conteúdo                           |
    | "User prefers dark mode"           |
    | "User works with Kubernetes"       |
    | "User uses macOS"                  |
  Quando construo contexto para "suggest tools"
  Então o contexto deve mencionar Kubernetes
  E o contexto deve mencionar macOS

Cenário: Contexto para decisão técnica
  Dado que tenho memórias sobre decisões técnicas
  Quando construo contexto para "decisão sobre banco de dados"
  Então o contexto deve incluir as decisões relevantes
  E o contexto deve incluir o racional das decisões

Cenário: Contexto com explicabilidade
  Dado que tenho memórias armazenadas
  Quando construo contexto
  Então cada memória no contexto deve ter explicação
  E a explicação deve ser compreensível

Cenário: Contexto para troubleshooting
  Dado que tenho memórias de erros e soluções
  Quando construo contexto para "erro de conexão"
  Então o contexto deve incluir soluções relacionadas
