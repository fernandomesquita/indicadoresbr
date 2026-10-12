#!/usr/bin/env python3
"""Educação básica nos estados e municípios, a partir do SIOPE (FNDE), 2017 a 2025.

Para cada UF e ano, baixa da API de dados abertos do SIOPE
(https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata):
- Indicadores_Siope: indicador 40 (% da receita de impostos aplicada em MDE) e
  indicador 72 (investimento educacional por aluno da educação básica), por ente;
- Despesas_Funcao_Educacao_Siope: despesa liquidada por subfunção, por ente;
- Dados_Gerais_Siope: população e despesa liquidada em educação, por ente.
Saída: data/aux/coleta/siope_estados/ (um CSV por tabela).
"""
import sys, json, csv, pathlib, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _rede import baixar
OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "coleta" / "siope_estados"
OUT.mkdir(parents=True, exist_ok=True)
BASE = "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata"
UFS = "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split()
anos = [int(a) for a in sys.argv[1:]] or list(range(2017, 2026))
BASICA = {"361", "362", "365", "366", "367"}

def odata(rec, ano, uf, filtro=None, select=None):
    itens, skip, top = [], 0, 10000
    while True:
        q = {"@Ano_Consulta": ano, "@Num_Peri": 6, "@Sig_UF": f"'{uf}'", "$format": "json", "$top": top, "$skip": skip}
        if filtro: q["$filter"] = filtro
        if select: q["$select"] = select
        url = f"{BASE}/{rec}(Ano_Consulta=@Ano_Consulta,Num_Peri=@Num_Peri,Sig_UF=@Sig_UF)?" + urllib.parse.urlencode(q, safe="@'$")
        v = json.loads(baixar(url, timeout=300))["value"]
        itens += v
        if len(v) < top: return itens
        skip += top

ind_f = open(OUT / "indicadores.csv", "w", newline="", encoding="utf-8")
iw = csv.writer(ind_f, delimiter=";"); iw.writerow(["ano", "uf", "tipo", "cod_muni", "nome_muni", "cod_indi", "valor"])
desp_f = open(OUT / "despesa_basica.csv", "w", newline="", encoding="utf-8")
dw = csv.writer(desp_f, delimiter=";"); dw.writerow(["ano", "uf", "tipo", "cod_muni", "nome_muni", "subfuncao", "liquidado_max", "linhas"])
ger_f = open(OUT / "dados_gerais.csv", "w", newline="", encoding="utf-8")
gw = csv.writer(ger_f, delimiter=";"); gw.writerow(["ano", "uf", "tipo", "cod_muni", "nome_muni", "populacao", "desp_liquidada_educacao", "data_declaracao"])
for ano in anos:
    for uf in UFS:
        try:
            ind = odata("Indicadores_Siope", ano, uf, filtro="COD_INDI eq 40 or COD_INDI eq 72 or COD_INDI eq 73")
            for r in ind: iw.writerow([ano, uf, r["TIPO"], r["COD_MUNI"], r["NOM_MUNI"], r["COD_INDI"], r["VAL_INDI"]])
            dsp = odata("Despesas_Funcao_Educacao_Siope", ano, uf)
            agg = {}
            for r in dsp:
                sf = str(r["DES_SUBF"]).strip()
                if sf not in BASICA and sf != "364": continue
                k = (r["TIPO"], r["COD_MUNI"], r["NOM_MUNI"], sf)
                v = float(r["VAL_DESP_LIQU"] or 0)
                m, n = agg.get(k, (0.0, 0)); agg[k] = (max(m, v), n + 1)
            for (t, cm, nm, sf), (v, n) in agg.items(): dw.writerow([ano, uf, t, cm, nm, sf, v, n])
            ger = odata("Dados_Gerais_Siope", ano, uf)
            for r in ger: gw.writerow([ano, uf, r["TIPO"], r["COD_MUNI"], r["NOM_MUNI"], r.get("NUM_POPU"), r.get("VL_DESP_LIQU_EDU"), r.get("DAT_DECL")])
            print(ano, uf, len(ind), len(dsp), len(ger), flush=True)
        except Exception as e:
            print("ERRO", ano, uf, e, flush=True)
        ind_f.flush(); desp_f.flush(); ger_f.flush()
print("fim")
