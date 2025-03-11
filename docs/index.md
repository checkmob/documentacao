# Vinculando Segmentos a Clientes na API CheckMob

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
  "segments": [
    {
      "id": 214513,
      "name": "Segmento Exemplo"
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
      214513
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
  "idSegment": 182349,
  "idsClients": [
    37897513
  ]
}'
```

### **Resposta Esperada**
```json
{
  "success": true,
  "message": "Segment successfully linked to client(s)."
}
```

Com essa abordagem, você pode garantir que os clientes estejam sempre vinculados aos segmentos corretos na sua base de dados.

