# Agendar uma visita

Este é o caminho principal de quem integra com a Checkmob. Se a sua pergunta é "como eu mando meu time visitar este cliente amanhã?", é aqui.

Na Checkmob, uma visita agendada é um **registro** — `POST /v2/registros/post`. Você diz quem vai, para qual cliente e quando, e ela aparece no aplicativo do usuário em campo.

!!! question "E a ordem de serviço, não serve para isso?"
    Serve, mas para um caso mais específico. **Para a maioria das integrações, o registro agendado é o que você quer.**

    A ordem de serviço existe para quando o trabalho não cabe numa visita só: mais de um usuário em campo atuando no mesmo atendimento, ou várias visitas ligadas ao mesmo trabalho. Ver [ordens de serviço](ordens-servico.md).

## Agendando

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

Guarde o `id` — é por ele que você vai [buscar o que foi realizado](consumir-visita.md) depois.

## Os campos

### Obrigatórios

| Campo | O que é |
|---|---|
| `id_cliente` | Onde a visita acontece |
| `data_inicio_esperada` | Início da janela agendada |
| `data_conclusao_esperada` | Fim da janela. Não pode ser anterior ao início |

### Opcionais que fazem diferença

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

!!! warning "`ativo` controla se a visita chega no campo"
    Com `ativo: false` a visita fica como **"a enviar"** e o usuário não a vê no aplicativo. É útil para preparar uma agenda e liberar depois — mas se você espera que ela apareça agora, mande `ativo: true`.

## Resolvendo os ids antes de agendar

Os campos `id_*` apontam para cadastros existentes. Antes do primeiro agendamento você precisa descobrir esses ids:

| Preciso do id de | Onde busco |
|---|---|
| Cliente | `POST /v2/clientes/list` — filtre por `codigos` se você guarda o código do seu ERP |
| Usuário | `POST /v2/usuarios/list` |
| Objetivo | `POST /v2/objetivos/list` |
| Contato | `POST /v2/pessoas/list` com `ids_clientes` |
| Segmento / grupo | `POST /v2/segmentos/list` · `POST /v2/grupos/list` |

!!! tip "Guarde em cache"
    Objetivos, segmentos e grupos mudam pouco. Carregue uma vez e reaproveite — não vale gastar requisição resolvendo o mesmo id de objetivo em cada agendamento. Ver [limites](../conceitos/limites.md).

## Achando o cliente pelo código do seu sistema

Se você grava o código do seu ERP no cliente (recomendado — ver [sincronizar clientes](sincronizar-clientes.md)), não precisa manter tabela de-para:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "codigos": ["ERP-4471"] }'
```

## Agendando várias visitas

Não existe endpoint de lote para registros — agende uma por requisição. Respeitando o [limite](../conceitos/limites.md) de 30 requisições por 30 segundos, isso dá cerca de 60 agendamentos por minuto.

Para volumes grandes, distribua ao longo do tempo e acompanhe o cabeçalho `X-RateLimit-Remaining` para desacelerar antes de ser bloqueado.

## Consultando a agenda

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

=== "Agenda de um técnico"

    ```json
    {
      "ids_usuario": [1201],
      "concluido": false,
      "ordenar": "data_agendada"
    }
    ```

=== "Visitas de um cliente"

    ```json
    { "ids_cliente": [1024] }
    ```

=== "Pelo número visível"

    ```json
    { "codigo": 3391 }
    ```

## Corrigindo um agendamento

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

## Próximo passo

Depois que a equipe executar, você busca o que aconteceu: [consumir o que foi realizado](consumir-visita.md).
