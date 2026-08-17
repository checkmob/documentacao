// Gera a Postman Collection v2.1 da API Checkmob v2.
// Escrever JSON na mão em 800 linhas é receita de erro de sintaxe;
// aqui as requisições ficam declarativas e o JSON sai validado.
const fs = require('fs');

const req = (name, method, path, { body, description, query } = {}) => {
  const segs = path.split('/').filter(Boolean);
  const url = { raw: `{{base_url}}/${segs.join('/')}`, host: ['{{base_url}}'], path: segs };
  if (query) {
    url.query = query;
    url.raw += '?' + query.map(q => `${q.key}=${q.value}`).join('&');
  }
  const r = {
    name,
    request: {
      method,
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      url,
      description
    }
  };
  if (body) {
    r.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } }
    };
  }
  return r;
};

const pasta = (name, description, item) => ({ name, description, item });

// --- Token: guarda o token automaticamente nas variáveis da collection ---
const token = {
  name: '1. Gerar token',
  event: [{
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: [
        '// Guarda o token automaticamente: as demais requisições já saem autenticadas.',
        'if (pm.response.code === 200) {',
        '    const r = pm.response.json();',
        '    pm.collectionVariables.set("token_acesso", r.token_acesso);',
        '    pm.collectionVariables.set("token_expira_em", r.expira_em);',
        '    console.log("Token guardado. Expira em: " + r.expira_em);',
        '} else {',
        '    console.log("Falha ao autenticar: " + pm.response.code + " " + pm.response.text());',
        '}'
      ]
    }
  }],
  request: {
    auth: { type: 'noauth' },
    method: 'POST',
    header: [{ key: 'Content-Type', value: 'application/json' }],
    url: { raw: '{{base_url}}/v2/token', host: ['{{base_url}}'], path: ['v2', 'token'] },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ login: '{{login}}', senha: '{{senha}}' }, null, 2),
      options: { raw: { language: 'json' } }
    },
    description: [
      'Gera o token de acesso. **Rode esta requisição primeiro.**',
      '',
      'Preencha `login` e `senha` nas variáveis da collection (aba Variables).',
      '',
      'O script de teste guarda o `token_acesso` automaticamente — as demais',
      'requisições já saem autenticadas, sem você copiar nada.'
    ].join('\n')
  }
};

const collection = {
  info: {
    name: 'Checkmob — API de Integração v2',
    description: [
      '# API de Integração Checkmob — v2',
      '',
      'Collection oficial para explorar e testar a API v2.',
      '',
      '## Como começar',
      '',
      '1. Abra a aba **Variables** da collection e preencha `login` e `senha`.',
      '2. Rode **Comece aqui → 1. Gerar token**.',
      '3. Pronto: o token é guardado sozinho e todas as outras requisições já usam ele.',
      '',
      '## Sobre os ids dos exemplos',
      '',
      'Os corpos vêm preenchidos com ids de exemplo (`1024`, `1201`...). Troque pelos',
      'ids da sua base — use as requisições de listagem para descobrir os seus.',
      '',
      '## Documentação',
      '',
      'Guias e conceitos: https://checkmob.github.io/documentacao/'
    ].join('\n'),
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token_acesso}}', type: 'string' }] },
  variable: [
    { key: 'base_url', value: 'https://api-integration.checkmob.com', type: 'string' },
    { key: 'login', value: '', type: 'string' },
    { key: 'senha', value: '', type: 'string' },
    { key: 'token_acesso', value: '', type: 'string' },
    { key: 'token_expira_em', value: '', type: 'string' },
    { key: 'id_cliente', value: '1024', type: 'string' },
    { key: 'id_usuario', value: '1201', type: 'string' },
    { key: 'id_registro', value: '77120', type: 'string' },
    { key: 'id_ordem_servico', value: '8801', type: 'string' }
  ],
  item: [

    pasta('Comece aqui', 'Autenticação e a primeira listagem.', [
      token,
      req('2. Listar clientes (primeira chamada)', 'POST', '/v2/clientes/list', {
        body: { pagina: 1, por_pagina: 25, ativo: true },
        description: 'Confirma que o token funcionou. Repare no envelope `{ dados, paginacao }`.'
      })
    ]),

    pasta('Visitas (registros)', 'O fluxo principal: agendar uma visita e depois consumir o que foi realizado.', [
      req('Agendar visita', 'POST', '/v2/registros/post', {
        body: {
          id_cliente: 1024,
          id_usuario: 1201,
          data_inicio_esperada: '2026-09-05T13:00:00Z',
          data_conclusao_esperada: '2026-09-05T17:00:00Z',
          ativo: true,
          id_objetivo: 3,
          instrucoes: 'Conferir pressão da bomba antes de iniciar'
        },
        description: 'Cria a visita agendada. `ativo: true` envia para o aplicativo do usuário.\n\nObrigatórios: `id_cliente`, `data_inicio_esperada`, `data_conclusao_esperada`.'
      }),
      req('Listar visitas — agenda da semana', 'POST', '/v2/registros/list', {
        body: {
          agendado: true,
          concluido: false,
          data_agendada_apos: '2026-09-01T00:00:00Z',
          data_agendada_antes: '2026-09-07T23:59:59Z',
          ordenar: 'data_agendada'
        },
        description: 'O que está marcado e ainda não foi executado.'
      }),
      req('Listar visitas — o que foi executado hoje', 'POST', '/v2/registros/list', {
        body: {
          concluido: true,
          data_realizacao_apos: '2026-08-17T00:00:00Z',
          data_realizacao_antes: '2026-08-17T23:59:59Z',
          por_pagina: 100
        },
        description: '`data_inicio` é o check-in, `data_realizacao` é o check-out.'
      }),
      req('Listar visitas — sync incremental', 'POST', '/v2/registros/list', {
        body: { atualizado_apos: '2026-08-16T03:00:00Z', ordenar: 'atualizado_em', por_pagina: 100 },
        description: 'Traz só o que mudou desde o instante informado. Guarde o maior `atualizado_em` recebido como próximo cursor.'
      }),
      req('Obter visita', 'GET', '/v2/registros/{{id_registro}}'),
      req('Ajustar apontamento', 'PUT', '/v2/registros/{{id_registro}}', {
        body: { data_realizacao: '2026-09-05T15:10:00Z', observacao: 'Horário ajustado conforme apontamento do técnico' },
        description: 'Campo ausente preserva o valor atual.'
      }),
      req('Respostas do questionário da visita', 'GET', '/v2/respostas-questionario/{{id_registro}}', {
        description: 'O que foi preenchido no checklist durante a visita.\n\n`404` significa que não houve questionário — não é erro de integração.'
      }),
      req('Respostas por ordem de serviço', 'GET', '/v2/respostas-questionario/ordem-servico/{{id_ordem_servico}}'),
      req('Listar questionários respondidos', 'POST', '/v2/respostas-questionario/list', {
        body: { atualizado_apos: '2026-09-01T00:00:00Z', por_pagina: 100 },
        description: 'Aceita apenas paginação e `atualizado_apos`.'
      })
    ]),

    pasta('Clientes', 'Cadastro e sincronização da base de clientes.', [
      req('Listar', 'POST', '/v2/clientes/list', {
        body: { pagina: 1, por_pagina: 50, ativo: true, busca: '' },
        description: '`busca` cobre nome, código e documento.'
      }),
      req('Listar — sync incremental', 'POST', '/v2/clientes/list', {
        body: { atualizado_apos: '2026-08-16T03:00:00Z', ordenar: 'atualizado_em', por_pagina: 100 }
      }),
      req('Buscar pelo código do seu ERP', 'POST', '/v2/clientes/list', {
        body: { codigos: ['ERP-4471'] },
        description: 'Evita manter tabela de-para do seu lado.'
      }),
      req('Listar — por classificação', 'POST', '/v2/clientes/list', {
        body: { ids_segmento: [4], ids_categoria: [2], data_criacao_apos: '2026-01-01T00:00:00Z' }
      }),
      req('Obter', 'GET', '/v2/clientes/{{id_cliente}}'),
      req('Criar', 'POST', '/v2/clientes', {
        body: { tipo: 'J', nome: 'Padaria do Bairro LTDA', documento: '12345678000190', ativo: true },
        description: '`tipo`: F = física, J = jurídica, N = estrangeiro.'
      }),
      req('Criar em lote (207)', 'POST', '/v2/clientes/criar-lote', {
        body: {
          clientes: [
            { tipo: 'J', nome: 'Padaria do Bairro LTDA', documento: '12345678000190' },
            { tipo: 'F', nome: 'Maria Souza', documento: '12345678901' }
          ]
        },
        description: 'Máximo 500 por requisição. Resposta 207 com o resultado item a item — percorra `resultados`.'
      }),
      req('Atualizar parcialmente (PATCH)', 'PATCH', '/v2/clientes/{{id_cliente}}', { body: { ativo: false } }),
      req('Substituir (PUT)', 'PUT', '/v2/clientes/{{id_cliente}}', {
        body: { tipo: 'J', nome: 'Padaria do Bairro LTDA', documento: '12345678000190', ativo: true },
        description: 'Campo ausente preserva o valor atual.'
      }),
      req('Excluir', 'DELETE', '/v2/clientes/{{id_cliente}}'),
      req('Endereço — obter', 'GET', '/v2/clientes/{{id_cliente}}/endereco'),
      req('Endereço — substituir', 'PUT', '/v2/clientes/{{id_cliente}}/endereco', {
        body: { logradouro: 'Rua das Flores', numero: '150', bairro: 'Centro', cidade: 'São Paulo', estado: 'São Paulo', cep: '01001000' }
      }),
      req('Vincular contatos', 'POST', '/v2/clientes/pessoas/vincular', {
        body: { id_cliente: 1024, ids_pessoas: [88, 91] }
      }),
      req('Desvincular contatos', 'POST', '/v2/clientes/pessoas/desvincular', {
        body: { id_cliente: 1024, ids_pessoas: [88] }
      }),
      req('Notas — listar', 'POST', '/v2/clientes/{{id_cliente}}/notas/list', { body: { por_pagina: 25 } }),
      req('Notas — criar', 'POST', '/v2/clientes/{{id_cliente}}/notas', { body: { nota: 'Cliente pediu retorno na próxima semana' } })
    ]),

    pasta('Pessoas (contatos)', 'Contatos dentro dos clientes.', [
      req('Listar', 'POST', '/v2/pessoas/list', { body: { pagina: 1, por_pagina: 50, ativo: true } }),
      req('Listar — de um cliente', 'POST', '/v2/pessoas/list', { body: { ids_clientes: [1024] } }),
      req('Obter', 'GET', '/v2/pessoas/88'),
      req('Criar', 'POST', '/v2/pessoas/post', {
        body: { nome: 'Maria Souza', email: 'maria@padaria.com.br', celular: '11999998888', ids_clientes: [1024] }
      }),
      req('Atualizar', 'PUT', '/v2/pessoas/88', { body: { celular: '11999997777', ativo: true } }),
      req('Ativar/inativar em lote', 'POST', '/v2/pessoas/status', { body: { ids_pessoas: [88, 91], ativo: false } }),
      req('Vincular a clientes', 'POST', '/v2/pessoas/clientes/vincular', { body: { id_pessoa: 88, ids_clientes: [1024] } }),
      req('Endereço — obter', 'GET', '/v2/pessoas/88/endereco')
    ]),

    pasta('Ordens de serviço', 'Para quando o trabalho envolve mais de um usuário ou mais de uma visita.', [
      req('Listar — janela de agendamento', 'POST', '/v2/ordens-servico/list', {
        body: {
          data_agendada_apos: '2026-09-01T00:00:00Z',
          data_agendada_antes: '2026-09-07T23:59:59Z',
          concluida: false,
          ordenar: 'data_agendada'
        }
      }),
      req('Listar — por equipe', 'POST', '/v2/ordens-servico/list', { body: { ids_usuario: [1201, 1202], concluida: false } }),
      req('Obter', 'GET', '/v2/ordens-servico/{{id_ordem_servico}}'),
      req('Criar', 'POST', '/v2/ordens-servico/post', {
        body: {
          nome: 'Manutenção preventiva',
          id_cliente: 1024,
          id_tipo_servico: 7,
          inicio_agendado: '2026-09-02T13:00:00Z',
          data_agendada: '2026-09-02T17:00:00Z',
          comentario: 'Levar filtro de reposição',
          prioridade: 2,
          ids_usuarios: [1201, 1202]
        },
        description: 'Obrigatórios: `nome` e `id_cliente`.'
      }),
      req('Substituir', 'PUT', '/v2/ordens-servico/{{id_ordem_servico}}', {
        body: { id_cliente: 1024, data_agendada: '2026-09-03T17:00:00Z' },
        description: 'Campo ausente preserva o valor atual — inclusive `ids_usuarios`.'
      }),
      req('Listar status disponíveis', 'GET', '/v2/ordens-servico/status'),
      req('Alterar status', 'PUT', '/v2/ordens-servico/{{id_ordem_servico}}/status', { body: { id_status: 7 } }),
      req('Visitas desta OS', 'POST', '/v2/registros/list', { body: { id_ordem_servico: 8801 } }),
      req('Excluir em lote (207)', 'POST', '/v2/ordens-servico/excluir', {
        body: { ids: [8801, 8802] },
        description: 'Máximo 500 por requisição.'
      })
    ]),

    pasta('Deslocamentos', 'KM rodado e custo: do resumo ao percurso.', [
      req('1. Resumo por usuário', 'POST', '/v2/deslocamentos/usuarios/list', {
        body: { data_inicio: '2026-08-01T00:00:00Z', data_fim: '2026-08-31T23:59:59Z' },
        description: 'Filtros `aprovacao` e `pagamento` aceitam lista.\n\naprovacao: 0 aprovado · 1 desconsiderado · 2 em verificação · 3 não avaliado · 4 rejeitado\n\npagamento: 0 em aberto · 2 aguardando avaliação · 3 pago'
      }),
      req('2. Dias de um usuário', 'POST', '/v2/deslocamentos/dias/list', {
        body: { id_usuario: 1201, data_inicio: '2026-08-01T00:00:00Z', data_fim: '2026-08-31T23:59:59Z' },
        description: 'Guarde o `id_dia` de cada item para abrir os percursos.'
      }),
      req('3. Percursos de um dia', 'POST', '/v2/deslocamentos/percursos/list', {
        body: { id_usuario: 1201, id_dia: 55012 }
      }),
      req('Apenas aprovado e não pago', 'POST', '/v2/deslocamentos/usuarios/list', {
        body: { data_inicio: '2026-08-01T00:00:00Z', data_fim: '2026-08-31T23:59:59Z', aprovacao: [0], pagamento: [0] }
      })
    ]),

    pasta('Usuários, grupos e segmentos', 'Quem executa e como está organizado.', [
      req('Usuários — listar', 'POST', '/v2/usuarios/list', { body: { ativo: true, por_pagina: 100 } }),
      req('Usuários — de um grupo', 'POST', '/v2/usuarios/list', { body: { ids_grupo: [12] } }),
      req('Usuário — obter', 'GET', '/v2/usuarios/{{id_usuario}}'),
      req('Usuário — localização', 'GET', '/v2/usuarios/{{id_usuario}}/localizacao'),
      req('Grupos — listar', 'POST', '/v2/grupos/list', { body: { por_pagina: 100 } }),
      req('Grupos — criar', 'POST', '/v2/grupos/post', { body: { nome: 'Equipe Sul', ids_usuarios: [1201, 1202] } }),
      req('Segmentos — listar', 'POST', '/v2/segmentos/list', { body: { ativo: true } }),
      req('Segmentos — vínculos', 'GET', '/v2/segmentos/4/vinculos')
    ]),

    pasta('Questionários', 'Os checklists preenchidos em campo.', [
      req('Listar', 'POST', '/v2/questionarios/list', { body: { ativo: true, por_pagina: 100 } }),
      req('Listar — vigentes hoje', 'POST', '/v2/questionarios/list', { body: { ativo: true, vigente_em: '2026-08-17T00:00:00Z' } }),
      req('Obter', 'GET', '/v2/questionarios/31'),
      req('Vincular a grupo', 'POST', '/v2/questionarios/31/grupos', { body: { id_grupo: 12 } }),
      req('Vincular a segmento', 'POST', '/v2/questionarios/31/segmentos', { body: { id_segmento: 4 } })
    ]),

    pasta('Tabelas de apoio', 'Listas de referência para preencher os campos de classificação. Carregue uma vez e guarde em cache.', [
      req('Objetivos', 'POST', '/v2/objetivos/list', { body: { por_pagina: 100 } }),
      req('Tipos de serviço', 'POST', '/v2/tipos-servico/list', { body: { por_pagina: 100 } }),
      req('Categorias', 'POST', '/v2/categorias/list', { body: { por_pagina: 100 } }),
      req('Etapas', 'POST', '/v2/etapas/list', { body: { por_pagina: 100 } }),
      req('Temperaturas', 'POST', '/v2/temperaturas/list', { body: { por_pagina: 100 } }),
      req('Setores de mercado', 'POST', '/v2/setores-mercado/list', { body: { por_pagina: 100 } }),
      req('Status de registro', 'POST', '/v2/status-servico/list', { body: { por_pagina: 100 } }),
      req('Campos personalizados — clientes', 'POST', '/v2/campos-personalizados/clientes/list', { body: { por_pagina: 100 } }),
      req('Campos personalizados — pessoas', 'POST', '/v2/campos-personalizados/pessoas/list', { body: { por_pagina: 100 } })
    ])
  ]
};

const destino = process.argv[2];
fs.writeFileSync(destino, JSON.stringify(collection, null, 2) + '\n', 'utf8');

const total = collection.item.reduce((n, f) => n + f.item.length, 0);
console.log(`ok: ${collection.item.length} pastas, ${total} requisições -> ${destino}`);
