// Indicadores BR · motor de gráficos e tabelas
// Um único desenhista em Canvas serve à tela (animado) e à imagem PNG (estático, alta resolução).
import { MAPA_BR } from "./mapa-br.js";

export const F = {
  disp: "'Barlow Condensed','Arial Narrow',Arial,sans-serif",
  body: "'Public Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',ui-monospace,monospace",
};

/* ------------------------------------------------------------ utilidades */
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else if (k === "html") e.innerHTML = v; // só para ícones fixos do próprio código
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
const NF = {};
export const nf = c => NF[c] || (NF[c] = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c }));
export const isNum = v => typeof v === "number" && isFinite(v);
export const decs = v => { const s = String(v), i = s.indexOf("."); return i < 0 ? 0 : Math.min(3, s.length - i - 1); };
export const colDecs = (rows, k) => Math.max(0, ...rows.map(r => isNum(r[k]) ? decs(r[k]) : 0));
export function fmtV(v, ind, c) {
  if (!isNum(v)) return v == null || v === "" ? "s/d" : String(v);
  c = c == null ? (ind.casas ?? 1) : c;
  return (v < 0 ? "−" : "") + (ind.prefixo || "") + nf(c).format(Math.abs(v)) + (ind.sufixo || "");
}
export const fmtCell = (v, c) => isNum(v) ? (Number.isInteger(v) && v >= 1800 && v <= 2100 && c == null ? String(v) : (v < 0 ? "−" : "") + nf(c == null ? decs(v) : c).format(Math.abs(v))) : (v == null || v === "" ? "s/d" : String(v));
export const domain = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
export const ease = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
const clamp01 = t => Math.max(0, Math.min(1, t));
export const col = (ind, name) => (ind.colunas || []).indexOf(name);
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const yearCol = (rows, k) => rows.length > 0 && rows.every(r => Number.isInteger(r[k]) && r[k] >= 1800 && r[k] <= 2100);
export function numericCols(ind) {
  const rows = ind.linhas || [];
  // colunas de ano (1995, 2025) são tratadas como texto: sem separador de milhar e alinhadas à esquerda
  return (ind.colunas || []).map((c, k) => !yearCol(rows, k) && rows.every(r => r[k] == null || r[k] === "" || isNum(r[k])) && rows.some(r => isNum(r[k])));
}

function nice(lo, hi, n) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const raw = (hi - lo) / (n || 5), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  const step = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step, ticks = [];
  for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(10));
  return { lo: a, hi: b, step, ticks };
}
function axisFmt(v, ind, step) {
  const c = step < 1 ? Math.min(3, Math.ceil(-Math.log10(step) - 1e-9)) : 0;
  return (v < 0 ? "−" : "") + (ind.prefixo || "") + nf(c).format(Math.abs(v)) + (ind.sufixo || "");
}
export function wrapText(ctx, text, maxW, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean), lines = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  if (maxLines && lines.length > maxLines) {
    const l = lines.slice(0, maxLines); let last = l[maxLines - 1];
    while (last.length && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
    l[maxLines - 1] = last.trimEnd() + "…"; return l;
  }
  return lines;
}
function fit(ctx, text, maxW) { text = String(text); if (ctx.measureText(text).width <= maxW) return text; while (text.length > 1 && ctx.measureText(text + "…").width > maxW) text = text.slice(0, -1); return text + "…"; }
function setFont(ctx, w, size, fam) { ctx.font = `${w} ${size}px ${fam}`; }

/* ------------------------------------------------------------ temas */
export function themeCSS() {
  const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  return { bg: g("--surface"), ink: g("--ink"), muted: g("--muted"), line: g("--line"), grid: g("--grid"), accent: g("--accent"), accent2: g("--accent-2"), band: g("--band"), series: [g("--s1"), g("--s2"), g("--s3"), g("--s4"), g("--s5")] };
}
export const EXPORT_THEMES = {
  claro: { bg: "#F6F7F4", ink: "#14222B", muted: "#55646B", line: "#CDD5D0", grid: "#E2E7E3", accent: "#0C6A70", accent2: "#C98A1E", band: "rgba(20,34,43,.06)", series: ["#0C6A70", "#C98A1E", "#6B4E9B", "#B5503C", "#3F7A3B"] },
  escuro: { bg: "#0F171C", ink: "#EAF0EE", muted: "#9AA8AE", line: "#2A3943", grid: "#1E2B34", accent: "#47B0B5", accent2: "#EBB04A", band: "rgba(234,240,238,.06)", series: ["#47B0B5", "#EBB04A", "#A88BD6", "#E07B63", "#7DBB6F"] },
};

/* ------------------------------------------------------------ faixas de governo */
let GOVERNOS = [];
export function setGovernos(g) { GOVERNOS = Array.isArray(g) ? g : []; }
function govBands(x0, x1) {
  const g = GOVERNOS, out = [];
  g.forEach((r, i) => {
    let a = r.de - 0.5, b = r.ate + 0.5;
    if (g[i - 1] && g[i - 1].ate === r.de) a = r.de;
    if (g[i + 1] && g[i + 1].de === r.ate) b = r.ate;
    a = Math.max(a, x0 - 0.5); b = Math.min(b, x1 + 0.5);
    if (b > a) out.push({ a, b, rotulo: r.rotulo });
  });
  return out;
}
function drawBands(ctx, bands, px, plot, th, s, labelY) {
  // todas as faixas recebem rótulo no mesmo corpo de letra, para nenhum governo ficar sem nome
  const geo = bands.map(bd => ({ x1: Math.max(plot.x, px(bd.a)), x2: Math.min(plot.x + plot.w, px(bd.b)), t: bd.rotulo.toUpperCase() })).filter(g => g.x2 > g.x1);
  let size = 10.5 * s;
  for (; size > 7.5 * s; size -= .5 * s) { setFont(ctx, 600, size, F.body); if (geo.every(g => ctx.measureText(g.t).width + 4 * s <= g.x2 - g.x1)) break; }
  geo.forEach((g, i) => {
    if (i % 2 === 0) { ctx.fillStyle = th.band; ctx.fillRect(g.x1, plot.y, g.x2 - g.x1, plot.h); }
    setFont(ctx, 600, size, F.body); ctx.fillStyle = th.muted; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    let t = g.t; if (ctx.measureText(t).width + 4 * s > g.x2 - g.x1) t = t.slice(0, 3) + ".";
    if (ctx.measureText(t).width <= g.x2 - g.x1 + 2 * s) ctx.fillText(t, (g.x1 + g.x2) / 2, labelY);
  });
}

/* ------------------------------------------------------------ desenho */
export function drawChart(ctx, ind, b, th, s, t, hits, hover) {
  const xi = col(ind, ind.x), ys = (ind.series || []).map(c => col(ind, c)).filter(i => i >= 0);
  ctx.textBaseline = "alphabetic";
  if (ind.tipo === "tabela") return drawTableCanvas(ctx, ind, b, th, s);
  if (xi < 0 || !ys.length || !(ind.linhas || []).length) {
    setFont(ctx, 500, 13 * s, F.body); ctx.fillStyle = th.muted; ctx.textAlign = "center";
    ctx.fillText("Escolha a coluna do eixo e ao menos uma série com números.", b.x + b.w / 2, b.y + b.h / 2); return;
  }
  const fn = { colunas: drawCols, barras: drawBars, linha: drawLine, dispersao: drawScatter, mapa: drawMap }[ind.tipo] || drawCols;
  fn(ctx, ind, b, th, s, t, hits || [], hover, xi, ys);
}
function yAxis(ctx, ind, sc, plot, th, s, Y) {
  setFont(ctx, 400, 11.5 * s, F.mono); ctx.textAlign = "right"; ctx.textBaseline = "middle";
  sc.ticks.forEach(v => {
    const y = Math.round(Y(v)) + .5;
    ctx.strokeStyle = v === 0 ? th.muted : th.grid; ctx.lineWidth = v === 0 ? 1.2 * s : 1 * s;
    ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
    ctx.fillStyle = th.muted; ctx.fillText(axisFmt(v, ind, sc.step), plot.x - 8 * s, y);
  });
  ctx.textBaseline = "alphabetic";
}
function yLabelWidth(ctx, ind, sc, s) { setFont(ctx, 400, 11.5 * s, F.mono); return Math.max(...sc.ticks.map(v => ctx.measureText(axisFmt(v, ind, sc.step)).width)) + 12 * s; }
function xStep(xs) { return xs.length > 1 ? (xs[xs.length - 1] - xs[0]) / (xs.length - 1) || 1 : 1; }
function xTickEvery(ctx, labels, avail, s) {
  setFont(ctx, 400, 11.5 * s, F.mono);
  const w = Math.max(...labels.map(l => ctx.measureText(String(l)).width)) + 14 * s;
  return Math.max(1, Math.ceil(w / Math.max(1, avail)));
}

function drawCols(ctx, ind, b, th, s, t, hits, hover, xi, ys) {
  // sobrepor: com duas séries, a primeira (ex.: previsto) vira barra clara ao fundo e a segunda (ex.: executado) fica na frente
  const sob = !!ind.sobrepor && ys.length >= 2, bi = sob ? ys[0] : null;
  const yi = sob ? ys[1] : ys[0], rows = ind.linhas.filter(r => isNum(r[yi]) || (sob && isNum(r[bi]))), n = rows.length;
  if (!n) return;
  const vals = rows.map(r => isNum(r[yi]) ? r[yi] : 0), back = sob ? rows.map(r => isNum(r[bi]) ? r[bi] : 0) : [];
  const lo = Math.min(0, ...vals, ...back), hi = Math.max(0, ...vals, ...back), sc = nice(lo, hi, 5);
  const isYearish = rows.every(r => isNum(r[xi]));
  const numX = isYearish && ind.faixasGoverno;
  const yw = yLabelWidth(ctx, ind, sc, s);
  const bandsH = numX ? 20 * s : 0, valH = (sob ? 34 : 20) * s;
  const catLabels = rows.map(r => String(r[xi]));
  const bwGuess = (b.w - yw) / n;
  setFont(ctx, 500, 11.5 * s, F.body);
  const twoLines = !isYearish && catLabels.some(l => ctx.measureText(l).width > bwGuess - 4 * s);
  const botH = (twoLines ? 34 : 20) * s;
  const plot = { x: b.x + yw, y: b.y + bandsH + valH, w: b.w - yw, h: b.h - bandsH - valH - botH };
  const Y = v => plot.y + plot.h * (1 - (v - sc.lo) / (sc.hi - sc.lo));
  const bw = plot.w / n, gap = Math.max(1 * s, bw * (n > 20 ? .18 : .28));
  if (numX) {
    const xs = rows.map(r => r[xi]), st = xStep(xs), x0 = xs[0];
    const px = v => plot.x + ((v - x0) / st + .5) * bw;
    drawBands(ctx, govBands(xs[0], xs[xs.length - 1]), px, plot, th, s, b.y + 13 * s);
  }
  yAxis(ctx, ind, sc, plot, th, s, Y);
  const dest = (ind.destaque || []).map(String);
  const showAll = n <= 16;
  const iMax = vals.indexOf(Math.max(...vals)), iMin = vals.indexOf(Math.min(...vals));
  if (sob) {
    // legenda das duas séries, acima da área do gráfico
    setFont(ctx, 500, 11.5 * s, F.body); ctx.textBaseline = "middle"; ctx.textAlign = "left";
    let lx = plot.x; const ly = b.y + bandsH + 9 * s;
    [[ind.colunas[bi], .3], [ind.colunas[yi], 1]].forEach(([nome, a]) => {
      ctx.globalAlpha = a; ctx.fillStyle = th.accent; ctx.fillRect(lx, ly - 5 * s, 10 * s, 10 * s); ctx.globalAlpha = 1;
      ctx.fillStyle = th.ink; ctx.fillText(nome, lx + 15 * s, ly); lx += ctx.measureText(nome).width + 34 * s;
    });
    ctx.textBaseline = "alphabetic";
  }
  rows.forEach((r, i) => {
    const e = ease((t * 1.5) - (i / n) * .5);
    const v = vals[i] * e, x = plot.x + i * bw + gap / 2, w = bw - gap, y0 = Y(0), y1 = Y(v);
    if (hover != null && hover !== i) ctx.globalAlpha = .55;
    if (sob) {
      const yb = Y(back[i] * e);
      ctx.save(); ctx.globalAlpha *= .3; ctx.fillStyle = th.accent; ctx.fillRect(x, Math.min(y0, yb), w, Math.max(1, Math.abs(yb - y0))); ctx.restore();
    }
    ctx.fillStyle = dest.includes(String(r[xi])) ? th.accent2 : th.accent;
    ctx.fillRect(x, Math.min(y0, y1), w, Math.max(1, Math.abs(y1 - y0)));
    ctx.globalAlpha = 1;
    const lines = sob ? [[ind.colunas[bi], fmtV(back[i], ind)], [ind.colunas[yi], fmtV(vals[i], ind)], ...(back[i] ? [["Executado", nf(0).format(vals[i] / back[i] * 100) + "%"]] : [])] : [[ind.colunas[yi], fmtV(vals[i], ind)]];
    hits.push({ kind: "rect", x: plot.x + i * bw, y: plot.y, w: bw, h: plot.h, cx: x + w / 2, cy: Math.min(y0, Y(sob ? Math.max(vals[i], back[i]) : vals[i])), i, title: String(r[xi]), lines });
  });
  rows.forEach((r, i) => {
    const e = ease((t * 1.5) - (i / n) * .5);
    if ((showAll || i === iMax || i === iMin || i === n - 1) && e > .95) {
      setFont(ctx, 500, (n > 10 ? 10.5 : 12) * s, F.mono); ctx.fillStyle = th.ink; ctx.textAlign = "center";
      const lab = fmtV(vals[i], ind), lw = ctx.measureText(lab).width;
      if (lw < bw * 1.9 || !showAll) {
        const cx = Math.max(plot.x + lw / 2, Math.min(b.x + b.w - lw / 2, plot.x + i * bw + bw / 2));
        ctx.fillText(lab, cx, vals[i] >= 0 ? Y(vals[i]) - 6 * s : Y(vals[i]) + 14 * s);
      }
    }
  });
  ctx.fillStyle = th.muted; ctx.textAlign = "center";
  if (isYearish) {
    const every = xTickEvery(ctx, catLabels, bw, s);
    setFont(ctx, 400, 11.5 * s, F.mono);
    rows.forEach((r, i) => { if ((n - 1 - i) % every === 0) { const lab = String(r[xi]), lw = ctx.measureText(lab).width; ctx.fillText(lab, Math.max(plot.x + lw / 2, Math.min(b.x + b.w - lw / 2, plot.x + i * bw + bw / 2)), plot.y + plot.h + 16 * s); } });
  } else {
    setFont(ctx, 500, 11.5 * s, F.body);
    rows.forEach((r, i) => {
      const lines = wrapText(ctx, String(r[xi]), bw - 4 * s, twoLines ? 2 : 1);
      lines.forEach((l, k) => ctx.fillText(fit(ctx, l, bw - 2 * s), plot.x + i * bw + bw / 2, plot.y + plot.h + (16 + k * 14) * s));
    });
  }
}

function drawBars(ctx, ind, b, th, s, t, hits, hover, xi, ys) {
  const yi = ys[0], rows = ind.linhas.filter(r => isNum(r[yi])), n = rows.length;
  if (!n) return;
  const vals = rows.map(r => r[yi]), lo = Math.min(0, ...vals), hi = Math.max(0, ...vals) || 1;
  setFont(ctx, 500, 13 * s, F.body);
  const labW = Math.min(Math.max(...rows.map(r => ctx.measureText(String(r[xi])).width)) + 14 * s, b.w * .4);
  setFont(ctx, 500, 12 * s, F.mono);
  const valW = Math.max(...vals.map(v => ctx.measureText(fmtV(v, ind)).width)) + 10 * s;
  const plot = { x: b.x + labW, y: b.y, w: b.w - labW - valW, h: b.h };
  const X = v => plot.x + (v - lo) / (hi - lo) * plot.w;
  const rh = plot.h / n, bh = Math.min(rh * .64, 24 * s);
  const dest = (ind.destaque || []).map(String);
  if (lo < 0) { ctx.strokeStyle = th.muted; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(X(0), plot.y); ctx.lineTo(X(0), plot.y + plot.h); ctx.stroke(); }
  rows.forEach((r, i) => {
    const e = ease(t * 1.5 - (i / n) * .5), cy = plot.y + i * rh + rh / 2;
    setFont(ctx, 500, 13 * s, F.body); ctx.fillStyle = th.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(fit(ctx, String(r[xi]), labW - 12 * s), b.x, cy);
    ctx.fillStyle = th.grid; ctx.fillRect(plot.x, cy - bh / 2, plot.w, bh);
    ctx.fillStyle = dest.includes(String(r[xi])) ? th.accent2 : th.accent;
    if (hover != null && hover !== i) ctx.globalAlpha = .55;
    const x0 = X(0), x1 = X(vals[i] * e);
    ctx.fillRect(Math.min(x0, x1), cy - bh / 2, Math.max(1, Math.abs(x1 - x0)), bh);
    ctx.globalAlpha = 1;
    if (e > .3) {
      setFont(ctx, 500, 12 * s, F.mono); ctx.fillStyle = th.ink; ctx.globalAlpha = clamp01((e - .3) / .5);
      ctx.textAlign = "left"; ctx.fillText(fmtV(vals[i], ind), plot.x + plot.w + 8 * s, cy); ctx.globalAlpha = 1;
    }
    const extra = ind.colunas.map((c, k) => [c, r[k]]).filter((p, k) => k !== xi && k !== yi && p[1] != null && p[1] !== "").map(p => [p[0], fmtCell(p[1])]);
    hits.push({ kind: "rect", x: b.x, y: cy - rh / 2, w: b.w, h: rh, cx: x1, cy: cy - bh / 2, i, title: String(r[xi]), lines: [[ind.colunas[yi], fmtV(vals[i], ind)], ...extra] });
  });
  ctx.textBaseline = "alphabetic";
}

function drawLine(ctx, ind, b, th, s, t, hits, hover, xi, ys) {
  const rows = ind.linhas.filter(r => r[xi] != null && r[xi] !== ""), n = rows.length;
  if (!n) return;
  const numX = rows.every(r => isNum(r[xi]));
  const xs = rows.map((r, i) => numX ? r[xi] : i);
  const all = []; ys.forEach(k => rows.forEach(r => { if (isNum(r[k])) all.push(r[k]); }));
  if (!all.length) return;
  let lo = Math.min(...all), hi = Math.max(...all);
  if (lo > 0 && lo < hi * .35) lo = 0;
  if (isNum(ind.ymin)) lo = Math.min(lo, ind.ymin); // eixo fixo, quando o indicador pede
  if (isNum(ind.ymax)) hi = Math.max(hi, ind.ymax);
  const sc = nice(lo, hi, 5), multi = ys.length > 1;
  const yw = yLabelWidth(ctx, ind, sc, s);
  const bandsH = ind.faixasGoverno && numX ? 20 * s : 0, legH = multi ? 26 * s : 0;
  setFont(ctx, 600, 12 * s, F.mono);
  const lastW = Math.max(...ys.map(k => { const v = [...rows].reverse().find(r => isNum(r[k])); return v ? ctx.measureText(fmtV(v[k], ind)).width : 0; })) + 14 * s;
  const topPad = (multi ? 10 : 24) * s; // espaço para o rótulo do valor máximo não encostar nas faixas
  const plot = { x: b.x + yw, y: b.y + legH + bandsH + topPad, w: b.w - yw - lastW, h: b.h - legH - bandsH - topPad - 22 * s };
  const st = xStep(xs), x0 = xs[0] - st * .5, x1 = xs[n - 1] + st * .5;
  const px = v => plot.x + (v - x0) / (x1 - x0) * plot.w;
  const Y = v => plot.y + plot.h * (1 - (v - sc.lo) / (sc.hi - sc.lo));
  if (multi) {
    let lx = b.x; setFont(ctx, 500, 12.5 * s, F.body); ctx.textAlign = "left";
    ys.forEach((k, j) => { ctx.fillStyle = th.series[j % 5]; ctx.fillRect(lx, b.y + 7 * s, 14 * s, 4 * s); ctx.fillStyle = th.ink; ctx.fillText(ind.colunas[k], lx + 20 * s, b.y + 13 * s); lx += ctx.measureText(ind.colunas[k]).width + 40 * s; });
  }
  if (bandsH) drawBands(ctx, govBands(xs[0], xs[n - 1]), px, plot, th, s, b.y + legH + 13 * s);
  yAxis(ctx, ind, sc, plot, th, s, Y);
  const e = ease(t);
  ctx.save(); ctx.beginPath(); ctx.rect(plot.x - 6 * s, b.y, (plot.w + 12 * s) * e + 1, b.h); ctx.clip();
  ys.forEach((k, j) => {
    const color = th.series[j % 5], pts = rows.map((r, i) => isNum(r[k]) ? [px(xs[i]), Y(r[k])] : null);
    if (!multi) {
      const g = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
      const hex = /^#[0-9a-f]{6}$/i.test(color);
      if (hex) { g.addColorStop(0, color + "40"); g.addColorStop(1, color + "00"); }
      ctx.fillStyle = hex ? g : th.band;
      let seg = []; const flush = () => { if (seg.length > 1) { ctx.beginPath(); ctx.moveTo(seg[0][0], Y(Math.max(sc.lo, 0))); seg.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(seg[seg.length - 1][0], Y(Math.max(sc.lo, 0))); ctx.closePath(); ctx.fill(); } seg = []; };
      pts.forEach(p => p ? seg.push(p) : flush()); flush();
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2.6 * s; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); let pen = false;
    pts.forEach(p => { if (!p) { pen = false; return; } pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; }); ctx.stroke();
    if (n <= 24) pts.forEach(p => { if (p) { ctx.fillStyle = th.bg; ctx.beginPath(); ctx.arc(p[0], p[1], 3.2 * s, 0, 7); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2 * s; ctx.stroke(); } });
  });
  ctx.restore();
  if (hover != null && rows[hover]) {
    const gx = px(xs[hover]); ctx.strokeStyle = th.muted; ctx.lineWidth = 1 * s; ctx.setLineDash([3 * s, 3 * s]);
    ctx.beginPath(); ctx.moveTo(gx, plot.y); ctx.lineTo(gx, plot.y + plot.h); ctx.stroke(); ctx.setLineDash([]);
    ys.forEach((k, j) => { const v = rows[hover][k]; if (isNum(v)) { ctx.fillStyle = th.series[j % 5]; ctx.beginPath(); ctx.arc(gx, Y(v), 5 * s, 0, 7); ctx.fill(); } });
  }
  if (t > .85) {
    ctx.globalAlpha = clamp01((t - .85) / .15);
    if (!multi) {
      const k = ys[0], vals = rows.map(r => r[k]), idx = new Set();
      const valid = vals.map((v, i) => isNum(v) ? i : -1).filter(i => i >= 0);
      const iMax = valid.reduce((a, i) => vals[i] > vals[a] ? i : a, valid[0]), iMin = valid.reduce((a, i) => vals[i] < vals[a] ? i : a, valid[0]);
      [valid[0], iMax, iMin, valid[valid.length - 1]].forEach(i => idx.add(i));
      setFont(ctx, 600, 12 * s, F.mono); ctx.fillStyle = th.ink;
      [...idx].forEach(i => {
        const x = px(xs[i]), y = Y(vals[i]), isLast = i === valid[valid.length - 1];
        const nb = [vals[i - 1], vals[i + 1]].filter(isNum), avg = nb.length ? nb.reduce((a, c) => a + c, 0) / nb.length : vals[i];
        const above = i === iMax || (i !== iMin && vals[i] >= avg);
        const lab = fmtV(vals[i], ind), lw = ctx.measureText(lab).width;
        if (isLast) { ctx.textAlign = "left"; ctx.fillText(lab, x + 8 * s, y + 4 * s); return; }
        ctx.textAlign = "center";
        ctx.fillText(lab, Math.max(plot.x + lw / 2, x), above ? y - 10 * s : y + 19 * s);
      });
    } else {
      const ends = ys.map((k, j) => { const r = [...rows].reverse().find(r => isNum(r[k])); const i = rows.indexOf(r); return r ? { y: Y(r[k]), x: px(xs[i]), txt: fmtV(r[k], ind), j } : null; }).filter(Boolean).sort((a, c) => a.y - c.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15 * s) ends[i].y = ends[i - 1].y + 15 * s;
      setFont(ctx, 600, 12 * s, F.mono); ctx.textAlign = "left";
      ends.forEach(en => { ctx.fillStyle = th.series[en.j % 5]; ctx.fillText(en.txt, en.x + 8 * s, en.y + 4 * s); });
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = th.muted; ctx.textAlign = "center";
  const labels = rows.map(r => String(r[xi])), stepPx = plot.w / n, every = xTickEvery(ctx, labels, stepPx, s);
  setFont(ctx, 400, 11.5 * s, F.mono);
  rows.forEach((r, i) => { if ((n - 1 - i) % every === 0) ctx.fillText(labels[i], px(xs[i]), plot.y + plot.h + 17 * s); });
  rows.forEach((r, i) => hits.push({ kind: "strip", x: px(xs[i]) - stepPx / 2, y: plot.y, w: stepPx, h: plot.h, cx: px(xs[i]), cy: Math.min(...ys.map(k => isNum(r[k]) ? Y(r[k]) : plot.y + plot.h)), i, title: labels[i], lines: ys.map(k => [ind.colunas[k], fmtV(r[k], ind)]) }));
}

function drawScatter(ctx, ind, b, th, s, t, hits, hover, xi, ys) {
  const yi = ys[0], li = col(ind, ind.rotulo), pts = ind.linhas.filter(r => isNum(r[xi]) && isNum(r[yi]));
  if (!pts.length) return;
  const xv = pts.map(r => r[xi]), yv = pts.map(r => r[yi]);
  const plain = { ...ind, prefixo: "", sufixo: "" };
  const sx = nice(Math.min(...xv), Math.max(...xv), 5), sy = nice(Math.min(0, Math.min(...yv)), Math.max(...yv), 5);
  const yw = yLabelWidth(ctx, plain, sy, s);
  const plot = { x: b.x + yw, y: b.y + 22 * s, w: b.w - yw - 10 * s, h: b.h - 22 * s - 42 * s };
  const X = v => plot.x + (v - sx.lo) / (sx.hi - sx.lo) * plot.w, Y = v => plot.y + plot.h * (1 - (v - sy.lo) / (sy.hi - sy.lo));
  yAxis(ctx, plain, sy, plot, th, s, Y);
  setFont(ctx, 400, 11.5 * s, F.mono); ctx.fillStyle = th.muted; ctx.textAlign = "center";
  sx.ticks.forEach(v => { const x = X(v); ctx.strokeStyle = th.grid; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke(); ctx.fillText(axisFmt(v, {}, sx.step), x, plot.y + plot.h + 17 * s); });
  setFont(ctx, 600, 11.5 * s, F.body); ctx.fillStyle = th.ink;
  ctx.textAlign = "right"; ctx.fillText(ind.x + " →", plot.x + plot.w, plot.y + plot.h + 36 * s);
  ctx.textAlign = "left"; ctx.fillText("↑ " + ind.colunas[yi], b.x, b.y + 12 * s);
  if (ind.tendencia && pts.length > 2) {
    const n = pts.length, mx = xv.reduce((a, c) => a + c, 0) / n, my = yv.reduce((a, c) => a + c, 0) / n;
    const sl = xv.reduce((a, x, i) => a + (x - mx) * (yv[i] - my), 0) / xv.reduce((a, x) => a + (x - mx) ** 2, 0), ic = my - sl * mx;
    const a = Math.min(...xv), c = Math.max(...xv), e = ease(t);
    ctx.save(); ctx.beginPath(); ctx.rect(plot.x, plot.y, plot.w, plot.h); ctx.clip();
    ctx.strokeStyle = th.accent2; ctx.lineWidth = 2.2 * s; ctx.setLineDash([7 * s, 5 * s]);
    ctx.beginPath(); ctx.moveTo(X(a), Y(sl * a + ic)); const cc = a + (c - a) * e; ctx.lineTo(X(cc), Y(sl * cc + ic)); ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
  }
  const dest = (ind.destaque || []).map(String), placed = [];
  const order = pts.map((r, i) => i).sort((a, c) => (dest.includes(String(pts[c][li])) ? 1 : 0) - (dest.includes(String(pts[a][li])) ? 1 : 0));
  pts.forEach((r, i) => {
    const e = ease(t * 1.6 - (i / pts.length) * .6), isD = li >= 0 && dest.includes(String(r[li]));
    ctx.fillStyle = isD ? th.accent2 : th.accent; ctx.globalAlpha = hover != null && hover !== i ? .35 : .9;
    ctx.beginPath(); ctx.arc(X(r[xi]), Y(r[yi]), (isD ? 6.5 : 5) * s * e, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    hits.push({ kind: "circle", cx: X(r[xi]), cy: Y(r[yi]), r: 11 * s, i, title: li >= 0 ? String(r[li]) : "", lines: [[ind.x, fmtCell(r[xi])], [ind.colunas[yi], fmtV(r[yi], ind)]] });
  });
  if (li >= 0 && t > .8) {
    ctx.globalAlpha = clamp01((t - .8) / .2);
    order.forEach(i => {
      const r = pts[i], isD = dest.includes(String(r[li]));
      setFont(ctx, isD ? 700 : 500, (isD ? 12.5 : 11) * s, F.body);
      const txt = String(r[li]), w = ctx.measureText(txt).width, x = X(r[xi]) + 8 * s, y = Y(r[yi]) + 4 * s;
      const box = { x, y: y - 11 * s, w, h: 13 * s };
      if (!isD && placed.some(p => box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h > p.y)) return;
      placed.push(box); ctx.fillStyle = isD ? th.ink : th.muted; ctx.textAlign = "left"; ctx.fillText(txt, x, y);
    });
    ctx.globalAlpha = 1;
  }
}

export function drawTableCanvas(ctx, ind, b, th) {
  const cols = ind.colunas, rows = ind.linhas, n = rows.length;
  const numCol = numericCols(ind);
  const bi = col(ind, ind.barra), cd = cols.map((c, k) => numCol[k] ? colDecs(rows, k) : null);
  let fs = Math.min(30, Math.max(14, (b.h / (n + 1.3)) * .6)), widths;
  for (; fs >= 12; fs -= 1) {
    widths = cols.map((c, k) => { setFont(ctx, 600, fs * .74, F.mono); let w = ctx.measureText(c.toUpperCase()).width; setFont(ctx, 500, fs, numCol[k] ? F.mono : F.body); rows.forEach(r => { w = Math.max(w, ctx.measureText(fmtCell(r[k], cd[k])).width); }); return w + fs * 1.4; });
    if (widths.reduce((a, c) => a + c, 0) + (bi >= 0 ? 160 : 0) <= b.w) break;
  }
  const base = widths.reduce((a, c) => a + c, 0);
  let bar = 0;
  if (bi >= 0) bar = Math.max(120, b.w - base - fs * 2);
  else { const extra = (b.w - base) / cols.length; widths = widths.map(w => w + Math.max(0, extra)); }
  const rh = Math.min(fs * 2.1, b.h / (n + 1.3));
  let x = b.x; const xs = widths.map(w => { const a = x; x += w; return a; });
  const barX = bi >= 0 ? xs[bi] + widths[bi] : 0;
  if (bi >= 0) for (let k = bi + 1; k < cols.length; k++) xs[k] += bar;
  let y = b.y;
  setFont(ctx, 600, fs * .74, F.mono); ctx.fillStyle = th.muted; ctx.textBaseline = "middle";
  cols.forEach((c, k) => { ctx.textAlign = numCol[k] ? "right" : "left"; ctx.fillText(c.toUpperCase(), numCol[k] ? xs[k] + widths[k] - fs * .5 : xs[k] + fs * .3, y + rh * .5); });
  y += rh; ctx.fillStyle = th.ink; ctx.fillRect(b.x, y - 1, b.w, 2);
  const bmax = bi >= 0 ? Math.max(...rows.map(r => isNum(r[bi]) ? Math.abs(r[bi]) : 0)) || 1 : 1;
  rows.forEach((r, i) => {
    if (i % 2 === 1) { ctx.fillStyle = th.band; ctx.fillRect(b.x, y, b.w, rh); }
    cols.forEach((c, k) => {
      setFont(ctx, k === 0 ? 600 : 500, fs, numCol[k] ? F.mono : F.body);
      const v = r[k]; ctx.fillStyle = isNum(v) && v < 0 ? th.accent2 : th.ink;
      ctx.textAlign = numCol[k] ? "right" : "left";
      ctx.fillText(fit(ctx, fmtCell(v, cd[k]), widths[k] - fs * .6), numCol[k] ? xs[k] + widths[k] - fs * .5 : xs[k] + fs * .3, y + rh * .52);
    });
    if (bi >= 0 && isNum(r[bi])) { const bh = Math.min(rh * .42, fs * .7); ctx.fillStyle = th.grid; ctx.fillRect(barX + fs * .4, y + rh / 2 - bh / 2, bar - fs * .8, bh); ctx.fillStyle = th.accent; ctx.fillRect(barX + fs * .4, y + rh / 2 - bh / 2, (bar - fs * .8) * Math.abs(r[bi]) / bmax, bh); }
    y += rh;
  });
  ctx.textBaseline = "alphabetic";
}

/* ------------------------------------------------------------ tabela HTML animada */
export function renderTable(ind, { animate = false, onReport = null } = {}) {
  const cols = ind.colunas, rows = ind.linhas;
  const numCol = numericCols(ind);
  const bi = col(ind, ind.barra), bmax = bi >= 0 ? Math.max(...rows.map(r => isNum(r[bi]) ? Math.abs(r[bi]) : 0)) || 1 : 1;
  const cd = cols.map((c, k) => numCol[k] ? colDecs(rows, k) : null);
  const thead = h("thead", {}, h("tr", {}, cols.map((c, k) => [h("th", { class: numCol[k] ? "n" : "", scope: "col", text: c }), k === bi ? h("th", { "aria-hidden": "true" }) : null]), onReport ? h("th", { class: "rep", scope: "col" }, h("span", { class: "sr", text: "Reportar" })) : null));
  const nums = [];
  const tbody = h("tbody", {}, rows.map((r, i) => {
    const tr = h("tr", { style: `--i:${animate ? Math.min(i, 30) : 0}` });
    cols.forEach((c, k) => {
      const v = r[k];
      if (numCol[k]) { const sp = h("span", { text: animate && isNum(v) && !reduced ? fmtCell(0, cd[k]) : fmtCell(v, cd[k]) }); if (isNum(v)) nums.push([sp, v, cd[k]]); tr.append(h(k === 0 ? "th" : "td", { class: "n" + (isNum(v) && v < 0 ? " neg" : ""), scope: k === 0 ? "row" : null }, sp)); }
      else tr.append(h(k === 0 ? "th" : "td", { scope: k === 0 ? "row" : null, text: fmtCell(v) }));
      if (k === bi) { const iEl = h("i"); tr.append(h("td", { class: "barcell", "aria-hidden": "true" }, h("div", { class: "bar" }, iEl))); requestAnimationFrame(() => requestAnimationFrame(() => { iEl.style.width = (isNum(v) ? Math.abs(v) / bmax * 100 : 0) + "%"; })); }
    });
    if (onReport) {
      const resumo = cols.map((c, k) => `${c}: ${numCol[k] ? fmtCell(r[k], cd[k]) : fmtCell(r[k])}`).join(" · ");
      tr.append(h("td", { class: "rep" }, h("button", { class: "repbtn", type: "button", title: "Reportar erro nesta linha", "aria-label": `Reportar erro na linha ${fmtCell(r[0])}`, onclick: () => onReport(resumo), html: ICON.flag })));
    }
    return tr;
  }));
  const table = h("table", { class: "tbl" + (animate ? " anim" : "") }, thead, tbody);
  if (animate && !reduced) {
    const t0 = performance.now(), dur = 900;
    const step = now => { const e = ease((now - t0) / dur); nums.forEach(([sp, v, c]) => { sp.textContent = fmtCell(v * e, c); }); if (e < 1) requestAnimationFrame(step); else nums.forEach(([sp, v, c]) => sp.textContent = fmtCell(v, c)); };
    requestAnimationFrame(step);
  }
  return h("div", { class: "tblwrap" }, table);
}

export const ICON = {
  png: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10"/></svg>',
  tbl: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M2 7h12M6 7v6"/></svg>',
  chart: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 13h12M4 11V7m4 4V4m4 7V8"/></svg>',
  link: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 9a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4l-1 1M9 7a3 3 0 0 0-4 0L3 9a3 3 0 0 0 4 4l1-1"/></svg>',
  flag: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 14V2.5m0 0h8l-1.5 3L11 8.5H3"/></svg>',
  csv: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 1.5h5l3 3v10H4z"/><path d="M9 1.5v3h3M6 9h4M6 11.5h4"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 8h10m0 0-4-4m4 4-4 4"/></svg>',
};

/* ------------------------------------------------------------ mapa do Brasil por região */
const hexRGB = c => {
  const t = String(c).trim(), m = /^#?([0-9a-f]{6})$/i.exec(t);
  if (m) { const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  const r = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(t);
  return r ? [+r[1], +r[2], +r[3]] : null;
};
function mix(a, b, t) { const A = hexRGB(a), B = hexRGB(b); if (!A || !B) return b; return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * t)).join(",")})`; }
const PATHS = {};
const pathOf = nome => PATHS[nome] || (PATHS[nome] = MAPA_BR.regioes[nome] ? new Path2D(MAPA_BR.regioes[nome].d) : null);
function drawMap(ctx, ind, b, th, s, t, hits, hover, xi, ys) {
  const yi = ys[0], rows = ind.linhas.filter(r => isNum(r[yi]) && MAPA_BR.regioes[String(r[xi])]);
  if (!rows.length) return;
  const vals = rows.map(r => r[yi]), lo = Math.min(...vals), hi = Math.max(...vals), rg = hi - lo || 1;
  const legH = 34 * s;
  const sc = Math.min(b.w / MAPA_BR.w, (b.h - legH) / MAPA_BR.h);
  const ox = b.x + (b.w - MAPA_BR.w * sc) / 2, oy = b.y;
  const claro = mix(th.bg, th.accent, .14), escuro = th.accent;
  const e = ease(t);
  ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);
  rows.forEach((r, i) => {
    const p = pathOf(String(r[xi])); if (!p) return;
    ctx.globalAlpha = (hover != null && hover !== i ? .55 : 1) * (.25 + .75 * e);
    ctx.fillStyle = mix(claro, escuro, (r[yi] - lo) / rg * .85 + .15);
    ctx.fill(p, "evenodd");
    ctx.globalAlpha = 1; ctx.strokeStyle = th.bg; ctx.lineWidth = 3 * s / sc; ctx.lineJoin = "round"; ctx.stroke(p);
  });
  ctx.restore();
  // rótulos: nome da região e valor, com contorno da cor do fundo para ler sobre qualquer tom
  const big = Math.max(16 * s, Math.min(34 * s, MAPA_BR.w * sc * .055));
  rows.forEach((r, i) => {
    const reg = MAPA_BR.regioes[String(r[xi])], cx = ox + reg.rot[0] * sc, cy = oy + reg.rot[1] * sc;
    ctx.globalAlpha = clamp01((e - .35) / .5); ctx.textAlign = "center"; ctx.lineJoin = "round";
    setFont(ctx, 600, big * .48, F.body); ctx.lineWidth = 4 * s; ctx.strokeStyle = th.bg; ctx.fillStyle = th.ink; ctx.textBaseline = "alphabetic";
    ctx.strokeText(String(r[xi]), cx, cy - big * .2); ctx.fillText(String(r[xi]), cx, cy - big * .2);
    setFont(ctx, 700, big, F.disp); ctx.lineWidth = 5 * s;
    ctx.strokeText(fmtV(r[yi], ind), cx, cy + big * .78); ctx.fillText(fmtV(r[yi], ind), cx, cy + big * .78);
    ctx.globalAlpha = 1;
    const extra = ind.colunas.map((c, k) => [c, r[k]]).filter((q, k) => k !== xi && k !== yi && q[1] != null && q[1] !== "").map(q => [q[0], fmtCell(q[1])]);
    hits.push({ kind: "circle", cx, cy, r: Math.max(28 * s, big * 1.6), i, title: String(r[xi]), lines: [[ind.colunas[yi], fmtV(r[yi], ind)], ...extra] });
  });
  // legenda: escala do menor ao maior valor
  const lw = Math.min(220 * s, b.w * .45), lx = b.x + (b.w - lw) / 2, ly = b.y + b.h - legH + 6 * s;
  const gr = ctx.createLinearGradient(lx, 0, lx + lw, 0); gr.addColorStop(0, mix(claro, escuro, .15)); gr.addColorStop(1, escuro);
  ctx.fillStyle = gr; ctx.fillRect(lx, ly, lw, 8 * s);
  setFont(ctx, 500, 11.5 * s, F.mono); ctx.fillStyle = th.muted; ctx.textBaseline = "top";
  ctx.textAlign = "left"; ctx.fillText(fmtV(lo, ind), lx, ly + 12 * s);
  ctx.textAlign = "right"; ctx.fillText(fmtV(hi, ind), lx + lw, ly + 12 * s);
  ctx.textBaseline = "alphabetic";
}

/* ------------------------------------------------------------ gráfico na tela */
const CHARTS = new Set();
export function heightFor(ind, w, big) {
  if (ind.tipo === "barras") { const n = ind.linhas.length; return Math.max(160, n * (w < 500 ? 30 : big ? 36 : 32) + 8); }
  if (ind.tipo === "mapa") return Math.round(Math.max(300, Math.min(big ? 600 : 420, w * MAPA_BR.h / MAPA_BR.w + 34)));
  return Math.round(Math.max(250, Math.min(big ? 460 : 390, w * (big ? .5 : .56))));
}
export function makeChart(ind, wrap, { big = false, still = false } = {}) {
  const canvas = h("canvas", { role: "img", "aria-label": `Gráfico: ${ind.titulo}. ${ind.subtitulo || ""}. Os valores estão na tabela de dados.` });
  const tip = h("div", { class: "tip", "aria-hidden": "true" });
  wrap.append(canvas, tip);
  const c = { ind, wrap, canvas, tip, t: reduced || still ? 1 : 0, hits: [], hover: null, started: still };
  c.paint = () => {
    const w = wrap.clientWidth; if (!w) return;
    const hh = heightFor(c.ind, w, big), dpr = Math.min(2.5, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hh * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(hh * dpr); canvas.style.height = hh + "px"; }
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, hh);
    c.hits = []; drawChart(ctx, c.ind, { x: 0, y: 0, w, h: hh }, themeCSS(), 1, c.t, c.hits, c.hover);
  };
  c.play = () => {
    if (c.started) return; c.started = true;
    if (reduced) { c.t = 1; c.paint(); return; }
    const t0 = performance.now(), dur = 1100;
    const step = now => { c.t = Math.min(1, (now - t0) / dur); c.paint(); if (c.t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const find = (mx, my) => {
    for (const ht of c.hits) {
      if (ht.kind === "circle" && Math.hypot(mx - ht.cx, my - ht.cy) <= ht.r) return ht;
      if ((ht.kind === "rect" || ht.kind === "strip") && mx >= ht.x && mx <= ht.x + ht.w && my >= ht.y - 30 && my <= ht.y + ht.h + 30) return ht;
    }
    return null;
  };
  const leave = () => { tip.classList.remove("on"); if (c.hover != null) { c.hover = null; c.paint(); } };
  const move = ev => {
    if (c.t < 1) return;
    const r = canvas.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top, ht = find(mx, my);
    if (!ht) { leave(); return; }
    tip.replaceChildren(h("b", { text: ht.title }), ...ht.lines.map(([k, v]) => h("div", {}, k + ": ", h("span", { class: "mono", text: v }))));
    const tw = tip.offsetWidth, x = Math.max(tw / 2 + 4, Math.min(r.width - tw / 2 - 4, ht.cx));
    tip.style.left = x + "px"; tip.style.top = Math.max(tip.offsetHeight + 12, ht.cy) + "px"; tip.classList.add("on");
    if (c.hover !== ht.i) { c.hover = ht.i; c.paint(); }
  };
  c.setInd = novo => { c.ind = novo; c.hover = null; tip.classList.remove("on"); c.paint(); };
  canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerdown", move); canvas.addEventListener("pointerleave", leave);
  CHARTS.add(c);
  return c;
}
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const c = [...CHARTS].find(c => c.wrap === e.target); if (c) { c.play(); io.unobserve(e.target); } } }), { threshold: .25 }) : null;
const ro = "ResizeObserver" in window ? new ResizeObserver(es => es.forEach(e => { const c = [...CHARTS].find(c => c.wrap === e.target); if (c) c.paint(); })) : null;
export function mountChart(ind, wrap, opts) {
  const c = makeChart(ind, wrap, opts);
  requestAnimationFrame(() => { c.paint(); if (!c.started) { if (io) io.observe(wrap); else c.play(); } if (ro) ro.observe(wrap); });
  if (!c.started) setTimeout(() => c.play(), 2500);
  return c;
}
export function clearCharts() { CHARTS.clear(); }
export function repaintAll() { CHARTS.forEach(c => { if (c.wrap.isConnected) c.paint(); else CHARTS.delete(c); }); }
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaintAll);
new MutationObserver(repaintAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* ------------------------------------------------------------ imagem PNG para redes */
export const FORMATS = {
  feed: { w: 1080, h: 1350, nome: "Feed 4:5" },
  quadrado: { w: 1080, h: 1080, nome: "Quadrado" },
  stories: { w: 1080, h: 1920, nome: "Stories 9:16" },
  og: { w: 1200, h: 630, nome: "Prévia de link", oculto: true },
};
export async function composePNG(ind, fk, tk, { categoria = "", siteNome = "Indicadores BR", siteDominio = "" } = {}) {
  try { await document.fonts.ready; } catch (e) {}
  const FM = FORMATS[fk], th = EXPORT_THEMES[tk], W = FM.w, H = FM.h;
  const og = fk === "og", P = og ? 56 : 76;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = th.accent; ctx.fillRect(0, 0, W, og ? 8 : 10);
  let y = P + (fk === "stories" ? 90 : 0);
  setFont(ctx, 600, og ? 20 : 24, F.mono); ctx.fillStyle = th.accent; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText(categoria.toUpperCase(), P, y + 18);
  y += og ? 34 : 46;
  const tsz = og ? 50 : fk === "quadrado" ? 64 : 76;
  setFont(ctx, 700, tsz, F.disp); ctx.fillStyle = th.ink;
  wrapText(ctx, ind.titulo, og ? W * .42 : W - 2 * P, og ? 4 : 3).forEach(l => { y += tsz * .98; ctx.fillText(l, P, y); });
  if (!og) {
    y += 14; setFont(ctx, 400, 28, F.body); ctx.fillStyle = th.muted;
    wrapText(ctx, ind.subtitulo, W - 2 * P, 3).forEach(l => { y += 38; ctx.fillText(l, P, y); });
    y += 40;
  }
  // rodapé: fonte à esquerda, marca do portal à direita
  setFont(ctx, 700, og ? 34 : 42, F.disp);
  const brandW = ctx.measureText(siteNome).width + 48;
  setFont(ctx, 500, og ? 20 : 24, F.body);
  const srcW = og ? W * .42 : W - 2 * P - brandW;
  const srcLines = wrapText(ctx, "Fonte: " + (ind.fonte && ind.fonte.nome || "não informada"), srcW, og ? 3 : 3);
  const dom = domain(ind.fonte && ind.fonte.url);
  const lineH = og ? 27 : 32;
  const footH = 34 + srcLines.length * lineH + (dom ? 34 : 0) + 6;
  const fy = H - P - footH - (fk === "stories" ? 110 : 0);
  if (og) {
    const box = { x: W * .5, y: P, w: W * .5 - P, h: H - 2 * P };
    drawChart(ctx, ind, box, th, ind.tipo === "tabela" ? 1 : 1.25, 1, [], null);
    let sy = H - P - srcLines.length * lineH - (dom ? 30 : 0);
    setFont(ctx, 500, 20, F.body); ctx.fillStyle = th.ink; ctx.textAlign = "left";
    srcLines.forEach(l => { ctx.fillText(l, P, sy); sy += lineH; });
    if (dom) { setFont(ctx, 400, 18, F.mono); ctx.fillStyle = th.muted; ctx.fillText(dom, P, sy); }
    setFont(ctx, 700, 30, F.disp); ctx.fillStyle = th.accent; ctx.fillText(siteNome, P, H - P - srcLines.length * lineH - (dom ? 30 : 0) - 40);
    return cv;
  }
  const box = { x: P, y, w: W - 2 * P, h: fy - y - 36 };
  drawChart(ctx, ind, box, th, fk === "quadrado" ? 1.75 : 2, 1, [], null);
  ctx.fillStyle = th.ink; ctx.fillRect(P, fy, W - 2 * P, 2);
  let sy = fy + 40; setFont(ctx, 500, 24, F.body); ctx.fillStyle = th.ink; ctx.textAlign = "left";
  srcLines.forEach(l => { ctx.fillText(l, P, sy); sy += lineH; });
  if (dom) { setFont(ctx, 400, 21, F.mono); ctx.fillStyle = th.muted; ctx.fillText(dom, P, sy + 2); }
  ctx.textAlign = "right"; setFont(ctx, 700, 42, F.disp); ctx.fillStyle = th.ink;
  ctx.fillText(siteNome, W - P, fy + 48);
  if (siteDominio) { setFont(ctx, 500, 22, F.mono); ctx.fillStyle = th.accent; ctx.fillText(siteDominio, W - P, fy + 82); }
  return cv;
}
