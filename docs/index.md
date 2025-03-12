# Documentação API Checkmob


## **1. Autenticação**
Para utilizar a API da Checkmob, é necessário estar autenticado. O primeiro passo é obter um **token de acesso**, que será utilizado em todas as requisições subsequentes.

### **1.1. Obtendo o Token de Autenticação**
Para gerar um token, utilize o endpoint `/api/v1/auth/login` enviando as credenciais de login.

#### **Exemplo de Requisição - Obter Token**
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
```json
{
  "success": true,
  "data": {
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZENoZWNrbW9iIjoiNzA0MDciLCJJZFVzZXIiOiIyNTM1ODciLCJOYW1lIjoiRmVsaXBlIFBvcnRlbGEiLCJFbWFpbCI6ImZlbGlwZS5wb3J0ZWxhQGNoZWNrbW9iLmNvbSIsIm5iZiI6MTc0MTc4MjAwNiwiZXhwIjoxNzQ0NDEwMDA2LCJpYXQiOjE3NDE3ODIwMDYsImlzcyI6IkNIRUNLTU9CIiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3QifQ.ycTH1evq5O6Ld0gCUVh3rnLOkaHcOZ3zdBpjV_XMFtY",
      "expiresIn": "2025-04-11T22:20:06Z",
      "tokenType": "Bearer"
    }
  }
}
```

O campo `token` contém o **JWT (JSON Web Token)**, que deve ser incluído no cabeçalho `Authorization` para todas as requisições à API.

---

## Criando um Cliente com um Segmento

Para criar um cliente e vinculá-lo a um segmento, é necessário enviar o **ID do segmento** dentro do array `idsSegment` na requisição **POST** para `/api/v1/client/post`.

### **Obtendo o ID do Segmento**
Antes de criar o cliente, você pode listar os segmentos disponíveis na base de dados utilizando o endpoint `/api/v1/segment/list`.

#### **Exemplo de Requisição - Listar Segmentos**
```sh
curl -X 'POST' \  
  'https://api-integration.checkmob.com/api/v1/segment/list' \  
  -H 'accept: text/plain' \  
  -H 'Accept-Language: en-US' \  
  -H 'Authorization: bearer SEU_TOKEN_AQUI' \  
  -H 'Content-Type: application/json' \  
  -d '{
  "numberOfRows": 10,
  "numberOfRowsSkipped": 0,
  "active": true
}'
```

#### **Resposta Esperada**
```json
{
  "success": true,
  "data": [
    {
      "id": 179022,
      "name": "Segmento Teste"
    }
  ]
}
```

Após obter o **ID do segmento**, inclua-o no array `idsSegment` ao criar o cliente.

### **Criando um Cliente Vinculado a um Segmento**

#### **Exemplo de Requisição - Criar Cliente**
```sh
curl -X 'POST' \  
  'https://api-integration.checkmob.com/api/v1/client/post' \  
  -H 'accept: application/json' \  
  -H 'Authorization: bearer SEU_TOKEN_AQUI' \  
  -H 'Content-Type: application/json' \  
  -d '{
   "name":"John Doe",
   "code":12345,
   "type":"F",
   "cpf":"123.456.789-00",
   "email":"johndoe@example.com",
   "phone":"+55 11 4002-8922",
   "cellphone":"+55 11 99999-9999",
   "role":"Manager",
   "responsible":"Jane Doe",
   "responsiblePhone":"+55 11 98888-8888",
   "active":true,
   "idsSegment":[
      179022
   ]
}'
```

Se a requisição for bem-sucedida, o cliente será criado e vinculado ao segmento especificado.

---

## **Vinculando um Segmento a um Cliente Existente**
Se o cliente já existir e você deseja vinculá-lo a um novo segmento, utilize o endpoint `/api/v1/segment/linkSegmentToClient`.

### **Exemplo de Requisição - Vincular Segmento a Cliente**
```sh
curl -X 'POST' \  
  'https://api-integration.checkmob.com/api/v1/segment/linkSegmentToClient' \  
  -H 'accept: application/json' \  
  -H 'Authorization: bearer SEU_TOKEN_AQUI' \  
  -H 'Content-Type: application/json' \  
  -d '{
  "idSegment": 179022,
  "idsClients": [
    37897513
  ]
}'
```