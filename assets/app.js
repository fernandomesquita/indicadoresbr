// Indicadores BR · site público
import { h, ICON, fmtV, fmtCell, isNum, numericCols, colDecs, domain, reduced, renderTable, mountChart, clearCharts, composePNG, FORMATS, setGovernos } from "./charts.js";
import * as store from "./store.js";

const CFG = window.IBR_CONFIG || {};
const $ = (s, el = document) => el.querySelector(s);
const app = $("#app");
let DATA = null;
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };

/* ------------------------------------------------------------ dados derivados */
const visiveis = () => DATA.indicadores.filter(i => i.visivel !== false && i.fonte && i.fonte.nome);
const catDe = id => DATA.categorias.find(c => c.id === id);
const doCat = id => visiveis().filter(i => i.categoria === id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
const siteNome = () => (DATA.site && DATA.site.nome) || "Indicadores BR";
const siteURL = () => (CFG.SITE_URL || location.origin).replace(/\/$/, "");
const dataBR = iso => iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "";
// primeira parte do texto de periodicidade, para o cabeçalho (o texto inteiro aparece em "Quando este dado muda")
const resumoPer = t => { const c = String(t).split(/[;(.]/)[0].trim(); return c.length > 2 && c.length < 70 ? c : (String(t).length > 70 ? String(t).slice(0, 67).trim() + "…" : String(t)); };

function maisRecente(ind) {
  const xi = ind.colunas.indexOf(ind.x);
  if (xi < 0 || ind.tipo === "tabela" || ind.tipo === "barras" || ind.tipo === "dispersao") return null;
  const v = ind.linhas.map(r => r[xi]).filter(x => x != null && x !== "");
  return v.length ? String(v[v.length - 1]) : null;
}

/* ------------------------------------------------------------ navegação */
export function go(path, { replace = false } = {}) {
  if (path === location.pathname + location.hash) return;
  history[replace ? "replaceState" : "pushState"]({}, "", path);
  render();
}
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-nav]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault(); go(a.getAttribute("href")); closeMenu();
});
window.addEventListener("popstate", render);
const link = (href, attrs, ...kids) => h("a", { href, "data-nav": "", ...(attrs || {}) }, ...kids);

function setMeta(title, desc) {
  document.title = title ? `${title} · ${siteNome()}` : `${siteNome()} · dados públicos do Brasil, com fonte`;
  const m = document.querySelector('meta[name="description"]'); if (m && desc) m.setAttribute("content", desc);
}
function focusMain() { const h1 = app.querySelector("h1"); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); } }

/* ------------------------------------------------------------ cabeçalho */
function renderNav(path) {
  const nav = $("#catnav");
  nav.replaceChildren(...DATA.categorias.map(c => link("/categoria/" + c.id, { class: "catlink", "aria-current": path === "/categoria/" + c.id ? "page" : null }, c.nome)));
  document.querySelectorAll(".mainnav a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === path ? "page" : "false"));
}
const menuBtn = $("#menubtn");
function closeMenu() { document.body.classList.remove("menu-open"); menuBtn && menuBtn.setAttribute("aria-expanded", "false"); }
menuBtn && menuBtn.addEventListener("click", () => { const o = document.body.classList.toggle("menu-open"); menuBtn.setAttribute("aria-expanded", String(o)); });

/* ------------------------------------------------------------ peças comuns */
function ibtn(icon, label, onclick, cls, attrs) { return h("button", { class: "btn " + (cls || ""), type: "button", onclick, ...(attrs || {}) }, h("span", { class: "ico", html: ICON[icon] }), label); }

function card(ind, { compact = false } = {}) {
  const cat = catDe(ind.categoria);
  const art = h("article", { class: "card" + (!compact && (ind.tipo === "tabela" || (ind.tipo === "barras" && ind.linhas.length > 12)) ? " wide" : ""), id: "c-" + ind.id });
  art.append(h("header", {},
    compact && cat ? h("p", { class: "eyebrow", text: cat.nome }) : null,
    h("h3", {}, link("/indicador/" + ind.id, {}, ind.titulo)),
    ind.subtitulo ? h("p", { class: "sub", text: ind.subtitulo }) : null));
  const body = h("div", { class: ind.tipo === "tabela" ? "tblbox" : "chart" });
  art.append(body);
  if (ind.tipo === "tabela") {
    const rows = compact ? { ...ind, linhas: ind.linhas.slice(0, 6) } : ind;
    body.append(renderTable(rows, { animate: !reduced }));
    if (compact && ind.linhas.length > 6) body.append(h("p", { class: "more", text: `Mais ${ind.linhas.length - 6} linhas na página do indicador.` }));
  } else mountChart(ind, body);
  art.append(h("div", { class: "foot" },
    h("p", { class: "src" }, h("strong", { text: "Fonte: " }), ind.fonte.url ? h("a", { href: ind.fonte.url, target: "_blank", rel: "noopener noreferrer", text: ind.fonte.nome }) : ind.fonte.nome),
    h("div", { class: "acts" },
      link("/indicador/" + ind.id, { class: "btn pri" }, "Entenda este dado", h("span", { class: "ico", html: ICON.arrow })),
      ibtn("png", "PNG", () => openShare(ind), "", { "aria-label": "Baixar imagem PNG de " + ind.titulo }),
      ibtn("flag", "Reportar erro", () => openReport(ind), "ghost"))));
  return art;
}

function emptyCat(cat) {
  return h("div", { class: "empty" },
    h("h3", { text: `${cat.nome}: em preparação` }),
    h("p", { text: "Os primeiros indicadores desta categoria entram com fonte oficial, contexto e nota de método. Diga o que você gostaria de ver aqui." }),
    link("/sugira?categoria=" + encodeURIComponent(cat.id), { class: "btn pri" }, "Sugerir dados para " + cat.nome));
}

function sugiraBand() {
  return h("section", { class: "band" }, h("div", { class: "wrap bandin" },
    h("div", {}, h("h2", { text: "Que dado você gostaria de ver aqui?" }),
      h("p", { text: "Conte qual número você procura e, se souber, em que fonte ele aparece. As sugestões orientam os próximos indicadores." })),
    link("/sugira", { class: "btn pri big" }, "Sugerir dados")));
}

/* ------------------------------------------------------------ busca */
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function searchBox({ id = "busca", top = false } = {}) {
  const out = h("ul", { class: "results", role: "listbox", id: id + "-res", hidden: true });
  const input = h("input", { type: "search", id, placeholder: top ? "Buscar indicador: inflação, dívida, concursos" : "Ex.: inflação, desemprego, Câmara, polícia", autocomplete: "off", "aria-controls": id + "-res", "aria-describedby": id + "-dica" });
  const run = () => {
    const q = norm(input.value).trim();
    if (q.length < 2) { out.hidden = true; out.replaceChildren(); return; }
    const terms = q.split(/\s+/);
    const hits = visiveis().filter(i => { const hay = norm([i.titulo, i.subtitulo, (catDe(i.categoria) || {}).nome, (i.glossario || []).map(g => g.termo).join(" ")].join(" ")); return terms.every(t => hay.includes(t)); }).slice(0, 8);
    out.replaceChildren(...(hits.length ? hits.map(i => h("li", {}, link("/indicador/" + i.id, {}, h("strong", { text: i.titulo }), h("span", { text: (catDe(i.categoria) || {}).nome || "" })))) :
      [h("li", { class: "none" }, "Nenhum indicador encontrado. ", link("/sugira?texto=" + encodeURIComponent(input.value), {}, "Sugira este dado"))]));
    out.hidden = false;
  };
  input.addEventListener("input", run);
  input.addEventListener("focus", () => { if (input.value.trim().length >= 2) run(); });
  input.addEventListener("keydown", e => { if (e.key === "Enter") { const a = out.querySelector("a"); if (a) { e.preventDefault(); a.click(); } } if (e.key === "Escape") { input.value = ""; run(); input.blur(); } });
  const box = h("div", { class: "search" + (top ? " top" : "") }, h("label", { for: id, class: top ? "sr" : null, text: "Busque um indicador" }), input, h("p", { id: id + "-dica", class: "sr", text: "Os resultados aparecem abaixo enquanto você digita." }), out);
  box.fechar = () => { out.hidden = true; };
  return box;
}
// busca fixa no topo: montada uma vez e mantida entre as páginas
let topBusca = null;
function montaBuscaTopo() {
  const slot = $("#topsearch");
  if (!slot || topBusca) return;
  topBusca = searchBox({ id: "busca-topo", top: true });
  slot.replaceChildren(topBusca);
  document.addEventListener("click", e => { if (!topBusca.contains(e.target)) topBusca.fechar(); });
  topBusca.addEventListener("click", e => { if (e.target.closest("a[data-nav]")) { topBusca.querySelector("input").value = ""; topBusca.fechar(); } });
}

/* ------------------------------------------------------------ últimos dados (carrossel da home) */
const SERIE_TIPOS = ["linha", "colunas"];
function resumoUltimo(ind) {
  const cols = ind.colunas || [], rows = ind.linhas || [];
  if (!rows.length) return null;
  const anual = k => rows.every(r => Number.isInteger(r[k]) && r[k] >= 1800 && r[k] <= 2100);
  if (SERIE_TIPOS.includes(ind.tipo)) {
    const xi = cols.indexOf(ind.x), si = cols.indexOf((ind.series || [])[0]);
    if (xi < 0 || si < 0) return null;
    if (!ind.ultimo && !anual(xi)) return null; // eixo de partidos, estados etc.: só entra com rótulo próprio
    const pts = rows.filter(r => isNum(r[si]));
    if (!pts.length) return null;
    const ult = pts[pts.length - 1];
    return { valor: fmtV(ult[si], ind), legenda: cols[si] + " · " + (ind.ultimo || ult[xi]), serie: pts.map(r => r[si]), forma: ind.tipo };
  }
  if (ind.tipo === "tabela" && ind.ultimo) {
    const bi = cols.indexOf(ind.barra), ult = rows[rows.length - 1];
    const vi = bi >= 0 ? bi : cols.findIndex((c, k) => k > 0 && isNum(ult[k]));
    if (vi < 0 || !isNum(ult[vi])) return null;
    return { valor: fmtV(ult[vi], ind), legenda: cols[vi] + " · " + ind.ultimo, serie: null };
  }
  return null;
}
function sparkline(vals, forma) {
  const W = 220, H = 52, p = 4, mn = forma === "colunas" ? Math.min(0, ...vals) : Math.min(...vals), mx = Math.max(...vals), rg = (mx - mn) || 1;
  const y = v => H - p - ((v - mn) / rg) * (H - 2 * p);
  const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "spark"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("preserveAspectRatio", "none");
  const el = (t, a) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); svg.append(e); return e; };
  if (forma === "colunas") {
    const bw = (W - p * 2) / vals.length;
    vals.forEach((v, i) => el("rect", { x: p + i * bw + bw * .15, y: Math.min(y(v), y(0)), width: bw * .7, height: Math.max(1, Math.abs(y(0) - y(v))), class: i === vals.length - 1 ? "last" : "" }));
  } else {
    const x = i => p + (vals.length > 1 ? i * (W - 2 * p) / (vals.length - 1) : (W - 2 * p) / 2);
    el("polyline", { points: vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ") });
  }
  return svg;
}
function ultimosDados(n = 8) {
  const ordemHome = new Map(DATA.categorias.map((c, k) => [c.id, k]));
  const lista = visiveis().map(i => ({ i, r: resumoUltimo(i), d: (i.atualizacao || {}).ultima_conferencia || "" })).filter(x => x.r)
    .sort((a, b) => b.d.localeCompare(a.d) || (ordemHome.get(a.i.categoria) - ordemHome.get(b.i.categoria)) || ((a.i.ordem || 0) - (b.i.ordem || 0)))
    .slice(0, n);
  return lista;
}
function carrossel() {
  const itens = ultimosDados();
  if (!itens.length) return null;
  let k = 0, timer = null, parado = reduced;
  const slides = itens.map(({ i, r, d }, n) => h("article", { class: "slide", role: "group", "aria-roledescription": "slide", "aria-label": `${n + 1} de ${itens.length}`, hidden: n !== 0 },
    h("p", { class: "eyebrow", text: (catDe(i.categoria) || {}).nome || "" }),
    h("h3", {}, link("/indicador/" + i.id, {}, i.titulo)),
    h("p", { class: "big", text: r.valor }),
    h("p", { class: "leg", text: r.legenda }),
    r.serie && r.serie.length > 1 ? sparkline(r.serie, r.forma) : null,
    h("p", { class: "sfoot" }, d ? h("span", { text: "Conferido em " + dataBR(d) }) : h("span"), link("/indicador/" + i.id, { class: "ver" }, "Ver indicador"))));
  const live = h("div", { class: "slides", "aria-live": "off" }, slides);
  const dots = h("div", { class: "dots" }, itens.map((x, n) => h("button", { type: "button", "aria-label": `Mostrar ${n + 1}: ${x.i.titulo}`, "aria-current": n === 0 ? "true" : null, onclick: () => { para(); mostra(n); } })));
  const box = h("section", { class: "carrossel", "aria-roledescription": "carrossel", "aria-label": "Últimos dados" },
    h("div", { class: "chead" }, h("h2", { text: "Últimos dados" }),
      h("div", { class: "cnav" },
        h("button", { type: "button", class: "btn ghost", "aria-label": "Anterior", text: "‹", onclick: () => { para(); mostra(k - 1); } }),
        h("button", { type: "button", class: "btn ghost", "aria-label": "Próximo", text: "›", onclick: () => { para(); mostra(k + 1); } }))),
    live, dots);
  function mostra(n) {
    k = (n + slides.length) % slides.length;
    slides.forEach((s, j) => { s.hidden = j !== k; });
    [...dots.children].forEach((b, j) => b.setAttribute("aria-current", j === k ? "true" : "false"));
  }
  function para() { parado = true; live.setAttribute("aria-live", "polite"); clearInterval(timer); timer = null; }
  function anda() {
    if (parado || timer) return;
    timer = setInterval(() => {
      if (!box.isConnected) { clearInterval(timer); timer = null; return; }
      if (document.hidden || box.matches(":hover") || box.contains(document.activeElement)) return;
      mostra(k + 1);
    }, 6000);
  }
  let x0 = null;
  live.addEventListener("pointerdown", e => { x0 = e.clientX; });
  live.addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) { para(); mostra(k + (dx < 0 ? 1 : -1)); } });
  box.addEventListener("keydown", e => { if (e.key === "ArrowRight") { para(); mostra(k + 1); } if (e.key === "ArrowLeft") { para(); mostra(k - 1); } });
  anda();
  return box;
}

/* ------------------------------------------------------------ páginas */
function pageHome() {
  setMeta(null, "Dados públicos do Brasil reunidos, conferidos e explicados, com gráficos para entender e compartilhar e a fonte oficial de cada número.");
  const total = visiveis(), fontes = new Set(total.flatMap(i => [(i.fonte.nome || "").split(/[,;(]/)[0].trim(), ...(i.fontes || []).map(f => domain(f.url))]).filter(Boolean));
  const destaques = (DATA.site.destaques || []).map(id => total.find(i => i.id === id)).filter(Boolean);
  const feat = destaques.length ? destaques : DATA.categorias.map(c => doCat(c.id)[0]).filter(Boolean).slice(0, 3);
  return [
    h("section", { class: "hero" }, h("div", { class: "wrap herogrid" },
      h("div", {},
        h("p", { class: "eyebrow", text: "Dados públicos do Brasil" }),
        h("h1", {}, "Os números que explicam o país, ", h("em", { text: "reunidos num lugar só." })),
        h("p", { class: "lede", text: "Os dados oficiais do Brasil estão espalhados por dezenas de órgãos, em planilhas, relatórios e sistemas que não conversam entre si. Cada um tem seu formato, sua data e sua forma de contar. Juntar tudo isso dá trabalho, e é esse trabalho que o " + siteNome() + " faz: coleta cada número na fonte oficial, confere, organiza em séries comparáveis e mostra em gráficos que dá para entender e compartilhar." }),
        h("dl", { class: "stats" },
          h("div", {}, h("dt", { text: "indicadores" }), h("dd", { text: String(total.length) })),
          h("div", {}, h("dt", { text: "fontes consultadas" }), h("dd", { text: String(fontes.size) })),
          h("div", {}, h("dt", { text: "categorias" }), h("dd", { text: String(DATA.categorias.length) })))),
      carrossel())),
    h("section", { class: "wrap how" },
      h("h2", { text: "Como cada indicador é feito" }),
      h("ol", { class: "steps" },
        h("li", {}, h("strong", { text: "Coleta na fonte oficial" }), h("span", { text: "IBGE, Banco Central, Câmara, TSE, Fórum de Segurança e outros órgãos. Nada de número de segunda mão." })),
        h("li", {}, h("strong", { text: "Conferência" }), h("span", { text: "Cada série é comparada com a publicação original antes de entrar no ar, e cada cálculo próprio é explicado." })),
        h("li", {}, h("strong", { text: "Explicação" }), h("span", { text: "Todo gráfico tem uma página com contexto, como ler, glossário e a lista completa de fontes." })),
        h("li", {}, h("strong", { text: "Correção aberta" }), h("span", { text: "Viu algo errado? O botão Reportar erro chega direto a quem mantém o portal." }))),
      h("p", {}, link("/metodo", {}, "Leia o método completo"))),
    h("section", { class: "wrap" },
      h("div", { class: "sechead" }, h("h2", { text: "Categorias" })),
      h("div", { class: "cats" }, DATA.categorias.map(c => {
        const n = doCat(c.id).length;
        return link("/categoria/" + c.id, { class: "catcard" + (n ? "" : " soon") }, h("strong", { text: c.nome }), h("span", { text: c.descricao }), h("em", { text: n ? `${n} ${n === 1 ? "indicador" : "indicadores"}` : "em preparação" }));
      }))),
    feat.length ? h("section", { class: "wrap" }, h("div", { class: "sechead" }, h("h2", { text: "Para começar" })), h("div", { class: "grid three" }, feat.map(i => card(i, { compact: true })))) : null,
    sugiraBand(),
  ];
}

function pageCategoria(id) {
  const cat = catDe(id);
  if (!cat) return page404();
  setMeta(cat.nome, cat.descricao);
  const inds = doCat(cat.id);
  return [
    h("section", { class: "wrap pagehead" },
      h("nav", { class: "crumbs", "aria-label": "Você está em" }, link("/", {}, "Início"), h("span", { "aria-hidden": "true", text: "›" }), h("span", { text: cat.nome })),
      h("h1", { text: cat.nome }), cat.descricao ? h("p", { class: "lede", text: cat.descricao }) : null,
      h("p", { class: "cnt", text: inds.length ? `${inds.length} ${inds.length === 1 ? "indicador" : "indicadores"}. Clique em "Entenda este dado" para ver contexto, tabela completa e fontes.` : "" })),
    h("section", { class: "wrap" }, h("div", { class: "grid" }, inds.length ? inds.map(i => card(i)) : emptyCat(cat))),
    sugiraBand(),
  ];
}

function pageIndicador(id) {
  const ind = visiveis().find(i => i.id === id);
  if (!ind) return page404();
  const cat = catDe(ind.categoria) || { nome: "", id: "" };
  setMeta(ind.titulo, ind.subtitulo);
  const recente = maisRecente(ind);
  const conferido = (ind.atualizacao && ind.atualizacao.ultima_conferencia) || DATA.site.atualizado;
  const chartBox = h("div", { class: ind.tipo === "tabela" ? "tblbox" : "chart big" });
  const tableBox = h("div", { class: "tblbox" });
  const fontes = [ind.fonte, ...(ind.fontes || [])].filter((f, i, a) => f && f.nome && a.findIndex(g => (g.url || g.nome) === (f.url || f.nome)) === i);
  const outros = doCat(ind.categoria).filter(i => i.id !== ind.id).slice(0, 3);
  const up = ind.atualizacao || {};
  const view = [
    h("article", { class: "wrap detail" },
      h("nav", { class: "crumbs", "aria-label": "Você está em" }, link("/", {}, "Início"), h("span", { "aria-hidden": "true", text: "›" }), link("/categoria/" + cat.id, {}, cat.nome), h("span", { "aria-hidden": "true", text: "›" }), h("span", { text: ind.titulo })),
      h("header", { class: "dhead" },
        h("h1", { text: ind.titulo }), ind.subtitulo ? h("p", { class: "lede", text: ind.subtitulo }) : null,
        h("ul", { class: "meta" },
          h("li", {}, h("span", { text: "Fonte" }), ind.fonte.url ? h("a", { href: ind.fonte.url, target: "_blank", rel: "noopener noreferrer", text: ind.fonte.nome }) : ind.fonte.nome),
          recente ? h("li", {}, h("span", { text: "Dado mais recente" }), recente) : null,
          conferido ? h("li", {}, h("span", { text: "Conferido em" }), dataBR(conferido)) : null,
          up.periodicidade ? h("li", {}, h("span", { text: "Atualização" }), resumoPer(up.periodicidade)) : null)),
      h("div", { class: "dchart" }, chartBox,
        h("div", { class: "acts" },
          ibtn("png", "Baixar PNG", () => openShare(ind), "pri"),
          ibtn("csv", "Baixar CSV", () => baixarCSV(ind)),
          ibtn("link", "Copiar link", ev => copiar(ev.currentTarget, siteURL() + "/indicador/" + ind.id)),
          ibtn("flag", "Reportar erro", () => openReport(ind), "ghost"))),
      h("div", { class: "dbody" },
        h("div", { class: "prose" },
          ind.como_ler ? h("section", { class: "howto", "aria-labelledby": "h-como" }, h("h2", { id: "h-como", text: ind.tipo === "tabela" ? "Como ler a tabela" : "Como ler o gráfico" }), h("p", { text: ind.como_ler })) : null,
          (ind.contexto || []).length ? h("section", { "aria-labelledby": "h-ctx" }, h("h2", { id: "h-ctx", text: "Contexto" }), ind.contexto.map(p => h("p", { text: p }))) : null,
          h("section", { "aria-labelledby": "h-dados" }, h("h2", { id: "h-dados", text: "Os dados" }),
            h("p", { class: "hint", text: "Cada linha tem um botão para reportar erro naquele valor específico." }), tableBox),
          (ind.glossario || []).length ? h("section", { "aria-labelledby": "h-glo" }, h("h2", { id: "h-glo", text: "Glossário" }), h("dl", { class: "glo" }, ind.glossario.map(g => [h("dt", { text: g.termo }), h("dd", { text: g.definicao })]))) : null),
        h("aside", { class: "side" },
          h("section", { "aria-labelledby": "h-fontes" }, h("h2", { id: "h-fontes", text: "Fontes" }),
            h("ol", { class: "fontes" }, fontes.map(f => h("li", {}, f.url ? h("a", { href: f.url, target: "_blank", rel: "noopener noreferrer", text: f.nome }) : h("span", { text: f.nome }), f.o_que_sustenta ? h("span", { class: "why", text: f.o_que_sustenta }) : null, f.url ? h("span", { class: "dom", text: domain(f.url) }) : null)))),
          (up.periodicidade || up.proxima || up.onde_buscar) ? h("section", { "aria-labelledby": "h-upd" }, h("h2", { id: "h-upd", text: "Quando este dado muda" }),
            h("dl", { class: "upd" },
              up.periodicidade ? [h("dt", { text: "Periodicidade" }), h("dd", { text: up.periodicidade })] : null,
              up.proxima ? [h("dt", { text: "Próxima divulgação" }), h("dd", { text: up.proxima })] : null)) : null,
          h("section", { class: "repbox" }, h("h2", { text: "Achou um erro?" }), h("p", { text: "Conte o que está errado e, se puder, qual é o número certo e em que fonte ele aparece. Cada aviso é conferido contra a fonte." }), ibtn("flag", "Reportar erro", () => openReport(ind), "pri"))))),
    outros.length ? h("section", { class: "wrap" }, h("div", { class: "sechead" }, h("h2", { text: "Mais em " + cat.nome })), h("div", { class: "grid three" }, outros.map(i => card(i, { compact: true })))) : null,
    sugiraBand(),
  ];
  requestAnimationFrame(() => {
    if (ind.tipo === "tabela") chartBox.append(renderTable(ind, { animate: !reduced, onReport: p => openReport(ind, p) }));
    else { mountChart(ind, chartBox, { big: true }); tableBox.append(renderTable(ind, { onReport: p => openReport(ind, p) })); }
    if (ind.tipo === "tabela") tableBox.parentElement.hidden = true;
  });
  return view;
}

function pageMetodo() {
  setMeta("Método", "Como o Indicadores BR coleta, confere, explica e corrige os dados.");
  const P = (t) => h("p", { text: t });
  return [h("article", { class: "wrap narrow textpage" },
    h("nav", { class: "crumbs", "aria-label": "Você está em" }, link("/", {}, "Início"), h("span", { "aria-hidden": "true", text: "›" }), h("span", { text: "Método" })),
    h("h1", { text: "Como trabalhamos" }),
    P("O " + siteNome() + " reúne dados públicos que já existem, mas estão espalhados: cada órgão publica no seu site, no seu formato e no seu calendário. Nosso trabalho é encontrar o número na fonte oficial, conferir, colocar lado a lado com os anos anteriores e explicar o que ele mede."),
    h("h2", { text: "Fontes" }),
    P("Usamos a fonte primária sempre que ela existe: o órgão que produz o dado (IBGE, Banco Central, Câmara dos Deputados, TSE, Fórum Brasileiro de Segurança Pública, Ipea e outros). Reportagens servem para contexto e para fatos que não têm registro oficial, e aparecem citadas como tal. Toda página de indicador lista as fontes com link e diz o que cada uma sustenta."),
    h("h2", { text: "Cálculos próprios" }),
    P("Quando o gráfico mostra uma conta nossa (uma média por período, uma taxa por habitante, uma variação entre dois anos), a página diz qual foi a conta e de qual série ela partiu. Mudanças de metodologia da fonte e quebras de série são avisadas no texto Como ler, logo abaixo do gráfico."),
    h("h2", { text: "Mesma régua para todos" }),
    P("Indicadores por governo ou por partido usam o mesmo critério para todos, explicado na própria página. Faixas de governo nos gráficos servem para localizar o leitor no tempo e não atribuem causa: preços, empregos e crimes dependem de muitos fatores, inclusive de fora do país, do Congresso, do Banco Central e dos governos estaduais."),
    h("h2", { text: "Correções" }),
    P("Qualquer pessoa pode apontar um erro pelo botão Reportar erro, em cada gráfico e em cada linha das tabelas. Cada aviso é conferido contra a fonte. Quando o erro se confirma, corrigimos e registramos a data da conferência na página do indicador."),
    h("h2", { text: "Uso das imagens" }),
    P("Os gráficos podem ser baixados em PNG e compartilhados livremente, desde que a imagem não seja alterada. A fonte e o nome do portal já vão na própria imagem."),
    h("p", {}, link("/contato", { class: "btn" }, "Fale com a equipe"), " ", link("/sugira", { class: "btn" }, "Sugira dados")))];
}

/* ------------------------------------------------------------ formulários */
const honeypot = () => h("div", { class: "hp", "aria-hidden": "true" }, h("label", { for: "site_url", text: "Não preencha" }), h("input", { id: "site_url", name: "site_url", tabindex: "-1", autocomplete: "off" }));
function formStatus() { return h("div", { class: "fstatus", role: "status", "aria-live": "polite" }); }
function offlineNote() { return store.hasBackend ? null : h("p", { class: "msg warn", text: "O envio ainda não está ligado neste endereço. Assim que o banco de dados for configurado, este formulário passa a funcionar." }); }
function erroEnvio(r) {
  if (r.motivo === "offline") return "O envio ainda não está ligado neste endereço.";
  if (r.motivo === "validacao") return "Algum campo não passou na conferência. Revise e tente de novo.";
  if (/muitos envios|repetido/.test(r.detalhe || "")) return "Recebemos muitos envios agora. Tente de novo em alguns minutos.";
  return "Não foi possível enviar agora. Tente de novo em instantes.";
}
function fieldErr(input, msg) {
  let el = input.parentElement.querySelector(".ferr");
  if (!el) { el = h("p", { class: "ferr", id: input.id + "-err" }); input.parentElement.append(el); }
  el.textContent = msg || ""; input.setAttribute("aria-invalid", msg ? "true" : "false");
  if (msg) input.setAttribute("aria-describedby", el.id);
}
function sentAt() { return Date.now(); }

function pageSugira() {
  setMeta("Sugira dados", "Diga que dado público você gostaria de ver no portal.");
  const qs = new URLSearchParams(location.search);
  const t0 = sentAt();
  const texto = h("textarea", { id: "s-texto", rows: "5", required: true, placeholder: "Ex.: quanto cada estado gasta com saúde por habitante, ano a ano", text: qs.get("texto") || "" });
  const catSel = h("select", { id: "s-cat" }, h("option", { value: "", text: "Escolha, se souber" }), DATA.categorias.map(c => h("option", { value: c.id, selected: qs.get("categoria") === c.id, text: c.nome })), h("option", { value: "outra", text: "Outra" }));
  const onde = h("input", { id: "s-onde", placeholder: "Nome do órgão, site ou relatório" });
  const email = h("input", { id: "s-email", type: "email", autocomplete: "email", placeholder: "voce@exemplo.com" });
  const st = formStatus();
  const form = h("form", { class: "form", novalidate: true },
    offlineNote(),
    h("div", { class: "f" }, h("label", { for: "s-texto", text: "Que dado você gostaria de ver?" }), texto, h("p", { class: "fhelp", text: "Descreva com suas palavras. Pelo menos três palavras." })),
    h("div", { class: "f2" },
      h("div", { class: "f" }, h("label", { for: "s-cat", text: "Categoria" }), catSel),
      h("div", { class: "f" }, h("label", { for: "s-onde", text: "Em que fonte esse dado pode estar (opcional)" }), onde)),
    h("div", { class: "f" }, h("label", { for: "s-email", text: "Seu e-mail (opcional)" }), email, h("p", { class: "fhelp", text: "Só para avisar quando o dado entrar no portal." })),
    honeypot(),
    h("button", { class: "btn pri big", type: "submit", disabled: !store.hasBackend }, "Enviar sugestão"), st);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (form.site_url && form.querySelector("#site_url").value) return;
    let ok = true;
    if (store.palavras(texto.value) < 3) { fieldErr(texto, "Escreva pelo menos três palavras sobre o dado."); ok = false; } else fieldErr(texto, "");
    if (email.value && !email.checkValidity()) { fieldErr(email, "Confira o e-mail."); ok = false; } else fieldErr(email, "");
    if (!ok) { form.querySelector('[aria-invalid="true"]').focus(); return; }
    if (Date.now() - t0 < 2500) { st.textContent = "Um instante antes de enviar."; return; }
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Enviando…";
    const r = await store.enviarSugestao({ texto: texto.value, categoria: catSel.value, onde: onde.value, email: email.value });
    btn.disabled = false; btn.textContent = "Enviar sugestão";
    if (r.ok) { form.replaceChildren(h("div", { class: "done" }, h("h2", { text: "Sugestão recebida" }), h("p", { text: "Obrigado. As sugestões são lidas uma a uma e orientam os próximos indicadores." }), link("/", { class: "btn" }, "Voltar ao início"))); }
    else st.replaceChildren(h("p", { class: "msg err", text: erroEnvio(r) }));
  });
  return [h("section", { class: "wrap narrow textpage" },
    h("nav", { class: "crumbs", "aria-label": "Você está em" }, link("/", {}, "Início"), h("span", { "aria-hidden": "true", text: "›" }), h("span", { text: "Sugira dados" })),
    h("h1", { text: "Sugira dados" }),
    h("p", { class: "lede", text: "Procurou um número e não achou? Conte qual é. Se souber em que fonte ele é publicado, ajuda muito." }), form)];
}

function pageContato() {
  setMeta("Contato", "Fale com a equipe do Indicadores BR.");
  const t0 = sentAt();
  const nome = h("input", { id: "c-nome", required: true, autocomplete: "name" });
  const email = h("input", { id: "c-email", type: "email", required: true, autocomplete: "email" });
  const assunto = h("select", { id: "c-assunto" }, ["Dúvida", "Correção", "Imprensa", "Parceria", "Outro"].map(a => h("option", { value: a, text: a })));
  const msg = h("textarea", { id: "c-msg", rows: "6", required: true });
  const st = formStatus();
  const form = h("form", { class: "form", novalidate: true },
    offlineNote(),
    h("div", { class: "f2" },
      h("div", { class: "f" }, h("label", { for: "c-nome", text: "Nome" }), nome),
      h("div", { class: "f" }, h("label", { for: "c-email", text: "E-mail" }), email)),
    h("div", { class: "f" }, h("label", { for: "c-assunto", text: "Assunto" }), assunto),
    h("div", { class: "f" }, h("label", { for: "c-msg", text: "Mensagem" }), msg),
    h("p", { class: "fhelp", text: "Para apontar erro num número, o botão Reportar erro, na página do indicador, já leva o aviso direto ao dado certo." }),
    honeypot(),
    h("button", { class: "btn pri big", type: "submit", disabled: !store.hasBackend }, "Enviar mensagem"), st);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (form.querySelector("#site_url").value) return;
    let ok = true;
    if (nome.value.trim().length < 2) { fieldErr(nome, "Diga seu nome."); ok = false; } else fieldErr(nome, "");
    if (!email.value || !email.checkValidity()) { fieldErr(email, "Precisamos de um e-mail válido para responder."); ok = false; } else fieldErr(email, "");
    if (msg.value.trim().length < 10) { fieldErr(msg, "Escreva sua mensagem (pelo menos 10 caracteres)."); ok = false; } else fieldErr(msg, "");
    if (!ok) { form.querySelector('[aria-invalid="true"]').focus(); return; }
    if (Date.now() - t0 < 2500) { st.textContent = "Um instante antes de enviar."; return; }
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Enviando…";
    const r = await store.enviarContato({ nome: nome.value, email: email.value, assunto: assunto.value, mensagem: msg.value });
    btn.disabled = false; btn.textContent = "Enviar mensagem";
    if (r.ok) form.replaceChildren(h("div", { class: "done" }, h("h2", { text: "Mensagem enviada" }), h("p", { text: "Obrigado pelo contato. Respondemos pelo e-mail informado." }), link("/", { class: "btn" }, "Voltar ao início")));
    else st.replaceChildren(h("p", { class: "msg err", text: erroEnvio(r) }));
  });
  return [h("section", { class: "wrap narrow textpage" },
    h("nav", { class: "crumbs", "aria-label": "Você está em" }, link("/", {}, "Início"), h("span", { "aria-hidden": "true", text: "›" }), h("span", { text: "Contato" })),
    h("h1", { text: "Contato" }),
    h("p", { class: "lede", text: "Dúvidas, pedidos da imprensa, parcerias ou qualquer outro assunto." }), form)];
}

function page404() {
  setMeta("Página não encontrada");
  return [h("section", { class: "wrap narrow textpage" }, h("h1", { text: "Página não encontrada" }), h("p", { class: "lede", text: "O endereço pode ter mudado. Use a busca no topo da página ou volte ao início." }), h("p", {}, link("/", { class: "btn" }, "Voltar ao início")))];
}

/* ------------------------------------------------------------ modais */
const modal = $("#modal"), mbox = $("#mbox");
let lastFocus = null;
function openModal(content, label) {
  lastFocus = document.activeElement;
  mbox.replaceChildren(...content); mbox.setAttribute("aria-label", label);
  modal.hidden = false; document.body.classList.add("modal-open");
  const f = mbox.querySelector("textarea, input:not([type=hidden]), select, button"); f && f.focus();
}
export function closeModal() { modal.hidden = true; document.body.classList.remove("modal-open"); mbox.replaceChildren(); lastFocus && lastFocus.focus && lastFocus.focus(); }
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => {
  if (modal.hidden) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "Tab") { const f = [...mbox.querySelectorAll("a[href], button:not([disabled]), input, select, textarea")].filter(x => !x.closest(".hp")); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
});
const closeBtn = () => h("button", { class: "mclose", type: "button", "aria-label": "Fechar", onclick: closeModal, text: "×" });

function openReport(ind, ponto) {
  const t0 = sentAt();
  const motivo = h("textarea", { id: "r-motivo", rows: "5", required: true, placeholder: "Ex.: o IPCA de 2015 na fonte oficial é 10,67%, e aqui aparece outro valor" });
  const cnt = h("span", { class: "wc", "aria-live": "polite", text: "0 de 5 palavras" });
  const upd = () => { const n = store.palavras(motivo.value); cnt.textContent = n >= 5 ? `${n} palavras` : `${n} de 5 palavras`; cnt.classList.toggle("ok", n >= 5); };
  motivo.addEventListener("input", upd);
  const email = h("input", { id: "r-email", type: "email", autocomplete: "email", placeholder: "voce@exemplo.com" });
  const st = formStatus();
  const form = h("form", { class: "form", novalidate: true },
    offlineNote(),
    h("p", { class: "rctx" }, h("strong", { text: ind.titulo }), ponto ? h("span", { text: "Valor apontado: " + ponto }) : h("span", { text: "Reporte sobre o gráfico como um todo. Para um valor específico, use o botão na linha da tabela, na página do indicador." })),
    h("div", { class: "f" }, h("label", { for: "r-motivo", text: "Por que este dado parece errado?" }), motivo, h("div", { class: "fhelp row" }, h("span", { text: "Mínimo de 5 palavras. Se souber o valor certo e a fonte, diga." }), cnt)),
    h("div", { class: "f" }, h("label", { for: "r-email", text: "Seu e-mail (opcional)" }), email, h("p", { class: "fhelp", text: "Só para contar o resultado da conferência." })),
    honeypot(),
    h("div", { class: "row" }, h("button", { class: "btn pri", type: "submit", disabled: !store.hasBackend }, "Enviar report"), h("button", { class: "btn", type: "button", onclick: closeModal }, "Cancelar")), st);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (form.querySelector("#site_url").value) return;
    if (store.palavras(motivo.value) < 5) { fieldErr(motivo, "Explique com pelo menos 5 palavras o que está errado."); motivo.focus(); return; } else fieldErr(motivo, "");
    if (email.value && !email.checkValidity()) { fieldErr(email, "Confira o e-mail."); email.focus(); return; } else fieldErr(email, "");
    if (Date.now() - t0 < 2000) { st.textContent = "Um instante antes de enviar."; return; }
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Enviando…";
    const r = await store.enviarReport({ indicador_id: ind.id, ponto, motivo: motivo.value, email: email.value, pagina: location.pathname });
    btn.disabled = false; btn.textContent = "Enviar report";
    if (r.ok) form.replaceChildren(h("div", { class: "done" }, h("h2", { text: "Report recebido" }), h("p", { text: "Obrigado. Vamos conferir contra a fonte e corrigir se for o caso." }), h("button", { class: "btn", type: "button", onclick: closeModal }, "Fechar")));
    else st.replaceChildren(h("p", { class: "msg err", text: erroEnvio(r) }));
  });
  openModal([closeBtn(), h("h2", { class: "mtitle", text: "Reportar erro" }), form], "Reportar erro");
}

let share = null;
async function openShare(ind) {
  const longa = ind.tipo === "tabela" && ind.linhas.length > 14;
  share = { ind, fk: longa ? "stories" : (lsGet("ibr_fmt") || "feed"), tk: lsGet("ibr_theme") || "claro" };
  if (!FORMATS[share.fk] || FORMATS[share.fk].oculto) share.fk = "feed";
  const img = h("img", { alt: "Prévia da imagem de " + ind.titulo });
  const fmt = h("div", { class: "seg", role: "group", "aria-label": "Formato" }), thm = h("div", { class: "seg", role: "group", "aria-label": "Tema" });
  const save = h("a", { class: "btn pri", download: "" }, h("span", { class: "ico", html: ICON.png }), "Salvar PNG");
  const refresh = async () => {
    fmt.replaceChildren(...Object.entries(FORMATS).filter(([, v]) => !v.oculto).map(([k, v]) => h("button", { type: "button", "aria-pressed": String(share.fk === k), onclick: () => { share.fk = k; lsSet("ibr_fmt", k); refresh(); } }, v.nome)));
    thm.replaceChildren(...[["claro", "Claro"], ["escuro", "Escuro"]].map(([k, n]) => h("button", { type: "button", "aria-pressed": String(share.tk === k), onclick: () => { share.tk = k; lsSet("ibr_theme", k); refresh(); } }, n)));
    const cv = await composePNG(ind, share.fk, share.tk, { categoria: (catDe(ind.categoria) || {}).nome || "", siteNome: siteNome(), siteDominio: domain(siteURL()) });
    const url = cv.toDataURL("image/png");
    img.src = url; save.href = url; save.setAttribute("download", `indicadores-br_${ind.id}_${share.fk}.png`);
  };
  openModal([closeBtn(), h("div", { class: "share" },
    h("div", { class: "pv" }, img),
    h("div", { class: "side" },
      h("h2", { class: "mtitle", text: "Baixar imagem" }),
      h("div", {}, h("p", { class: "lbl", text: "Formato" }), fmt),
      h("div", {}, h("p", { class: "lbl", text: "Tema" }), thm),
      save,
      h("p", { class: "hint", text: (longa ? "Tabelas longas ficam mais legíveis no formato Stories. " : "") + "A imagem leva o título, o gráfico, a fonte e o nome do portal. No celular, se o download não começar, toque e segure a imagem para salvar." })))], "Baixar imagem");
  await refresh();
}

function baixarCSV(ind) {
  const esc = v => { const s = v == null ? "" : String(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const numCol = numericCols(ind);
  const linhas = [ind.colunas.map(esc).join(";"), ...ind.linhas.map(r => r.map((v, k) => esc(numCol[k] && isNum(v) ? String(v).replace(".", ",") : v)).join(";"))];
  const txt = "﻿" + linhas.join("\n") + `\n\nFonte: ${ind.fonte.nome}${ind.fonte.url ? " (" + ind.fonte.url + ")" : ""}\nPortal: ${siteNome()} ${siteURL()}/indicador/${ind.id}\n`;
  const a = h("a", { href: URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" })), download: `indicadores-br_${ind.id}.csv` });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
async function copiar(btn, url) {
  const lab = btn.lastChild, old = lab.textContent;
  try { await navigator.clipboard.writeText(url); lab.textContent = "Link copiado"; } catch (e) { lab.textContent = url; }
  setTimeout(() => { lab.textContent = old; }, 2400);
}

/* ------------------------------------------------------------ roteador */
async function render() {
  if (!DATA) return;
  const path = location.pathname.replace(/\/+$/, "") || "/";
  clearCharts();
  closeModal();
  renderNav(path);
  if (topBusca) topBusca.fechar();
  if (path === "/admin") {
    document.body.classList.add("is-admin");
    const { renderAdmin } = await import("./admin.js");
    renderAdmin(app, DATA, { reload: async () => { DATA = await store.loadData(); setGovernos(DATA.site.governos); } });
    window.scrollTo(0, 0); return;
  }
  document.body.classList.remove("is-admin");
  let view;
  const m = path.match(/^\/(categoria|indicador)\/([a-z0-9-]+)$/);
  if (path === "/") view = pageHome();
  else if (m && m[1] === "categoria") view = pageCategoria(m[2]);
  else if (m && m[1] === "indicador") view = pageIndicador(m[2]);
  else if (path === "/sugira") view = pageSugira();
  else if (path === "/contato") view = pageContato();
  else if (path === "/metodo") view = pageMetodo();
  else view = page404();
  app.replaceChildren(...[view].flat(Infinity).filter(Boolean));
  window.scrollTo(0, 0);
  focusMain();
}

async function boot() {
  try { DATA = await store.loadData(); }
  catch (e) { app.replaceChildren(h("section", { class: "wrap narrow textpage" }, h("h1", { text: "Não foi possível carregar os indicadores" }), h("p", { class: "lede", text: "Recarregue a página em instantes." }))); return; }
  DATA.site = DATA.site || {}; DATA.categorias = (DATA.categorias || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  setGovernos(DATA.site.governos);
  try { await document.fonts.ready; } catch (e) {}
  const yr = $("#ano"); if (yr) yr.textContent = new Date().getFullYear();
  montaBuscaTopo();
  render();
}
boot();
