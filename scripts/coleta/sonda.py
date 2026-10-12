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
# SIOPE: indicadores e despesas por função, Acre 2024 (estado e municípios)
get(siope("Indicadores_Siope", 2024, "AC"), "siope_indicadores_AC_2024")
get(siope("Despesas_Funcao_Educacao_Siope", 2024, "AC", "&$filter=" + urllib.parse.quote("DS_TIPO eq 'Estado'")), "siope_despfuncao_AC_2024_estado")
get(siope("Dados_Gerais_Siope", 2024, "AC"), "siope_dadosgerais_AC_2024")
# Siconfi: RREO Anexo 02 (função/subfunção) da União e Anexo 08 (MDE) de um estado
q = lambda d: SICONFI + d
get(q("/rreo?an_exercicio=2024&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=" + urllib.parse.quote("RREO-Anexo 02") + "&co_esfera=U&id_ente=1"), "siconfi_rreo02_uniao_2024")
get(q("/rreo?an_exercicio=2015&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=" + urllib.parse.quote("RREO-Anexo 02") + "&co_esfera=U&id_ente=1"), "siconfi_rreo02_uniao_2015")
get(q("/rreo?an_exercicio=2024&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=" + urllib.parse.quote("RREO-Anexo 08") + "&co_esfera=E&id_ente=12"), "siconfi_rreo08_AC_2024")
get(q("/anexos-relatorios"), "siconfi_anexos")
get(q("/entes"), "siconfi_entes", 20000)
print("fim")
