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
# Rodada 3
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}
def cabeca(url, nome):
    try:
        req = urllib.request.Request(url, headers={**UA, "Range": "bytes=0-1023"})
        with urllib.request.urlopen(req, timeout=120) as r:
            (OUT / f"{nome}.txt").write_text(f"{url}\n{r.status} {dict(r.headers)}", encoding="utf-8"); print("ok", nome)
    except Exception as e:
        (OUT / f"{nome}.txt").write_text(f"{url}\nERRO {e}", encoding="utf-8"); print("erro", nome, e)
cabeca("https://download.inep.gov.br/dados_abertos/sinopses_estatisticas/sinopses_estatisticas_censo_escolar_2024.zip", "inep_sinopse_2024")
cabeca("https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2024.zip", "inep_microdados_2024")
cabeca("https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2018.zip", "tse_cand_2018")
get(siope("Indicadores_Siope", 2016, "AC").replace("$top=5000", "$top=60"), "siope_indicadores_AC_2016", 60000)
get(siope("Despesas_Funcao_Educacao_Siope", 2016, "AC").replace("$top=5000", "$top=40"), "siope_despfuncao_AC_2016", 20000)
SPARQL = "https://www1.siop.planejamento.gov.br/sparql/"
for ano in (2006, 2014, 2024):
    qq = f"""PREFIX loa: <http://vocab.e.gov.br/2013/09/loa#>
SELECT ?cod (SUM(?liq) AS ?liquidado) (SUM(?pago) AS ?pago) WHERE {{
  GRAPH <http://orcamento.dados.gov.br/{ano}/> {{
    ?i loa:temSubfuncao ?sf . ?sf loa:codigo ?cod . FILTER(?cod = "364")
    OPTIONAL {{ ?i loa:valorLiquidado ?liq }} OPTIONAL {{ ?i loa:valorPago ?pago }}
  }} }} GROUP BY ?cod"""
    get(SPARQL + "?" + urllib.parse.urlencode({"query": qq, "format": "json", "default-graph-uri": ""}), f"siop_sparql_364_{ano}", 20000)
print("fim")
