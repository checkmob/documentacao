"""Hooks do MkDocs.

O arquivo de contexto para IA (`docs/assets/*-contexto-ia.md`) precisa ser
baixável como Markdown cru. Como o MkDocs converte todo `.md` em página HTML,
ele é excluído da renderização por `exclude_docs` no mkdocs.yml — e copiado
verbatim para o site aqui, depois do build.

Sem isso, a URL do download viraria uma página e o link quebraria.
"""

import shutil
from pathlib import Path

ARQUIVOS_CRUS = ["assets/checkmob-api-v2-contexto-ia.md"]


def on_post_build(config, **kwargs):
    origem_base = Path(config["docs_dir"])
    destino_base = Path(config["site_dir"])

    for relativo in ARQUIVOS_CRUS:
        origem = origem_base / relativo
        if not origem.exists():
            print(f"AVISO: {relativo} não encontrado em docs/ — download vai quebrar.")
            continue

        destino = destino_base / relativo
        destino.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(origem, destino)
