# Documentação de Webhook

## Introdução

Webhooks são chamadas HTTP enviadas automaticamente por um sistema para notificar outro sistema sobre eventos ocorridos. Esta documentação explica como configurar e utilizar um webhook.

## Como Funciona

1. Um evento ocorre no sistema emissor.
2. O sistema emissor envia uma requisição HTTP POST para a URL do webhook.
3. O sistema receptor processa os dados recebidos e executa uma ação correspondente.

## Configuração do Webhook

### 1. Criando um Endpoint para Receber o Webhook

O endpoint deve ser capaz de receber requisições HTTP POST com dados no formato JSON. Exemplo em Python (Flask):

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    print("Recebido webhook:", data)
    return jsonify({"message": "Webhook recebido com sucesso!"}), 200

if __name__ == '__main__':
    app.run(port=5000)
```

### 2. Configurando o Webhook no Sistema Emissor

No sistema emissor, registre a URL do webhook (`http://seu-servidor.com/webhook`) e escolha quais eventos deseja monitorar.

### 3. Estrutura da Requisição

A requisição HTTP POST enviada pelo sistema emissor geralmente tem este formato:

```
POST /webhook HTTP/1.1
Host: seu-servidor.com
Content-Type: application/json

{
  "evento": "usuario_registrado",
  "dados": {
    "id": 123,
    "nome": "João Silva",
    "email": "joao@example.com"
  }
}
```

## Tratamento e Segurança

- **Valide os dados recebidos** para evitar ataques.
- **Use autenticação** com um token secreto para garantir que os webhooks sejam de uma fonte confiável.
- **Responda rapidamente** (dentro de 5 segundos) para evitar falhas no webhook.

## Testando o Webhook

Use o `curl` para testar o webhook manualmente:

```sh
curl -X POST http://localhost:5000/webhook \
     -H "Content-Type: application/json" \
     -d '{"evento": "teste", "dados": {"mensagem": "Hello Webhook"}}'
```

## Conclusão

Agora você sabe como configurar e utilizar um webhook para receber notificações automáticas entre sistemas!!!!!!

