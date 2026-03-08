# language: pt
Funcionalidade: Compressão de Memórias
  Como um desenvolvedor de agentes
  Quero comprimir múltiplos eventos em memórias consolidadas
  Para otimizar o uso da memória e melhorar o retrieval

Cenário: Comprimir manualmente um grupo de eventos
  Dado que tenho 5 eventos similares armazenados
  Quando executo compressão manual
  Então os eventos devem ser comprimidos em 1 memória
  E os eventos originais devem ter status "compressed"

Cenário: Compressão automática ao atingir threshold
  Dado que configurei autoCompress com threshold "5"
  Quando armazeno 5 eventos
  Então a compressão automática deve ser acionada

Cenário: Não comprimir abaixo do mínimo
  Dado que tenho 3 eventos armazenados
  E o minEvents é "5"
  Quando executo compressão
  Então nenhum evento deve ser comprimido

Cenário: Compressão preserva informações importantes
  Dado que tenho eventos com informações críticas
  Quando comprimo os eventos
  Então as informações críticas devem ser preservadas no summary

Cenário: Compressão gera summary adequado
  Dado que tenho eventos sobre "decisões OAuth"
  Quando comprimo os eventos
  Então o summary deve mencionar "OAuth"
  E o summary deve indicar que é uma compressão

Cenário: Compressão aumenta importância
  Dado que tenho eventos com importância média 5
  Quando comprimo os eventos
  Então a memória comprimida deve ter importância maior

Cenário: Descomprimir memória
  Dado que tenho uma memória comprimida
  Quando descomprimo a memória
  Então os eventos originais devem ser restaurados
  E o status deve mudar para "active"

Cenário: Compressão com LLM
  Dado que tenho LLM configurado
  E tenho 5 eventos para comprimir
  Quando executo compressão
  Então o LLM deve ser usado para gerar o summary

Cenário: Compressão de eventos de tipos diferentes
  Dado que tenho eventos de tipos misturados
  Quando executo compressão
  Então a compressão deve lidar com tipos diferentes

Cenário: Estatísticas de compressão
  Dado que tenho 10 eventos comprimidos em 2 memórias
  Quando consulto as estatísticas
  Então compressionRatio deve refletir a compressão

Cenário: Não comprimir nós já comprimidos
  Dado que tenho eventos já comprimidos
  Quando executo compressão novamente
  Então eventos já comprimidos não devem ser recomprimidos

Cenário: Compressão de eventos temporais
  Dado que tenho eventos com timestamps diferentes
  Quando comprimo os eventos
  Então o dateRange deve ser preservado no conteúdo comprimido
