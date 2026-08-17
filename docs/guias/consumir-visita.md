# Consumir o que foi realizado

A visita foi agendada, a equipe executou. Agora você traz o resultado para dentro do seu sistema.

O fluxo tem duas etapas, nesta ordem:

```
1. Buscar o registro executado   →  quando entrou, quando saiu, onde, observações
2. Buscar o questionário respondido  →  o que foi preenchido durante a visita
```

## 1. O registro executado

O mesmo registro que você [agendou](agendar-visita.md) volta preenchido com o que aconteceu em campo.

### O que a equipe fez hoje

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

### Os campos que contam a execução

| Campo | O que é |
|---|---|
| `data_inicio` | **Check-in** — quando a visita começou de fato |
| `data_realizacao` | **Check-out** — quando terminou |
| `concluido` | Se a execução foi finalizada |
| `latitude` / `longitude` | Onde o check-in aconteceu |
| `observacao` | O que o usuário escreveu |
| `id_status` / `status` | Situação atual, com o nome legível |

A diferença entre `data_inicio` e `data_realizacao` é o **tempo em atendimento**. Comparar `data_agendada` com `data_realizacao` mostra se a visita saiu no horário.

### Recortes úteis

=== "Por técnico"

    ```json
    {
      "ids_usuario": [1201],
      "concluido": true,
      "data_realizacao_apos": "2026-08-01T00:00:00Z"
    }
    ```

=== "Por cliente"

    ```json
    { "ids_cliente": [1024], "concluido": true }
    ```

=== "Ainda em aberto"

    ```json
    { "concluido": false, "ativo": true }
    ```

=== "De uma ordem de serviço"

    ```json
    { "id_ordem_servico": 8801 }
    ```

### Uma visita específica

Se você guardou o `id` no agendamento:

```
GET /v2/registros/77120
```

### Ajustando um apontamento

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

## 2. O questionário respondido

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

### Como ler as questões

O formato acomoda tipos diferentes de pergunta, e qual campo importa depende do tipo:

| Campo | Quando importa |
|---|---|
| `selecionado` | Múltipla escolha — indica se aquele item foi marcado. O texto do item está em `nome_item` |
| `resposta_texto` | Pergunta aberta — o que o usuário digitou |
| `url_imagem` | Foto anexada, quando houver |
| `comentario` | Observação livre do usuário naquela questão |

!!! tip "Em múltipla escolha vem uma linha por item"
    Uma pergunta com cinco alternativas devolve cinco questões com o mesmo `numero_questao` e `nome_questao`, variando o `nome_item` e o `selecionado`. Para saber o que foi marcado, filtre por `selecionado: true`.

### Pela ordem de serviço

Quando a visita nasceu de uma [ordem de serviço](ordens-servico.md), dá para buscar as respostas por ela:

```
GET /v2/respostas-questionario/ordem-servico/8801
```

### Varrendo um período

Para trazer tudo que foi respondido sem ir de registro em registro:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/respostas-questionario/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "atualizado_apos": "2026-09-01T00:00:00Z", "por_pagina": 100 }'
```

Cada item traz `id_registro` e `id_ordem_servico`, então você amarra de volta ao registro correspondente.

!!! note "Esta listagem aceita menos filtros"
    Só paginação e `atualizado_apos`. A origem desses dados não suporta busca textual nem ordenação — mandar `busca` ou `ordenar` aqui devolve `400`, em vez de aceitar e ignorar em silêncio.

## Montando a rotina

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

Trocar a janela de datas por `atualizado_apos` é o que faz essa rotina ficar leve: em vez de reprocessar o dia inteiro, você traz só o que mudou desde a última execução. Os detalhes de cursor e reprocessamento estão em [sincronização incremental](../conceitos/sincronizacao.md).

!!! warning "Registro sem questionário devolve 404"
    Nem toda visita tem questionário respondido. Trate o `404 NAO_ENCONTRADO` como "não houve questionário", não como erro de integração.

## Deslocamento da visita

O KM rodado entre visitas tem guia próprio: [deslocamentos](deslocamentos.md).
