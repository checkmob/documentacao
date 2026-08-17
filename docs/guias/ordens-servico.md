# Ordens de serviço

!!! tip "Antes de começar: você precisa mesmo de uma ordem de serviço?"
    Para agendar uma visita simples — um técnico, um cliente, uma ida — o caminho é o **registro agendado**. É o que a maioria das integrações usa. Ver [agendar uma visita](agendar-visita.md).

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

## Criando

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

## Consultando

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

=== "Por equipe"

    ```json
    { "ids_usuario": [1201, 1202], "concluida": false }
    ```

=== "Por cliente"

    ```json
    { "ids_cliente": [1024] }
    ```

=== "Por status"

    ```json
    { "ids_status": [3, 7] }
    ```

    Os status disponíveis vêm de `GET /v2/ordens-servico/status`.

=== "Pelo número visível"

    ```json
    { "codigo": 4471 }
    ```

    O `codigo` é o número que o usuário vê na tela — diferente do `id` interno.

## Alterando

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

!!! info "Reatribuir a equipe"
    `ids_usuarios` segue a mesma regra: omitido preserva os responsáveis atuais; enviado substitui a lista inteira; lista vazia (`[]`) remove todos.

    ```json
    { "id_cliente": 1024, "ids_usuarios": [1203, 1204] }
    ```

## Mudando o status

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

## Concluindo

`concluida` controla a conclusão de forma explícita:

```json
{ "id_cliente": 1024, "concluida": true }
```

| Valor | Efeito |
|---|---|
| `true` | Marca como concluída agora (se já estava, mantém a data original) |
| `false` | Reabre |
| ausente | Não mexe |

## Excluindo

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

## Fluxo completo

Uma integração de despacho com OS faz assim:

1. **Cria a OS** com cliente, janela e a lista de responsáveis em `ids_usuarios`.
2. **Acompanha** com `atualizado_apos`, trazendo só o que mudou.
3. **Lê as visitas** que aconteceram debaixo dela: `POST /v2/registros/list` com `{ "id_ordem_servico": 8801 }`.
4. **Busca as respostas** do questionário — por registro ou pela OS inteira em `/v2/respostas-questionario/ordem-servico/{id}`.
5. **Fecha o ciclo** no seu sistema com o resultado.

Os passos 3 e 4 estão detalhados em [consumir o que foi realizado](consumir-visita.md).
