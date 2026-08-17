# Listagens e filtros

Toda listagem da v2 segue o mesmo formato. Aprenda uma vez, vale para clientes, ordens de serviço, registros, pessoas, usuários e todo o resto.

## O formato

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

??? question "Por que POST e não GET?"
    Listagem é leitura, e a intuição diz `GET`. Mas os filtros da v2 incluem listas (`ids_status`, `ids_usuario`, `ids_segmento`) e intervalos de data. Em query string isso vira uma URL enorme, difícil de escapar corretamente e sujeita a limite de tamanho. Com o corpo em JSON o filtro fica legível e não tem teto prático.

**Corpo vazio lista tudo**, paginado. `{}` ou nenhum corpo funcionam igual:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## Os filtros que todo recurso aceita

| Campo | Tipo | O que faz |
|---|---|---|
| `pagina` | inteiro | Página desejada, começa em 1. Padrão: 1 |
| `por_pagina` | inteiro | Itens por página. Padrão: 25, máximo: 100 |
| `busca` | texto | Busca textual ampla. Vazio é ignorado |
| `ordenar` | texto | Campos de ordenação, separados por vírgula |
| `atualizado_apos` | data/hora | Só o que mudou depois deste instante |

Cada recurso soma os seus próprios filtros a essa base. Os campos exatos de cada um estão no [Swagger](https://api-integration.checkmob.com/index.html).

## Busca

`busca` procura nos campos que fazem sentido para aquele recurso — normalmente os que a pessoa tem em mãos na hora de procurar:

| Recurso | `busca` procura em |
|---|---|
| Clientes | nome, código, documento |
| Pessoas | nome, e-mail |
| Usuários | nome, login, e-mail |
| Registros | observação, instruções |

Busca vazia ou só com espaços é ignorada, e a listagem devolve tudo.

## Ordenação

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

!!! info "A ordenação é estável"
    A API sempre acrescenta o `id` como último critério de desempate. Sem isso, dois registros com a mesma data poderiam trocar de posição entre uma página e outra, fazendo você ler um item duas vezes e pular outro.

## Filtros por lista e por intervalo

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

## Campo desconhecido é erro, não silêncio

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

## Datas

Todas as datas são **UTC**, no formato ISO 8601: `2026-08-17T14:30:00Z`. Isso vale tanto para o que você envia quanto para o que recebe. Converta para o fuso local só na hora de exibir.
