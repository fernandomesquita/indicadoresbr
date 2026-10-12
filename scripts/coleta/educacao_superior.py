#!/usr/bin/env python3
"""Despesa da União com ensino superior (subfunção 364), 2006 a 2026.

Fontes primárias:
- SIOP, Ministério do Planejamento e Orçamento, dados abertos do orçamento federal
  (endpoint SPARQL https://www1.siop.planejamento.gov.br/sparql/, grafos
  http://orcamento.dados.gov.br/{ano}/): dotação, empenhado, liquidado e pago por
  subfunção, grupo de natureza de despesa (GND) e esfera.
- IBGE, Sidra tabela 1737 (IPCA, número-índice), para corrigir pela inflação.
- Conferência: Tesouro Nacional, Siconfi, RREO-Anexo 02 da União (2015 em diante).
Saída: data/aux/coleta/educacao_superior/
"""
import sys, json, csv, pathlib, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _rede import baixar
OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "coleta" / "educacao_superior"
OUT.mkdir(parents=True, exist_ok=True)
SPARQL = "https://www1.siop.planejamento.gov.br/sparql/"
ANOS = list(range(2006, 2027))
Q = """PREFIX loa: <http://vocab.e.gov.br/2013/09/loa#>
SELECT ?gnd ?esf (SUM(xsd:decimal(?dot)) AS ?dotacao) (SUM(xsd:decimal(?lmc)) AS ?autorizado)
       (SUM(xsd:decimal(?emp)) AS ?empenhado) (SUM(xsd:decimal(?liq)) AS ?liquidado) (SUM(xsd:decimal(?pag)) AS ?pago)
WHERE { GRAPH <http://orcamento.dados.gov.br/%d/> {
  ?i loa:temSubfuncao ?sf . ?sf loa:codigo "364" .
  ?i loa:temGND ?g . ?g loa:codigo ?gnd .
  ?i loa:temEsfera ?e . ?e loa:codigo ?esf .
  OPTIONAL { ?i loa:valorDotacaoInicial ?dot } OPTIONAL { ?i loa:valorLeiMaisCredito ?lmc }
  OPTIONAL { ?i loa:valorEmpenhado ?emp } OPTIONAL { ?i loa:valorLiquidado ?liq } OPTIONAL { ?i loa:valorPago ?pag }
} } GROUP BY ?gnd ?esf ORDER BY ?gnd ?esf"""
linhas = []
for ano in ANOS:
    url = SPARQL + "?" + urllib.parse.urlencode({"query": Q % ano})
    try:
        j = json.loads(baixar(url, headers={"Accept": "application/sparql-results+json"}, timeout=600))
    except Exception as e:
        print("erro", ano, e, flush=True); continue
    for b in j["results"]["bindings"]:
        g = lambda k: float(b[k]["value"]) if k in b else None
        linhas.append({"ano": ano, "gnd": b["gnd"]["value"], "esfera": b["esf"]["value"], "dotacao_inicial": g("dotacao"),
                       "autorizado": g("autorizado"), "empenhado": g("empenhado"), "liquidado": g("liquidado"), "pago": g("pago")})
    print(ano, "ok", sum((x["liquidado"] or 0) for x in linhas if x["ano"] == ano) / 1e9, "bi liquidados", flush=True)
with open(OUT / "siop_364_por_gnd.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(linhas[0].keys()), delimiter=";"); w.writeheader(); w.writerows(linhas)
# IPCA número-índice mensal
ip = json.loads(baixar("https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/2266/p/all?formato=json"))
idx = {r["D3C"]: float(r["V"]) for r in ip[1:] if r["V"] not in ("...", "-", "")}
(OUT / "ipca_numero_indice.json").write_text(json.dumps(idx, indent=0))
# conferência Siconfi RREO-Anexo 02 (União), 2015 em diante
conf = []
for ano in range(2015, 2026):
    u = ("https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=%d&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=%s&co_esfera=U&id_ente=1"
         % (ano, urllib.parse.quote("RREO-Anexo 02")))
    try:
        j = json.loads(baixar(u, timeout=300))
        for x in j["items"]:
            if x["conta"].strip() == "Ensino Superior" and x["coluna"].startswith("DESPESAS LIQUIDADAS ATÉ"):
                conf.append({"ano": ano, "conta": x["cod_conta"], "liquidado": x["valor"]})
    except Exception as e:
        print("siconfi erro", ano, e)
(OUT / "siconfi_rreo02_superior.json").write_text(json.dumps(conf, ensure_ascii=False, indent=1))
print("fim")
