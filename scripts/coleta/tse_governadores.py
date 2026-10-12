#!/usr/bin/env python3
"""Governadores e vices eleitos em 2014, 2018 e 2022, com partido, a partir do TSE.

Fonte: TSE, Portal de Dados Abertos, consulta_cand_{ano}.zip
(https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/).
Saída: data/aux/coleta/tse_governadores/governadores_eleitos.csv
"""
import sys, csv, io, zipfile, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _rede import baixar
OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "coleta" / "tse_governadores"
OUT.mkdir(parents=True, exist_ok=True)
csv.field_size_limit(10**9)
saida = []
for ano in [int(a) for a in sys.argv[1:]] or [2014, 2018, 2022]:
    z = f"/tmp/cand_{ano}.zip"
    baixar(f"https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_{ano}.zip", z)
    with zipfile.ZipFile(z) as zf:
        nomes = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        brasil = [n for n in nomes if "BRASIL" in n.upper()]
        alvo = brasil or [n for n in nomes if "_BR" not in n.upper()]
        print(ano, alvo[:3], len(alvo), flush=True)
        for n in alvo:
            txt = zf.read(n).decode("latin-1")
            for r in csv.DictReader(io.StringIO(txt), delimiter=";"):
                cargo = r.get("DS_CARGO", "").upper()
                if cargo not in ("GOVERNADOR", "VICE-GOVERNADOR"): continue
                saida.append({"ano": ano, "uf": r.get("SG_UF"), "cargo": cargo, "turno": r.get("NR_TURNO"),
                              "numero": r.get("NR_CANDIDATO"), "nome": r.get("NM_CANDIDATO"), "nome_urna": r.get("NM_URNA_CANDIDATO"),
                              "partido": r.get("SG_PARTIDO"), "situacao_turno": r.get("DS_SIT_TOT_TURNO"),
                              "situacao_candidatura": r.get("DS_SITUACAO_CANDIDATURA") or r.get("DS_DETALHE_SITUACAO_CAND"),
                              "sq_candidato": r.get("SQ_CANDIDATO"), "coligacao": r.get("NM_COLIGACAO") or r.get("DS_COMPOSICAO_COLIGACAO")})
with open(OUT / "candidatos_governador.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(saida[0].keys()), delimiter=";"); w.writeheader(); w.writerows(saida)
print(len(saida), "fim")
