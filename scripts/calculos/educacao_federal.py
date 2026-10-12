#!/usr/bin/env python3
"""Despesa da União com educação (função 12), 2006 a 2025, em reais de 2025.

Lê data/aux/educacao_federal/ (coletado por scripts/coleta/educacao_federal.py).
Regras: despesa liquidada; sem o grupo 5 (inversões financeiras, que registra os
empréstimos do Fies); correção pela média anual do IPCA (Sidra 1737).
Blocos: educação básica (subfunções 361, 362, 365, 366, 367, 368, 306 alimentação
escolar e 847 transferências, que inclui a complementação da União ao Fundeb),
ensino superior (364), educação profissional (363), hospitais universitários (302)
e demais (administração, benefícios a servidores e outros).
"""
import csv, json, pathlib, collections
D = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "educacao_federal"
idx = json.loads((D / "ipca_numero_indice.json").read_text())
media = lambda a: sum(idx[f"{a}{m:02d}"] for m in range(1, 13)) / 12
FATOR = {a: media(2025) / media(a) for a in range(2006, 2026)}
BLOCO = {**{s: "basica" for s in ("361", "362", "365", "366", "367", "368", "306", "847")},
         "364": "superior", "363": "profissional", "302": "hospitais"}
anual = collections.defaultdict(lambda: collections.defaultdict(float))
for r in csv.DictReader(open(D / "siop_funcao12.csv", encoding="utf-8"), delimiter=";"):
    a = int(r["ano"])
    if a > 2025 or r["gnd"] == "5": continue
    v = float(r["liquidado"] or 0) * FATOR[a] / 1e9
    anual[a][BLOCO.get(r["subfuncao"], "demais")] += v
    anual[a]["total"] += v
    if r["gnd"] == "4": anual[a]["obras_equipamentos"] += v
    if r["subfuncao"] == "847": anual[a]["transferencias_847"] += v
    if r["gnd"] == "1": anual[a]["pessoal"] += v
GOV = [("Lula 2", "2007 a 2010", range(2007, 2011)), ("Dilma 1", "2011 a 2014", range(2011, 2015)), ("Dilma 2", "2015", [2015]),
       ("Temer", "2017 e 2018", [2017, 2018]), ("Bolsonaro", "2019 a 2022", range(2019, 2023)), ("Lula 3", "2023 a 2025", range(2023, 2026))]
def media_gov(chave):
    return [(n, p, sum(anual[a][chave] for a in anos) / len(list(anos))) for n, p, anos in GOV]
if __name__ == "__main__":
    for a in sorted(anual): print(a, {k: round(v, 1) for k, v in anual[a].items()})
    for k in ("total", "basica", "superior", "profissional", "obras_equipamentos", "transferencias_847", "pessoal"):
        print(k, [(n, round(v, 1)) for n, p, v in media_gov(k)])
