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

async function loadStatic() {
  const r = await fetch("/data/indicadores.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("Falha ao carregar /data/indicadores.json (" + r.status + ")");
  const d = await r.json();
  d.origem = "arquivo";
  return d;
}

/** Carrega site, categorias e indicadores publicados. */
export async function loadData({ admin = false } = {}) {
  if (hasBackend) {
    try {
      const c = await sb();
      const [cfg, cats, inds] = await Promise.all([
        c.from("config").select("chave,valor"),
        c.from("categorias").select("*").order("ordem"),
        admin ? c.from("indicadores").select("id,conteudo,atualizado_em,atualizado_por").order("ordem")
              : c.from("indicadores").select("id,conteudo,atualizado_em").eq("visivel", true).order("ordem"),
      ]);
      for (const x of [cfg, cats, inds]) if (x.error) throw x.error;
      if (!inds.data.length && !admin) throw new Error("banco vazio");
      const site = (cfg.data.find(r => r.chave === "site") || {}).valor || {};
      return {
        origem: "banco", site,
        categorias: cats.data.map(c => ({ id: c.id, nome: c.nome, descricao: c.descricao || "", ordem: c.ordem })),
        indicadores: inds.data.map(r => ({ ...r.conteudo, id: r.id, _atualizado_em: r.atualizado_em, _atualizado_por: r.atualizado_por })),
      };
    } catch (e) {
      console.warn("[Indicadores BR] banco indisponível, usando a cópia em arquivo:", e.message || e);
    }
  }
  return loadStatic();
}

/* ------------------------------------------------------------ envios públicos */
const wc = s => String(s || "").trim().split(/\s+/).filter(Boolean).length;
export const palavras = wc;

async function inserir(tabela, linha) {
  if (!hasBackend) return { ok: false, motivo: "offline" };
  try {
    const c = await sb();
    const { error } = await c.from(tabela).insert(linha);
    if (error) return { ok: false, motivo: error.code === "23514" ? "validacao" : "erro", detalhe: error.message };
    return { ok: true };
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
  sb().then(c => c && c.from("eventos").insert(row)).catch(() => {});
}
export async function estatisticas(dias = 30) {
  const c = await sb(); if (!c) throw new Error("Banco não configurado.");
  const { data, error } = await c.rpc("estatisticas", { dias });
  if (error) throw error;
  return data;
}
