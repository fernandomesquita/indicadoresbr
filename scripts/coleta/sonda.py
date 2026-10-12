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
# Rodada 2
get(siope("Informacoes_Complementares_Siope", 2024, "AC"), "siope_infocompl_AC_2024", 400000)
get(siope("Despesas_Funcao_Educacao_Siope", 2024, "AC"), "siope_despfuncao_AC_2024", 400000)
get(siope("Despesas_Siope", 2024, "AC") .replace("$top=5000", "$top=300"), "siope_despesas_AC_2024", 400000)
q = lambda d: SICONFI + d
for ano in (2006, 2010, 2014):
    get(q(f"/rreo?an_exercicio={ano}&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=" + urllib.parse.quote("RREO-Anexo 02") + "&co_esfera=U&id_ente=1"), f"siconfi_rreo02_uniao_{ano}", 3000)
txt = get(q("/rreo?an_exercicio=2024&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=" + urllib.parse.quote("RREO-Anexo 02") + "&co_esfera=U&id_ente=1"), "siconfi_rreo02_uniao_2024_full", 10)
if txt:
    j = json.loads(txt); sup = [x for x in j["items"] if "Superior" in x["conta"]]
    (OUT / "siconfi_rreo02_uniao_2024_superior.json").write_text(json.dumps(sup, ensure_ascii=False, indent=1), encoding="utf-8")
for url, nome in [("https://download.inep.gov.br/dados_abertos/sinopses_estatisticas/sinopses_estatisticas_censo_escolar_2024.zip", "inep_sinopse_2024"),]:
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, method="HEAD", headers={"User-Agent": "IndicadoresBR/1.0"}), timeout=60)
        (OUT / f"{nome}.txt").write_text(f"{url}\n{r.status} {dict(r.headers)}", encoding="utf-8"); print("ok", nome)
    except Exception as e:
        (OUT / f"{nome}.txt").write_text(f"{url}\nERRO {e}", encoding="utf-8"); print("erro", nome, e)
print("fim")
