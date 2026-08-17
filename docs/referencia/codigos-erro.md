# Códigos de erro

Catálogo completo. O campo `codigo` é **estável**: não é traduzido e não muda entre versões — é nele que o seu tratamento de erro deve se apoiar.

## Catálogo

| Código | HTTP | Quando acontece | Repetir resolve? |
|---|---|---|---|
| `CAMPO_OBRIGATORIO` | 400 | Campo obrigatório ausente. Vem dentro de `erros[]` | Não |
| `VALOR_INVALIDO` | 400 | Valor fora do domínio aceito | Não |
| `TIPO_INVALIDO` | 400 | Tipo errado — texto onde se espera número, data malformada | Não |
| `VALIDACAO_CAMPOS` | 400 | Falha de validação. Traz `erros[]` com o detalhe por campo | Não |
| `NAO_AUTENTICADO` | 401 | Token ausente, inválido ou expirado | Depois de renovar |
| `SEM_PERMISSAO` | 403 | Autenticado, mas sem acesso àquele recurso | Não |
| `NAO_ENCONTRADO` | 404 | Recurso inexistente, ou de outro cliente | Não |
| `CONFLITO` | 409 | Choca com o estado atual — nome duplicado, vínculo já existente | Não |
| `REGRA_NEGOCIO` | 422 | Corpo válido, operação não permitida. O motivo está em `detalhe` | Não |
| `LIMITE_EXCEDIDO` | 429 | Limite de requisições estourado | Sim, após `Retry-After` |
| `ERRO_INTERNO` | 500 | Falha do nosso lado | Sim, com backoff |

## A regra prática

**4xx é você, 5xx somos nós.**

Repetir um 4xx sem mudar a requisição não vai resolver — só consome o seu limite. As duas exceções são `NAO_AUTENTICADO` (repita depois de renovar o token) e `LIMITE_EXCEDIDO` (repita depois do `Retry-After`).

## Status de sucesso

| HTTP | Quando |
|---|---|
| 200 | Leitura ou atualização bem-sucedida |
| 201 | Recurso criado. Traz o cabeçalho `Location` |
| 204 | Sucesso sem conteúdo — exclusões e vínculos |
| 207 | Lote processado. O resultado está item a item no corpo |

!!! warning "O 207 não é um veredito"
    Ele chega mesmo quando todos os itens falharam. Sempre percorra `resultados` para saber o que aconteceu com cada um.

## Estrutura da resposta de erro

```json
{
  "tipo": "https://docs.checkmob.com/erros/validacao",
  "titulo": "Falha de validação",
  "status": 400,
  "codigo": "VALIDACAO_CAMPOS",
  "detalhe": "O corpo enviado tem campos inválidos.",
  "instancia": "/v2/clientes",
  "erros": [
    { "campo": "nome", "codigo": "CAMPO_OBRIGATORIO", "mensagem": "O campo nome é obrigatório." }
  ]
}
```

`detalhe`, `instancia` e `erros` são omitidos quando não se aplicam. `codigo`, `status`, `titulo` e `tipo` estão sempre presentes.

Como tratar cada um em código: [erros](../conceitos/erros.md).
