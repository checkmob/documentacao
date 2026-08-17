# Collection do Postman

Uma collection pronta com **70 requisições** organizadas por fluxo, para você explorar a API sem escrever uma linha de código.

[:material-download: Baixar a collection](../assets/checkmob-api-v2.postman_collection.json){ .md-button .md-button--primary download="checkmob-api-v2.postman_collection.json" }

## Importar

1. Abra o Postman e clique em **Import**, no canto superior esquerdo.
2. Arraste o arquivo baixado, ou selecione-o pelo botão.
3. A collection **Checkmob — API de Integração v2** aparece na barra lateral.

## Configurar (uma vez só)

1. Clique com o botão direito na collection → **Edit** → aba **Variables**.
2. Preencha `login` e `senha` na coluna **Current value**.
3. Salve.

| Variável | Para que serve |
|---|---|
| `base_url` | Endereço da API. Já vem preenchido |
| `login` · `senha` | Suas credenciais |
| `token_acesso` | **Preenchido automaticamente.** Não mexa |
| `id_cliente`, `id_usuario`, `id_registro`, `id_ordem_servico` | Ids de exemplo usados nas URLs. Troque pelos da sua base |

!!! warning "Use a coluna *Current value*"
    O que você digita em **Initial value** vai junto se a collection for exportada ou compartilhada. **Current value** fica só na sua máquina. Credenciais sempre em *Current value*.

## Usar

Rode **Comece aqui → 1. Gerar token**.

Um script guarda o token automaticamente, e todas as outras requisições já saem autenticadas — você não precisa copiar e colar nada. Se quiser conferir, o console do Postman (`Ctrl+Alt+C`) mostra:

```
Token guardado. Expira em: 2026-08-18T22:20:06Z
```

Depois disso é só navegar pelas pastas e disparar o que quiser.

!!! tip "Token expirado?"
    Se começar a receber `401 NAO_AUTENTICADO`, rode **1. Gerar token** de novo. O token tem validade — ver [autenticação](autenticacao.md).

## O que tem dentro

| Pasta | O que cobre |
|---|---|
| **Comece aqui** | Token e a primeira listagem |
| **Visitas (registros)** | Agendar, consultar a agenda, ler o que foi executado e o questionário respondido |
| **Clientes** | Cadastro, lote, endereço, contatos e notas |
| **Pessoas (contatos)** | Cadastro e vínculo com clientes |
| **Ordens de serviço** | Criação, status e as visitas ligadas a elas |
| **Deslocamentos** | Resumo por usuário, dias e percursos |
| **Usuários, grupos e segmentos** | Quem executa e como está organizado |
| **Questionários** | Checklists e seus vínculos |
| **Tabelas de apoio** | Objetivos, tipos de serviço, categorias, etapas e campos personalizados |

Várias pastas trazem a mesma rota com filtros diferentes — por exemplo, listar clientes por busca, por código do ERP e por sincronização incremental. A ideia é que você veja o filtro montado em vez de partir de um corpo vazio.

## Os ids dos exemplos

Os corpos vêm com ids fictícios (`1024`, `1201`, `8801`). Eles **não existem na sua base** — troque pelos seus.

Para descobrir os ids reais, rode primeiro as listagens:

| Preciso do id de | Rode |
|---|---|
| Cliente | **Clientes → Listar** |
| Usuário | **Usuários → Usuários — listar** |
| Objetivo | **Tabelas de apoio → Objetivos** |
| Tipo de serviço | **Tabelas de apoio → Tipos de serviço** |

Os ids que você mais usa valem uma passada nas variáveis da collection — assim as URLs se ajustam sozinhas.

## Cuidados

!!! danger "A collection aponta para a sua base real"
    Não existe ambiente de teste separado. As requisições de `POST`, `PUT` e `DELETE` **alteram dados de verdade**.

    Enquanto estiver explorando, prefira as de listagem. E antes de disparar uma exclusão, confira o id.

O [limite de requisições](../conceitos/limites.md) também vale aqui: 30 a cada 30 segundos. Usar o **Run collection** em tudo de uma vez provavelmente vai esbarrar em `429`.

## Preferindo o Swagger?

O [Swagger](https://api-integration.checkmob.com/index.html) também permite testar direto no navegador, sem instalar nada, e lista todos os campos de cada endpoint. A collection ganha quando você quer os fluxos já montados e o token resolvido sozinho.
