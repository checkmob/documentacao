# Primeira integração

Três comandos para sair do zero: pegar um token, listar clientes e entender o que voltou.

## 1. Obtenha um token

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

## 2. Liste seus clientes

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

## 3. Entenda a resposta

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

!!! tip "Guarde o `atualizado_em`"
    Repare no campo `atualizado_em` de cada registro. Ele é a chave da [sincronização incremental](../conceitos/sincronizacao.md): na próxima vez você pede só o que mudou depois dele, em vez de baixar os 138 clientes de novo.

## Pronto. E agora?

Você já tem o essencial. O próximo passo depende do que quer fazer:

| Objetivo | Vá para |
|---|---|
| **Mandar meu time visitar um cliente** | [Agendar uma visita](../guias/agendar-visita.md) |
| **Trazer o que foi feito na visita** | [Consumir o que foi realizado](../guias/consumir-visita.md) |
| Manter meu ERP e a Checkmob com a mesma base de clientes | [Sincronizar clientes](../guias/sincronizar-clientes.md) |
| Acompanhar KM rodado e custo | [Deslocamentos](../guias/deslocamentos.md) |
| Coordenar trabalho com vários técnicos ou várias visitas | [Ordens de serviço](../guias/ordens-servico.md) |
| Ver tudo que existe | [Recursos disponíveis](../referencia/recursos.md) |

Os dois primeiros são o caminho mais percorrido: agendar a visita e depois ler o que aconteceu nela.

## Erros comuns nesses primeiros passos

| O que acontece | Causa provável |
|---|---|
| `401 NAO_AUTENTICADO` | Faltou o cabeçalho `Authorization`, ou o token expirou |
| `400 VALIDACAO_CAMPOS` com o campo `busca` | Você mandou um filtro que aquele endpoint não aceita — a v2 recusa em vez de ignorar |
| `405` num `GET /v2/clientes` | Listagem é `POST /v2/clientes/list`, não `GET` |
| `429 LIMITE_EXCEDIDO` | Passou de 30 requisições em 30 segundos. Ver [limites](../conceitos/limites.md) |
