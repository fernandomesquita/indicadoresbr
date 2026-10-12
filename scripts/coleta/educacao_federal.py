#!/usr/bin/env python3
"""Despesa da União na função Educação (12), por subfunção e grupo de despesa, 2006 a 2026 (SIOP).
Saída: data/aux/coleta/educacao_federal/siop_funcao12.csv
"""
import sys, json, csv, pathlib, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _rede import baixar
OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "coleta" / "educacao_federal"; OUT.mkdir(parents=True, exist_ok=True)
Q = """PREFIX loa: <http://vocab.e.gov.br/2013/09/loa#>
SELECT ?sf ?gnd (SUM(xsd:decimal(?liq)) AS ?liquidado) (SUM(xsd:decimal(?pag)) AS ?pago) (SUM(xsd:decimal(?dot)) AS ?dotacao)
WHERE { GRAPH <http://orcamento.dados.gov.br/%d/> {
 ?i loa:temFuncao ?f . ?f loa:codigo "12" . ?i loa:temSubfuncao ?s . ?s loa:codigo ?sf . ?i loa:temGND ?g . ?g loa:codigo ?gnd .
 OPTIONAL { ?i loa:valorLiquidado ?liq } OPTIONAL { ?i loa:valorPago ?pag } OPTIONAL { ?i loa:valorDotacaoInicial ?dot }
} } GROUP BY ?sf ?gnd ORDER BY ?sf ?gnd"""
linhas = []
for ano in range(2006, 2027):
    j = json.loads(baixar("https://www1.siop.planejamento.gov.br/sparql/?" + urllib.parse.urlencode({"query": Q % ano}), headers={"Accept": "application/sparql-results+json"}, timeout=600))
    for b in j["results"]["bindings"]:
        g = lambda k: float(b[k]["value"]) if k in b else None
        linhas.append({"ano": ano, "subfuncao": b["sf"]["value"], "gnd": b["gnd"]["value"], "liquidado": g("liquidado"), "pago": g("pago"), "dotacao_inicial": g("dotacao")})
    print(ano, round(sum((x["liquidado"] or 0) for x in linhas if x["ano"] == ano) / 1e9, 2), flush=True)
with open(OUT / "siop_funcao12.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(linhas[0].keys()), delimiter=";"); w.writeheader(); w.writerows(linhas)
print("fim")
