# Sincronizar clientes

O caso mais comum: manter a base de clientes do seu ERP ou CRM espelhada na Checkmob.

## A chave de ligação: `codigo`

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

## Carga inicial

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

## Sincronização diária

Da segunda execução em diante, só o que mudou:

```json
{
  "atualizado_apos": "2026-08-16T03:00:00Z",
  "pagina": 1,
  "por_pagina": 100,
  "ordenar": "atualizado_em"
}
```

Os detalhes de cursor, falha no meio e reprocessamento estão em [sincronização incremental](../conceitos/sincronizacao.md).

## Criando clientes

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

### Em lote

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

!!! warning "Percorra sempre os `resultados`"
    O `207` chega mesmo que tudo tenha dado certo — e mesmo que tudo tenha falhado. O veredito está item a item, não no status HTTP.

## Atualizando

Dois verbos, com propósitos diferentes:

=== "PATCH — mudar um campo"

    ```bash
    curl -X PATCH 'https://api-integration.checkmob.com/v2/clientes/1024' \
      -H 'Authorization: Bearer SEU_TOKEN' \
      -H 'Content-Type: application/json' \
      -d '{ "ativo": false }'
    ```

    Só o que você mandar é alterado. É o que você quer na maioria dos casos.

=== "PUT — enviar o cadastro"

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

## Inativar em vez de excluir

Cliente com histórico de atendimento raramente deve sumir. Prefira inativar:

```json
{ "ativo": false }
```

Ele para de aparecer para a equipe de campo, mas o histórico continua íntegro. Use `DELETE` só quando o cadastro foi realmente um engano.

## Filtros úteis no dia a dia

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

## Contatos e endereço

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

## Checklist antes de subir para produção

- [ ] O `codigo` do seu sistema está gravado no cliente da Checkmob
- [ ] O cursor de sincronização é persistido, e só depois de processar tudo
- [ ] Reprocessar o mesmo cliente duas vezes não duplica nada do seu lado
- [ ] Erros `4xx` não entram em loop de retry
- [ ] O `X-Request-Id` está sendo registrado no seu log
