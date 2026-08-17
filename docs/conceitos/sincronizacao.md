# Sincronização incremental

Este é o recurso que mais economiza tempo e requisição na v2 — e o que ninguém descobre olhando só a lista de endpoints.

## O problema

A integração ingênua roda toda noite e baixa tudo:

```json
{ "pagina": 1, "por_pagina": 100 }
```

Com 50 mil clientes, são 500 requisições para descobrir que 12 mudaram. Todo dia. Você gasta o seu limite de requisições, demora, e ainda precisa comparar tudo do seu lado para achar o que mudou.

## A solução

Todo recurso da v2 aceita `atualizado_apos` e devolve `atualizado_em` em cada registro:

```json
{
  "atualizado_apos": "2026-08-16T03:00:00Z",
  "por_pagina": 100
}
```

Agora vêm só os registros alterados depois daquele instante. As mesmas 500 requisições viram uma.

## O ciclo

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

!!! tip "Use o `atualizado_em` recebido, não o relógio local"
    É tentador salvar `agora()` como cursor. Não faça isso: o relógio do seu servidor e o da Checkmob não são idênticos, e a diferença — mesmo de poucos segundos — faz registros escaparem para sempre da sua sincronização.

    O maior `atualizado_em` que você efetivamente recebeu não tem esse problema.

## Cuidados que evitam dor de cabeça

**Salve o cursor só no fim.** Se o processo cair no meio, o cursor antigo faz a próxima execução reprocessar o trecho. Reprocessar é chato; **perder registro é pior**.

**Prepare-se para receber o mesmo registro duas vezes.** Isso acontece quando um registro é alterado no exato instante do cursor, ou quando uma execução falha no meio. Faça a gravação do seu lado ser idempotente — normalmente um `upsert` pela chave do registro resolve.

**Ordene por `atualizado_em`.** Assim o maior valor vem nas últimas páginas e você pode avançar o cursor com segurança mesmo se interromper no meio.

**Sync inicial não usa cursor.** Na primeira carga, rode sem `atualizado_apos` para trazer a base inteira, guarde o maior `atualizado_em` e siga incremental daí em diante.

## E as exclusões?

`atualizado_apos` traz o que foi **criado ou alterado**. Registros excluídos simplesmente deixam de aparecer nas listagens — eles não voltam marcados como apagados.

Se o seu sistema precisa refletir exclusões, tem duas saídas:

- **Rode uma reconciliação completa periodicamente** (semanal, por exemplo): liste tudo sem `atualizado_apos`, compare com a sua base e marque como inativo o que sumiu.
- **Filtre pelos ids que você conhece** usando o filtro `ids` e veja quais não voltaram.

## Onde funciona

Em todos os recursos de listagem: clientes, pessoas, usuários, grupos, segmentos, ordens de serviço, registros, questionários, endereços e as tabelas de apoio (categorias, etapas, tipos de serviço, temperaturas, setores de mercado, objetivos, campos personalizados).

Cada registro devolve o `atualizado_em` correspondente, que é sempre o valor a usar como próximo cursor.
