# Paginação

## O envelope

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

## Percorrendo as páginas

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

## Limites

| Situação | Comportamento |
|---|---|
| `por_pagina` ausente | Usa 25 |
| `por_pagina` acima de 100 | Usa 100. **Não é erro** |
| `pagina` ausente | Usa 1 |
| `pagina` ou `por_pagina` menor que 1 | `400 VALOR_INVALIDO` |

Ou seja: mandar `por_pagina: 5000` funciona, mas devolve 100. Se o seu código conta com o valor que enviou, leia `paginacao.por_pagina` da resposta em vez de assumir.

## Ordem estável entre páginas

A API sempre acrescenta o `id` como critério final de ordenação, mesmo que você não peça.

Isso resolve um problema silencioso: se você ordenar por `data_criacao` e vinte registros tiverem a mesma data, sem desempate o banco pode devolvê-los em ordem diferente a cada consulta. Na prática, você leria o mesmo registro na página 1 e na página 2, e perderia outro.

!!! warning "Dados que mudam durante a varredura"
    Paginar uma coleção que está sendo alterada enquanto você percorre pode fazer registros pularem entre páginas — isso vale para qualquer API paginada, não é específico da Checkmob.

    Para varreduras grandes e recorrentes, prefira a [sincronização incremental](sincronizacao.md): além de resolver esse problema, você baixa muito menos dado.
