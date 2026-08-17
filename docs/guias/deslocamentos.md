# Deslocamentos

KM rodado e custo associado, do agregado ao detalhe. São três níveis, e você desce conforme precisa:

```
usuários  →  dias        →  percursos
(resumo)     (por dia)      (origem → destino)
```

Cada nível usa o identificador do anterior, então a ordem importa.

## 1. Resumo por usuário

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

## 2. Dias de um usuário

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

## 3. Percursos de um dia

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/deslocamentos/percursos/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "id_usuario": 1201, "id_dia": 55012 }'
```

`id_usuario` e `id_dia` são obrigatórios.

Cada percurso é um trecho de origem a destino, com a distância e o custo. Os campos `id_cliente_origem`, `id_cliente_destino`, `id_registro_origem` e `id_registro_destino` amarram o trecho às visitas — é assim que você liga o KM ao atendimento que o gerou.

## Códigos de aprovação e pagamento

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

## Fechamento de KM do mês

Rotina típica de quem manda esses valores para a folha ou para o financeiro:

1. **Resumo por usuário** no período, filtrando `aprovacao: [0]` para pegar só o aprovado.
2. Para quem precisa de conferência, **desça para os dias** e veja onde está a divergência.
3. Se ainda precisar detalhar, **abra os percursos** daquele dia.
4. Amarre ao atendimento pelos campos `id_registro_origem` / `id_registro_destino`.

!!! note "Estes endpoints não têm `atualizado_apos`"
    Diferente do resto da API, deslocamento é consultado por período, não por sincronização incremental. Para acompanhar de forma recorrente, refaça a consulta da janela que interessa — normalmente o mês corrente.
