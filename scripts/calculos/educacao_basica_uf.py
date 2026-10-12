#!/usr/bin/env python3
"""Gasto público em educação básica por aluno, por UF, 2017 a 2025 (estado + municípios), e recorte pelo partido do governador.

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
Saída: data/aux/educacao_uf/gasto_por_aluno_uf.csv e partido_governador.csv
"""
import csv, gzip, json, collections, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
SIOPE = R / "data/aux/coleta/siope_estados/despesa_subfuncao.csv.gz"
SICONFI = R / "data/aux/coleta/siconfi_educacao_uf/rreo02_estados.csv"
MAT = R / "data/aux/coleta/inep_matriculas/matriculas_uf.csv"
IPCA = R / "data/aux/educacao_federal/ipca_numero_indice.json"
OUT = R / "data/aux/educacao_uf"; OUT.mkdir(parents=True, exist_ok=True)
ANOS = range(2017, 2026)  # o SIOPE em dados abertos começa em 2017

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
    tot, intra, sup, desp = collections.Counter(), collections.Counter(), collections.Counter(), collections.Counter()
    bloco = None
    for r in csv.DictReader(open(SICONFI, encoding="utf-8"), delimiter=";"):
        k = (int(r["ano"]), r["uf"]); c = r["conta"]; cc = r["cod_conta"]
        if c.startswith("DESPESAS (EXCETO INTRA") or c.startswith("DESPESAS (INTRA"): desp[k] += float(r["valor"]); continue
        if c == "Educação":
            if cc == "RREO2TotalDespesas": tot[k] = float(r["valor"]); bloco = k
            elif "Intra" in cc: intra[k] = float(r["valor"])
            continue
        if c == "Cultura": bloco = None; continue
        if c == "Ensino Superior": sup[k] += float(r["valor"])  # parcela comum e intraorçamentária
    out = {}
    for k in tot:
        out[k] = {"total": tot[k] + intra[k], "superior": sup[k], "prev": siope.get(k, {}).get("prev", 0.0),
                  "basica": tot[k] + intra[k] - sup[k] - siope.get(k, {}).get("prev", 0.0), "despesa_total": desp[k]}
    return out

def calcula(fonte_estado="siconfi"):
    mun, mat = municipios(), matriculas()
    es = estados_siope(); ec = estados_siconfi(es)
    linhas = []
    for (a, uf), m in sorted(mat.items()):
        if a not in FATOR or (a, uf) not in ec: continue
        vm = sum(mun.get((a, uf), {}).values())
        if fonte_estado == "siope" and (a, uf) in es: ve, orig = es[(a, uf)]["basica"], "SIOPE"
        else: ve, orig = ec[(a, uf)]["basica"], "Siconfi"
        me, mm = int(m["estadual"]), int(m["municipal"])
        linhas.append({"ano": a, "uf": uf, "gasto_estado": ve * FATOR[a], "gasto_municipios": vm * FATOR[a],
                       "fonte_estado": orig, "matriculas_estaduais": me, "matriculas_municipais": mm,
                       "matriculas": me + mm, "por_aluno": (ve + vm) * FATOR[a] / (me + mm),
                       "por_aluno_rede_estadual": ve * FATOR[a] / me,
                       "despesa_total_estado": ec[(a, uf)]["despesa_total"] * FATOR[a],
                       "pct_orcamento_estado": 100 * ve / ec[(a, uf)]["despesa_total"]})
    return linhas

# Mesmo partido com outro nome (troca de nome, sem fusão): conta junto, com o nome atual.
RENOMEADOS = {"PMDB": "MDB", "PRB": "Republicanos", "PR": "PL", "PPS": "Cidadania", "PTN": "Podemos",
              "PC do B": "PCdoB", "PCdoB": "PCdoB", "PHS": "PHS", "União Brasil": "União", "UNIÃO": "União"}

def governadores():
    g = {}
    for r in csv.DictReader(open(R / "data/aux/governadores_2016_2025.csv", encoding="utf-8"), delimiter=";"):
        p = r["partido_na_eleicao"].strip(); g[(int(r["ano"]), r["uf"])] = (r["governador_maior_parte_do_ano"], RENOMEADOS.get(p, p))
    return g

def por_partido(linhas):
    g = governadores(); acc = collections.defaultdict(list)
    for l in linhas:
        nome, partido = g[(l["ano"], l["uf"])]; l["governador"], l["partido"] = nome, partido
        acc[partido].append(l)
    out = []
    for p, ls in acc.items():
        out.append({"partido": p, "ufs_ano": len(ls), "ufs": sorted({l["uf"] for l in ls}),
                    "por_aluno_rede_estadual": sum(l["por_aluno_rede_estadual"] for l in ls) / len(ls),
                    "pct_orcamento_estado": sum(l["pct_orcamento_estado"] for l in ls) / len(ls)})
    return sorted(out, key=lambda d: (-d["ufs_ano"], d["partido"]))

if __name__ == "__main__":
    L = calcula()
    campos = list(L[0].keys())
    with open(OUT / "gasto_por_aluno_uf.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos, delimiter=";"); w.writeheader()
        for l in L: w.writerow({k: (round(v, 2) if isinstance(v, float) else v) for k, v in l.items()})
    P = por_partido(L)
    with open(OUT / "partido_governador.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";"); w.writerow(["partido", "ufs_ano", "ufs", "por_aluno_rede_estadual", "pct_orcamento_estado"])
        for d in P: w.writerow([d["partido"], d["ufs_ano"], " ".join(d["ufs"]), round(d["por_aluno_rede_estadual"]), round(d["pct_orcamento_estado"], 1)])
    anos = sorted({l["ano"] for l in L}); print("anos:", anos[0], "a", anos[-1], len(L), "linhas")
    for d in P: print(d["partido"], d["ufs_ano"], round(d["por_aluno_rede_estadual"]), round(d["pct_orcamento_estado"], 1), " ".join(d["ufs"]))

def linhas_indicadores(L):
    """Linhas dos indicadores educacao-basica-por-aluno e educacao-basica-partido-governador."""
    d = {(l["ano"], l["uf"]): l for l in L}
    br = collections.defaultdict(lambda: [0.0, 0])
    for l in L: br[l["ano"]][0] += l["gasto_estado"] + l["gasto_municipios"]; br[l["ano"]][1] += l["matriculas"]
    B = {a: v[0] / v[1] for a, v in br.items()}
    ufs = sorted({l["uf"] for l in L}, key=lambda u: -d[(2025, u)]["por_aluno"])
    t1 = [["Brasil", round(B[2017]), round(B[2021]), round(B[2025]), round(100 * (B[2025] / B[2017] - 1))]]
    for u in ufs:
        v = [d[(a, u)]["por_aluno"] for a in (2017, 2021, 2025)]
        t1.append([u, round(v[0]), round(v[1]), round(v[2]), round(100 * (v[2] / v[0] - 1))])
    t2 = [[p["partido"], p["ufs_ano"], ", ".join(p["ufs"]), round(p["por_aluno_rede_estadual"]), round(p["pct_orcamento_estado"], 1)]
          for p in sorted(por_partido(L), key=lambda p: p["partido"].lower())]
    return t1, t2

if __name__ == "__main__" and "--indicadores" in __import__("sys").argv:
    t1, t2 = linhas_indicadores(calcula())
    for arq, linhas in (("educacao-basica-por-aluno", t1), ("educacao-basica-partido-governador", t2)):
        p = R / "data/indicadores" / f"{arq}.json"
        if p.exists():
            j = json.loads(p.read_text()); j["linhas"] = linhas
            p.write_text(json.dumps(j, ensure_ascii=False, indent=2) + "\n"); print("atualizado", arq)
        else:
            print(arq, json.dumps(linhas, ensure_ascii=False))
