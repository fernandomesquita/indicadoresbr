#!/usr/bin/env python3
"""Detalhe por ação orçamentária na função Educação (SIOP): maiores ações por subfunção ou grupo de despesa.
Argumentos: pares filtro=ano, ex.: sf847=2024 gnd4=2012
"""
import sys, json, pathlib, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _rede import baixar
OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "coleta" / "siop_acoes"; OUT.mkdir(parents=True, exist_ok=True)
Q = """PREFIX loa: <http://vocab.e.gov.br/2013/09/loa#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?acao ?nome (SUM(xsd:decimal(?liq)) AS ?liquidado) WHERE { GRAPH <http://orcamento.dados.gov.br/%d/> {
 ?i loa:temFuncao ?f . ?f loa:codigo "12" . %s
 ?i loa:temAcao ?a . ?a loa:codigo ?acao . OPTIONAL { ?a rdfs:label ?nome }
 OPTIONAL { ?i loa:valorLiquidado ?liq } } } GROUP BY ?acao ?nome ORDER BY DESC(?liquidado) LIMIT 20"""
res = {}
for arg in sys.argv[1:] or ["sf847=2024", "sf847=2020", "sf847=2010", "gnd4=2012", "gnd4=2024", "sf331=2024", "sf846=2024"]:
    filtro, ano = arg.split("="); ano = int(ano)
    cond = (f'?i loa:temSubfuncao ?s . ?s loa:codigo "{filtro[2:]}" .' if filtro.startswith("sf")
            else f'?i loa:temGND ?g . ?g loa:codigo "{filtro[3:]}" .')
    j = json.loads(baixar("https://www1.siop.planejamento.gov.br/sparql/?" + urllib.parse.urlencode({"query": Q % (ano, cond)}),
                          headers={"Accept": "application/sparql-results+json"}, timeout=600))
    res[arg] = [{k: v["value"] for k, v in b.items()} for b in j["results"]["bindings"]]
    print(arg, [(x["acao"], x.get("nome", "")[:50], round(float(x.get("liquidado", 0)) / 1e9, 2)) for x in res[arg][:6]], flush=True)
(OUT / "acoes.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
