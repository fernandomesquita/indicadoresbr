"""Gera assets/mapa-br.js: contornos das cinco grandes regiões do Brasil para o tipo de gráfico "mapa".

Parte da malha estadual com os códigos do IBGE (cópia pública em
github.com/codeforgermany/click_that_hood, arquivo brazil-states.geojson), junta os estados
de cada região, simplifica o contorno (o mapa é de visualização, sem uso cartográfico) e
grava os caminhos num quadro de 1000 unidades de largura.

Uso: python3 scripts/gerar_mapa_br.py   (precisa de shapely: pip install shapely)
"""
import json, math, urllib.request
from pathlib import Path
from shapely.geometry import shape
from shapely.ops import unary_union

URL = "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson"
SAIDA = Path(__file__).resolve().parent.parent / "assets" / "mapa-br.js"
REGIOES = {"Norte": "AC AP AM PA RO RR TO", "Nordeste": "AL BA CE MA PB PE PI RN SE",
           "Sudeste": "ES MG RJ SP", "Sul": "PR RS SC", "Centro-Oeste": "DF GO MT MS"}

def main():
    with urllib.request.urlopen(URL, timeout=120) as r:
        d = json.loads(r.read())
    sigla_regiao = {s: r for r, ss in REGIOES.items() for s in ss.split()}
    partes = {r: [] for r in REGIOES}
    for f in d["features"]:
        partes[sigla_regiao[f["properties"]["sigla"]]].append(shape(f["geometry"]).buffer(0))
    assert sum(len(v) for v in partes.values()) == 27, "a malha precisa ter as 27 UFs"
    k = math.cos(math.radians(15))  # correção de escala horizontal para a latitude média do país
    reg = {r: unary_union(g).buffer(0.02).buffer(-0.02).simplify(0.06, preserve_topology=True) for r, g in partes.items()}
    minx, miny, maxx, maxy = unary_union(list(reg.values())).bounds
    W = 1000; sx = W / ((maxx - minx) * k); H = round((maxy - miny) * sx)
    P = lambda x, y: ((x - minx) * k * sx, (maxy - y) * sx)

    def caminho(g):
        polis = [g] if g.geom_type == "Polygon" else list(g.geoms)
        out = []
        for p in polis:
            if p.area < 0.05:  # descarta ilhas pequenas demais para a escala do mapa
                continue
            for anel in [p.exterior] + list(p.interiors):
                out.append("M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in (P(*c) for c in anel.coords)) + "Z")
        return "".join(out)

    rot = {}
    for r, g in reg.items():
        maior = max(([g] if g.geom_type == "Polygon" else list(g.geoms)), key=lambda p: p.area)
        c = maior.centroid if r == "Norte" else maior.representative_point()
        rot[r] = [round(v) for v in P(c.x, c.y)]
    dados = {"w": W, "h": H, "regioes": {r: {"d": caminho(g), "rot": rot[r]} for r, g in reg.items()}}
    SAIDA.write_text(
        "// Mapa do Brasil por grandes regiões, gerado de malha estadual com códigos do IBGE (simplificada).\n"
        f"// Coordenadas num quadro de {W} x {H} unidades. Gerado por scripts/gerar_mapa_br.py; não edite à mão.\n"
        "export const MAPA_BR = " + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"ok: {SAIDA.relative_to(SAIDA.parent.parent)} ({SAIDA.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
