# Limites e cabeçalhos

## Limite de requisições

**30 requisições a cada 30 segundos**, por usuário autenticado.

Toda resposta — não só as bloqueadas — informa onde você está:

| Cabeçalho | O que é |
|---|---|
| `X-RateLimit-Limit` | O teto da janela (30) |
| `X-RateLimit-Remaining` | Quantas ainda cabem nesta janela |
| `X-RateLimit-Reset` | Quando a janela reinicia (timestamp Unix) |

Isso permite desacelerar **antes** de levar bloqueio, em vez de reagir depois.

### Ao exceder

Você recebe `429` com `Retry-After` em segundos:

```json
{
  "titulo": "Limite de requisições excedido",
  "status": 429,
  "codigo": "LIMITE_EXCEDIDO",
  "detalhe": "Limite de requisições excedido. Tente novamente em 30 segundos."
}
```

```python
if resposta.status_code == 429:
    espera(int(resposta.headers.get("Retry-After", 30)))
    repete()
```

### Como não chegar lá

**Aumente `por_pagina` em vez de fazer mais chamadas.** Uma página de 100 gasta uma requisição; quatro de 25 gastam quatro, para o mesmo dado.

**Use [sincronização incremental](sincronizacao.md).** É a diferença entre 500 requisições por noite e uma.

**Guarde o token.** Pedir token a cada chamada dobra o seu consumo.

**Prefira lote.** Criar 200 clientes em `criar-lote` é uma requisição, não 200.

## Tamanho dos lotes

Operações em lote aceitam no máximo **500 itens** por requisição. Acima disso:

```json
{
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "erros": [
    { "campo": "ids", "codigo": "VALOR_INVALIDO", "mensagem": "Informe no máximo 500 itens por requisição (recebidos 1200)." }
  ]
}
```

Vale para `criar-lote`, exclusão em lote e os endpoints de vínculo. Quebre listas maiores em blocos de 500.

## Identificação da requisição

```
X-Request-Id: 9f2c4a1b7e6d4f8a9c3b2e1d0f5a6b7c
```

Presente em **toda** resposta, inclusive nas de erro. Guarde no seu log.

Você também pode enviar o seu próprio identificador nesse cabeçalho, e a API o devolve — útil para amarrar o log do seu sistema ao nosso quando precisar de suporte.

## Idioma

`Accept-Language` define o idioma de `titulo` e `detalhe` nos erros:

| Valor | Resultado |
|---|---|
| `pt-BR` | Português (padrão) |
| `en-US` | Inglês |
| outro | Cai no padrão, português |

O campo `codigo` nunca é traduzido.

## Cabeçalhos da v1

Chamadas à v1 trazem os cabeçalhos de descontinuação:

```
Deprecation: true
Sunset: Fri, 31 Dec 2027 23:59:59 GMT
Link: <https://docs.checkmob.com/migracao-v2>; rel="deprecation"
```

Se a sua integração ainda usa v1, use o `Sunset` para se programar. A documentação da versão legada está em [v1 (legado)](../legado/v1.md).
