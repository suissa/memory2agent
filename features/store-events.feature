# language: pt
Funcionalidade: Armazenar Eventos na Memória
  Como um desenvolvedor de agentes
  Quero armazenar eventos na memória vectorless
  Para que o agente possa recuperar informações relevantes depois

Cenário: Armazenar um evento simples
  Dado que tenho uma memória vazia
  Quando armazeno um evento do tipo "message" com dados "{ \"text\": \"Olá mundo\" }"
  Então o evento deve ser armazenado com sucesso
  E a memória deve ter 1 evento

Cenário: Armazenar múltiplos eventos
  Dado que tenho uma memória vazia
  Quando armazeno os seguintes eventos:
    | tipo        | dados                              |
    | message     | { "text": "Primeira mensagem" }    |
    | message     | { "text": "Segunda mensagem" }     |
    | decision    | { "decision": "Usar OAuth2" }      |
  Então a memória deve ter 3 eventos

Cenário: Armazenar evento com metadata
  Dado que tenho uma memória vazia
  Quando armazeno um evento com metadata "tags: [\"importante\", \"teste\"]"
  Então o evento deve ter as metadata salvas

Cenário: Armazenar eventos de tipos diferentes
  Dado que tenho uma memória vazia
  Quando armazeno um evento do tipo "episodic"
  E armazeno um evento do tipo "semantic"
  E armazeno um evento do tipo "procedural"
  Então a memória deve classificar corretamente cada tipo

Cenário: Armazenar evento com alta importância
  Dado que tenho uma memória vazia
  Quando armazeno um evento com confidence "0.95"
  Então o evento deve ter importância maior que 7

Cenário: Armazenar batch de eventos
  Dado que tenho uma memória vazia
  Quando armazeno um batch de 10 eventos
  Então todos os 10 eventos devem ser armazenados

Cenário: Armazenar evento duplicado
  Dado que tenho uma memória vazia
  Quando armazeno o mesmo evento duas vezes
  Então devo receber IDs diferentes para cada evento

Cenário: Armazenar evento com tags
  Dado que tenho uma memória vazia
  Quando armazeno um evento com tags "['oauth', 'security', 'decision']"
  Então as tags devem ser usadas como keywords
