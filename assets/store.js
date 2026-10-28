// Indicadores BR · acesso a dados
// Fonte dos dados publicados: tabelas do Supabase quando config.js estiver preenchido;
// sem Supabase (ou se ele falhar), o site usa a cópia versionada em /data/indicadores.json.
// Reports, sugestões e contatos só são gravados com Supabase configurado.

const CFG = window.IBR_CONFIG || {};
export const hasBackend = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
let client = null;

async function sb() {
  if (!hasBackend) return null;
  if (client) return client;
  if (!window.supabase) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
      s.onload = res; s.onerror = () => rej(new Error("Não foi possível carregar a biblioteca do banco."));
      document.head.append(s);
    });
  }
  client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { persistSession: true, storageKey: "ibr-auth" } });
  return client;
}

// Versão dos dados publicada junto com o site (meta ibr-dados no HTML, gerada pelo build).
const DV = (document.querySelector('meta[name="ibr-dados"]') || {}).content || "";
const REST = hasBackend ? CFG.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/" : "";
const HDR = hasBackend ? { apikey: CFG.SUPABASE_ANON_KEY, Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY } : {};
async function rest(caminho) {
  const r = await fetch(REST + caminho, { headers: HDR });
  if (!r.ok) throw new Error("banco respondeu " + r.status);
  return r.json();
}

async function loadStatic(arquivo = "resumo") {
  const r = await fetch(`/data/${arquivo}.json${DV ? "?v=" + DV : ""}`);
  if (!r.ok) throw new Error(`Falha ao carregar /data/${arquivo}.json (${r.status})`);
  const d = await r.json();
  d.origem = "arquivo";
  return d;
}

/** Dados completos direto do banco (admin e revalidação). */
async function loadBanco({ admin = false } = {}) {
  if (admin) {
    const c = await sb();
    const [cfg, cats, inds] = await Promise.all([
      c.from("config").select("chave,valor"),
      c.from("categorias").select("*").order("ordem"),
      c.from("indicadores").select("id,conteudo,atualizado_em,atualizado_por").order("ordem"),
    ]);
    for (const x of [cfg, cats, inds]) if (x.error) throw x.error;
    return montar(cfg.data, cats.data, inds.data);
  }
  const [cfg, cats, inds] = await Promise.all([
    rest("config?select=chave,valor"),
    rest("categorias?select=*&order=ordem.asc"),
    rest("indicadores?select=id,conteudo,atualizado_em&visivel=eq.true&order=ordem.asc"),
  ]);
  if (!inds.length) throw new Error("banco vazio");
  return montar(cfg, cats, inds);
}
function montar(cfg, cats, inds) {
  const site = (cfg.find(r => r.chave === "site") || {}).valor || {};
  return {
    origem: "banco", completo: true, site,
    categorias: cats.map(c => ({ id: c.id, nome: c.nome, descricao: c.descricao || "", ordem: c.ordem })),
    indicadores: inds.map(r => ({ ...r.conteudo, id: r.id, _atualizado_em: r.atualizado_em, _atualizado_por: r.atualizado_por })),
  };
}

/**
 * Carrega site, categorias e indicadores.
 * Público: desenha na hora com o resumo publicado junto com o site (/data/resumo.json) e confere o banco depois (revalidar).
 * Admin (ou banco: true): lê tudo do banco.
 */
export async function loadData({ admin = false, banco = false } = {}) {
  if (hasBackend && (admin || banco)) {
    try { return await loadBanco({ admin }); }
    catch (e) { if (admin) throw e; console.warn("[Indicadores BR] banco indisponível, usando a cópia em arquivo:", e.message || e); }
  }
  try { return await loadStatic("resumo"); }
  catch (e) { return loadStatic("indicadores"); }
}

/**
 * Confere se o banco tem algo mais novo que a cópia publicada: outra versão de carga
 * ou indicador editado pelo admin depois da carga. Só então baixa o conteúdo completo.
 * Devolve os dados novos, ou null quando a cópia publicada está em dia.
 */
export async function revalidar() {
  if (!hasBackend) return null;
  try {
    const [cfg, ult] = await Promise.all([
      rest("config?select=valor&chave=eq.versao"),
      rest("indicadores?select=atualizado_em&order=atualizado_em.desc&limit=1"),
    ]);
    const ver = (cfg[0] || {}).valor || {};
    const editado = ult[0] && ver.em && new Date(ult[0].atualizado_em) > new Date(ver.em);
    if (ver.dados === DV && !editado) return null;
    return await loadBanco();
  } catch (e) { return null; }
}

/** Conteúdo completo de um indicador (texto, fontes, glossário), para a página do indicador. */
const CACHE_COMPLETO = new Map();
export async function completo(ind, DATA) {
  if (!ind || DATA.completo || ind._completo) return ind;
  if (!CACHE_COMPLETO.has(ind.id)) CACHE_COMPLETO.set(ind.id, fetch(`/data/i/${ind.id}.json${DV ? "?v=" + DV : ""}`).then(r => r.ok ? r.json() : null).catch(() => null));
  const full = await CACHE_COMPLETO.get(ind.id);
  if (!full) return ind;
  Object.assign(ind, full, { _completo: true });
  return ind;
}

/* ------------------------------------------------------------ envios públicos */
const wc = s => String(s || "").trim().split(/\s+/).filter(Boolean).length;
export const palavras = wc;

async function inserir(tabela, linha) {
  if (!hasBackend) return { ok: false, motivo: "offline" };
  try {
    const r = await fetch(REST + tabela, { method: "POST", headers: { ...HDR, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(linha), keepalive: true });
    if (r.ok) return { ok: true };
    let err = {}; try { err = await r.json(); } catch (e) {}
    return { ok: false, motivo: err.code === "23514" ? "validacao" : "erro", detalhe: err.message || ("HTTP " + r.status) };
  } catch (e) { return { ok: false, motivo: "erro", detalhe: e.message }; }
}
export function enviarReport({ indicador_id, ponto, motivo, email, pagina }) {
  return inserir("reports", { indicador_id, ponto: ponto || null, motivo: motivo.trim(), email: email || null, pagina: pagina || null });
}
export function enviarSugestao({ texto, categoria, onde, email }) {
  return inserir("sugestoes", { texto: texto.trim(), categoria: categoria || null, onde: onde || null, email: email || null });
}
export function enviarContato({ nome, email, assunto, mensagem }) {
  return inserir("contatos", { nome: nome.trim(), email: email.trim(), assunto, mensagem: mensagem.trim() });
}

/* ------------------------------------------------------------ admin */
export async function sessao() { const c = await sb(); if (!c) return null; const { data } = await c.auth.getSession(); return data.session; }
export async function entrar(email, senha) { const c = await sb(); const { data, error } = await c.auth.signInWithPassword({ email, password: senha }); if (error) throw error; return data.session; }
export async function sair() { const c = await sb(); if (c) await c.auth.signOut(); }
export async function ehAdmin() { const c = await sb(); if (!c) return false; const { data, error } = await c.rpc("is_admin"); return !error && data === true; }

export async function listar(tabela, { status = null, limite = 200 } = {}) {
  const c = await sb();
  let q = c.from(tabela).select("*").order("criado_em", { ascending: false }).limit(limite);
  if (status) q = q.eq("status", status);
  const { data, error } = await q; if (error) throw error; return data;
}
export async function contarNovos() {
  const c = await sb(), out = {};
  for (const t of ["reports", "sugestoes", "contatos"]) {
    const { count } = await c.from(t).select("id", { count: "exact", head: true }).eq("status", "novo");
    out[t] = count || 0;
  }
  return out;
}
export async function atualizarItem(tabela, id, patch) {
  const c = await sb(); const { error } = await c.from(tabela).update(patch).eq("id", id); if (error) throw error;
}

/** Grava um indicador. `antes` é o atualizado_em lido: se o banco tiver versão mais nova, a gravação para (conflito). */
export async function salvarIndicador(ind, antes) {
  const c = await sb();
  const { _atualizado_em, _atualizado_por, ...conteudo } = ind;
  const { data: atual, error: e1 } = await c.from("indicadores").select("atualizado_em").eq("id", ind.id).maybeSingle();
  if (e1) throw e1;
  if (atual && antes && new Date(atual.atualizado_em) > new Date(antes)) { const err = new Error("conflito"); err.code = "conflito"; throw err; }
  const { data, error } = await c.from("indicadores").upsert({ id: ind.id, conteudo }).select("atualizado_em,atualizado_por").single();
  if (error) throw error;
  return data;
}
export async function excluirIndicador(id) { const c = await sb(); const { error } = await c.from("indicadores").delete().eq("id", id); if (error) throw error; }
export async function salvarCategorias(cats) {
  const c = await sb();
  const { error } = await c.from("categorias").upsert(cats.map((x, i) => ({ id: x.id, nome: x.nome, descricao: x.descricao || "", ordem: i + 1 })));
  if (error) throw error;
}
export async function excluirCategoria(id) { const c = await sb(); const { error } = await c.from("categorias").delete().eq("id", id); if (error) throw error; }
export async function salvarSite(site) { const c = await sb(); const { error } = await c.from("config").upsert({ chave: "site", valor: site }); if (error) throw error; }

/* ------------------------------------------------------------ estatísticas de acesso */
// Anônimas: sem IP, sem cookie, sem dado pessoal. O código de visitante é aleatório e muda todo mês
// (serve só para contar visitantes únicos). Navegadores com "não rastrear" e robôs não enviam nada.
const semRastreio = () => { try { return navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true || navigator.webdriver === true || !!localStorage.getItem("ibr-auth"); } catch (e) { return true; } };
function visitante() {
  const mes = new Date().toISOString().slice(0, 7);
  try {
    const v = JSON.parse(localStorage.getItem("ibr_v") || "null");
    if (v && v.m === mes && /^[a-z0-9]{8,24}$/.test(v.id)) return v.id;
    const id = Array.from(crypto.getRandomValues(new Uint8Array(9)), b => (b % 36).toString(36)).join("") + Date.now().toString(36).slice(-4);
    localStorage.setItem("ibr_v", JSON.stringify({ m: mes, id }));
    return id;
  } catch (e) { return null; }
}
const tela = () => { const w = Math.min(screen.width || innerWidth, innerWidth || screen.width); return w < 700 ? "celular" : w < 1100 ? "tablet" : "computador"; };
let origemDaVisita;
function origem() {
  if (origemDaVisita !== undefined) return origemDaVisita;
  let o = null;
  try {
    const q = new URLSearchParams(location.search), utm = q.get("utm_source") || q.get("ref");
    if (utm) o = utm.toLowerCase().slice(0, 60);
    else if (document.referrer) { const h = new URL(document.referrer).hostname.replace(/^www\./, ""); if (h && h !== location.hostname.replace(/^www\./, "")) o = h.slice(0, 120); }
  } catch (e) {}
  origemDaVisita = o; // a origem vai só no primeiro evento da visita
  return o;
}
export function registrar({ tipo, caminho, indicador_id = null, termo = null, resultados = null }) {
  if (!hasBackend || semRastreio()) return;
  const row = { tipo, caminho: String(caminho || "/").slice(0, 200), indicador_id, termo: termo ? String(termo).slice(0, 80) : null, resultados, visitante: visitante(), tela: tela(), origem: origem() };
  origemDaVisita = null;
  inserir("eventos", row).catch(() => {});
}
export async function estatisticas(dias = 30) {
  const c = await sb(); if (!c) throw new Error("Banco não configurado.");
  const { data, error } = await c.rpc("estatisticas", { dias });
  if (error) throw error;
  return data;
}
