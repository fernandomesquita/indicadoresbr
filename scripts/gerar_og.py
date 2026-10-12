#!/usr/bin/env python3
"""Indicadores BR · imagens de prévia de link (Open Graph, 1200x630)

Gera og/<id>.png para cada indicador e og/site.png para as demais páginas,
usando o mesmo desenhista dos gráficos do site. Rode depois de mudar dados ou títulos:
  python3 scripts/gerar_og.py && python3 scripts/build.py
Precisa de Python com Playwright e Chromium (pip install playwright && playwright install chromium).
"""
import asyncio, base64, functools, http.server, json, threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OG = ROOT / "og"

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

JS = """async ({ids}) => {
  const m = await import('/assets/charts.js');
  const d = await (await fetch('/data/indicadores.json')).json();
  m.setGovernos(d.site.governos);
  await document.fonts.ready;
  const out = {};
  for (const ind of d.indicadores) {
    if (ids.length && !ids.includes(ind.id)) continue;
    const cat = (d.categorias.find(c => c.id === ind.categoria) || {}).nome || '';
    const cv = await m.composePNG(ind, 'og', 'claro', { categoria: cat, siteNome: d.site.nome || 'Indicadores BR' });
    out[ind.id] = cv.toDataURL('image/png');
  }
  // imagem geral do site
  const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 630;
  const c = cv.getContext('2d');
  c.fillStyle = '#F6F7F4'; c.fillRect(0, 0, 1200, 630);
  c.fillStyle = '#0C6A70'; c.fillRect(0, 0, 1200, 10);
  const bars = [3, 5, 4, 7, 6, 8, 7, 9];
  bars.forEach((b, i) => { c.fillStyle = i === bars.length - 1 ? '#C98A1E' : '#0C6A70'; c.fillRect(760 + i * 48, 520 - b * 40, 34, b * 40); });
  c.fillStyle = '#14222B'; c.font = "700 92px 'Barlow Condensed', 'Arial Narrow', sans-serif"; c.fillText('Indicadores', 72, 250);
  const bw = c.measureText('BR').width; c.fillStyle = '#0C6A70'; c.fillRect(72, 280, bw + 32, 96); c.fillStyle = '#F6F7F4'; c.fillText('BR', 88, 362);
  c.fillStyle = '#55646B'; c.font = "400 32px 'Public Sans', sans-serif";
  ['Dados públicos do Brasil,', 'reunidos, conferidos e explicados.'].forEach((t, i) => c.fillText(t, 72, 450 + i * 44));
  out.__site = cv.toDataURL('image/png');
  return out;
}"""

async def main(ids):
    from playwright.async_api import async_playwright
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8799), functools.partial(H, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    OG.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto("http://127.0.0.1:8799/index.html")
        await pg.wait_for_timeout(1500)
        res = await pg.evaluate(JS, {"ids": ids})
        await b.close()
    for k, url in res.items():
        nome = "site" if k == "__site" else k
        (OG / f"{nome}.png").write_bytes(base64.b64decode(url.split(",", 1)[1]))
    srv.shutdown()
    print(f"{len(res)} imagens em og/")

if __name__ == "__main__":
    import sys
    asyncio.run(main(sys.argv[1:]))
