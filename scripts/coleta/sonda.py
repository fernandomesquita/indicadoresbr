#!/usr/bin/env python3
"""Sonda: baixa amostras de APIs oficiais para conhecer o formato antes de escrever a coleta."""
import json, sys, urllib.request, urllib.parse, pathlib, time
OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "coleta" / "sonda"
OUT.mkdir(parents=True, exist_ok=True)
SIOPE = "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata"
SICONFI = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt"
def get(url, nome, limite=200000):
    t = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "IndicadoresBR/1.0", "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=180) as r: dados = r.read()
        txt = dados.decode("utf-8", errors="replace")
        (OUT / f"{nome}.txt").write_text(f"URL: {url}\nBYTES: {len(dados)}\nSEG: {time.time()-t:.1f}\n\n" + txt[:limite], encoding="utf-8")
        print("ok", nome, len(dados), flush=True)
        return txt
    except Exception as e:
        (OUT / f"{nome}.txt").write_text(f"URL: {url}\nERRO: {e}\n", encoding="utf-8"); print("erro", nome, e, flush=True)
def siope(rec, ano, uf, extra=""):
    return f"{SIOPE}/{rec}(Ano_Consulta=@Ano_Consulta,Num_Peri=@Num_Peri,Sig_UF=@Sig_UF)?@Ano_Consulta={ano}&@Num_Peri=6&@Sig_UF='{uf}'&$format=json&$top=5000{extra}"
# Rodada 4
import subprocess
for ano in range(2017, 2026):
    get(siope("Indicadores_Siope", ano, "AC").replace("$top=5000", "$top=3"), f"siope_ind_AC_{ano}", 3000)
for url, nome in [("https://download.inep.gov.br/dados_abertos/sinopses_estatisticas/sinopses_estatisticas_censo_escolar_2024.zip", "inep_sinopse_2024_curl"),
                  ("https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2024.zip", "inep_microdados_2024_curl")]:
    r = subprocess.run(["curl", "-sS", "-I", "-L", "-m", "60", "-A", "Mozilla/5.0", url], capture_output=True, text=True)
    (OUT / f"{nome}.txt").write_text(url + "\n" + r.stdout[-2000:] + "\n" + r.stderr[-2000:], encoding="utf-8"); print(nome, r.returncode, r.stderr[:200])
SPARQL = "https://www1.siop.planejamento.gov.br/sparql/"
def sparql(qq, nome):
    url = SPARQL + "?" + urllib.parse.urlencode({"query": qq})
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/sparql-results+json", "User-Agent": "IndicadoresBR/1.0"})
        with urllib.request.urlopen(req, timeout=300) as r: t = r.read().decode("utf-8", "replace")
        (OUT / f"{nome}.txt").write_text(t[:50000], encoding="utf-8"); print("ok", nome, len(t))
    except Exception as e:
        (OUT / f"{nome}.txt").write_text(f"ERRO {e}", encoding="utf-8"); print("erro", nome, e)
sparql("SELECT DISTINCT ?g WHERE { GRAPH ?g { ?s ?p ?o } } LIMIT 60", "siop_grafos")
sparql("""PREFIX loa: <http://vocab.e.gov.br/2013/09/loa#>
SELECT ?p (COUNT(*) AS ?n) WHERE { GRAPH <http://orcamento.dados.gov.br/2014/> { ?i a loa:ItemDespesa ; ?p ?o } } GROUP BY ?p""", "siop_props_2014")
print("fim")
