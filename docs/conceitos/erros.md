# Erros

A v2 tem **um único formato de erro** para toda a API. Você escreve o tratamento uma vez e ele funciona em qualquer endpoint.

## O formato

Todo erro vem como `application/problem+json` ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "tipo": "https://docs.checkmob.com/erros/validacao",
  "titulo": "Falha de validação",
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "detalhe": "O corpo enviado tem campos inválidos.",
  "instancia": "/v2/clientes",
  "erros": [
    { "campo": "tipo", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "O campo tipo é obrigatório." },
    { "campo": "nome", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "O campo nome é obrigatório." }
  ]
}
```

| Campo | Para que serve |
|---|---|
| `codigo` | **É o que o seu código deve usar.** Estável, nunca traduzido, nunca muda |
| `status` | O código HTTP, repetido no corpo |
| `titulo` | Resumo legível. Respeita o `Accept-Language` |
| `detalhe` | Explicação do caso específico. Respeita o `Accept-Language` |
| `instancia` | O caminho que gerou o erro |
| `erros` | Presente só em validação: um item por campo problemático |
| `tipo` | URL com a documentação daquele tipo de erro |

!!! danger "Nunca decida nada com base em texto"
    `titulo` e `detalhe` mudam de idioma conforme o `Accept-Language` e podem ser reescritos para ficarem mais claros. Um `if mensagem == "Cliente não encontrado"` vai quebrar.

    Use sempre o `codigo`. Ele é contrato: não traduz e não muda.

## Erros de validação

Quando há problema nos campos, a resposta traz **todos** os campos com problema de uma vez, não só o primeiro:

```json
{
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "erros": [
    { "campo": "tipo", "codigo": "VALOR_INVALIDO", "mensagem": "Deve ser um dos valores: F, J ou N." },
    { "campo": "nome", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "O campo nome é obrigatório." }
  ]
}
```

Assim você corrige tudo de uma vez em vez de descobrir um problema por tentativa.

Em lote, o `campo` indica a posição no array:

```json
{ "campo": "clientes[3].documento", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "..." }
```

## Como tratar cada código

| Código | HTTP | O que fazer |
|---|---|---|
| `VALIDACAO_CAMPOS` | 400 | Corrija o corpo. Percorra `erros[]` para saber o quê. **Não repita sem mudar nada** |
| `CAMPO_OBRIGATORIO` | 400 | Campo faltando. Aparece dentro de `erros[]` |
| `VALOR_INVALIDO` | 400 | Valor fora do aceito. Aparece dentro de `erros[]` |
| `TIPO_INVALIDO` | 400 | Tipo errado (texto onde se espera número, data malformada) |
| `NAO_AUTENTICADO` | 401 | Token ausente, inválido ou expirado. Renove e repita **uma vez** |
| `SEM_PERMISSAO` | 403 | O usuário não tem acesso. Repetir não resolve |
| `NAO_ENCONTRADO` | 404 | O recurso não existe ou não é do seu cliente |
| `CONFLITO` | 409 | Choca com o estado atual (nome duplicado, vínculo que já existe) |
| `REGRA_NEGOCIO` | 422 | Corpo válido, mas a operação não é permitida. Leia o `detalhe` |
| `LIMITE_EXCEDIDO` | 429 | Espere o `Retry-After` e repita. Ver [limites](limites.md) |
| `ERRO_INTERNO` | 500 | Falha nossa. Repita com backoff; se persistir, abra chamado com o `X-Request-Id` |

Lista completa em [códigos de erro](../referencia/codigos-erro.md).

## Esqueleto de tratamento

```python
resposta = requests.post(url, json=corpo, headers=cabecalhos)

if resposta.ok:
    return resposta.json()

problema = resposta.json()
codigo = problema["codigo"]

if codigo == "NAO_AUTENTICADO":
    renova_token()
    return repete_uma_vez()

if codigo == "LIMITE_EXCEDIDO":
    espera(int(resposta.headers.get("Retry-After", 30)))
    return repete()

if codigo == "VALIDACAO_CAMPOS":
    for erro in problema.get("erros", []):
        registra(f"{erro['campo']}: {erro['mensagem']}")
    raise ErroDeDados(problema)      # repetir não vai resolver

if codigo == "ERRO_INTERNO":
    raise ErroTemporario(problema)   # repita com backoff

raise ErroDeIntegracao(problema)
```

A regra geral: **4xx é você, 5xx somos nós.** Repetir um 4xx sem mudar a requisição só gasta o seu limite.

## Operações em lote

Endpoints de lote (`criar-lote`, `excluir`) respondem **`207 Multi-Status`** com o resultado item a item — um item com erro não derruba os outros:

```json
{
  "resultados": [
    { "indice": 0, "status": "criado", "recurso": { "id": 5012, "nome": "Padaria do Bairro" } },
    { "indice": 1, "status": "erro", "mensagem": "Já existe cliente com este documento." }
  ]
}
```

O `207` chega mesmo quando todos deram certo. Sempre percorra `resultados` — não trate o status HTTP como veredito do lote inteiro.

## Sempre guarde o `X-Request-Id`

Toda resposta traz esse cabeçalho. Registre-o junto com os seus erros: é com ele que o suporte encontra exatamente a requisição que falhou.

```
X-Request-Id: 9f2c4a1b7e6d4f8a9c3b2e1d0f5a6b7c
```

Você também pode enviar o seu próprio valor no mesmo cabeçalho — a API o devolve, o que permite correlacionar com o log do seu lado.
