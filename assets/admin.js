// Indicadores BR · área administrativa (/admin)
// Não há link para cá no site público. O acesso exige login no Supabase e e-mail na tabela admins.
import { h, isNum, renderTable, makeChart, composePNG, setGovernos } from "./charts.js";
import * as store from "./store.js";

const TYPES = [["colunas", "Colunas"], ["barras", "Barras horizontais"], ["linha", "Linha"], ["dispersao", "Dispersão"], ["tabela", "Tabela"]];
const STATUS = [["novo", "Novo"], ["em_analise", "Em análise"], ["resolvido", "Resolvido"], ["descartado", "Descartado"]];
const TABS = [["reports", "Reports de erro"], ["sugestoes", "Sugestões"], ["contatos", "Contatos"], ["dados", "Indicadores"], ["config", "Categorias e site"]];
let A = { tab: "reports", filtro: "novo", sel: null, data: null, novos: {}, msg: null, dirty: new Set() };
let root, reloadPublic;

const dt = iso => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
function parseCell(str) {
  const t = String(str).trim().replace(/−/g, "-");
  if (t === "") return null;
  if (/^-?[\d.]*\d,\d+$/.test(t)) { const n = Number(t.replace(/\./g, "").replace(",", ".")); if (isFinite(n)) return n; }
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}
const showCell = v => v == null ? "" : isNum(v) ? String(v).replace(".", ",") : String(v);
function msg(text, err) { A.msg = { text, err }; const box = root.querySelector("#admmsg"); if (box) box.replaceChildren(h("p", { class: "msg" + (err ? " err" : ""), text })); }

export async function renderAdmin(el, PUBLIC, { reload }) {
  root = el; reloadPublic = reload;
  document.title = "Administração · Indicadores BR";
  if (!store.hasBackend) {
    root.replaceChildren(h("section", { class: "wrap narrow textpage" }, h("h1", { text: "Administração" }),
      h("p", { class: "lede", text: "O banco de dados ainda não está configurado neste endereço." }),
      h("p", { text: "Preencha SUPABASE_URL e SUPABASE_ANON_KEY no arquivo config.js e rode supabase/schema.sql no projeto. O passo a passo está em docs/04_publicacao.md." })));
    return;
  }
  const s = await store.sessao();
  if (!s) return loginView();
  if (!(await store.ehAdmin())) {
    root.replaceChildren(h("section", { class: "wrap narrow textpage" }, h("h1", { text: "Acesso restrito" }),
      h("p", { class: "lede", text: `A conta ${s.user.email} entrou, mas não está na lista de administradores.` }),
      h("p", { text: "Peça para incluir este e-mail na tabela admins do banco." }),
      h("button", { class: "btn", type: "button", onclick: async () => { await store.sair(); renderAdmin(root, PUBLIC, { reload }); } }, "Sair")));
    return;
  }
  A.email = s.user.email;
  await carregarDados();
  draw();
}

function loginView() {
  const email = h("input", { id: "a-email", type: "email", autocomplete: "username", required: true });
  const senha = h("input", { id: "a-senha", type: "password", autocomplete: "current-password", required: true });
  const st = h("div", { role: "status", "aria-live": "polite" });
  const form = h("form", { class: "form" },
    h("div", { class: "f" }, h("label", { for: "a-email", text: "E-mail" }), email),
    h("div", { class: "f" }, h("label", { for: "a-senha", text: "Senha" }), senha),
    h("button", { class: "btn pri big", type: "submit" }, "Entrar"), st);
  form.addEventListener("submit", async e => {
    e.preventDefault(); st.textContent = "Entrando…";
    try { await store.entrar(email.value.trim(), senha.value); renderAdmin(root, null, { reload: reloadPublic }); }
    catch (err) { st.replaceChildren(h("p", { class: "msg err", text: /invalid/i.test(err.message) ? "E-mail ou senha incorretos." : "Não foi possível entrar agora." })); }
  });
  root.replaceChildren(h("section", { class: "wrap narrow textpage" }, h("h1", { text: "Administração" }), h("p", { class: "lede", text: "Entre com a conta de administrador." }), form));
  email.focus();
}

async function carregarDados() {
  A.data = await store.loadData({ admin: true });
  A.data.categorias.sort((a, b) => a.ordem - b.ordem);
  setGovernos(A.data.site.governos);
  try { A.novos = await store.contarNovos(); } catch (e) { A.novos = {}; }
}

function draw() {
  const tabs = h("nav", { class: "admtabs", role: "tablist" }, TABS.map(([k, n]) => h("button", { type: "button", role: "tab", "aria-selected": String(A.tab === k), onclick: () => { if (A.dirty.size && !confirmLeave()) return; A.tab = k; A.sel = null; draw(); } }, n, A.novos[k] ? h("span", { class: "badge", text: String(A.novos[k]) }) : null)));
  const head = h("div", { class: "admhead" }, h("h1", { text: "Administração" }), h("div", { class: "row" }, h("span", { class: "who", text: A.email }),
    h("button", { class: "btn", type: "button", onclick: exportar }, "Exportar JSON"),
    h("a", { class: "btn", href: "/", "data-nav": "" }, "Ver site"),
    h("button", { class: "btn", type: "button", onclick: async () => { await store.sair(); location.reload(); } }, "Sair")));
  const body = h("div", { id: "admbody" });
  root.replaceChildren(h("section", { class: "wrap adm" }, head, tabs, h("div", { id: "admmsg" }), body));
  if (A.msg) msg(A.msg.text, A.msg.err), A.msg = null;
  if (["reports", "sugestoes", "contatos"].includes(A.tab)) inbox(body, A.tab);
  else if (A.tab === "dados") dados(body);
  else config(body);
}
let leaveArmed = 0;
function confirmLeave() {
  if (Date.now() - leaveArmed < 5000) { A.dirty.clear(); return true; }
  leaveArmed = Date.now(); msg("Há alterações não salvas neste indicador. Clique de novo em outra aba para sair sem salvar.", true); return false;
}

/* ------------------------------------------------------------ caixa de entrada */
async function inbox(body, tabela) {
  const filtros = h("div", { class: "seg" }, [["novo", "Novos"], ["em_analise", "Em análise"], ["resolvido", "Resolvidos"], ["descartado", "Descartados"], ["", "Todos"]].map(([k, n]) =>
    h("button", { type: "button", "aria-pressed": String(A.filtro === k), onclick: () => { A.filtro = k; draw(); } }, n)));
  const list = h("div", { class: "inbox" }, h("p", { class: "hint", text: "Carregando…" }));
  body.replaceChildren(filtros, list);
  let rows;
  try { rows = await store.listar(tabela, { status: A.filtro || null }); }
  catch (e) { list.replaceChildren(h("p", { class: "msg err", text: "Não foi possível carregar: " + e.message })); return; }
  if (!rows.length) { list.replaceChildren(h("p", { class: "empty", text: A.filtro === "novo" ? "Nada novo por aqui." : "Nenhum item neste filtro." })); return; }
  const titulo = id => { const i = A.data.indicadores.find(x => x.id === id); return i ? i.titulo : id; };
  list.replaceChildren(...rows.map(r => {
    const sel = h("select", { "aria-label": "Situação" }, STATUS.map(([k, n]) => h("option", { value: k, selected: r.status === k, text: n })));
    const nota = h("textarea", { rows: "2", placeholder: "Nota interna (só a equipe vê)", text: r.nota_interna || "" });
    const save = h("button", { class: "btn", type: "button", onclick: async () => {
      save.disabled = true;
      try { await store.atualizarItem(tabela, r.id, { status: sel.value, nota_interna: nota.value || null }); save.textContent = "Salvo"; A.novos = await store.contarNovos(); setTimeout(() => draw(), 600); }
      catch (e) { save.disabled = false; msg("Não foi possível salvar: " + e.message, true); }
    } }, "Salvar");
    let corpo;
    if (tabela === "reports") corpo = [h("p", { class: "itt" }, h("a", { href: "/indicador/" + r.indicador_id, target: "_blank", rel: "noopener", text: titulo(r.indicador_id) }), r.ponto ? h("span", { class: "pt", text: r.ponto }) : null), h("p", { class: "txt", text: r.motivo })];
    else if (tabela === "sugestoes") corpo = [h("p", { class: "itt", text: r.categoria ? "Categoria: " + ((A.data.categorias.find(c => c.id === r.categoria) || {}).nome || r.categoria) : "Sem categoria" }), h("p", { class: "txt", text: r.texto }), r.onde ? h("p", { class: "hint", text: "Fonte sugerida: " + r.onde }) : null];
    else corpo = [h("p", { class: "itt" }, h("strong", { text: r.nome }), " · ", r.assunto), h("p", { class: "txt", text: r.mensagem })];
    return h("article", { class: "item st-" + r.status },
      h("div", { class: "imeta" }, h("time", { text: dt(r.criado_em) }), r.email ? h("span", { class: "mono", text: r.email }) : h("span", { class: "hint", text: "sem e-mail" })),
      ...corpo,
      h("div", { class: "row" }, sel, nota, save));
  }));
}

/* ------------------------------------------------------------ indicadores */
function dados(body) {
  const D = A.data;
  if (!A.sel) A.sel = D.indicadores[0] ? D.indicadores[0].id : null;
  const side = h("aside", { class: "admside" },
    h("button", { class: "btn pri", type: "button", onclick: novo }, "+ Novo indicador"),
    D.categorias.map(c => [h("h5", { text: c.nome }), D.indicadores.filter(i => i.categoria === c.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(i =>
      h("button", { class: "it" + (i.visivel === false || !(i.fonte && i.fonte.nome) ? " off" : ""), type: "button", "aria-current": String(A.sel === i.id), onclick: () => { if (A.dirty.size && !confirmLeave()) return; A.sel = i.id; draw(); } }, i.titulo || "(sem título)"))]));
  const ind = D.indicadores.find(i => i.id === A.sel);
  body.replaceChildren(h("div", { class: "admgrid" }, side, ind ? editor(ind) : h("p", { text: "Nenhum indicador." })));
}
function novo() {
  const D = A.data; let id = "novo-indicador", k = 2; while (D.indicadores.some(i => i.id === id)) id = "novo-indicador-" + k++;
  const cat = D.categorias[0].id;
  D.indicadores.push({ id, categoria: cat, ordem: 999, visivel: false, tipo: "colunas", titulo: "Novo indicador", subtitulo: "", prefixo: "", sufixo: "", casas: 1,
    colunas: ["Rótulo", "Valor"], linhas: [["Exemplo A", 10], ["Exemplo B", 20]], x: "Rótulo", series: ["Valor"], rotulo: "", tendencia: false, barra: "", destaque: [], faixasGoverno: false,
    fonte: { nome: "", url: "" }, fontes: [], como_ler: "", contexto: [], glossario: [], atualizacao: {}, _novo: true });
  A.sel = id; A.dirty.add(id); draw();
}
function fld(label, input, cls, help) { return h("div", { class: "f " + (cls || "") }, h("label", { for: input.id, text: label }), input, help ? h("p", { class: "fhelp", text: help }) : null); }

function editor(ind) {
  const touch = () => { A.dirty.add(ind.id); stEl.textContent = "Alterações não salvas"; stEl.className = "dirty"; clearTimeout(editor.t); editor.t = setTimeout(preview, 200); };
  const inp = (id, val, on, attrs) => h("input", { id, value: val == null ? "" : val, oninput: e => { on(e.target.value); touch(); }, ...(attrs || {}) });
  const area = (id, val, on, rows) => h("textarea", { id, rows: rows || 3, oninput: e => { on(e.target.value); touch(); }, text: val || "" });
  const sel = (id, opts, val, on) => h("select", { id, onchange: e => { on(e.target.value); touch(); } }, opts.map(([v, n]) => h("option", { value: v, selected: v === val, text: n })));
  const stEl = h("span", { text: A.dirty.has(ind.id) ? "Alterações não salvas" : (ind._atualizado_em ? "Salvo em " + dt(ind._atualizado_em) + (ind._atualizado_por ? " por " + ind._atualizado_por : "") : ""), class: A.dirty.has(ind.id) ? "dirty" : "" });
  const warn = h("p", { class: "warn" });
  const prev = h("div", { class: "prev" });
  const preview = () => {
    const issues = [];
    if (!ind.fonte.nome) issues.push("Sem fonte: o indicador fica oculto no site até a fonte ser preenchida.");
    if (ind.tipo !== "tabela" && (!ind.series.length || ind.colunas.indexOf(ind.x) < 0)) issues.push("Escolha a coluna do eixo e a dos valores.");
    if (!(ind.contexto || []).length) issues.push("Sem contexto: a página do indicador fica sem explicação.");
    if (!ind.como_ler) issues.push("Sem o texto Como ler o gráfico.");
    if (/—/.test(JSON.stringify(ind))) issues.push("Há travessão longo (—) em algum texto: troque por vírgula, ponto ou dois-pontos.");
    warn.textContent = issues.join(" ");
    if (ind.tipo === "tabela") { prev.replaceChildren(renderTable(ind)); return; }
    const w = h("div", { class: "chart" }); prev.replaceChildren(w);
    const c = makeChart(ind, w, { still: true }); requestAnimationFrame(c.paint);
  };
  const mapping = h("div", { class: "fgrid" });
  const drawMapping = () => {
    const kids = [], colOpts = [["", "(nenhuma)"], ...ind.colunas.map(c => [c, c])];
    if (ind.tipo !== "tabela") {
      kids.push(fld(ind.tipo === "dispersao" ? "Eixo horizontal (número)" : "Coluna dos rótulos / eixo", sel("m-x", ind.colunas.map(c => [c, c]), ind.x, v => { ind.x = v; ind.series = ind.series.filter(s => s !== v); drawMapping(); }), "c2"));
      kids.push(h("div", { class: "f c2" }, h("p", { class: "flabel", text: ind.tipo === "linha" ? "Séries (uma linha por coluna)" : ind.tipo === "dispersao" ? "Eixo vertical (número)" : "Coluna dos valores" }),
        h("div", { class: "chks" }, ind.colunas.filter(c => c !== ind.x).map(c => h("label", { class: "chk" }, h("input", { type: ind.tipo === "linha" ? "checkbox" : "radio", name: "m-ser", checked: ind.series.includes(c), onchange: e => { ind.series = ind.tipo === "linha" ? (e.target.checked ? [...ind.series, c] : ind.series.filter(s => s !== c)).sort((a, b) => ind.colunas.indexOf(a) - ind.colunas.indexOf(b)) : [c]; touch(); } }), c)))));
    }
    if (ind.tipo === "dispersao") { kids.push(fld("Nome de cada ponto", sel("m-rot", colOpts, ind.rotulo || "", v => ind.rotulo = v), "c2")); kids.push(h("label", { class: "chk f c2" }, h("input", { type: "checkbox", checked: !!ind.tendencia, onchange: e => { ind.tendencia = e.target.checked; touch(); } }), "Mostrar linha de tendência")); }
    if (ind.tipo === "tabela") kids.push(fld("Coluna com barra animada", sel("m-bar", colOpts, ind.barra || "", v => ind.barra = v), "c2"));
    if (ind.tipo === "linha" || ind.tipo === "colunas") kids.push(h("label", { class: "chk f c2" }, h("input", { type: "checkbox", checked: !!ind.faixasGoverno, onchange: e => { ind.faixasGoverno = e.target.checked; touch(); } }), "Faixas de governo (eixo em anos)"));
    if (ind.tipo !== "tabela" && ind.tipo !== "linha") kids.push(fld("Destaques (rótulos separados por vírgula)", inp("m-dest", (ind.destaque || []).join(", "), v => ind.destaque = v.split(",").map(s => s.trim()).filter(Boolean)), "c4"));
    mapping.replaceChildren(...kids);
  };
  drawMapping();
  const grid = h("div", { class: "dgrid" });
  const drawGrid = () => {
    const thr = h("tr", {}, h("th", {}), ind.colunas.map((c, k) => h("th", {}, h("div", { class: "row tight" },
      h("input", { value: c, "aria-label": "Nome da coluna " + (k + 1), onchange: e => { const nv = e.target.value.trim() || c; if (nv !== c && ind.colunas.includes(nv)) { e.target.value = c; return; } ind.colunas[k] = nv; for (const f of ["x", "rotulo", "barra"]) if (ind[f] === c) ind[f] = nv; ind.series = ind.series.map(s => s === c ? nv : s); touch(); drawMapping(); } }),
      h("button", { class: "x", type: "button", title: "Excluir coluna", "aria-label": "Excluir coluna " + c, disabled: ind.colunas.length <= 1, onclick: () => { ind.colunas.splice(k, 1); ind.linhas.forEach(r => r.splice(k, 1)); if (ind.x === c) ind.x = ind.colunas[0]; ind.series = ind.series.filter(s => s !== c); touch(); drawGrid(); drawMapping(); } }, "×")))));
    const rows = ind.linhas.map((r, i) => h("tr", {}, h("td", { class: "rn" }, String(i + 1), h("button", { class: "x", type: "button", title: "Excluir linha", "aria-label": "Excluir linha " + (i + 1), onclick: () => { ind.linhas.splice(i, 1); touch(); drawGrid(); } }, "×")),
      ind.colunas.map((c, k) => h("td", {}, h("input", { value: showCell(r[k]), "aria-label": `${c}, linha ${i + 1}`, oninput: e => { r[k] = parseCell(e.target.value); touch(); } })))));
    grid.replaceChildren(h("table", {}, h("thead", {}, thr), h("tbody", {}, rows)));
  };
  drawGrid();
  const csv = h("textarea", { id: "csvin", rows: "4", placeholder: "Cole uma tabela do Excel, Google Sheets ou CSV. A primeira linha vira o nome das colunas." });
  const fontesTxt = (ind.fontes || []).map(f => [f.nome, f.url, f.o_que_sustenta].filter(x => x != null).join(" | ")).join("\n");
  const gloTxt = (ind.glossario || []).map(g => `${g.termo}: ${g.definicao}`).join("\n");
  const up = ind.atualizacao = ind.atualizacao || {};
  const del = h("button", { class: "btn danger", type: "button" }, "Excluir");
  del.addEventListener("click", async () => {
    if (!del.dataset.armed) { del.dataset.armed = "1"; del.textContent = "Clique de novo para excluir"; setTimeout(() => { if (del.isConnected) { delete del.dataset.armed; del.textContent = "Excluir"; } }, 4000); return; }
    try { if (!ind._novo) await store.excluirIndicador(ind.id); A.data.indicadores = A.data.indicadores.filter(i => i !== ind); A.dirty.delete(ind.id); A.sel = null; msg("Indicador excluído. A versão anterior fica no histórico do banco."); await reloadPublic(); draw(); }
    catch (e) { msg("Não foi possível excluir: " + e.message, true); }
  });
  const salvar = async () => {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ind.id)) { msg("O endereço do indicador só pode ter letras minúsculas, números e hífen.", true); return; }
    try {
      const { _novo, ...limpo } = ind;
      const r = await store.salvarIndicador(limpo, ind._atualizado_em);
      ind._atualizado_em = r.atualizado_em; ind._atualizado_por = r.atualizado_por; delete ind._novo;
      A.dirty.delete(ind.id); msg("Salvo. O site público já mostra esta versão."); await reloadPublic(); draw();
    } catch (e) {
      msg(e.code === "conflito" ? "Outra pessoa salvou este indicador depois que você abriu. Recarregue a página para ver a versão nova antes de salvar." : "Não foi possível salvar: " + e.message, true);
    }
  };
  setTimeout(preview, 0);
  return h("section", { class: "pane" },
    h("div", { class: "row between" }, h("h2", { text: ind.titulo || "(sem título)" }), h("div", { class: "row" }, stEl, h("button", { class: "btn pri", type: "button", onclick: salvar }, "Salvar e publicar"), h("button", { class: "btn", type: "button", onclick: async () => { const cv = await composePNG(ind, "feed", "claro", { categoria: "", siteNome: A.data.site.nome || "Indicadores BR" }); const w = window.open(); if (w) w.document.write(`<img src="${cv.toDataURL()}" style="max-width:100%">`); } }, "Ver PNG"), del)),
    warn,
    h("div", { class: "fgrid" },
      h("label", { class: "chk f c2" }, h("input", { type: "checkbox", checked: ind.visivel !== false, onchange: e => { ind.visivel = e.target.checked; touch(); } }), "Visível no site público"),
      fld("Ordem na categoria", inp("f-ord", ind.ordem, v => ind.ordem = parseInt(v) || 0, { type: "number" })),
      fld("Endereço", ind._novo ? inp("f-id", ind.id, v => ind.id = v.trim(), { pattern: "[a-z0-9-]+" }) : h("input", { id: "f-id", value: ind.id, readonly: true }), "", ind._novo ? "Só letras minúsculas, números e hífen. Fica fixo depois de salvar." : "Fixo, para não quebrar links compartilhados."),
      fld("Título", inp("f-tit", ind.titulo, v => ind.titulo = v), "c4"),
      fld("Subtítulo (o que o gráfico mostra, com unidade e período)", inp("f-sub", ind.subtitulo, v => ind.subtitulo = v), "c4"),
      fld("Categoria", sel("f-cat", A.data.categorias.map(c => [c.id, c.nome]), ind.categoria, v => ind.categoria = v), "c2"),
      fld("Tipo", sel("f-tipo", TYPES, ind.tipo, v => { ind.tipo = v; if (v !== "linha") ind.series = ind.series.slice(0, 1); drawMapping(); }), "c2"),
      fld("Prefixo", inp("f-pre", ind.prefixo, v => ind.prefixo = v, { placeholder: "R$ " })),
      fld("Sufixo", inp("f-suf", ind.sufixo, v => ind.sufixo = v, { placeholder: "%" })),
      fld("Casas decimais", inp("f-cas", ind.casas, v => ind.casas = Math.max(0, Math.min(4, parseInt(v) || 0)), { type: "number", min: "0", max: "4" })),
      h("div", { class: "f" }),
      fld("Fonte principal (obrigatória)", inp("f-fn", ind.fonte.nome, v => ind.fonte.nome = v), "c2"),
      fld("Link da fonte principal", inp("f-fu", ind.fonte.url, v => ind.fonte.url = v.trim(), { placeholder: "https://" }), "c2")),
    h("h3", { text: "Textos da página do indicador" }),
    h("div", { class: "fgrid" },
      fld("Como ler o gráfico", area("f-como", ind.como_ler, v => ind.como_ler = v, 4), "c4", "Um parágrafo que faça sentido sozinho: o que cada barra ou linha representa, a unidade, o período e os cuidados."),
      fld("Contexto", area("f-ctx", (ind.contexto || []).join("\n\n"), v => ind.contexto = v.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean), 9), "c4", "Dois ou três parágrafos, separados por uma linha em branco."),
      fld("Glossário", area("f-glo", gloTxt, v => ind.glossario = v.split("\n").map(l => { const i = l.indexOf(":"); return i > 0 ? { termo: l.slice(0, i).trim(), definicao: l.slice(i + 1).trim() } : null; }).filter(Boolean), 4), "c4", "Um termo por linha, no formato termo: definição."),
      fld("Outras fontes", area("f-fts", fontesTxt, v => ind.fontes = v.split("\n").map(l => l.split("|").map(s => s.trim())).filter(p => p[0]).map(p => ({ nome: p[0], url: p[1] || "", o_que_sustenta: p[2] || "" })), 5), "c4", "Uma por linha: nome | link | o que ela sustenta."),
      fld("Periodicidade", inp("f-per", up.periodicidade, v => up.periodicidade = v, { placeholder: "mensal, por volta do dia 10" }), "c2"),
      fld("Próxima divulgação", inp("f-prox", up.proxima, v => up.proxima = v), "c2"),
      fld("Onde buscar a atualização (link ou API)", inp("f-onde", up.onde_buscar, v => up.onde_buscar = v), "c2"),
      fld("Última conferência (AAAA-MM-DD)", inp("f-conf", up.ultima_conferencia, v => up.ultima_conferencia = v, { placeholder: "2026-10-12" }), "c2")),
    h("h3", { text: "Dados" }), grid,
    h("div", { class: "row" },
      h("button", { class: "btn", type: "button", onclick: () => { ind.linhas.push(ind.colunas.map(() => null)); touch(); drawGrid(); } }, "+ Linha"),
      h("button", { class: "btn", type: "button", onclick: () => { let nm = "Coluna", k = 2; while (ind.colunas.includes(nm)) nm = "Coluna " + k++; ind.colunas.push(nm); ind.linhas.forEach(r => r.push(null)); touch(); drawGrid(); drawMapping(); } }, "+ Coluna")),
    h("details", {}, h("summary", { text: "Colar uma tabela inteira" }), h("div", { class: "stack" }, csv, h("button", { class: "btn", type: "button", onclick: () => {
      const txt = csv.value.trim(); if (!txt) return;
      const lines = txt.split(/\r?\n/).filter(l => l.trim());
      const d = lines[0].includes("\t") ? "\t" : lines[0].split(";").length > lines[0].split(",").length ? ";" : ",";
      const rows = lines.map(l => l.split(d).map(c => c.trim().replace(/^"|"$/g, "")));
      ind.colunas = rows[0].map((c, k) => c || "Coluna " + (k + 1));
      ind.linhas = rows.slice(1).map(r => ind.colunas.map((c, k) => parseCell(r[k] ?? "")));
      ind.x = ind.colunas[0]; ind.series = ind.colunas.slice(1, ind.tipo === "linha" ? undefined : 2); ind.rotulo = ""; ind.barra = "";
      csv.value = ""; touch(); drawGrid(); drawMapping();
    } }, "Substituir os dados por esta tabela"))),
    h("h3", { text: "Mapeamento do gráfico" }), mapping,
    h("h3", { text: "Prévia" }), prev);
}

/* ------------------------------------------------------------ categorias e site */
function config(body) {
  const D = A.data, s = D.site;
  const govTxt = (s.governos || []).map(g => `${g.de};${g.ate};${g.rotulo}`).join("\n");
  const cats = D.categorias.map(c => ({ ...c }));
  const list = h("div", {});
  const drawCats = () => list.replaceChildren(...cats.map((c, i) => {
    const n = D.indicadores.filter(x => x.categoria === c.id).length;
    return h("div", { class: "catrow" },
      h("div", { class: "f" }, h("label", { for: "cn" + i, text: "Nome" }), h("input", { id: "cn" + i, value: c.nome, oninput: e => c.nome = e.target.value })),
      h("div", { class: "f" }, h("label", { for: "cd" + i, text: "Descrição" }), h("input", { id: "cd" + i, value: c.descricao, oninput: e => c.descricao = e.target.value })),
      h("div", { class: "row" },
        h("button", { class: "btn", type: "button", disabled: i === 0, "aria-label": "Subir", onclick: () => { cats.splice(i - 1, 0, cats.splice(i, 1)[0]); drawCats(); } }, "↑"),
        h("button", { class: "btn", type: "button", disabled: i === cats.length - 1, "aria-label": "Descer", onclick: () => { cats.splice(i + 1, 0, cats.splice(i, 1)[0]); drawCats(); } }, "↓"),
        h("button", { class: "btn danger", type: "button", disabled: n > 0, title: n ? "Mova ou exclua os indicadores antes" : "", onclick: async () => { try { if (D.categorias.some(x => x.id === c.id)) await store.excluirCategoria(c.id); cats.splice(i, 1); D.categorias = D.categorias.filter(x => x.id !== c.id); drawCats(); msg("Categoria removida."); } catch (e) { msg("Não foi possível remover: " + e.message, true); } } }, n ? `${n} indicadores` : "Remover")));
  }));
  drawCats();
  const nome = h("input", { id: "s-nome", value: s.nome || "Indicadores BR" });
  const dest = h("input", { id: "s-dest", value: (s.destaques || []).join(", "), placeholder: "ipca-anual, mvi-anual" });
  const gov = h("textarea", { id: "s-gov", rows: "7", text: govTxt });
  body.replaceChildren(h("section", { class: "pane" },
    h("h2", { text: "Categorias" }), list,
    h("div", { class: "row" },
      h("button", { class: "btn", type: "button", onclick: () => { let base = "nova-categoria", id = base, k = 2; while (cats.some(c => c.id === id)) id = base + "-" + k++; cats.push({ id, nome: "Nova categoria", descricao: "" }); drawCats(); } }, "+ Nova categoria"),
      h("button", { class: "btn pri", type: "button", onclick: async () => { try { await store.salvarCategorias(cats); D.categorias = cats.map((c, i) => ({ ...c, ordem: i + 1 })); await reloadPublic(); msg("Categorias salvas."); } catch (e) { msg("Não foi possível salvar: " + e.message, true); } } }, "Salvar categorias")),
    h("p", { class: "hint", text: "O endereço de cada categoria é criado quando ela nasce e não muda ao renomear, para não quebrar links compartilhados." }),
    h("h2", { text: "Site" }),
    h("div", { class: "fgrid" },
      fld("Nome do portal (vai nas imagens)", nome, "c2"),
      fld("Destaques da página inicial (endereços, separados por vírgula)", dest, "c2"),
      fld("Faixas de governo (de;até;nome, uma por linha)", gov, "c4", "Quando um governo termina no mesmo ano em que outro começa, a divisa fica no meio daquele ano.")),
    h("button", { class: "btn pri", type: "button", onclick: async () => {
      const novo = { ...s, nome: nome.value.trim() || "Indicadores BR", destaques: dest.value.split(",").map(x => x.trim()).filter(Boolean),
        governos: gov.value.split("\n").map(l => l.split(";")).filter(p => p.length >= 3 && isFinite(+p[0]) && isFinite(+p[1])).map(p => ({ de: +p[0], ate: +p[1], rotulo: p.slice(2).join(";").trim() })) };
      try { await store.salvarSite(novo); D.site = novo; setGovernos(novo.governos); await reloadPublic(); msg("Configurações salvas."); } catch (e) { msg("Não foi possível salvar: " + e.message, true); }
    } }, "Salvar configurações")));
}

function exportar() {
  const D = A.data;
  const out = { site: D.site, categorias: D.categorias.map(({ id, nome, descricao }, i) => ({ id, nome, descricao, ordem: i + 1 })), indicadores: D.indicadores.map(({ _atualizado_em, _atualizado_por, _novo, ...i }) => i) };
  const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: "application/json" })), download: "indicadores-br_export_" + new Date().toISOString().slice(0, 10) + ".json" });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
