# Recursos disponíveis

Mapa completo da v2. Para o detalhe de cada campo, use o [Swagger](https://api-integration.checkmob.com/index.html) — aqui está o panorama.

Base: `https://api-integration.checkmob.com`

## Autenticação

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/token` | Gera o token de acesso. Único endpoint sem autenticação |

## Clientes

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/clientes/list` | Lista clientes |
| GET | `/v2/clientes/{id}` | Obtém um cliente |
| POST | `/v2/clientes` | Cria um cliente |
| POST | `/v2/clientes/criar-lote` | Cria até 500 de uma vez (207) |
| PUT | `/v2/clientes/{id}` | Substitui (campo ausente preserva) |
| PATCH | `/v2/clientes/{id}` | Altera só os campos enviados |
| DELETE | `/v2/clientes/{id}` | Exclui |
| GET | `/v2/clientes/{id}/endereco` | Endereço principal |
| PUT | `/v2/clientes/{id}/endereco` | Substitui o endereço principal |
| POST | `/v2/clientes/pessoas/vincular` | Vincula contatos ao cliente |
| POST | `/v2/clientes/pessoas/desvincular` | Remove o vínculo |
| POST | `/v2/clientes/{id}/notas/list` | Lista as notas do cliente |
| POST | `/v2/clientes/{id}/notas` | Cria uma nota |
| PUT | `/v2/notas-cliente/{id}` | Altera uma nota |
| DELETE | `/v2/notas-cliente/{id}` | Exclui uma nota |

→ [Guia: sincronizar clientes](../guias/sincronizar-clientes.md)

## Pessoas (contatos)

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/pessoas/list` | Lista pessoas |
| GET | `/v2/pessoas/{id}` | Obtém uma pessoa |
| POST | `/v2/pessoas/post` | Cria uma pessoa |
| PUT | `/v2/pessoas/{id}` | Atualiza (inclui `ativo`) |
| POST | `/v2/pessoas/status` | Ativa/inativa em lote |
| DELETE | `/v2/pessoas/{id}` | Exclui |
| GET | `/v2/pessoas/{id}/endereco` | Endereço da pessoa |
| PUT | `/v2/pessoas/{id}/endereco` | Substitui o endereço |
| POST | `/v2/pessoas/clientes/vincular` | Vincula a clientes |
| POST | `/v2/pessoas/clientes/desvincular` | Remove o vínculo |

## Ordens de serviço

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/ordens-servico/list` | Lista ordens de serviço |
| GET | `/v2/ordens-servico/{id}` | Obtém uma OS |
| POST | `/v2/ordens-servico/post` | Cria uma OS |
| PUT | `/v2/ordens-servico/{id}` | Substitui (campo ausente preserva) |
| PUT | `/v2/ordens-servico/{id}/status` | Altera o status |
| GET | `/v2/ordens-servico/status` | Lista os status disponíveis |
| DELETE | `/v2/ordens-servico/{id}` | Exclui |
| POST | `/v2/ordens-servico/excluir` | Exclui até 500 de uma vez (207) |

→ [Guia: ordens de serviço](../guias/ordens-servico.md)

## Registros (visitas)

O recurso central da integração: uma visita agendada e, depois, a execução dela.

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/registros/post` | **Agenda uma visita** |
| POST | `/v2/registros/list` | Lista visitas agendadas e executadas |
| GET | `/v2/registros/{id}` | Obtém uma visita |
| PUT | `/v2/registros/{id}` | Ajusta check-in/check-out, cliente, objetivo, observação |

→ [Guia: agendar uma visita](../guias/agendar-visita.md) · [Guia: consumir o que foi realizado](../guias/consumir-visita.md)

## Questionários

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/questionarios/list` | Lista questionários |
| GET | `/v2/questionarios/{id}` | Obtém um questionário |
| POST | `/v2/questionarios/{id}/grupos` | Vincula a um grupo |
| DELETE | `/v2/questionarios/{id}/grupos/{idGrupo}` | Remove o vínculo |
| POST | `/v2/questionarios/{id}/segmentos` | Vincula a um segmento |
| DELETE | `/v2/questionarios/{id}/segmentos/{idSegmento}` | Remove o vínculo |

## Respostas de questionário

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/respostas-questionario/list` | Lista questionários respondidos |
| GET | `/v2/respostas-questionario/{idRegistro}` | Respostas de um registro |
| GET | `/v2/respostas-questionario/ordem-servico/{id}` | Respostas de uma OS |

→ [Guia: consumir o que foi realizado](../guias/consumir-visita.md)

## Deslocamentos

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/deslocamentos/usuarios/list` | Resumo consolidado por usuário |
| POST | `/v2/deslocamentos/dias/list` | Dias de um usuário |
| POST | `/v2/deslocamentos/percursos/list` | Percursos de um dia |

→ [Guia: deslocamentos](../guias/deslocamentos.md)

## Usuários

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/usuarios/list` | Lista usuários |
| GET | `/v2/usuarios/{id}` | Obtém um usuário |
| GET | `/v2/usuarios/{id}/localizacao` | Última localização registrada |

## Grupos e segmentos

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/v2/grupos/list` | Lista grupos |
| GET | `/v2/grupos/{id}` | Obtém um grupo |
| POST | `/v2/grupos/post` | Cria um grupo |
| PUT | `/v2/grupos/{id}` | Substitui |
| DELETE | `/v2/grupos/{id}` | Exclui |
| POST | `/v2/segmentos/list` | Lista segmentos |
| GET | `/v2/segmentos/{id}` | Obtém um segmento |
| POST | `/v2/segmentos/post` | Cria um segmento |
| PUT | `/v2/segmentos/{id}` | Substitui |
| DELETE | `/v2/segmentos/{id}` | Exclui |
| GET | `/v2/segmentos/{id}/vinculos` | Usuários e grupos do segmento |
| POST | `/v2/segmentos/{id}/clientes` | Vincula clientes |
| DELETE | `/v2/segmentos/{id}/clientes/{idCliente}` | Remove o vínculo |
| POST | `/v2/segmentos/{id}/grupos` | Vincula grupos |
| DELETE | `/v2/segmentos/{id}/grupos/{idGrupo}` | Remove o vínculo |
| POST | `/v2/segmentos/{id}/usuarios` | Vincula usuários |
| DELETE | `/v2/segmentos/{id}/usuarios/{idUsuario}` | Remove o vínculo |

## Tabelas de apoio

Listas de referência para preencher os campos de classificação. Todas aceitam `busca`, `ordenar` e `atualizado_apos`.

| Método | Caminho | O que traz |
|---|---|---|
| POST | `/v2/categorias/list` | Categorias de cliente |
| POST | `/v2/etapas/list` | Etapas do funil |
| POST | `/v2/temperaturas/list` | Temperaturas |
| POST | `/v2/setores-mercado/list` | Setores de mercado |
| POST | `/v2/tipos-servico/list` | Tipos de serviço |
| POST | `/v2/objetivos/list` | Objetivos de visita |
| POST | `/v2/status-servico/list` | Status de registro |
| POST | `/v2/campos-personalizados/list` | Campos personalizados (filtro `origem`) |
| POST | `/v2/campos-personalizados/clientes/list` | Campos personalizados de cliente |
| POST | `/v2/campos-personalizados/pessoas/list` | Campos personalizados de pessoa |

!!! tip "Carregue as tabelas de apoio uma vez"
    Elas mudam pouco. Carregue no início da integração, guarde em cache e atualize periodicamente com `atualizado_apos` — não vale gastar requisição resolvendo o mesmo id de categoria toda vez.
