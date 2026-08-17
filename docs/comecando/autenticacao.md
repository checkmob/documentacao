# Autenticação

A API usa **token JWT** no cabeçalho `Authorization`. Todo endpoint exige token, com uma única exceção: o próprio `POST /v2/token`.

## Obtendo o token

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/token' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "seu_usuario",
    "senha": "sua_senha"
  }'
```

```json
{
  "token_acesso": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tipo_token": "Bearer",
  "expira_em": "2026-08-18T22:20:06Z"
}
```

| Campo | O que é |
|---|---|
| `token_acesso` | O JWT que vai no cabeçalho de todas as outras chamadas |
| `tipo_token` | Sempre `Bearer` |
| `expira_em` | Instante de expiração, em UTC |

## Usando o token

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## Boas práticas

!!! warning "Não peça um token por requisição"
    Guarde o token e reaproveite até perto de `expira_em`. Pedir token a cada chamada desperdiça o seu limite de requisições e é o erro mais comum em integrações novas.

**Renove com antecedência.** Renovar quando faltarem alguns minutos para `expira_em` evita a corrida entre "token ainda válido" e "token expirado no meio da chamada".

**Trate o 401 como sinal de renovação.** Se uma chamada voltar `401 NAO_AUTENTICADO`, peça um token novo e repita a requisição uma vez. Se voltar 401 de novo, aí sim é problema de credencial.

**Nunca versione a senha no código.** Use variável de ambiente ou cofre de segredos.

## Credencial inválida

Login ou senha errados devolvem sempre a mesma resposta, sem dizer qual dos dois falhou:

```json
{
  "tipo": "https://docs.checkmob.com/erros/nao-autenticado",
  "titulo": "Não autenticado",
  "status": 401,
  "codigo": "NAO_AUTENTICADO",
  "detalhe": "Login ou senha inválidos.",
  "instancia": "/v2/token"
}
```

## Proteção contra tentativas repetidas

Sequências de tentativas malsucedidas **para o mesmo login** são bloqueadas temporariamente:

```json
{
  "titulo": "Limite de requisições excedido",
  "status": 429,
  "codigo": "LIMITE_EXCEDIDO",
  "detalhe": "Muitas tentativas de autenticação. Tente novamente em 47 segundos."
}
```

A resposta traz o cabeçalho `Retry-After` com os segundos a esperar. Autenticação bem-sucedida zera a contagem — uma integração que guarda o token corretamente nunca esbarra nisso.

## Idioma das mensagens

O campo `codigo` **nunca** muda de idioma — é ele que o seu código deve usar. Já `titulo` e `detalhe` respeitam o cabeçalho `Accept-Language`:

```bash
curl -X POST 'https://api-integration.checkmob.com/v2/clientes/list' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Accept-Language: en-US' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Idiomas: `pt-BR` (padrão) e `en-US`.
