# Documentação API 


## **Documentação**
Esta documentação auxiliar tem como objetivo guiar você, passo a passo, na integração com a API da Checkmob. Abordaremos desde a autenticação até a manipulação de dados, incluindo a paginação de resultados.

### **1.1. Autenticação**
Para interagir com a API da Checkmob, é imprescindível estar autenticado. O primeiro passo é obter um token de acesso, que funcionará como sua credencial em todas as requisições subsequentes.

#### **Obtendo o Token de Autenticação**
Para gerar seu token, você precisará enviar suas credenciais de login para o endpoint /api/v1/auth/login.

#### **Exemplo de Requisição - Obter Token**

No exemplo abaixo, utilizamos o curl para demonstrar como realizar essa requisição. Lembre-se de substituir "seu_usuario" e "sua_senha" pelas suas credenciais reais.

```sh
curl -X 'POST' \
  'https://api-integration.checkmob.com/api/v1/auth/login' \
  -H 'accept: application/json' \
  -H 'Accept-Language: en-US' \
  -H 'Content-Type: application/json' \
  -d '{
  "login": "seu_usuario",
  "password": "sua_senha"
}'
```

#### **Resposta Esperada**
Após enviar a requisição, você receberá uma resposta similar a esta:


```json
{
  "success": true,
  "data": {
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZENoZWNrbW9iIjoiNzA0MDciLCJJZFVzZXIiOiIyNTM1ODciLCJOYW1lIjoiVXN1YXJpbyBNb2NrIHN0cmluZyIsIkVtYWlsIjoiaW50ZWdyYWNhb0BjaGVja21vYi5jb20iLCJuYmYiOjE3NDEyMzQ1NjcsImV4cCI6MTc0MjM0NTY3OCwiaWF0IjoxNzQxMjM0NTY3LCJpc3MiOiJDSFVDWU1PRiIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0In0.Um_Token_Exemplo_Para_Documentacao_Apenas",
      "expiresIn": "2025-04-11T22:20:06Z",
      "tokenType": "Bearer"
    }
  }
}
```

- O campo **accessToken** contém o JWT que será usado para autenticação.

- O campo **expiresIn** indica a data e hora de expiração do token.

- O campo **tokenType** geralmente é Bearer e indica o tipo do token.

---
### **1.2. Utilizando o Token nas Requisições**

Depois de obter o token, você deve incluí-lo no cabeçalho Authorization de todas as requisições para os demais endpoints da API.

A forma correta é:

```json
Authorization: Bearer <seu_access_token>
```

### **2.0. Fazendo Requisições com Paginação**

Alguns endpoints, como a listagem de clientes, suportam paginação para controlar o volume de dados retornados.

### **2.1. Exemplo: Listar Clientes com Paginação**

```json
curl -X POST \
  'https://api-integration.checkmob.com/api/v1/client/list' \
  -H 'accept: application/json' \
  -H 'Accept-Language: en-US' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo.token.alterado' \
  -H 'Content-Type: application/json' \
  -d '{
    "numberOfRows": 500,
    "numberOfRowsSkipped": 0,
    "search": "",
    "active": true
  }'
```
Parâmetros do corpo da requisição

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| numberOfRows | Quantidade máxima de registros que deseja receber na resposta. | 500 |
| numberOfRowsSkipped | Quantidade de registros a pular (para paginação). | 0 |
| search | Termo para filtrar os resultados (opcional). | "" |
| active | Filtra clientes ativos (true) ou inativos (false). | true |


### **2.2. Como navegar entre páginas**

- Para obter a primeira página, envie numberOfRowsSkipped como 0.

- Para a segunda página, envie numberOfRowsSkipped igual a numberOfRows (ex: 500).

- Para a terceira página, envie numberOfRowsSkipped igual a numberOfRows * 2 (ex: 1000).

- E assim por diante.

### **3. Dicas Importantes**

- Sempre use HTTPS para garantir segurança na transmissão dos dados.

- Não compartilhe seu token com terceiros, pois ele garante acesso à sua conta.

- Quando o token expirar, será necessário obter um novo token via login.

- Verifique as mensagens de erro e códigos HTTP para tratar falhas na integração.