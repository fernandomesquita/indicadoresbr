#!/usr/bin/env python3
"""Calcula as séries de educação-superior a partir de data/aux/educacao_superior/ (coletadas por
scripts/coleta/educacao_superior.py) e imprime as linhas dos indicadores.

Regra: despesa liquidada da União na subfunção 364 (Ensino Superior), todas as esferas, sem o
grupo 5 (inversões financeiras), que de 2009 a 2011 registrou a concessão de empréstimos do Fies
(ação 0579) e depois saiu da subfunção. Valores em reais de 2025 pela média anual do IPCA.
"""
import csv, json, pathlib, collections
D = pathlib.Path(__file__).resolve().parents[2] / "data" / "aux" / "educacao_superior"
idx = json.loads((D / "ipca_numero_indice.json").read_text())
media = lambda a: sum(idx[f"{a}{m:02d}"] for m in range(1, 13)) / 12
fator = {a: media(2025) / media(a) for a in range(2006, 2026)}
by = collections.defaultdict(lambda: collections.defaultdict(float))
for r in csv.DictReader(open(D / "siop_364_por_gnd.csv", encoding="utf-8"), delimiter=";"):
    a = int(r["ano"])
    if a > 2025 or r["gnd"] == "5": continue
    g = {"1": "pessoal", "3": "custeio", "4": "investimentos"}.get(r["gnd"], "outros")
    by[a][g] += float(r["liquidado"] or 0) * fator[a] / 1e9
anual = {a: {**d, "total": sum(d.values())} for a, d in sorted(by.items())}
GOV = [("Lula 2 (2007 a 2010)", range(2007, 2011)), ("Dilma 1 (2011 a 2014)", range(2011, 2015)), ("Dilma 2 (2015)", [2015]),
       ("Temer (2017 e 2018)", [2017, 2018]), ("Bolsonaro (2019 a 2022)", range(2019, 2023)), ("Lula 3 (2023 a 2025)", range(2023, 2026))]
if __name__ == "__main__":
    print("anual:", json.dumps([[a, round(v["total"], 1), round(v["investimentos"], 2)] for a, v in anual.items()]))
    for n, anos in GOV:
        anos = list(anos); m = lambda k: round(sum(anual[a][k] for a in anos) / len(anos), 1)
        print(n, m("total"), m("pessoal"), m("custeio"), round(sum(anual[a]["investimentos"] for a in anos) / len(anos), 2))
