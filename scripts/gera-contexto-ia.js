// Gera um único .md com toda a documentação, para o cliente jogar na IA dele.
// Fonte é a própria documentação, então não nasce desatualizado — basta rodar de novo.
const fs = require('fs');
const path = require('path');

const RAIZ = process.argv[2];
const DESTINO = process.argv[3];

// Ordem de leitura = ordem do nav. Conceitos antes de guias: a IA precisa das
// regras gerais antes dos fluxos, senão responde receita sem entender o contrato.
const PAGINAS = [
  ['index.md', null],
  ['comecando/primeira-integracao.md', 'Primeira integração'],
  ['comecando/autenticacao.md', 'Autenticação'],
  ['conceitos/listagens.md', 'Listagens e filtros'],
  ['conceitos/paginacao.md', 'Paginação'],
  ['conceitos/sincronizacao.md', 'Sincronização incremental'],
  ['conceitos/erros.md', 'Erros'],
  ['conceitos/limites.md', 'Limites e cabeçalhos'],
  ['guias/agendar-visita.md', 'Guia: agendar uma visita'],
  ['guias/consumir-visita.md', 'Guia: consumir o que foi realizado'],
  ['guias/sincronizar-clientes.md', 'Guia: sincronizar clientes'],
  ['guias/deslocamentos.md', 'Guia: deslocamentos'],
  ['guias/ordens-servico.md', 'Guia: ordens de serviço'],
  ['referencia/recursos.md', 'Referência: recursos disponíveis'],
  ['referencia/codigos-erro.md', 'Referência: códigos de erro'],
  ['referencia/glossario.md', 'Referência: glossário']
];

// A sintaxe do MkDocs Material vira ruído para um modelo. Converte para
// markdown puro preservando o conteúdo.
// Limpezas que valem para qualquer linha de texto, dentro ou fora de admonition.
function limparInline(l) {
  return l
    .replace(/\{\s*\.md-button[^}]*\}/g, '')
    .replace(/:material-[a-z-]+:/g, '')
    // Links internos entre páginas: vira só o texto (aqui é tudo um arquivo só)
    .replace(/\[([^\]]+)\]\((?!https?:)[^)]*\.md[^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\((?!https?:)[^)]*\/assets\/[^)]*\)/g, '$1');
}

// Admonitions e abas do Material viram markdown puro. O corpo indentado é
// desindentado em vez de virar citação: bloco de código dentro de `>` fica
// ilegível e ainda quebra a contagem de cercas mais adiante.
function limpar(md) {
  const linhas = md.split('\n');
  const saida = [];
  let indentDeBloco = null; // indentação do admonition/aba aberto
  let emCodigo = false;

  const fecharBloco = () => { indentDeBloco = null; };

  for (const bruta of linhas) {
    let l = bruta;

    // Dentro de um bloco indentado: desindenta e segue como conteúdo normal.
    if (indentDeBloco !== null) {
      const prefixo = ' '.repeat(indentDeBloco + 4);
      if (l.trim() === '') { saida.push(''); continue; }
      if (l.startsWith(prefixo)) l = l.slice(prefixo.length);
      else fecharBloco();
    }

    if (/^\s*```/.test(l)) {
      emCodigo = !emCodigo;
      saida.push(l);
      continue;
    }

    if (emCodigo) { saida.push(l); continue; }

    // !!! tip "Título"  /  ??? question "Título"
    const adm = l.match(/^(\s*)(?:!!!|\?\?\?\+?)\s+\S+(?:\s+"([^"]*)")?\s*$/);
    if (adm) {
      indentDeBloco = (adm[1] || '').length;
      saida.push('');
      if (adm[2]) saida.push(`**${adm[2]}**`);
      saida.push('');
      continue;
    }

    // === "Aba"
    const aba = l.match(/^(\s*)===\s+"([^"]*)"\s*$/);
    if (aba) {
      indentDeBloco = (aba[1] || '').length;
      saida.push('');
      saida.push(`**${aba[2]}**`);
      saida.push('');
      continue;
    }

    // Grids do Material
    if (/^<div class="grid cards" markdown>\s*$/.test(l)) continue;
    if (/^<\/div>\s*$/.test(l)) continue;

    saida.push(limparInline(l));
  }

  return saida.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const cabecalho = `# API de Integração Checkmob — v2

> **Este arquivo é um contexto único e completo da API v2 da Checkmob.**
>
> Ele foi feito para ser entregue a um assistente de IA (ChatGPT, Claude, Copilot,
> Gemini ou o modelo que você usar) junto com a sua pergunta. Contém o contrato,
> as convenções, os fluxos e todos os endpoints — o suficiente para o modelo
> escrever código de integração correto sem inventar campo.
>
> Documentação navegável: https://checkmob.github.io/documentacao/
> Swagger (testar no navegador): https://api-integration.checkmob.com/index.html
> Collection do Postman: https://checkmob.github.io/documentacao/assets/checkmob-api-v2.postman_collection.json

## Como usar este arquivo

Anexe-o à conversa e pergunte o que precisa. Exemplos de pergunta que ele
responde bem:

- "Escreva um script em Python que sincroniza meus clientes com a Checkmob."
- "Como eu agendo uma visita para amanhã e leio o resultado depois?"
- "Meu código recebeu 400 VALIDACAO_CAMPOS. O que está errado neste corpo?"
- "Monte a chamada para listar as ordens de serviço da próxima semana."

## Regras que o modelo deve respeitar

Se você é um modelo lendo este arquivo, siga estritamente:

1. **Não invente campos, endpoints nem valores.** Use apenas o que está aqui.
   Se algo não estiver documentado, diga que não está em vez de supor.
2. **Toda data é UTC em ISO 8601** (\`2026-08-17T14:30:00Z\`), no envio e no retorno.
3. **Listagem é \`POST /{recurso}/list\`** com filtros no corpo JSON — nunca query string.
4. **Paginação é por página** (\`pagina\`, \`por_pagina\`), nunca por deslocamento.
   Máximo de 100 por página.
5. **Trate erro pelo campo \`codigo\`**, nunca pelo texto de \`titulo\` ou \`detalhe\`,
   que mudam de idioma.
6. **Campo desconhecido no corpo devolve 400.** Não acrescente campos "por garantia".
7. **Em \`PUT\`, campo ausente preserva o valor atual** — não zera.
8. **O fluxo principal é o registro (visita)**, não a ordem de serviço.
   Ordem de serviço só quando há mais de um usuário em campo ou mais de uma visita.
9. **Sempre que a integração for recorrente**, use \`atualizado_apos\` em vez de
   varrer tudo de novo.
10. **Respeite o limite** de 30 requisições por 30 segundos e o teto de 500 itens
    por operação em lote.

---
`;

const partes = [cabecalho];

for (const [arquivo, titulo] of PAGINAS) {
  const caminho = path.join(RAIZ, arquivo);
  if (!fs.existsSync(caminho)) { console.error('AVISO: não encontrado ->', arquivo); continue; }

  let conteudo = limpar(fs.readFileSync(caminho, 'utf8'));

  // Rebaixa os títulos da página em um nível e impõe o título da seção,
  // para o arquivo final ter uma hierarquia única e coerente.
  // Só fora de bloco de código, senão comentários `#` de shell viram título.
  let emCodigo = false;
  conteudo = conteudo.split('\n').map(l => {
    if (/^\s*```/.test(l)) { emCodigo = !emCodigo; return l; }
    if (emCodigo) return l;
    return l.replace(/^(#{1,5}) /, (_, h) => '#'.repeat(h.length + 1) + ' ');
  }).join('\n');

  // Remove o título original da página (que virou ##), pois o nosso o substitui.
  conteudo = conteudo.replace(/^## .*\n/, '').trim();

  partes.push(`## ${titulo || 'Visão geral'}\n\n${conteudo}`);
}

const texto = partes.join('\n\n---\n\n') + '\n';
fs.writeFileSync(DESTINO, texto, 'utf8');

const palavras = texto.split(/\s+/).length;
console.log(`ok -> ${DESTINO}`);
console.log(`   ${PAGINAS.length} páginas | ${texto.split('\n').length} linhas | ~${palavras} palavras | ~${Math.round(palavras * 1.5 / 1000)}k tokens estimados`);
