# Documentação da API Checkmob

Site em [MkDocs](https://www.mkdocs.org/) com o tema [Material](https://squidfunk.github.io/mkdocs-material/), publicado via GitHub Pages.

- **Conteúdo:** `docs/` (Markdown)
- **Menu e tema:** `mkdocs.yml`
- **Publicação:** branch `gh-pages`, gerada automaticamente pelo `mkdocs gh-deploy`

## Preparar a máquina (uma vez só)

Precisa de **Python 3.8+**. Confira se já tem:

```bash
python --version
```

> Se aparecer "Python was not found" no Windows, instale em [python.org/downloads](https://www.python.org/downloads/) e marque **"Add Python to PATH"** durante a instalação. Não use a versão da Microsoft Store — ela costuma dar problema com o PATH.

Com o Python no lugar, instale as dependências:

```bash
python -m pip install -r requirements.txt
```

> **Por que `python -m`?** Os comandos abaixo usam `python -m mkdocs` em vez de só `mkdocs`. No Windows, o instalador coloca os executáveis numa pasta `Scripts` que normalmente **não** entra no PATH — então `mkdocs` sozinho costuma dar "comando não encontrado". Com `python -m` funciona sempre. Se você adicionar a pasta `Scripts` ao PATH, pode usar `mkdocs` direto.

## Escrever e visualizar

```bash
python -m mkdocs serve
```

Abra <http://127.0.0.1:8000>. A página recarrega sozinha a cada vez que você salva um arquivo — dá para escrever com o navegador aberto do lado.

Para checar se algum link interno quebrou antes de publicar:

```bash
python -m mkdocs build --strict
```

O `--strict` transforma aviso em erro. Se passar aqui, publica sem susto.

## Publicar

```bash
python -m mkdocs gh-deploy
```

Um comando só. Ele constrói o site, envia para a branch `gh-pages` e o GitHub Pages atualiza em um ou dois minutos.

> **Não edite a branch `gh-pages` na mão.** Ela é gerada — qualquer alteração direta é perdida no próximo deploy.

## Adicionar uma página

1. Crie o `.md` dentro de `docs/`, na pasta da seção.
2. Registre em `nav:` no `mkdocs.yml` — sem isso a página existe mas não aparece no menu.
3. `python -m mkdocs serve` para conferir.
4. `python -m mkdocs gh-deploy` para publicar.

## Estrutura

```
docs/
├── index.md                  Página inicial
├── comecando/                Primeiros passos e autenticação
├── conceitos/                O que vale para toda a API
├── guias/                    Receitas por caso de uso
├── referencia/               Endpoints, códigos de erro, glossário
├── migracao/                 De-para v1 → v2
└── legado/                   Documentação da v1
```

## Recursos do tema usados

O `mkdocs.yml` já habilita: blocos de destaque (`!!! tip`), blocos recolhíveis (`??? question`), abas de conteúdo (`=== "Aba"`), botão de copiar código, modo escuro e busca em português. Os exemplos de uso estão espalhados pelas páginas existentes — vale copiar de lá.
