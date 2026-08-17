# API de Integração Checkmob — v2

> **Este arquivo é um contexto único e completo da API v2 da Checkmob.**
>
> Ele foi feito para ser entregue a um assistente de IA (ChatGPT, Claude, Copilot,
> Gemini ou o modelo que você usar) junto com a sua pergunta. Contém o contrato,
> as convenções, os fluxos e todos os endpoints — o suficiente para o modelo
> escrever código de integração correto sem inventar campo.
>
> Documentação navegável: https://checkmob.github.io/documentacao/
> Swagger (testar no navegador): https://api-integration.checkmob.com/index.html
> Collection do Postman: https://checkmob.github.io/documentacao/assets/checkmob-api-v2.postman_collection.json

## Como usar este arquivo

Anexe-o à conversa e pergunte o que precisa. Exemplos de pergunta que ele
responde bem:

- "Escreva um script em Python que sincroniza meus clientes com a Checkmob."
- "Como eu agendo uma visita para amanhã e leio o resultado depois?"
- "Meu código recebeu 400 VALIDACAO_CAMPOS. O que está errado neste corpo?"
- "Monte a chamada para listar as ordens de serviço da próxima semana."

## Regras que o modelo deve respeitar

Se você é um modelo lendo este arquivo, siga estritamente:

1. **Não invente campos, endpoints nem valores.** Use apenas o que está aqui.
   Se algo não estiver documentado, diga que não está em vez de supor.
2. **Toda data é UTC em ISO 8601** (`2026-08-17T14:30:00Z`), no envio e no retorno.
3. **Listagem é `POST /{recurso}/list`** com filtros no corpo JSON — nunca query string.
4. **Paginação é por página** (`pagina`, `por_pagina`), nunca por deslocamento.
   Máximo de 100 por página.
5. **Trate erro pelo campo `codigo`**, nunca pelo texto de `titulo` ou `detalhe`,
   que mudam de idioma.
6. **Campo desconhecido no corpo devolve 400.** Não acrescente campos "por garantia".
7. **Em `PUT`, campo ausente preserva o valor atual** — não zera.
8. **O fluxo principal é o registro (visita)**, não a ordem de serviço.
   Ordem de serviço só quando há mais de um usuário em campo ou mais de uma visita.
9. **Sempre que a integração for recorrente**, use `atualizado_apos` em vez de
   varrer tudo de novo.
10. **Respeite o limite** de 30 requisições por 30 segundos e o teto de 500 itens
    por operação em lote.

---


---

## Visão geral

Esta API permite que o seu sistema converse com a Checkmob: **mandar trabalho para o campo** (clientes, ordens de serviço, agendamentos) e **trazer de volta o que foi executado** (registros, respostas de questionário, deslocamento).

**Já quer iniciar?**

Vá direto para a primeira integração — token e primeira listagem em três comandos.

Prefere testar clicando? Baixe a collection do Postman — 70 requisições prontas, com o token se preenchendo sozinho.

### Como esta documentação funciona

| Onde | Para quê |
|---|---|
| **Esta documentação** | Entender **como** integrar: fluxos, conceitos e receitas prontas |
| **[Swagger](https://api-integration.checkmob.com/index.html)** | Consultar **o que** existe: cada endpoint, cada campo, e testar direto no navegador |

Os dois se completam. O Swagger responde "quais campos esse endpoint aceita?". Aqui a gente responde "como eu mantenho meu ERP sincronizado com a Checkmob sem baixar tudo de novo toda noite?".

### Versões

A API tem duas versões ativas.

**v2 — atual**

**Use esta em qualquer integração nova.** Contrato em português, respostas padronizadas, filtros mais ricos e sincronização incremental.

```
https://api-integration.checkmob.com/v2
```

**v1 — legado**

Mantida apenas para quem já integrou. Não recebe recursos novos e será descontinuada — toda resposta traz os cabeçalhos `Deprecation` e `Sunset` com a data.

```
https://api-integration.checkmob.com/api/v1
```

Já usa a v1? A documentação dela continua disponível em v1 (legado).

### O que muda na v2

Se você conhece a v1, estas são as diferenças que mais afetam o seu código:

- **Contrato em português**, com nomes em `snake_case`: `data_criacao`, `por_pagina`, `atualizado_em`.
- **Toda listagem é `POST /{recurso}/list`** com os filtros no corpo em JSON — sem query string quilométrica. Ver listagens.
- **Paginação por página**, não por deslocamento. Você pede `pagina: 2`, não `numberOfRowsSkipped: 500`. Ver paginação.
- **Um único formato de erro** para toda a API, com um código estável que o seu código pode tratar sem ler texto. Ver erros.
- **Sincronização incremental** em todos os recursos: peça só o que mudou desde a última vez. Ver sincronização.

### Os quatro conceitos que valem por toda a API

Aprenda uma vez e vale para todos os endpoints:

- **Listagens e filtros** — como buscar, filtrar e ordenar
- **Paginação** — o envelope de resposta e como percorrer páginas
- **Sincronização incremental** — trazer só o que mudou
- **Erros** — o formato único e como tratar cada código

### Precisa de ajuda?

Toda resposta da API traz o cabeçalho `X-Request-Id`. **Ao abrir um chamado, mande esse valor junto** — com ele o suporte localiza exatamente a sua requisição.

---

## Primeira integração

Três comandos para sair do zero: pegar um token, listar clientes e entender o que voltou.

### 1. Obtenha um token

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/token' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "seu_usuario",
    "senha": "sua_senha"
  }'
```

Resposta:

```json
{
  "token_acesso": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tipo_token": "Bearer",
  "expira_em": "2026-08-18T22:20:06Z"
}
```

Guarde o `token_acesso`. Ele vale até a data em `expira_em`.

### 2. Liste seus clientes

Todas as listagens da v2 são `POST` com os filtros no corpo:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "pagina": 1,
    "por_pagina": 25,
    "ativo": true
  }'
```

### 3. Entenda a resposta

Toda listagem devolve o mesmo envelope — dois campos, sempre:

```json
{
  "dados": [
    {
      "id": 1024,
      "codigo": "ERP-4471",
      "tipo": "J",
      "nome": "Padaria do Bairro LTDA",
      "documento": "12345678000190",
      "ativo": true,
      "data_criacao": "2026-03-11T14:02:00Z",
      "atualizado_em": "2026-08-14T09:31:22Z"
    }
  ],
  "paginacao": {
    "pagina": 1,
    "por_pagina": 25,
    "total_itens": 138,
    "total_paginas": 6
  }
}
```

- **`dados`** — o array de registros. Sempre um array, mesmo com um item só.
- **`paginacao`** — onde você está e quanto existe no total.

**Guarde o `atualizado_em`**

Repare no campo `atualizado_em` de cada registro. Ele é a chave da sincronização incremental: na próxima vez você pede só o que mudou depois dele, em vez de baixar os 138 clientes de novo.

### Pronto. E agora?

Você já tem o essencial. O próximo passo depende do que quer fazer:

| Objetivo | Vá para |
|---|---|
| **Mandar meu time visitar um cliente** | Agendar uma visita |
| **Trazer o que foi feito na visita** | Consumir o que foi realizado |
| Manter meu ERP e a Checkmob com a mesma base de clientes | Sincronizar clientes |
| Acompanhar KM rodado e custo | Deslocamentos |
| Coordenar trabalho com vários técnicos ou várias visitas | Ordens de serviço |
| Ver tudo que existe | Recursos disponíveis |

Os dois primeiros são o caminho mais percorrido: agendar a visita e depois ler o que aconteceu nela.

### Erros comuns nesses primeiros passos

| O que acontece | Causa provável |
|---|---|
| `401 NAO_AUTENTICADO` | Faltou o cabeçalho `Authorization`, ou o token expirou |
| `400 VALIDACAO_CAMPOS` com o campo `busca` | Você mandou um filtro que aquele endpoint não aceita — a v2 recusa em vez de ignorar |
| `405` num `GET /v2/clientes` | Listagem é `POST /v2/clientes/list`, não `GET` |
| `429 LIMITE_EXCEDIDO` | Passou de 30 requisições em 30 segundos. Ver limites |

---

## Autenticação

A API usa **token JWT** no cabeçalho `Authorization`. Todo endpoint exige token, com uma única exceção: o próprio `POST /v2/token`.

### Obtendo o token

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/token' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "seu_usuario",
    "senha": "sua_senha"
  }'
```

```json
{
  "token_acesso": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tipo_token": "Bearer",
  "expira_em": "2026-08-18T22:20:06Z"
}
```

| Campo | O que é |
|---|---|
| `token_acesso` | O JWT que vai no cabeçalho de todas as outras chamadas |
| `tipo_token` | Sempre `Bearer` |
| `expira_em` | Instante de expiração, em UTC |

### Usando o token

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Boas práticas

**Não peça um token por requisição**

Guarde o token e reaproveite até perto de `expira_em`. Pedir token a cada chamada desperdiça o seu limite de requisições e é o erro mais comum em integrações novas.

**Renove com antecedência.** Renovar quando faltarem alguns minutos para `expira_em` evita a corrida entre "token ainda válido" e "token expirado no meio da chamada".

**Trate o 401 como sinal de renovação.** Se uma chamada voltar `401 NAO_AUTENTICADO`, peça um token novo e repita a requisição uma vez. Se voltar 401 de novo, aí sim é problema de credencial.

**Nunca versione a senha no código.** Use variável de ambiente ou cofre de segredos.

### Credencial inválida

Login ou senha errados devolvem sempre a mesma resposta, sem dizer qual dos dois falhou:

```json
{
  "tipo": "https://docs.checkmob.com/erros/nao-autenticado",
  "titulo": "Não autenticado",
  "status": 401,
  "codigo": "NAO_AUTENTICADO",
  "detalhe": "Login ou senha inválidos.",
  "instancia": "/v2/token"
}
```

### Proteção contra tentativas repetidas

Sequências de tentativas malsucedidas **para o mesmo login** são bloqueadas temporariamente:

```json
{
  "titulo": "Limite de requisições excedido",
  "status": 429,
  "codigo": "LIMITE_EXCEDIDO",
  "detalhe": "Muitas tentativas de autenticação. Tente novamente em 47 segundos."
}
```

A resposta traz o cabeçalho `Retry-After` com os segundos a esperar. Autenticação bem-sucedida zera a contagem — uma integração que guarda o token corretamente nunca esbarra nisso.

### Idioma das mensagens

O campo `codigo` **nunca** muda de idioma — é ele que o seu código deve usar. Já `titulo` e `detalhe` respeitam o cabeçalho `Accept-Language`:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Accept-Language: en-US' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Idiomas: `pt-BR` (padrão) e `en-US`.

---

## Listagens e filtros

Toda listagem da v2 segue o mesmo formato. Aprenda uma vez, vale para clientes, ordens de serviço, registros, pessoas, usuários e todo o resto.

### O formato

```
POST /v2/{recurso}/list
```

Com os filtros no **corpo em JSON**:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "pagina": 1,
    "por_pagina": 50,
    "busca": "padaria",
    "ativo": true,
    "ordenar": "-data_criacao"
  }'
```

**Por que POST e não GET?**

Listagem é leitura, e a intuição diz `GET`. Mas os filtros da v2 incluem listas (`ids_status`, `ids_usuario`, `ids_segmento`) e intervalos de data. Em query string isso vira uma URL enorme, difícil de escapar corretamente e sujeita a limite de tamanho. Com o corpo em JSON o filtro fica legível e não tem teto prático.

**Corpo vazio lista tudo**, paginado. `{}` ou nenhum corpo funcionam igual:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Os filtros que todo recurso aceita

| Campo | Tipo | O que faz |
|---|---|---|
| `pagina` | inteiro | Página desejada, começa em 1. Padrão: 1 |
| `por_pagina` | inteiro | Itens por página. Padrão: 25, máximo: 100 |
| `busca` | texto | Busca textual ampla. Vazio é ignorado |
| `ordenar` | texto | Campos de ordenação, separados por vírgula |
| `atualizado_apos` | data/hora | Só o que mudou depois deste instante |

Cada recurso soma os seus próprios filtros a essa base. Os campos exatos de cada um estão no [Swagger](https://api-integration.checkmob.com/index.html).

### Busca

`busca` procura nos campos que fazem sentido para aquele recurso — normalmente os que a pessoa tem em mãos na hora de procurar:

| Recurso | `busca` procura em |
|---|---|
| Clientes | nome, código, documento |
| Pessoas | nome, e-mail |
| Usuários | nome, login, e-mail |
| Registros | observação, instruções |

Busca vazia ou só com espaços é ignorada, e a listagem devolve tudo.

### Ordenação

Campos separados por vírgula. Prefixo `-` inverte para decrescente:

```json
{ "ordenar": "-data_criacao,nome" }
```

Lê-se: mais recentes primeiro; empate resolve por nome crescente.

Cada recurso aceita um conjunto próprio de campos. Se você mandar um campo que não existe, a API **não ignora** — responde `400` dizendo quais são válidos:

```json
{
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "erros": [
    {
      "campo": "ordenar",
      "codigo": "VALOR_INVALIDO",
      "mensagem": "Campo de ordenação 'nome_cliente' desconhecido. Permitidos: id, nome, codigo, data_criacao, atualizado_em."
    }
  ]
}
```

**A ordenação é estável**

A API sempre acrescenta o `id` como último critério de desempate. Sem isso, dois registros com a mesma data poderiam trocar de posição entre uma página e outra, fazendo você ler um item duas vezes e pular outro.

### Filtros por lista e por intervalo

Filtros no plural aceitam vários valores e funcionam como "qualquer um destes":

```json
{
  "ids_status": [3, 7],
  "ids_usuario": [1201, 1202]
}
```

Datas e números usam sufixos de intervalo:

| Sufixo | Significado | Exemplo |
|---|---|---|
| `_apos` | maior que | `data_criacao_apos` |
| `_antes` | menor que | `data_criacao_antes` |
| `_min` | maior ou igual | `prioridade_min` |
| `_max` | menor ou igual | `prioridade_max` |

Combinando os dois lados você delimita uma janela:

```json
{
  "data_agendada_apos": "2026-08-01T00:00:00Z",
  "data_agendada_antes": "2026-08-31T23:59:59Z"
}
```

### Campo desconhecido é erro, não silêncio

Mandar um filtro que o endpoint não conhece devolve `400`:

```json
{
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "erros": [
    { "campo": "cliente_ativo", "codigo": "VALOR_INVALIDO", "mensagem": "Campo desconhecido." }
  ]
}
```

Pode parecer rigor desnecessário, mas é proteção. Se a API aceitasse e ignorasse, um erro de digitação em `ativo` faria você receber **todos** os clientes achando que recebeu só os ativos — e o problema só apareceria semanas depois, como dado errado no seu sistema.

### Datas

Todas as datas são **UTC**, no formato ISO 8601: `2026-08-17T14:30:00Z`. Isso vale tanto para o que você envia quanto para o que recebe. Converta para o fuso local só na hora de exibir.

---

## Paginação

### O envelope

Toda listagem devolve a mesma estrutura, com dois campos:

```json
{
  "dados": [ ... ],
  "paginacao": {
    "pagina": 2,
    "por_pagina": 50,
    "total_itens": 138,
    "total_paginas": 3
  }
}
```

| Campo | O que é |
|---|---|
| `pagina` | Página que você está vendo |
| `por_pagina` | Itens por página nesta resposta |
| `total_itens` | Total de registros que atendem ao filtro |
| `total_paginas` | Quantas páginas existem no total |

O formato é sempre esse — em coleções de cinco registros ou de cinco milhões.

### Percorrendo as páginas

Você pede a página que quer. Não precisa calcular deslocamento:

```json
{ "pagina": 1, "por_pagina": 50 }
```
```json
{ "pagina": 2, "por_pagina": 50 }
```
```json
{ "pagina": 3, "por_pagina": 50 }
```

Pare quando `pagina` alcançar `total_paginas`:

```python
pagina = 1
while True:
    r = post("/v2/clientes/list", {"pagina": pagina, "por_pagina": 100}).json()

    for cliente in r["dados"]:
        processa(cliente)

    if pagina >= r["paginacao"]["total_paginas"]:
        break
    pagina += 1
```

### Limites

| Situação | Comportamento |
|---|---|
| `por_pagina` ausente | Usa 25 |
| `por_pagina` acima de 100 | Usa 100. **Não é erro** |
| `pagina` ausente | Usa 1 |
| `pagina` ou `por_pagina` menor que 1 | `400 VALOR_INVALIDO` |

Ou seja: mandar `por_pagina: 5000` funciona, mas devolve 100. Se o seu código conta com o valor que enviou, leia `paginacao.por_pagina` da resposta em vez de assumir.

### Ordem estável entre páginas

A API sempre acrescenta o `id` como critério final de ordenação, mesmo que você não peça.

Isso resolve um problema silencioso: se você ordenar por `data_criacao` e vinte registros tiverem a mesma data, sem desempate o banco pode devolvê-los em ordem diferente a cada consulta. Na prática, você leria o mesmo registro na página 1 e na página 2, e perderia outro.

**Dados que mudam durante a varredura**

Paginar uma coleção que está sendo alterada enquanto você percorre pode fazer registros pularem entre páginas — isso vale para qualquer API paginada, não é específico da Checkmob.

Para varreduras grandes e recorrentes, prefira a sincronização incremental: além de resolver esse problema, você baixa muito menos dado.

---

## Sincronização incremental

Este é o recurso que mais economiza tempo e requisição na v2 — e o que ninguém descobre olhando só a lista de endpoints.

### O problema

A integração ingênua roda toda noite e baixa tudo:

```json
{ "pagina": 1, "por_pagina": 100 }
```

Com 50 mil clientes, são 500 requisições para descobrir que 12 mudaram. Todo dia. Você gasta o seu limite de requisições, demora, e ainda precisa comparar tudo do seu lado para achar o que mudou.

### A solução

Todo recurso da v2 aceita `atualizado_apos` e devolve `atualizado_em` em cada registro:

```json
{
  "atualizado_apos": "2026-08-16T03:00:00Z",
  "por_pagina": 100
}
```

Agora vêm só os registros alterados depois daquele instante. As mesmas 500 requisições viram uma.

### O ciclo

1. Guarde o instante do seu último sync bem-sucedido — chame de **cursor**.
2. Na próxima execução, mande esse cursor em `atualizado_apos`.
3. Processe o que veio, paginando normalmente.
4. **Avance o cursor para o maior `atualizado_em` que você recebeu.**
5. Salve o cursor só depois de processar tudo com sucesso.

```python
cursor = carrega_cursor()          # ex.: "2026-08-16T03:00:00Z"
maior_visto = cursor
pagina = 1

while True:
    r = post("/v2/clientes/list", {
        "atualizado_apos": cursor,
        "pagina": pagina,
        "por_pagina": 100,
        "ordenar": "atualizado_em"
    }).json()

    for cliente in r["dados"]:
        processa(cliente)
        maior_visto = max(maior_visto, cliente["atualizado_em"])

    if pagina >= r["paginacao"]["total_paginas"]:
        break
    pagina += 1

salva_cursor(maior_visto)          # só aqui, depois de tudo dar certo
```

**Use o `atualizado_em` recebido, não o relógio local**

É tentador salvar `agora()` como cursor. Não faça isso: o relógio do seu servidor e o da Checkmob não são idênticos, e a diferença — mesmo de poucos segundos — faz registros escaparem para sempre da sua sincronização.

O maior `atualizado_em` que você efetivamente recebeu não tem esse problema.

### Cuidados que evitam dor de cabeça

**Salve o cursor só no fim.** Se o processo cair no meio, o cursor antigo faz a próxima execução reprocessar o trecho. Reprocessar é chato; **perder registro é pior**.

**Prepare-se para receber o mesmo registro duas vezes.** Isso acontece quando um registro é alterado no exato instante do cursor, ou quando uma execução falha no meio. Faça a gravação do seu lado ser idempotente — normalmente um `upsert` pela chave do registro resolve.

**Ordene por `atualizado_em`.** Assim o maior valor vem nas últimas páginas e você pode avançar o cursor com segurança mesmo se interromper no meio.

**Sync inicial não usa cursor.** Na primeira carga, rode sem `atualizado_apos` para trazer a base inteira, guarde o maior `atualizado_em` e siga incremental daí em diante.

### E as exclusões?

`atualizado_apos` traz o que foi **criado ou alterado**. Registros excluídos simplesmente deixam de aparecer nas listagens — eles não voltam marcados como apagados.

Se o seu sistema precisa refletir exclusões, tem duas saídas:

- **Rode uma reconciliação completa periodicamente** (semanal, por exemplo): liste tudo sem `atualizado_apos`, compare com a sua base e marque como inativo o que sumiu.
- **Filtre pelos ids que você conhece** usando o filtro `ids` e veja quais não voltaram.

### Onde funciona

Em todos os recursos de listagem: clientes, pessoas, usuários, grupos, segmentos, ordens de serviço, registros, questionários, endereços e as tabelas de apoio (categorias, etapas, tipos de serviço, temperaturas, setores de mercado, objetivos, campos personalizados).

Cada registro devolve o `atualizado_em` correspondente, que é sempre o valor a usar como próximo cursor.

---

## Erros

A v2 tem **um único formato de erro** para toda a API. Você escreve o tratamento uma vez e ele funciona em qualquer endpoint.

### O formato

Todo erro vem como `application/problem+json` ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "tipo": "https://docs.checkmob.com/erros/validacao",
  "titulo": "Falha de validação",
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "detalhe": "O corpo enviado tem campos inválidos.",
  "instancia": "/v2/clientes",
  "erros": [
    { "campo": "tipo", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "O campo tipo é obrigatório." },
    { "campo": "nome", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "O campo nome é obrigatório." }
  ]
}
```

| Campo | Para que serve |
|---|---|
| `codigo` | **É o que o seu código deve usar.** Estável, nunca traduzido, nunca muda |
| `status` | O código HTTP, repetido no corpo |
| `titulo` | Resumo legível. Respeita o `Accept-Language` |
| `detalhe` | Explicação do caso específico. Respeita o `Accept-Language` |
| `instancia` | O caminho que gerou o erro |
| `erros` | Presente só em validação: um item por campo problemático |
| `tipo` | URL com a documentação daquele tipo de erro |

**Nunca decida nada com base em texto**

`titulo` e `detalhe` mudam de idioma conforme o `Accept-Language` e podem ser reescritos para ficarem mais claros. Um `if mensagem == "Cliente não encontrado"` vai quebrar.

Use sempre o `codigo`. Ele é contrato: não traduz e não muda.

### Erros de validação

Quando há problema nos campos, a resposta traz **todos** os campos com problema de uma vez, não só o primeiro:

```json
{
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "erros": [
    { "campo": "tipo", "codigo": "VALOR_INVALIDO", "mensagem": "Deve ser um dos valores: F, J ou N." },
    { "campo": "nome", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "O campo nome é obrigatório." }
  ]
}
```

Assim você corrige tudo de uma vez em vez de descobrir um problema por tentativa.

Em lote, o `campo` indica a posição no array:

```json
{ "campo": "clientes[3].documento", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "..." }
```

### Como tratar cada código

| Código | HTTP | O que fazer |
|---|---|---|
| `VALIDACAO_CAMPOS` | 400 | Corrija o corpo. Percorra `erros[]` para saber o quê. **Não repita sem mudar nada** |
| `CAMPO_OBRIGATORIO` | 400 | Campo faltando. Aparece dentro de `erros[]` |
| `VALOR_INVALIDO` | 400 | Valor fora do aceito. Aparece dentro de `erros[]` |
| `TIPO_INVALIDO` | 400 | Tipo errado (texto onde se espera número, data malformada) |
| `NAO_AUTENTICADO` | 401 | Token ausente, inválido ou expirado. Renove e repita **uma vez** |
| `SEM_PERMISSAO` | 403 | O usuário não tem acesso. Repetir não resolve |
| `NAO_ENCONTRADO` | 404 | O recurso não existe ou não é do seu cliente |
| `CONFLITO` | 409 | Choca com o estado atual (nome duplicado, vínculo que já existe) |
| `REGRA_NEGOCIO` | 422 | Corpo válido, mas a operação não é permitida. Leia o `detalhe` |
| `LIMITE_EXCEDIDO` | 429 | Espere o `Retry-After` e repita. Ver limites |
| `ERRO_INTERNO` | 500 | Falha nossa. Repita com backoff; se persistir, abra chamado com o `X-Request-Id` |

Lista completa em códigos de erro.

### Esqueleto de tratamento

```python
resposta = requests.post(url, json=corpo, headers=cabecalhos)

if resposta.ok:
    return resposta.json()

problema = resposta.json()
codigo = problema["codigo"]

if codigo == "NAO_AUTENTICADO":
    renova_token()
    return repete_uma_vez()

if codigo == "LIMITE_EXCEDIDO":
    espera(int(resposta.headers.get("Retry-After", 30)))
    return repete()

if codigo == "VALIDACAO_CAMPOS":
    for erro in problema.get("erros", []):
        registra(f"{erro['campo']}: {erro['mensagem']}")
    raise ErroDeDados(problema)      # repetir não vai resolver

if codigo == "ERRO_INTERNO":
    raise ErroTemporario(problema)   # repita com backoff

raise ErroDeIntegracao(problema)
```

A regra geral: **4xx é você, 5xx somos nós.** Repetir um 4xx sem mudar a requisição só gasta o seu limite.

### Operações em lote

Endpoints de lote (`criar-lote`, `excluir`) respondem **`207 Multi-Status`** com o resultado item a item — um item com erro não derruba os outros:

```json
{
  "resultados": [
    { "indice": 0, "status": "criado", "recurso": { "id": 5012, "nome": "Padaria do Bairro" } },
    { "indice": 1, "status": "erro", "mensagem": "Já existe cliente com este documento." }
  ]
}
```

O `207` chega mesmo quando todos deram certo. Sempre percorra `resultados` — não trate o status HTTP como veredito do lote inteiro.

### Sempre guarde o `X-Request-Id`

Toda resposta traz esse cabeçalho. Registre-o junto com os seus erros: é com ele que o suporte encontra exatamente a requisição que falhou.

```
X-Request-Id: 9f2c4a1b7e6d4f8a9c3b2e1d0f5a6b7c
```

Você também pode enviar o seu próprio valor no mesmo cabeçalho — a API o devolve, o que permite correlacionar com o log do seu lado.

---

## Limites e cabeçalhos

### Limite de requisições

**30 requisições a cada 30 segundos**, por usuário autenticado.

Toda resposta — não só as bloqueadas — informa onde você está:

| Cabeçalho | O que é |
|---|---|
| `X-RateLimit-Limit` | O teto da janela (30) |
| `X-RateLimit-Remaining` | Quantas ainda cabem nesta janela |
| `X-RateLimit-Reset` | Quando a janela reinicia (timestamp Unix) |

Isso permite desacelerar **antes** de levar bloqueio, em vez de reagir depois.

#### Ao exceder

Você recebe `429` com `Retry-After` em segundos:

```json
{
  "titulo": "Limite de requisições excedido",
  "status": 429,
  "codigo": "LIMITE_EXCEDIDO",
  "detalhe": "Limite de requisições excedido. Tente novamente em 30 segundos."
}
```

```python
if resposta.status_code == 429:
    espera(int(resposta.headers.get("Retry-After", 30)))
    repete()
```

#### Como não chegar lá

**Aumente `por_pagina` em vez de fazer mais chamadas.** Uma página de 100 gasta uma requisição; quatro de 25 gastam quatro, para o mesmo dado.

**Use sincronização incremental.** É a diferença entre 500 requisições por noite e uma.

**Guarde o token.** Pedir token a cada chamada dobra o seu consumo.

**Prefira lote.** Criar 200 clientes em `criar-lote` é uma requisição, não 200.

### Tamanho dos lotes

Operações em lote aceitam no máximo **500 itens** por requisição. Acima disso:

```json
{
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "erros": [
    { "campo": "ids", "codigo": "VALOR_INVALIDO", "mensagem": "Informe no máximo 500 itens por requisição (recebidos 1200)." }
  ]
}
```

Vale para `criar-lote`, exclusão em lote e os endpoints de vínculo. Quebre listas maiores em blocos de 500.

### Identificação da requisição

```
X-Request-Id: 9f2c4a1b7e6d4f8a9c3b2e1d0f5a6b7c
```

Presente em **toda** resposta, inclusive nas de erro. Guarde no seu log.

Você também pode enviar o seu próprio identificador nesse cabeçalho, e a API o devolve — útil para amarrar o log do seu sistema ao nosso quando precisar de suporte.

### Idioma

`Accept-Language` define o idioma de `titulo` e `detalhe` nos erros:

| Valor | Resultado |
|---|---|
| `pt-BR` | Português (padrão) |
| `en-US` | Inglês |
| outro | Cai no padrão, português |

O campo `codigo` nunca é traduzido.

### Cabeçalhos da v1

Chamadas à v1 trazem os cabeçalhos de descontinuação:

```
Deprecation: true
Sunset: Fri, 31 Dec 2027 23:59:59 GMT
Link: <https://docs.checkmob.com/migracao-v2>; rel="deprecation"
```

Se a sua integração ainda usa v1, use o `Sunset` para se programar. A documentação da versão legada está em v1 (legado).

---

## Guia: agendar uma visita

Este é o caminho principal de quem integra com a Checkmob. Se a sua pergunta é "como eu mando meu time visitar este cliente amanhã?", é aqui.

Na Checkmob, uma visita agendada é um **registro** — `POST /v2/registros/post`. Você diz quem vai, para qual cliente e quando, e ela aparece no aplicativo do usuário em campo.

**E a ordem de serviço, não serve para isso?**

Serve, mas para um caso mais específico. **Para a maioria das integrações, o registro agendado é o que você quer.**

A ordem de serviço existe para quando o trabalho não cabe numa visita só: mais de um usuário em campo atuando no mesmo atendimento, ou várias visitas ligadas ao mesmo trabalho. Ver ordens de serviço.

### Agendando

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/registros/post' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "id_cliente": 1024,
    "id_usuario": 1201,
    "data_inicio_esperada": "2026-09-05T13:00:00Z",
    "data_conclusao_esperada": "2026-09-05T17:00:00Z",
    "ativo": true,
    "id_objetivo": 3,
    "instrucoes": "Conferir pressão da bomba antes de iniciar"
  }'
```

Resposta `201` com a visita criada:

```json
{
  "id": 77120,
  "codigo": 3391,
  "id_cliente": 1024,
  "id_usuario": 1201,
  "agendado": true,
  "ativo": true,
  "concluido": false,
  "inicio_agendado": "2026-09-05T13:00:00Z",
  "data_agendada": "2026-09-05T17:00:00Z",
  "instrucoes": "Conferir pressão da bomba antes de iniciar",
  "data_criacao": "2026-08-17T18:22:04Z"
}
```

Guarde o `id` — é por ele que você vai buscar o que foi realizado depois.

### Os campos

#### Obrigatórios

| Campo | O que é |
|---|---|
| `id_cliente` | Onde a visita acontece |
| `data_inicio_esperada` | Início da janela agendada |
| `data_conclusao_esperada` | Fim da janela. Não pode ser anterior ao início |

#### Opcionais que fazem diferença

| Campo | O que é |
|---|---|
| `id_usuario` | Quem vai executar |
| `ativo` | `true` envia para o aplicativo; `false` deixa como "a enviar" |
| `id_objetivo` | Por que a visita acontece (manutenção, cobrança, prospecção). Lista em `/v2/objetivos/list` |
| `instrucoes` | Texto que o usuário lê no aplicativo antes de iniciar |
| `id_contato` | A pessoa a ser procurada no cliente |
| `id_segmento` | Recorte operacional |
| `id_equipe` | Grupo responsável |
| `id_ordem_servico` | Amarra a visita a uma OS existente |

**`ativo` controla se a visita chega no campo**

Com `ativo: false` a visita fica como **"a enviar"** e o usuário não a vê no aplicativo. É útil para preparar uma agenda e liberar depois — mas se você espera que ela apareça agora, mande `ativo: true`.

### Resolvendo os ids antes de agendar

Os campos `id_*` apontam para cadastros existentes. Antes do primeiro agendamento você precisa descobrir esses ids:

| Preciso do id de | Onde busco |
|---|---|
| Cliente | `POST /v2/clientes/list` — filtre por `codigos` se você guarda o código do seu ERP |
| Usuário | `POST /v2/usuarios/list` |
| Objetivo | `POST /v2/objetivos/list` |
| Contato | `POST /v2/pessoas/list` com `ids_clientes` |
| Segmento / grupo | `POST /v2/segmentos/list` · `POST /v2/grupos/list` |

**Guarde em cache**

Objetivos, segmentos e grupos mudam pouco. Carregue uma vez e reaproveite — não vale gastar requisição resolvendo o mesmo id de objetivo em cada agendamento. Ver limites.

### Achando o cliente pelo código do seu sistema

Se você grava o código do seu ERP no cliente (recomendado — ver sincronizar clientes), não precisa manter tabela de-para:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "codigos": ["ERP-4471"] }'
```

### Agendando várias visitas

Não existe endpoint de lote para registros — agende uma por requisição. Respeitando o limite de 30 requisições por 30 segundos, isso dá cerca de 60 agendamentos por minuto.

Para volumes grandes, distribua ao longo do tempo e acompanhe o cabeçalho `X-RateLimit-Remaining` para desacelerar antes de ser bloqueado.

### Consultando a agenda

O que está marcado para esta semana:

```json
{
  "agendado": true,
  "concluido": false,
  "data_agendada_apos": "2026-09-01T00:00:00Z",
  "data_agendada_antes": "2026-09-07T23:59:59Z",
  "ordenar": "data_agendada"
}
```

Outros recortes:

**Agenda de um técnico**

```json
{
  "ids_usuario": [1201],
  "concluido": false,
  "ordenar": "data_agendada"
}
```

**Visitas de um cliente**

```json
{ "ids_cliente": [1024] }
```

**Pelo número visível**

```json
{ "codigo": 3391 }
```

### Corrigindo um agendamento

```bash
curl -X PUT 'https://api-integration.checkmob.com/v2/registros/77120' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "id_objetivo": 5,
    "observacao": "Objetivo corrigido conforme solicitação do cliente"
  }'
```

Campo ausente preserva o valor atual.

O `PUT` de registro aceita: `id_cliente`, `id_objetivo`, `observacao`, `latitude`, `longitude`, `data_inicio` (check-in) e `data_realizacao` (check-out).

### Próximo passo

Depois que a equipe executar, você busca o que aconteceu: consumir o que foi realizado.

---

## Guia: consumir o que foi realizado

A visita foi agendada, a equipe executou. Agora você traz o resultado para dentro do seu sistema.

O fluxo tem duas etapas, nesta ordem:

```
1. Buscar o registro executado   →  quando entrou, quando saiu, onde, observações
2. Buscar o questionário respondido  →  o que foi preenchido durante a visita
```

### 1. O registro executado

O mesmo registro que você agendou volta preenchido com o que aconteceu em campo.

#### O que a equipe fez hoje

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/registros/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "concluido": true,
    "data_realizacao_apos": "2026-08-17T00:00:00Z",
    "data_realizacao_antes": "2026-08-17T23:59:59Z",
    "por_pagina": 100
  }'
```

Um registro executado:

```json
{
  "id": 77120,
  "codigo": 3391,
  "id_status": 4,
  "status": "Concluído",
  "id_cliente": 1024,
  "id_usuario": 1201,
  "id_objetivo": 3,
  "id_ordem_servico": null,
  "agendado": true,
  "concluido": true,
  "inicio_agendado": "2026-09-05T13:00:00Z",
  "data_agendada": "2026-09-05T17:00:00Z",
  "data_inicio": "2026-09-05T13:04:11Z",
  "data_realizacao": "2026-09-05T14:52:39Z",
  "observacao": "Filtro trocado, equipamento normalizado",
  "latitude": -23.5614,
  "longitude": -46.6559,
  "atualizado_em": "2026-09-05T14:52:39Z"
}
```

#### Os campos que contam a execução

| Campo | O que é |
|---|---|
| `data_inicio` | **Check-in** — quando a visita começou de fato |
| `data_realizacao` | **Check-out** — quando terminou |
| `concluido` | Se a execução foi finalizada |
| `latitude` / `longitude` | Onde o check-in aconteceu |
| `observacao` | O que o usuário escreveu |
| `id_status` / `status` | Situação atual, com o nome legível |

A diferença entre `data_inicio` e `data_realizacao` é o **tempo em atendimento**. Comparar `data_agendada` com `data_realizacao` mostra se a visita saiu no horário.

#### Recortes úteis

**Por técnico**

```json
{
  "ids_usuario": [1201],
  "concluido": true,
  "data_realizacao_apos": "2026-08-01T00:00:00Z"
}
```

**Por cliente**

```json
{ "ids_cliente": [1024], "concluido": true }
```

**Ainda em aberto**

```json
{ "concluido": false, "ativo": true }
```

**De uma ordem de serviço**

```json
{ "id_ordem_servico": 8801 }
```

#### Uma visita específica

Se você guardou o `id` no agendamento:

```
GET /v2/registros/77120
```

#### Ajustando um apontamento

Quando o técnico esquece o check-out ou erra o cliente:

```bash
curl -X PUT 'https://api-integration.checkmob.com/v2/registros/77120' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "data_realizacao": "2026-09-05T15:10:00Z",
    "observacao": "Horário ajustado conforme apontamento do técnico"
  }'
```

Campo ausente preserva o valor atual, e a alteração fica no histórico do registro.

### 2. O questionário respondido

Com o `id` do registro em mãos, você busca o que foi preenchido durante a visita:

```bash
curl 'https://api-integration.checkmob.com/v2/respostas-questionario/77120' \
  -H 'Authorization: Bearer SEU_TOKEN'
```

A resposta vem organizada em seções e questões, na mesma ordem em que aparecem no aplicativo:

```json
{
  "secoes": [
    {
      "id_secao": 12,
      "numero_secao": 1,
      "nome_secao": "Inspeção do equipamento",
      "usuario": "João Pereira",
      "data_conclusao": "2026-09-05T14:41:00Z",
      "questoes": [
        {
          "numero_questao": 1,
          "nome_questao": "Estado do filtro",
          "nome_item": "Necessita troca",
          "selecionado": true,
          "resposta_texto": null,
          "url_imagem": "https://...",
          "comentario": "Saturado",
          "data_imagem": "2026-09-05T14:38:12Z"
        }
      ]
    }
  ]
}
```

#### Como ler as questões

O formato acomoda tipos diferentes de pergunta, e qual campo importa depende do tipo:

| Campo | Quando importa |
|---|---|
| `selecionado` | Múltipla escolha — indica se aquele item foi marcado. O texto do item está em `nome_item` |
| `resposta_texto` | Pergunta aberta — o que o usuário digitou |
| `url_imagem` | Foto anexada, quando houver |
| `comentario` | Observação livre do usuário naquela questão |

**Em múltipla escolha vem uma linha por item**

Uma pergunta com cinco alternativas devolve cinco questões com o mesmo `numero_questao` e `nome_questao`, variando o `nome_item` e o `selecionado`. Para saber o que foi marcado, filtre por `selecionado: true`.

#### Pela ordem de serviço

Quando a visita nasceu de uma ordem de serviço, dá para buscar as respostas por ela:

```
GET /v2/respostas-questionario/ordem-servico/8801
```

#### Varrendo um período

Para trazer tudo que foi respondido sem ir de registro em registro:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/respostas-questionario/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "atualizado_apos": "2026-09-01T00:00:00Z", "por_pagina": 100 }'
```

Cada item traz `id_registro` e `id_ordem_servico`, então você amarra de volta ao registro correspondente.

**Esta listagem aceita menos filtros**

Só paginação e `atualizado_apos`. A origem desses dados não suporta busca textual nem ordenação — mandar `busca` ou `ordenar` aqui devolve `400`, em vez de aceitar e ignorar em silêncio.

### Montando a rotina

Uma integração de "fechamento do dia" faz assim:

```python
cursor = carrega_cursor()
maior_visto = cursor
pagina = 1

while True:
    r = post("/v2/registros/list", {
        "atualizado_apos": cursor,
        "concluido": True,
        "pagina": pagina,
        "por_pagina": 100,
        "ordenar": "atualizado_em"
    }).json()

    for reg in r["dados"]:
        respostas = get(f"/v2/respostas-questionario/{reg['id']}")
        grava(reg, respostas)
        maior_visto = max(maior_visto, reg["atualizado_em"])

    if pagina >= r["paginacao"]["total_paginas"]:
        break
    pagina += 1

salva_cursor(maior_visto)
```

Trocar a janela de datas por `atualizado_apos` é o que faz essa rotina ficar leve: em vez de reprocessar o dia inteiro, você traz só o que mudou desde a última execução. Os detalhes de cursor e reprocessamento estão em sincronização incremental.

**Registro sem questionário devolve 404**

Nem toda visita tem questionário respondido. Trate o `404 NAO_ENCONTRADO` como "não houve questionário", não como erro de integração.

### Deslocamento da visita

O KM rodado entre visitas tem guia próprio: deslocamentos.

---

## Guia: sincronizar clientes

O caso mais comum: manter a base de clientes do seu ERP ou CRM espelhada na Checkmob.

### A chave de ligação: `codigo`

Antes de escrever qualquer código, decida como os dois sistemas vão se reconhecer.

O cliente na Checkmob tem `id` (nosso) e `codigo` (seu). **Use o `codigo` para guardar o identificador do seu sistema** — é ele que permite reencontrar o cliente depois sem manter uma tabela de-para do seu lado.

```json
{
  "id": 1024,
  "codigo": "ERP-4471",
  "nome": "Padaria do Bairro LTDA"
}
```

E dá para buscar direto por ele:

```json
{ "codigos": ["ERP-4471", "ERP-4472"] }
```

### Carga inicial

Primeira execução: traga a base inteira e guarde o de-para.

```python
pagina = 1
cursor = None

while True:
    r = post("/v2/clientes/list", {
        "pagina": pagina,
        "por_pagina": 100,
        "ordenar": "atualizado_em"
    }).json()

    for c in r["dados"]:
        salva_local(c)
        cursor = max(cursor or c["atualizado_em"], c["atualizado_em"])

    if pagina >= r["paginacao"]["total_paginas"]:
        break
    pagina += 1

salva_cursor(cursor)
```

### Sincronização diária

Da segunda execução em diante, só o que mudou:

```json
{
  "atualizado_apos": "2026-08-16T03:00:00Z",
  "pagina": 1,
  "por_pagina": 100,
  "ordenar": "atualizado_em"
}
```

Os detalhes de cursor, falha no meio e reprocessamento estão em sincronização incremental.

### Criando clientes

Um por vez:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tipo": "J",
    "nome": "Padaria do Bairro LTDA",
    "documento": "12345678000190",
    "ativo": true
  }'
```

O campo `tipo` aceita:

| Valor | Significado |
|---|---|
| `F` | Pessoa física |
| `J` | Pessoa jurídica |
| `N` | Estrangeiro |

Resposta `201` com o cliente criado e o cabeçalho `Location` apontando para ele.

#### Em lote

Para carga inicial ou importação, mande até 500 de uma vez:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/criar-lote' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientes": [
      { "tipo": "J", "nome": "Padaria do Bairro LTDA", "documento": "12345678000190" },
      { "tipo": "F", "nome": "Maria Souza", "documento": "12345678901" }
    ]
  }'
```

A resposta é `207` com o destino de cada item:

```json
{
  "resultados": [
    { "indice": 0, "status": "criado", "recurso": { "id": 5012, "nome": "Padaria do Bairro LTDA" } },
    { "indice": 1, "status": "erro", "mensagem": "Já existe cliente com este documento." }
  ]
}
```

**Percorra sempre os `resultados`**

O `207` chega mesmo que tudo tenha dado certo — e mesmo que tudo tenha falhado. O veredito está item a item, não no status HTTP.

### Atualizando

Dois verbos, com propósitos diferentes:

**PATCH — mudar um campo**

```bash
curl -X PATCH 'https://api-integration.checkmob.com/v2/clientes/1024' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "ativo": false }'
```

Só o que você mandar é alterado. É o que você quer na maioria dos casos.

**PUT — enviar o cadastro**

```bash
curl -X PUT 'https://api-integration.checkmob.com/v2/clientes/1024' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tipo": "J",
    "nome": "Padaria do Bairro LTDA",
    "documento": "12345678000190",
    "ativo": true
  }'
```

Campo ausente **preserva** o valor atual — não zera.

`PUT` e `PATCH` nunca criam registro. Id inexistente devolve `404`.

### Inativar em vez de excluir

Cliente com histórico de atendimento raramente deve sumir. Prefira inativar:

```json
{ "ativo": false }
```

Ele para de aparecer para a equipe de campo, mas o histórico continua íntegro. Use `DELETE` só quando o cadastro foi realmente um engano.

### Filtros úteis no dia a dia

```json
{
  "ativo": true,
  "ids_segmento": [4, 9],
  "ids_categoria": [2],
  "data_criacao_apos": "2026-01-01T00:00:00Z",
  "busca": "padaria"
}
```

`busca` cobre nome, código e documento — dá para procurar pelo que você tiver em mãos.

### Contatos e endereço

Cliente é a empresa; **pessoa** é o contato dentro dela. O vínculo é muitos-para-muitos:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/pessoas/vincular' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "id_cliente": 1024, "ids_pessoas": [88, 91] }'
```

O endereço principal do cliente tem endpoint próprio:

```
GET /v2/clientes/1024/endereco
PUT /v2/clientes/1024/endereco
```

### Checklist antes de subir para produção

- [ ] O `codigo` do seu sistema está gravado no cliente da Checkmob
- [ ] O cursor de sincronização é persistido, e só depois de processar tudo
- [ ] Reprocessar o mesmo cliente duas vezes não duplica nada do seu lado
- [ ] Erros `4xx` não entram em loop de retry
- [ ] O `X-Request-Id` está sendo registrado no seu log

---

## Guia: deslocamentos

KM rodado e custo associado, do agregado ao detalhe. São três níveis, e você desce conforme precisa:

```
usuários  →  dias        →  percursos
(resumo)     (por dia)      (origem → destino)
```

Cada nível usa o identificador do anterior, então a ordem importa.

### 1. Resumo por usuário

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/deslocamentos/usuarios/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "data_inicio": "2026-08-01T00:00:00Z",
    "data_fim": "2026-08-31T23:59:59Z"
  }'
```

```json
{
  "dados": [
    {
      "id_usuario": 1201,
      "usuario": "João Pereira",
      "distancia_total": 842.5,
      "valor_total": 1264.1,
      "percursos": 63,
      "distancia_media": 13.4,
      "valor_aprovado": 1180.0,
      "valor_a_pagar": 84.1,
      "valor_pago": 1096.0
    }
  ],
  "paginacao": { "pagina": 1, "por_pagina": 25, "total_itens": 8, "total_paginas": 1 }
}
```

| Campo | O que é |
|---|---|
| `distancia_total` | KM no período |
| `valor_total` | Custo calculado sobre a distância |
| `valor_aprovado` | Parte já aprovada |
| `valor_a_pagar` | Aprovado e ainda não pago |
| `valor_pago` | Já quitado |

Filtros disponíveis: `data_inicio`, `data_fim`, `ids_usuario`, `ids_grupo`, `aprovacao`, `pagamento`, `ativo` e `busca`.

### 2. Dias de um usuário

`id_usuario` é obrigatório aqui:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/deslocamentos/dias/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "id_usuario": 1201,
    "data_inicio": "2026-08-01T00:00:00Z",
    "data_fim": "2026-08-31T23:59:59Z"
  }'
```

```json
{
  "dados": [
    {
      "id_dia": 55012,
      "data": "2026-08-14T00:00:00Z",
      "dia_semana": 5,
      "distancia": 47.2,
      "percursos": 4,
      "distancia_media": 11.8,
      "valor": 70.8,
      "aprovacao": 0,
      "pagamento": 3,
      "usuario_ultima_alteracao": "Ana Lima",
      "ultima_alteracao": "15/08/2026 09:12",
      "ativo": true
    }
  ]
}
```

Guarde o **`id_dia`** — é ele que abre o próximo nível.

### 3. Percursos de um dia

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/deslocamentos/percursos/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "id_usuario": 1201, "id_dia": 55012 }'
```

`id_usuario` e `id_dia` são obrigatórios.

Cada percurso é um trecho de origem a destino, com a distância e o custo. Os campos `id_cliente_origem`, `id_cliente_destino`, `id_registro_origem` e `id_registro_destino` amarram o trecho às visitas — é assim que você liga o KM ao atendimento que o gerou.

### Códigos de aprovação e pagamento

Aparecem nos campos `aprovacao` e `pagamento`, e também funcionam como filtro (aceitam lista).

| `aprovacao` | Significado |
|---|---|
| 0 | Aprovado — considerado no valor aprovado e no a pagar |
| 1 | Desconsiderado — descartado, fora de qualquer cálculo |
| 2 | Em verificação — aguardando avaliação |
| 3 | Não avaliado |
| 4 | Rejeitado — não entra em cálculo nem em pagamento |

| `pagamento` | Significado |
|---|---|
| 0 | Em aberto — aprovado, ainda não enviado para pagamento |
| 2 | Aguardando avaliação |
| 3 | Pago |

Para trazer só o que está aprovado e ainda não foi pago:

```json
{ "aprovacao": [0], "pagamento": [0] }
```

### Fechamento de KM do mês

Rotina típica de quem manda esses valores para a folha ou para o financeiro:

1. **Resumo por usuário** no período, filtrando `aprovacao: [0]` para pegar só o aprovado.
2. Para quem precisa de conferência, **desça para os dias** e veja onde está a divergência.
3. Se ainda precisar detalhar, **abra os percursos** daquele dia.
4. Amarre ao atendimento pelos campos `id_registro_origem` / `id_registro_destino`.

**Estes endpoints não têm `atualizado_apos`**

Diferente do resto da API, deslocamento é consultado por período, não por sincronização incremental. Para acompanhar de forma recorrente, refaça a consulta da janela que interessa — normalmente o mês corrente.

---

## Guia: ordens de serviço

**Antes de começar: você precisa mesmo de uma ordem de serviço?**

Para agendar uma visita simples — um técnico, um cliente, uma ida — o caminho é o **registro agendado**. É o que a maioria das integrações usa. Ver agendar uma visita.

A ordem de serviço existe para o trabalho que **não cabe numa visita só**:

- **mais de um usuário em campo** atuando no mesmo atendimento, ou
- **mais de uma visita** ligada ao mesmo trabalho.

Se o seu caso não é nenhum dos dois, agendar o registro direto é mais simples.

A ordem de serviço é o **guarda-chuva** do trabalho. As visitas que acontecem debaixo dela são registros, cada um com seu check-in, check-out e questionário:

```
Ordem de serviço            →  o trabalho como um todo
  └── registro (visita 1)   →  execução: quem foi, quando, o que respondeu
  └── registro (visita 2)
  └── registro (visita 3)
```

Por isso um registro pode ter `id_ordem_servico` preenchido (nasceu de uma OS) ou nulo (visita independente).

### Criando

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/ordens-servico/post' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "nome": "Manutenção preventiva",
    "id_cliente": 1024,
    "id_tipo_servico": 7,
    "inicio_agendado": "2026-09-02T13:00:00Z",
    "data_agendada": "2026-09-02T17:00:00Z",
    "comentario": "Levar filtro de reposição",
    "prioridade": 2,
    "ids_usuarios": [1201]
  }'
```

Obrigatórios: `nome` e `id_cliente`. O resto é opcional.

| Campo | Para que serve |
|---|---|
| `ids_usuarios` | Quem vai executar. Sem isso a OS nasce sem responsável |
| `inicio_agendado` / `data_agendada` | A janela de atendimento |
| `id_tipo_servico` | Classificação do trabalho. Liste em `/v2/tipos-servico/list` |
| `exige_checklist_conclusao` | Impede encerrar sem responder o questionário |
| `prioridade` | Ordena a fila do técnico |

### Consultando

O filtro que mais importa na operação é a **janela de agendamento** — "o que está marcado para esta semana":

```json
{
  "data_agendada_apos": "2026-09-01T00:00:00Z",
  "data_agendada_antes": "2026-09-07T23:59:59Z",
  "concluida": false,
  "ordenar": "data_agendada"
}
```

Outros recortes comuns:

**Por equipe**

```json
{ "ids_usuario": [1201, 1202], "concluida": false }
```

**Por cliente**

```json
{ "ids_cliente": [1024] }
```

**Por status**

```json
{ "ids_status": [3, 7] }
```

Os status disponíveis vêm de `GET /v2/ordens-servico/status`.

**Pelo número visível**

```json
{ "codigo": 4471 }
```

O `codigo` é o número que o usuário vê na tela — diferente do `id` interno.

### Alterando

```bash
curl -X PUT 'https://api-integration.checkmob.com/v2/ordens-servico/8801' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "id_cliente": 1024,
    "data_agendada": "2026-09-03T17:00:00Z"
  }'
```

**Campo ausente preserva o valor atual.** No exemplo acima, só a data muda — nome, comentário, prioridade e a equipe atribuída ficam como estavam.

**Reatribuir a equipe**

`ids_usuarios` segue a mesma regra: omitido preserva os responsáveis atuais; enviado substitui a lista inteira; lista vazia (`[]`) remove todos.

```json
{ "id_cliente": 1024, "ids_usuarios": [1203, 1204] }
```

### Mudando o status

Status tem endpoint próprio — **editar campos não muda o status da OS**:

```bash
curl -X PUT 'https://api-integration.checkmob.com/v2/ordens-servico/8801/status' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "id_status": 7 }'
```

Os ids válidos vêm de:

```
GET /v2/ordens-servico/status
```

### Concluindo

`concluida` controla a conclusão de forma explícita:

```json
{ "id_cliente": 1024, "concluida": true }
```

| Valor | Efeito |
|---|---|
| `true` | Marca como concluída agora (se já estava, mantém a data original) |
| `false` | Reabre |
| ausente | Não mexe |

### Excluindo

Uma:

```
DELETE /v2/ordens-servico/8801
```

Em lote, até 500 por vez, com resultado item a item:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/ordens-servico/excluir' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "ids": [8801, 8802, 8803] }'
```

```json
{
  "resultados": [
    { "id": 8801, "status": "excluido" },
    { "id": 8802, "status": "nao_encontrado" },
    { "id": 8803, "status": "excluido" }
  ]
}
```

### Fluxo completo

Uma integração de despacho com OS faz assim:

1. **Cria a OS** com cliente, janela e a lista de responsáveis em `ids_usuarios`.
2. **Acompanha** com `atualizado_apos`, trazendo só o que mudou.
3. **Lê as visitas** que aconteceram debaixo dela: `POST /v2/registros/list` com `{ "id_ordem_servico": 8801 }`.
4. **Busca as respostas** do questionário — por registro ou pela OS inteira em `/v2/respostas-questionario/ordem-servico/{id}`.
5. **Fecha o ciclo** no seu sistema com o resultado.

Os passos 3 e 4 estão detalhados em consumir o que foi realizado.

---

## Referência: recursos disponíveis

Mapa completo da v2. Para o detalhe de cada campo, use o [Swagger](https://api-integration.checkmob.com/index.html) — aqui está o panorama.

Base: `https://api-integration.checkmob.com`

### Autenticação

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/token` | Gera o token de acesso. Único endpoint sem autenticação |

### Clientes

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/clientes/list` | Lista clientes |
| GET | `/v2/clientes/{id}` | Obtém um cliente |
| POST | `/v2/clientes` | Cria um cliente |
| POST | `/v2/clientes/criar-lote` | Cria até 500 de uma vez (207) |
| PUT | `/v2/clientes/{id}` | Substitui (campo ausente preserva) |
| PATCH | `/v2/clientes/{id}` | Altera só os campos enviados |
| DELETE | `/v2/clientes/{id}` | Exclui |
| GET | `/v2/clientes/{id}/endereco` | Endereço principal |
| PUT | `/v2/clientes/{id}/endereco` | Substitui o endereço principal |
| POST | `/v2/clientes/pessoas/vincular` | Vincula contatos ao cliente |
| POST | `/v2/clientes/pessoas/desvincular` | Remove o vínculo |
| POST | `/v2/clientes/{id}/notas/list` | Lista as notas do cliente |
| POST | `/v2/clientes/{id}/notas` | Cria uma nota |
| PUT | `/v2/notas-cliente/{id}` | Altera uma nota |
| DELETE | `/v2/notas-cliente/{id}` | Exclui uma nota |

→ Guia: sincronizar clientes

### Pessoas (contatos)

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/pessoas/list` | Lista pessoas |
| GET | `/v2/pessoas/{id}` | Obtém uma pessoa |
| POST | `/v2/pessoas/post` | Cria uma pessoa |
| PUT | `/v2/pessoas/{id}` | Atualiza (inclui `ativo`) |
| POST | `/v2/pessoas/status` | Ativa/inativa em lote |
| DELETE | `/v2/pessoas/{id}` | Exclui |
| GET | `/v2/pessoas/{id}/endereco` | Endereço da pessoa |
| PUT | `/v2/pessoas/{id}/endereco` | Substitui o endereço |
| POST | `/v2/pessoas/clientes/vincular` | Vincula a clientes |
| POST | `/v2/pessoas/clientes/desvincular` | Remove o vínculo |

### Ordens de serviço

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/ordens-servico/list` | Lista ordens de serviço |
| GET | `/v2/ordens-servico/{id}` | Obtém uma OS |
| POST | `/v2/ordens-servico/post` | Cria uma OS |
| PUT | `/v2/ordens-servico/{id}` | Substitui (campo ausente preserva) |
| PUT | `/v2/ordens-servico/{id}/status` | Altera o status |
| GET | `/v2/ordens-servico/status` | Lista os status disponíveis |
| DELETE | `/v2/ordens-servico/{id}` | Exclui |
| POST | `/v2/ordens-servico/excluir` | Exclui até 500 de uma vez (207) |

→ Guia: ordens de serviço

### Registros (visitas)

O recurso central da integração: uma visita agendada e, depois, a execução dela.

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/registros/post` | **Agenda uma visita** |
| POST | `/v2/registros/list` | Lista visitas agendadas e executadas |
| GET | `/v2/registros/{id}` | Obtém uma visita |
| PUT | `/v2/registros/{id}` | Ajusta check-in/check-out, cliente, objetivo, observação |

→ Guia: agendar uma visita · Guia: consumir o que foi realizado

### Questionários

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/questionarios/list` | Lista questionários |
| GET | `/v2/questionarios/{id}` | Obtém um questionário |
| POST | `/v2/questionarios/{id}/grupos` | Vincula a um grupo |
| DELETE | `/v2/questionarios/{id}/grupos/{idGrupo}` | Remove o vínculo |
| POST | `/v2/questionarios/{id}/segmentos` | Vincula a um segmento |
| DELETE | `/v2/questionarios/{id}/segmentos/{idSegmento}` | Remove o vínculo |

### Respostas de questionário

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/respostas-questionario/list` | Lista questionários respondidos |
| GET | `/v2/respostas-questionario/{idRegistro}` | Respostas de um registro |
| GET | `/v2/respostas-questionario/ordem-servico/{id}` | Respostas de uma OS |

→ Guia: consumir o que foi realizado

### Deslocamentos

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/deslocamentos/usuarios/list` | Resumo consolidado por usuário |
| POST | `/v2/deslocamentos/dias/list` | Dias de um usuário |
| POST | `/v2/deslocamentos/percursos/list` | Percursos de um dia |

→ Guia: deslocamentos

### Usuários

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/usuarios/list` | Lista usuários |
| GET | `/v2/usuarios/{id}` | Obtém um usuário |
| GET | `/v2/usuarios/{id}/localizacao` | Última localização registrada |

### Grupos e segmentos

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/grupos/list` | Lista grupos |
| GET | `/v2/grupos/{id}` | Obtém um grupo |
| POST | `/v2/grupos/post` | Cria um grupo |
| PUT | `/v2/grupos/{id}` | Substitui |
| DELETE | `/v2/grupos/{id}` | Exclui |
| POST | `/v2/segmentos/list` | Lista segmentos |
| GET | `/v2/segmentos/{id}` | Obtém um segmento |
| POST | `/v2/segmentos/post` | Cria um segmento |
| PUT | `/v2/segmentos/{id}` | Substitui |
| DELETE | `/v2/segmentos/{id}` | Exclui |
| GET | `/v2/segmentos/{id}/vinculos` | Usuários e grupos do segmento |
| POST | `/v2/segmentos/{id}/clientes` | Vincula clientes |
| DELETE | `/v2/segmentos/{id}/clientes/{idCliente}` | Remove o vínculo |
| POST | `/v2/segmentos/{id}/grupos` | Vincula grupos |
| DELETE | `/v2/segmentos/{id}/grupos/{idGrupo}` | Remove o vínculo |
| POST | `/v2/segmentos/{id}/usuarios` | Vincula usuários |
| DELETE | `/v2/segmentos/{id}/usuarios/{idUsuario}` | Remove o vínculo |

### Tabelas de apoio

Listas de referência para preencher os campos de classificação. Todas aceitam `busca`, `ordenar` e `atualizado_apos`.

| Método | Caminho | O que traz |
|---|---|---|
| POST | `/v2/categorias/list` | Categorias de cliente |
| POST | `/v2/etapas/list` | Etapas do funil |
| POST | `/v2/temperaturas/list` | Temperaturas |
| POST | `/v2/setores-mercado/list` | Setores de mercado |
| POST | `/v2/tipos-servico/list` | Tipos de serviço |
| POST | `/v2/objetivos/list` | Objetivos de visita |
| POST | `/v2/status-servico/list` | Status de registro |
| POST | `/v2/campos-personalizados/list` | Campos personalizados (filtro `origem`) |
| POST | `/v2/campos-personalizados/clientes/list` | Campos personalizados de cliente |
| POST | `/v2/campos-personalizados/pessoas/list` | Campos personalizados de pessoa |

**Carregue as tabelas de apoio uma vez**

Elas mudam pouco. Carregue no início da integração, guarde em cache e atualize periodicamente com `atualizado_apos` — não vale gastar requisição resolvendo o mesmo id de categoria toda vez.

---

## Referência: códigos de erro

Catálogo completo. O campo `codigo` é **estável**: não é traduzido e não muda entre versões — é nele que o seu tratamento de erro deve se apoiar.

### Catálogo

| Código | HTTP | Quando acontece | Repetir resolve? |
|---|---|---|---|
| `CAMPO_OBRIGATORIO` | 400 | Campo obrigatório ausente. Vem dentro de `erros[]` | Não |
| `VALOR_INVALIDO` | 400 | Valor fora do domínio aceito | Não |
| `TIPO_INVALIDO` | 400 | Tipo errado — texto onde se espera número, data malformada | Não |
| `VALIDACAO_CAMPOS` | 400 | Falha de validação. Traz `erros[]` com o detalhe por campo | Não |
| `NAO_AUTENTICADO` | 401 | Token ausente, inválido ou expirado | Depois de renovar |
| `SEM_PERMISSAO` | 403 | Autenticado, mas sem acesso àquele recurso | Não |
| `NAO_ENCONTRADO` | 404 | Recurso inexistente, ou de outro cliente | Não |
| `CONFLITO` | 409 | Choca com o estado atual — nome duplicado, vínculo já existente | Não |
| `REGRA_NEGOCIO` | 422 | Corpo válido, operação não permitida. O motivo está em `detalhe` | Não |
| `LIMITE_EXCEDIDO` | 429 | Limite de requisições estourado | Sim, após `Retry-After` |
| `ERRO_INTERNO` | 500 | Falha do nosso lado | Sim, com backoff |

### A regra prática

**4xx é você, 5xx somos nós.**

Repetir um 4xx sem mudar a requisição não vai resolver — só consome o seu limite. As duas exceções são `NAO_AUTENTICADO` (repita depois de renovar o token) e `LIMITE_EXCEDIDO` (repita depois do `Retry-After`).

### Status de sucesso

| HTTP | Quando |
|---|---|
| 200 | Leitura ou atualização bem-sucedida |
| 201 | Recurso criado. Traz o cabeçalho `Location` |
| 204 | Sucesso sem conteúdo — exclusões e vínculos |
| 207 | Lote processado. O resultado está item a item no corpo |

**O 207 não é um veredito**

Ele chega mesmo quando todos os itens falharam. Sempre percorra `resultados` para saber o que aconteceu com cada um.

### Estrutura da resposta de erro

```json
{
  "tipo": "https://docs.checkmob.com/erros/validacao",
  "titulo": "Falha de validação",
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "detalhe": "O corpo enviado tem campos inválidos.",
  "instancia": "/v2/clientes",
  "erros": [
    { "campo": "nome", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "O campo nome é obrigatório." }
  ]
}
```

`detalhe`, `instancia` e `erros` são omitidos quando não se aplicam. `codigo`, `status`, `titulo` e `tipo` estão sempre presentes.

Como tratar cada um em código: erros.

---

## Referência: glossário

Os conceitos da Checkmob e como eles aparecem na API. Se você vem da v1, a última coluna é o de-para de nomenclatura.

### Conceitos

| Termo | O que é | Na v1 |
|---|---|---|
| **Cliente** | A empresa ou pessoa atendida. O "onde" do atendimento | `client` |
| **Pessoa** | O contato dentro do cliente. Um cliente tem vários; uma pessoa pode atender vários clientes | `person` / `contact` |
| **Usuário** | Quem usa a Checkmob — normalmente o técnico em campo | `user` |
| **Grupo** | Conjunto de usuários. É como se organiza uma equipe | `group` |
| **Segmento** | Recorte operacional que agrupa clientes, grupos e usuários. Define quem enxerga o quê | `segment` |
| **Ordem de serviço** | O trabalho **planejado**: para qual cliente, quando, por quem | `serviceorder` |
| **Registro** | A **execução**: check-in, check-out, o que foi feito. É o par da OS | `service` |
| **Questionário** | O checklist que a equipe preenche em campo | `checklist` |
| **Objetivo** | A razão da visita (manutenção, cobrança, prospecção) | `objective` |
| **Tipo de serviço** | Classificação do trabalho executado | `typeservice` |
| **Etapa** | Fase do cliente no funil comercial | `step` |
| **Categoria** | Classificação livre de cliente | `category` |
| **Temperatura** | Grau de interesse comercial do cliente | `temperature` |
| **Setor de mercado** | Ramo de atuação do cliente | `marketsector` |
| **Campo personalizado** | Campo extra configurado por cada empresa em cliente ou pessoa | `customfield` |
| **Deslocamento** | KM rodado e o custo associado | `displacement` |
| **Nota** | Anotação livre no cliente | `noteClient` |

### Registro × ordem de serviço

A dúvida mais comum de quem começa: qual dos dois eu crio?

**Na maioria dos casos, o registro.** Ele é a visita: um cliente, um usuário, uma ida a campo. É o que os clientes da Checkmob mais usam no dia a dia, e o que a maior parte das integrações precisa criar.

A **ordem de serviço** é o guarda-chuva, e existe para o trabalho que não cabe numa visita só:

- mais de um usuário em campo no mesmo atendimento, ou
- mais de uma visita ligada ao mesmo trabalho.

```
Ordem de serviço            (quando precisa coordenar)
  └── registro (visita 1)   ← a execução acontece aqui
  └── registro (visita 2)
```

Por isso o `id_ordem_servico` de um registro pode vir nulo: a visita não precisou de OS nenhuma.

O registro carrega tanto o **planejado** (`inicio_agendado`, `data_agendada`) quanto o **realizado** (`data_inicio` = check-in, `data_realizacao` = check-out). Comparar os dois pares mostra se a visita saiu no horário.

→ Agendar uma visita · Consumir o que foi realizado

### Convenções de nome dos campos

| Padrão | Significado | Exemplo |
|---|---|---|
| `id_*` | Referência a outro recurso | `id_cliente`, `id_usuario` |
| `ids_*` | Filtro por vários valores ao mesmo tempo | `ids_status`, `ids_usuario` |
| `*_apos` / `*_antes` | Intervalo de data (exclusivo) | `data_criacao_apos` |
| `*_min` / `*_max` | Intervalo numérico (inclusivo) | `prioridade_min` |
| `data_criacao` | Quando o registro foi criado | — |
| `atualizado_em` | Última alteração. É o cursor da sincronização | — |
| `codigo` | Identificador visível ao usuário, ou o código do **seu** sistema no caso do cliente | — |

Todos os campos são `snake_case`. Todas as datas são UTC em ISO 8601.

### `id` × `codigo`

Vale a distinção, porque os dois aparecem juntos:

| | `id` | `codigo` |
|---|---|---|
| **Cliente** | Identificador interno da Checkmob | O código do **seu** sistema — você define |
| **Ordem de serviço** | Identificador interno | Número sequencial que o usuário vê na tela |
| **Registro** | Identificador interno | Número sequencial que o usuário vê na tela |

Nas chamadas da API use sempre o `id`. O `codigo` serve para localizar (`codigos: [...]` em clientes) e para exibir ao usuário final.
