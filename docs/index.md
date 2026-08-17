# API de Integração Checkmob

Esta API permite que o seu sistema converse com a Checkmob: **mandar trabalho para o campo** (clientes, ordens de serviço, agendamentos) e **trazer de volta o que foi executado** (registros, respostas de questionário, deslocamento).

!!! tip "Já quer iniciar?"
    Vá direto para a [primeira integração](comecando/primeira-integracao.md) — token e primeira listagem em três comandos.

## Como esta documentação funciona

| Onde | Para quê |
|---|---|
| **Esta documentação** | Entender **como** integrar: fluxos, conceitos e receitas prontas |
| **[Swagger](https://api-integration.checkmob.com/index.html)** | Consultar **o que** existe: cada endpoint, cada campo, e testar direto no navegador |

Os dois se completam. O Swagger responde "quais campos esse endpoint aceita?". Aqui a gente responde "como eu mantenho meu ERP sincronizado com a Checkmob sem baixar tudo de novo toda noite?".

## Versões

A API tem duas versões ativas.

=== "v2 — atual"

    **Use esta em qualquer integração nova.** Contrato em português, respostas padronizadas, filtros mais ricos e sincronização incremental.

    ```
    https://api-integration.checkmob.com/v2
    ```

=== "v1 — legado"

    Mantida apenas para quem já integrou. Não recebe recursos novos e será descontinuada — toda resposta traz os cabeçalhos `Deprecation` e `Sunset` com a data.

    ```
    https://api-integration.checkmob.com/api/v1
    ```

Já usa a v1? A documentação dela continua disponível em [v1 (legado)](legado/v1.md).

## O que muda na v2

Se você conhece a v1, estas são as diferenças que mais afetam o seu código:

- **Contrato em português**, com nomes em `snake_case`: `data_criacao`, `por_pagina`, `atualizado_em`.
- **Toda listagem é `POST /{recurso}/list`** com os filtros no corpo em JSON — sem query string quilométrica. Ver [listagens](conceitos/listagens.md).
- **Paginação por página**, não por deslocamento. Você pede `pagina: 2`, não `numberOfRowsSkipped: 500`. Ver [paginação](conceitos/paginacao.md).
- **Um único formato de erro** para toda a API, com um código estável que o seu código pode tratar sem ler texto. Ver [erros](conceitos/erros.md).
- **Sincronização incremental** em todos os recursos: peça só o que mudou desde a última vez. Ver [sincronização](conceitos/sincronizacao.md).

## Os quatro conceitos que valem por toda a API

Aprenda uma vez e vale para todos os endpoints:

<div class="grid cards" markdown>

- **[Listagens e filtros](conceitos/listagens.md)** — como buscar, filtrar e ordenar
- **[Paginação](conceitos/paginacao.md)** — o envelope de resposta e como percorrer páginas
- **[Sincronização incremental](conceitos/sincronizacao.md)** — trazer só o que mudou
- **[Erros](conceitos/erros.md)** — o formato único e como tratar cada código

</div>

## Precisa de ajuda?

Toda resposta da API traz o cabeçalho `X-Request-Id`. **Ao abrir um chamado, mande esse valor junto** — com ele o suporte localiza exatamente a sua requisição.
