# Glossário

Os conceitos da Checkmob e como eles aparecem na API. Se você vem da v1, a última coluna é o de-para de nomenclatura.

## Conceitos

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

## Registro × ordem de serviço

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

→ [Agendar uma visita](../guias/agendar-visita.md) · [Consumir o que foi realizado](../guias/consumir-visita.md)

## Convenções de nome dos campos

| Padrão | Significado | Exemplo |
|---|---|---|
| `id_*` | Referência a outro recurso | `id_cliente`, `id_usuario` |
| `ids_*` | Filtro por vários valores ao mesmo tempo | `ids_status`, `ids_usuario` |
| `*_apos` / `*_antes` | Intervalo de data (exclusivo) | `data_criacao_apos` |
| `*_min` / `*_max` | Intervalo numérico (inclusivo) | `prioridade_min` |
| `data_criacao` | Quando o registro foi criado | — |
| `atualizado_em` | Última alteração. É o cursor da [sincronização](../conceitos/sincronizacao.md) | — |
| `codigo` | Identificador visível ao usuário, ou o código do **seu** sistema no caso do cliente | — |

Todos os campos são `snake_case`. Todas as datas são UTC em ISO 8601.

## `id` × `codigo`

Vale a distinção, porque os dois aparecem juntos:

| | `id` | `codigo` |
|---|---|---|
| **Cliente** | Identificador interno da Checkmob | O código do **seu** sistema — você define |
| **Ordem de serviço** | Identificador interno | Número sequencial que o usuário vê na tela |
| **Registro** | Identificador interno | Número sequencial que o usuário vê na tela |

Nas chamadas da API use sempre o `id`. O `codigo` serve para localizar (`codigos: [...]` em clientes) e para exibir ao usuário final.
