#!/usr/bin/env python3
"""Conferência: o que compõe a despesa com inversões financeiras (GND 5) na subfunção 364, 2009 a 2012 (SIOP)."""
import sys, json, pathlib, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _rede import baixar
OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "coleta" / "siop_gnd5"; OUT.mkdir(parents=True, exist_ok=True)
Q = """PREFIX loa: <http://vocab.e.gov.br/2013/09/loa#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?acao ?nome ?uo ?uonome (SUM(xsd:decimal(?liq)) AS ?liquidado) WHERE { GRAPH <http://orcamento.dados.gov.br/%d/> {
 ?i loa:temSubfuncao ?sf . ?sf loa:codigo "364" . ?i loa:temGND ?g . ?g loa:codigo "5" .
 ?i loa:temAcao ?a . ?a loa:codigo ?acao . OPTIONAL { ?a rdfs:label ?nome }
 ?i loa:temUnidadeOrcamentaria ?u . ?u loa:codigo ?uo . OPTIONAL { ?u rdfs:label ?uonome }
 OPTIONAL { ?i loa:valorLiquidado ?liq } } } GROUP BY ?acao ?nome ?uo ?uonome ORDER BY DESC(?liquidado) LIMIT 15"""
res = {}
for ano in (2009, 2010, 2011, 2012):
    j = json.loads(baixar("https://www1.siop.planejamento.gov.br/sparql/?" + urllib.parse.urlencode({"query": Q % ano}), headers={"Accept": "application/sparql-results+json"}))
    res[ano] = [{k: v["value"] for k, v in b.items()} for b in j["results"]["bindings"]]
    print(ano, res[ano][:3], flush=True)
(OUT / "gnd5.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
