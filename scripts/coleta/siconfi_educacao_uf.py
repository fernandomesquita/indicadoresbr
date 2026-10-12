#!/usr/bin/env python3
"""Despesa liquidada dos governos estaduais por função e subfunção (Siconfi, RREO Anexo 2), 2017 a 2025.

Serve para conferir os totais de educação declarados pelos estados no SIOPE (FNDE).
Fonte: Tesouro Nacional, Siconfi, API de dados abertos
https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo (6º bimestre, RREO-Anexo 02, esfera E).
Saída: data/aux/coleta/siconfi_educacao_uf/rreo02_estados.csv
"""
import sys, json, csv, pathlib, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _rede import baixar
OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "coleta" / "siconfi_educacao_uf"
OUT.mkdir(parents=True, exist_ok=True)
UF = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO", 21: "MA", 22: "PI", 23: "CE", 24: "RN",
      25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC",
      43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF"}
anos = [int(a) for a in sys.argv[1:]] or list(range(2017, 2026))
f = open(OUT / "rreo02_estados.csv", "w", newline="", encoding="utf-8")
w = csv.writer(f, delimiter=";"); w.writerow(["ano", "uf", "cod_conta", "conta", "coluna", "valor"])
erros = 0
for ano in anos:
    for cod, uf in UF.items():
        try:
            offset, n = 0, 0
            while True:
                u = ("https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=%d&nr_periodo=6"
                     "&co_tipo_demonstrativo=RREO&no_anexo=%s&co_esfera=E&id_ente=%d&offset=%d"
                     % (ano, urllib.parse.quote("RREO-Anexo 02"), cod, offset))
                j = json.loads(baixar(u, timeout=300))
                for x in j.get("items", []):
                    col = (x.get("coluna") or "").upper()
                    if col.startswith("DESPESAS LIQUIDADAS ATÉ") or col.startswith("DESPESAS LIQUIDADAS ATE"):
                        w.writerow([ano, uf, x.get("cod_conta"), (x.get("conta") or "").strip(), x.get("coluna"), x.get("valor")])
                        n += 1
                if not j.get("hasMore"): break
                offset += int(j.get("limit") or len(j.get("items", [])) or 5000)
            print(ano, uf, n, flush=True)
        except Exception as e:
            erros += 1
            print("ERRO", ano, uf, e, flush=True)
            if erros >= 3 and n == 0 and ano == anos[0] and cod <= 13:
                print("três primeiras consultas falharam; parando"); sys.exit(1)
        f.flush()
print("fim", "erros:", erros)
