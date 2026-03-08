# language: pt
Funcionalidade: Query e Retrieval de Memórias
  Como um desenvolvedor de agentes
  Quero fazer queries nas memórias armazenadas
  Para recuperar informações relevantes de forma explicável

Cenário: Query por keyword simples
  Dado que tenho memórias armazenadas com keywords "['oauth', 'security']"
  Quando faço uma query por "oauth"
  Então devo receber pelo menos 1 resultado
  E o resultado deve ter relevância maior que 0.5

Cenário: Query sem resultados
  Dado que tenho memórias armazenadas com keywords "['java', 'python']"
  Quando faço uma query por "javascript"
  Então devo receber 0 resultados

Cenário: Query por título
  Dado que tenho uma memória com título "OAuth Flow Decision"
  Quando faço uma query por "OAuth"
  Então o resultado deve incluir a memória com título contendo "OAuth"

Cenário: Query por tipo de memória
  Dado que tenho memórias dos tipos "episodic", "semantic" e "procedural"
  Quando faço uma query filtrando por tipo "semantic"
  Então devo receber apenas memórias do tipo semantic

Cenário: Query com múltiplas keywords
  Dado que tenho memórias com keywords sobre "authentication" e "authorization"
  Quando faço uma query por "authentication authorization"
  Então devo receber memórias que matcham ambas keywords

Cenário: Retrieval explicável
  Dado que tenho memórias armazenadas
  Quando faço uma query
  Então cada resultado deve ter uma explicação do retrieval
  E a explicação deve mencionar as keywords matched

Cenário: Query ordenada por relevância
  Dado que tenho 5 memórias com diferentes níveis de relevância
  Quando faço uma query
  Então os resultados devem estar ordenados por relevância decrescente

Cenário: Query com limite de resultados
  Dado que tenho 10 memórias armazenadas
  Quando faço uma query com maxResults "5"
  Então devo receber no máximo 5 resultados

Cenário: Query por caminho na árvore
  Dado que tenho memórias organizadas em "/projects/clientA/decisions"
  Quando faço uma query pelo path "['projects', 'clientA']"
  Então devo receber memórias daquele caminho

Cenário: Query recente
  Dado que tenho memórias criadas em tempos diferentes
  Quando busco memórias recentes
  Então devo receber as memórias mais recentes primeiro

Cenário: Query por importância
  Dado que tenho memórias com importâncias variadas
  Quando busco memórias importantes
  Então devo receber as memórias com maior importância primeiro

Cenário: Query com mínimo de importância
  Dado que tenho memórias com importância 2, 5 e 8
  Quando faço uma query com minImportance "5"
  Então não devo receber memórias com importância menor que 5
