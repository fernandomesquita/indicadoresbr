#!/usr/bin/env python3
"""Indicadores BR · build

Lê data/site.json e data/indicadores/*.json, valida tudo e gera:
  data/indicadores.json        pacote que o site usa quando o banco está fora do ar
  index.html e páginas estáticas (/categoria/<id>/, /indicador/<id>/, /metodo/, /sugira/, /contato/, /admin/, 404.html)
                               com título, descrição e prévia de link (Open Graph) próprios de cada página
  sitemap.xml, robots.txt
  supabase/seed.sql            carga inicial do banco (rodar no SQL Editor do Supabase)

Uso:
  python3 scripts/build.py              valida e gera
  python3 scripts/build.py --checar     só valida (sai com erro se houver problema)
  python3 scripts/build.py --formatar   regrava os JSON de data/ no formato padrão (uma linha de dados por linha)
Variável opcional: SITE_URL=https://seu-dominio (senão usa o valor de config.js ou a URL relativa).
"""
import json, os, re, sys, html, hashlib, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
TIPOS = {"colunas", "barras", "linha", "dispersao", "tabela"}
CAMPOS = ["id", "categoria", "ordem", "visivel", "titulo", "subtitulo", "tipo", "x", "series", "rotulo", "tendencia", "barra",
          "destaque", "faixasGoverno", "prefixo", "sufixo", "casas", "fonte", "fontes", "como_ler", "contexto", "glossario",
          "atualizacao", "colunas", "linhas", "checagem"]

# ------------------------------------------------------------------ JSON no formato do repositório
def dump_indicador(ind):
    """JSON legível com uma linha de dados por linha, para os diffs do Git mostrarem só o que mudou."""
    ordered = {k: ind[k] for k in CAMPOS if k in ind}
    for k in ind:
        if k not in ordered and not k.startswith("_"): ordered[k] = ind[k]
    linhas = ordered.pop("linhas", [])
    txt = json.dumps(ordered, ensure_ascii=False, indent=2)
    rows = ",\n".join("    " + json.dumps(r, ensure_ascii=False) for r in linhas)
    return txt[:-2] + ',\n  "linhas": [\n' + rows + "\n  ]\n}\n"

def carregar():
    site = json.loads((DATA / "site.json").read_text(encoding="utf-8"))
    inds = []
    for f in sorted((DATA / "indicadores").glob("*.json")):
        ind = json.loads(f.read_text(encoding="utf-8"))
        ind["_arquivo"] = f.name
        inds.append(ind)
    return site, inds

# ------------------------------------------------------------------ validação
PROIBIDOS = [("—", "travessão longo (use vírgula, ponto ou dois-pontos)")]
def textos(ind):
    yield "titulo", ind.get("titulo", "")
    yield "subtitulo", ind.get("subtitulo", "")
    yield "como_ler", ind.get("como_ler", "")
    for i, p in enumerate(ind.get("contexto", [])): yield f"contexto[{i}]", p
    for g in ind.get("glossario", []): yield "glossario", g.get("termo", "") + " " + g.get("definicao", "")

def validar(site, inds):
    erros, avisos = [], []
    cats = {c["id"] for c in site["categorias"]}
    ids = set()
    for ind in inds:
        nome = ind.get("_arquivo", ind.get("id"))
        e = lambda m: erros.append(f"{nome}: {m}")
        a = lambda m: avisos.append(f"{nome}: {m}")
        iid = ind.get("id", "")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", iid): e("id inválido (só minúsculas, números e hífen)")
        if nome != iid + ".json": e(f"o nome do arquivo deve ser {iid}.json")
        if iid in ids: e("id repetido")
        ids.add(iid)
        if ind.get("categoria") not in cats: e(f"categoria '{ind.get('categoria')}' não existe em site.json")
        if ind.get("tipo") not in TIPOS: e(f"tipo deve ser um de {sorted(TIPOS)}")
        for k in ["titulo", "subtitulo"]:
            if not str(ind.get(k, "")).strip(): e(f"falta {k}")
        fonte = ind.get("fonte") or {}
        if not fonte.get("nome"): e("falta fonte.nome (sem fonte o indicador não aparece)")
        if fonte.get("url") and not fonte["url"].startswith("http"): e("fonte.url deve começar com http")
        for f in ind.get("fontes", []):
            if not f.get("nome"): e("item de fontes sem nome")
            if f.get("url") and not f["url"].startswith("http"): e(f"url inválida em fontes: {f.get('url')}")
        cols, linhas = ind.get("colunas", []), ind.get("linhas", [])
        if not cols or not linhas: e("sem colunas ou sem linhas de dados")
        if len(set(cols)) != len(cols): e("nomes de coluna repetidos")
        for i, r in enumerate(linhas):
            if len(r) != len(cols): e(f"linha {i+1} tem {len(r)} valores e há {len(cols)} colunas")
        if ind.get("tipo") != "tabela":
            if ind.get("x") not in cols: e(f"x '{ind.get('x')}' não é coluna")
            ser = ind.get("series", [])
            if not ser: e("series vazia")
            for s in ser:
                if s not in cols: e(f"série '{s}' não é coluna")
                else:
                    k = cols.index(s)
                    if not any(isinstance(r[k], (int, float)) for r in linhas): e(f"série '{s}' não tem números")
            if ind.get("tipo") == "dispersao" and ind.get("rotulo") and ind["rotulo"] not in cols: e("rotulo não é coluna")
        if ind.get("barra") and ind["barra"] not in cols: e("barra não é coluna")
        if not ind.get("como_ler"): a("sem 'como_ler'")
        if len(ind.get("contexto", [])) < 1: a("sem 'contexto'")
        if not ind.get("atualizacao", {}).get("ultima_conferencia"): a("sem atualizacao.ultima_conferencia")
        for campo, t in textos(ind):
            for p, msg in PROIBIDOS:
                if p in (t or ""): e(f"{campo}: {msg}")
    return erros, avisos

# ------------------------------------------------------------------ páginas estáticas
def site_url():
    env = os.environ.get("SITE_URL")
    if env: return env.rstrip("/")
    m = re.search(r'SITE_URL:\s*"([^"]*)"', (ROOT / "config.js").read_text(encoding="utf-8"))
    return (m.group(1) if m else "").rstrip("/")

def pagina(tpl, *, title, og_title, desc, path, og_image, v, noscript=""):
    base = site_url()
    rep = {"{{TITLE}}": html.escape(title), "{{OG_TITLE}}": html.escape(og_title), "{{DESC}}": html.escape(desc),
           "{{URL}}": html.escape(base + path), "{{OG_IMAGE}}": html.escape(base + og_image), "{{V}}": v, "{{NOSCRIPT}}": noscript}
    out = tpl
    for k, val in rep.items(): out = out.replace(k, val)
    if path == "/admin/": out = out.replace('<meta name="description"', '<meta name="robots" content="noindex,nofollow">\n<meta name="description"', 1)
    return out

def escreve(rel, txt):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(txt, encoding="utf-8")

def noscript_ind(ind, cat_nome):
    e = html.escape
    partes = [f'<article class="wrap detail"><p class="eyebrow">{e(cat_nome)}</p><h1>{e(ind["titulo"])}</h1><p class="lede">{e(ind["subtitulo"])}</p>']
    if ind.get("como_ler"): partes.append(f'<h2>Como ler {"a tabela" if ind.get("tipo") == "tabela" else "o gráfico"}</h2><p>{e(ind["como_ler"])}</p>')
    if ind.get("contexto"): partes.append("<h2>Contexto</h2>" + "".join(f"<p>{e(p)}</p>" for p in ind["contexto"]))
    f = ind["fonte"]
    partes.append(f'<p>Fonte: <a href="{e(f.get("url",""))}">{e(f["nome"])}</a></p></article>')
    return "".join(partes)

def build():
    site, inds = carregar()
    erros, avisos = validar(site, inds)
    for a in avisos: print("aviso:", a)
    if erros:
        for e in erros: print("ERRO:", e)
        sys.exit(1)
    if "--checar" in sys.argv:
        print(f"ok: {len(inds)} indicadores válidos"); return
    if "--formatar" in sys.argv:
        for ind in inds: (DATA / "indicadores" / ind["_arquivo"]).write_text(dump_indicador(ind), encoding="utf-8")
        print("formatados", len(inds)); return

    cats = sorted(site["categorias"], key=lambda c: c.get("ordem", 0))
    publicos = [{k: v for k, v in i.items() if not k.startswith("_") and k != "checagem"} for i in
                sorted(inds, key=lambda i: ([c["id"] for c in cats].index(i["categoria"]), i.get("ordem", 0)))]
    pacote = {"site": site["site"], "categorias": cats, "indicadores": publicos}
    txt = json.dumps(pacote, ensure_ascii=False, separators=(",", ":"))
    escreve("data/indicadores.json", txt)
    v = hashlib.sha1((txt + "".join((ROOT / "assets" / f).read_text(encoding="utf-8") for f in ["app.js", "charts.js", "admin.js", "store.js", "style.css"])).encode()).hexdigest()[:10]

    tpl = (ROOT / "scripts" / "template.html").read_text(encoding="utf-8")
    og = lambda iid: f"/og/{iid}.png" if (ROOT / "og" / f"{iid}.png").exists() else "/og/site.png"
    nome = site["site"].get("nome", "Indicadores BR")
    desc_home = "Dados públicos do Brasil reunidos, conferidos e explicados, com gráficos para entender e compartilhar e a fonte oficial de cada número."
    escreve("index.html", pagina(tpl, title=f"{nome} · dados públicos do Brasil, com fonte", og_title=nome, desc=desc_home, path="/", og_image="/og/site.png", v=v))
    escreve("404.html", pagina(tpl, title=f"Página não encontrada · {nome}", og_title=nome, desc=desc_home, path="/404", og_image="/og/site.png", v=v))
    fixas = {"metodo": ("Método", "Como o Indicadores BR coleta, confere, explica e corrige os dados."),
             "sugira": ("Sugira dados", "Diga que dado público você gostaria de ver no portal."),
             "contato": ("Contato", "Fale com a equipe do Indicadores BR."),
             "admin": ("Administração", "Área restrita.")}
    for slug, (t, d) in fixas.items():
        escreve(f"{slug}/index.html", pagina(tpl, title=f"{t} · {nome}", og_title=t, desc=d, path=f"/{slug}/", og_image="/og/site.png", v=v))
    urls = ["/", "/metodo", "/sugira", "/contato"]
    for c in cats:
        escreve(f"categoria/{c['id']}/index.html", pagina(tpl, title=f"{c['nome']} · {nome}", og_title=c["nome"], desc=c.get("descricao") or desc_home, path=f"/categoria/{c['id']}", og_image="/og/site.png", v=v))
        urls.append(f"/categoria/{c['id']}")
    for i in publicos:
        if i.get("visivel") is False: continue
        cat = next(c for c in cats if c["id"] == i["categoria"])
        escreve(f"indicador/{i['id']}/index.html", pagina(tpl, title=f"{i['titulo']} · {nome}", og_title=i["titulo"], desc=i["subtitulo"], path=f"/indicador/{i['id']}", og_image=og(i["id"]), v=v, noscript=noscript_ind(i, cat["nome"])))
        urls.append(f"/indicador/{i['id']}")
    base = site_url() or "https://SEU-DOMINIO"
    hoje = datetime.date.today().isoformat()
    escreve("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            "".join(f"  <url><loc>{base}{u}</loc><lastmod>{hoje}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    escreve("robots.txt", f"User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: {base}/sitemap.xml\n")

    # catálogo de fontes (roteiro de atualização)
    md = ["# Catálogo de fontes", "",
          f"Gerado por `scripts/build.py` em {hoje}. Não edite à mão: mude o indicador em `data/indicadores/` e rode o build.", ""]
    for c in cats:
        dos = [i for i in inds if i["categoria"] == c["id"]]
        if not dos: continue
        md += [f"## {c['nome']}", "", "| Indicador | Fonte principal | Periodicidade | Endereço de atualização | Próxima divulgação | Última conferência |", "|---|---|---|---|---|---|"]
        for i in sorted(dos, key=lambda i: i.get("ordem", 0)):
            a = i.get("atualizacao") or {}
            cel = lambda s: str(s or "").replace("|", "/").replace("\n", " ")
            oculto = " (oculto)" if i.get("visivel") is False else ""
            md.append(f"| `{i['id']}`{oculto}: {cel(i['titulo'])} | [{cel(i['fonte'].get('nome'))}]({i['fonte'].get('url','')}) | {cel(a.get('periodicidade'))} | {cel(a.get('onde_buscar'))} | {cel(a.get('proxima'))} | {cel(a.get('ultima_conferencia'))} |")
        md.append("")
    escreve("docs/catalogo_de_fontes.md", "\n".join(md))

    # carga do banco
    q = lambda s: "'" + str(s).replace("'", "''") + "'"
    sql = ["-- Indicadores BR · carga gerada por scripts/build.py em " + hoje,
           "-- Rode depois de supabase/schema.sql. Atualiza site, categorias e indicadores sem apagar reports, sugestões e contatos.",
           "begin;",
           f"insert into public.config (chave, valor) values ('site', {q(json.dumps(site['site'], ensure_ascii=False))}::jsonb) on conflict (chave) do update set valor = excluded.valor;"]
    for c in cats:
        sql.append(f"insert into public.categorias (id, nome, descricao, ordem) values ({q(c['id'])}, {q(c['nome'])}, {q(c.get('descricao',''))}, {int(c.get('ordem',0))}) on conflict (id) do update set nome = excluded.nome, descricao = excluded.descricao, ordem = excluded.ordem;")
    for i in publicos:
        sql.append(f"insert into public.indicadores (id, categoria, conteudo) values ({q(i['id'])}, {q(i['categoria'])}, {q(json.dumps(i, ensure_ascii=False))}::jsonb) on conflict (id) do update set conteudo = excluded.conteudo;")
    sql.append("commit;")
    escreve("supabase/seed.sql", "\n".join(sql) + "\n")
    print(f"ok: {len(publicos)} indicadores, {len(cats)} categorias, versão {v}")

if __name__ == "__main__":
    build()
