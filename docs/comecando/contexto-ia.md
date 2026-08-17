# Contexto para IA

Um arquivo único com **toda** a documentação da API — contrato, convenções, fluxos e endpoints — para você entregar ao assistente de IA que já usa no dia a dia.

[:material-download: Baixar o arquivo](../assets/checkmob-api-v2-contexto-ia.md){ .md-button .md-button--primary download="checkmob-api-v2-contexto-ia.md" }

Cerca de 2.100 linhas, ~15 mil tokens. Cabe folgado na janela de contexto de qualquer modelo atual.

## Para que serve

Se você já pede ajuda ao ChatGPT, Claude, Copilot ou Gemini para escrever código, sabe o problema: sem conhecer a nossa API, o modelo **inventa**. Cria campo que não existe, monta paginação do jeito errado, chuta nome de endpoint. Aí você perde tempo depurando código que nunca teve chance de funcionar.

Este arquivo resolve isso. Com ele anexado, o modelo trabalha com o contrato real.

## Como usar

=== "ChatGPT / Claude / Gemini"

    Anexe o arquivo à conversa e faça a sua pergunta. Em projetos longos, vale deixá-lo fixado — no Claude, em *Project knowledge*; no ChatGPT, nos arquivos do projeto.

=== "Cursor / Copilot / Windsurf"

    Coloque o arquivo na raiz do seu repositório de integração. Assim ele entra no contexto automaticamente quando você pedir código relacionado.

=== "API / agente próprio"

    Inclua o conteúdo no *system prompt* ou no seu RAG. O arquivo já começa com as regras que o modelo deve seguir.

## Perguntas que ele responde bem

- "Escreva um script em Python que sincroniza meus clientes com a Checkmob."
- "Como eu agendo uma visita para amanhã e leio o resultado depois?"
- "Recebi `400 VALIDACAO_CAMPOS` neste corpo. O que está errado?"
- "Monte a chamada para listar as ordens de serviço da próxima semana."
- "Qual a diferença entre registro e ordem de serviço no meu caso?"

## O que tem dentro

O arquivo abre com dez regras que o modelo deve respeitar — não inventar campos, datas sempre em UTC, listagem é `POST /list`, erro se trata pelo `codigo`, `PUT` preserva campo ausente, o fluxo principal é o registro e não a ordem de serviço. Depois vem a documentação inteira: primeiros passos, autenticação, conceitos, os cinco guias e a referência completa.

É gerado a partir das mesmas páginas que você lê aqui no site, então **não sai de sincronia** com a documentação.

## Continue conferindo

!!! warning "IA erra, mesmo com contexto bom"
    O arquivo reduz muito a invenção, mas não elimina. Antes de subir para produção, confira o código gerado contra o [Swagger](https://api-integration.checkmob.com/index.html) — principalmente nomes de campo e valores aceitos.

    Uma boa forma de validar rápido é rodar a chamada pela [collection do Postman](postman.md) e comparar a resposta.
