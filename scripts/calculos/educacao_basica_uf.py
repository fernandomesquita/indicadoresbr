#!/usr/bin/env python3
"""Gasto público em educação básica por aluno, por UF, 2017 a 2025 (estado + municípios).

Numerador, por UF e ano, em R$ de 2025 (IPCA, média anual):
- Municípios: SIOPE (FNDE), despesa liquidada por subfunção declarada por cada prefeitura
  (arquivo data/aux/coleta/siope_estados/despesa_subfuncao.csv.gz).
  Entram: etapas de ensino (361, 362, 363, 365, 366, 367, 368), apoio (122 administração,
  306 alimentação escolar, 782 transporte escolar, 722 educação a distância) e, no leiaute
  até 2020, as linhas por programa (098 salário-educação, 116 PDDE, 117 PNAE, 118 PNATE,
  119 e 120 outras transferências e convênios, 190 outros recursos), que a partir de 2021
  passaram a ser declaradas como alimentação, transporte e administração.
  Ficam fora: 364 ensino superior, previdência e inativos (271 a 274), assistência,
  cultura, desporto, precatórios e encargos.
  Linhas "TOTAL" (2021 a 2023) e o total da educação infantil repetido no código 365
  (2024 e 2025) não são somados duas vezes.
- Estados: Siconfi, RREO Anexo 2 do 6º bimestre, função Educação menos as subfunções
  Ensino Superior e de previdência (ver ESTADO abaixo), porque Minas Gerais não declara
  o SIOPE e o Rio Grande do Sul não declarou em 2018 e 2019.
Denominador: matrículas das redes estadual e municipal (Inep, Sinopse, tabela 1.2).
Saída: data/aux/educacao_uf/gasto_por_aluno_uf.csv
"""
import csv, gzip, json, collections, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
SIOPE = R / "data/aux/coleta/siope_estados/despesa_subfuncao.csv.gz"
SICONFI = R / "data/aux/coleta/siconfi_educacao_uf/rreo02_estados.csv"
MAT = R / "data/aux/coleta/inep_matriculas/matriculas_uf.csv"
IPCA = R / "data/aux/educacao_federal/ipca_numero_indice.json"
OUT = R / "data/aux/educacao_uf"; OUT.mkdir(parents=True, exist_ok=True)
ANOS = range(2017, 2026)

ip = json.loads(IPCA.read_text())
med = {a: sum(ip[f"{a}{m:02d}"] for m in range(1, 13)) / 12 for a in ANOS}
FATOR = {a: med[2025] / med[a] for a in ANOS}

ETAPAS = {"361", "362", "363", "365", "366", "367", "368"}
APOIO = {"122", "306", "782", "722"}
PROGRAMAS = {"098", "116", "117", "118", "119", "120", "190"}

def codigo(s):
    s = s.strip()
    if s.startswith("98 "): return "098"
    return s[:3]

def municipios():
    """R$ correntes por (ano, uf): etapas, apoio, programas."""
    out = collections.defaultdict(collections.Counter)
    for r in csv.DictReader(gzip.open(SIOPE, "rt", encoding="utf-8"), delimiter=";"):
        if r["tipo"] != "Municipal": continue
        s = r["subfuncao"].strip()
        if s.upper().startswith("TOTAL"): continue
        soma, mx, n = float(r["liquidado_soma"]), float(r["liquidado_max"]), int(r["linhas"])
        v = mx if (n >= 2 and abs(mx - soma / 2) < 1) else soma
        c = codigo(s)
        bloco = "etapas" if c in ETAPAS else "apoio" if c in APOIO else "programas" if c in PROGRAMAS else None
        if bloco: out[(int(r["ano"]), r["uf"])][bloco] += v
    return out

def matriculas():
    return {(int(r["ano"]), r["uf"]): r for r in csv.DictReader(open(MAT, encoding="utf-8"), delimiter=";")}

if __name__ == "__main__":
    m = municipios()
    for a in ANOS:
        print(a, round(sum(sum(v.values()) for (ano, uf), v in m.items() if ano == a) * FATOR[a] / 1e9, 1))

# ---------------------------------------------------------------- estados
PREV = {"271", "272", "273", "274"}

def estados_siope():
    """R$ correntes por (ano, uf): mesma régua dos municípios, e previdência declarada à parte."""
    out = collections.defaultdict(collections.Counter)
    for r in csv.DictReader(gzip.open(SIOPE, "rt", encoding="utf-8"), delimiter=";"):
        if r["tipo"] != "Estadual": continue
        s = r["subfuncao"].strip()
        if s.upper().startswith("TOTAL"): continue
        soma, mx, n = float(r["liquidado_soma"]), float(r["liquidado_max"]), int(r["linhas"])
        v = mx if (n >= 2 and abs(mx - soma / 2) < 1) else soma
        c = codigo(s); k = (int(r["ano"]), r["uf"])
        out[k]["tudo"] += v
        if c in ETAPAS | APOIO | PROGRAMAS: out[k]["basica"] += v
        if c in PREV: out[k]["prev_sub"] += v
        if s.startswith("Inativos"): out[k]["prev_inat"] += v
        if c == "364": out[k]["superior"] += v
    # Quando o estado declara os inativos numa linha "Inativos" e também na subfunção 272
    # (São Paulo em 2019 e 2020), desconta-se a maior das duas, para não descontar duas vezes.
    for k, d in out.items(): d["prev"] = max(d["prev_sub"], d["prev_inat"])
    return out

def estados_siconfi(siope):
    """Função Educação (inclusive intraorçamentária) menos Ensino Superior e menos a previdência
    que o estado declara dentro da educação no SIOPE (São Paulo, DF, Goiás, Acre e outros poucos)."""
    tot, intra, sup = collections.Counter(), collections.Counter(), collections.Counter()
    bloco = None
    for r in csv.DictReader(open(SICONFI, encoding="utf-8"), delimiter=";"):
        k = (int(r["ano"]), r["uf"]); c = r["conta"]; cc = r["cod_conta"]
        if c == "Educação":
            if cc == "RREO2TotalDespesas": tot[k] = float(r["valor"]); bloco = k
            elif "Intra" in cc: intra[k] = float(r["valor"])
            continue
        if c == "Cultura": bloco = None; continue
        if bloco == k and cc == "RREO2TotalDespesas" and c == "Ensino Superior": sup[k] += float(r["valor"])
    out = {}
    for k in tot:
        out[k] = {"total": tot[k] + intra[k], "superior": sup[k], "prev": siope.get(k, {}).get("prev", 0.0),
                  "basica": tot[k] + intra[k] - sup[k] - siope.get(k, {}).get("prev", 0.0)}
    return out

def calcula(fonte_estado):
    mun, mat = municipios(), matriculas()
    es = estados_siope(); ec = estados_siconfi(es)
    linhas = []
    for (a, uf), m in sorted(mat.items()):
        if a not in FATOR: continue
        vm = sum(mun.get((a, uf), {}).values())
        if fonte_estado == "siope" and (a, uf) in es: ve, orig = es[(a, uf)]["basica"], "SIOPE"
        else: ve, orig = ec[(a, uf)]["basica"], "Siconfi"
        alunos = int(m["estadual"]) + int(m["municipal"])
        linhas.append({"ano": a, "uf": uf, "gasto_estado": ve * FATOR[a], "gasto_municipios": vm * FATOR[a],
                       "fonte_estado": orig, "matriculas": alunos,
                       "por_aluno": (ve + vm) * FATOR[a] / alunos})
    return linhas
