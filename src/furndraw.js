// Dessins vus de dessus, un par meuble du catalogue. Chaque fonction reçoit la largeur et la
// profondeur (dm) et la couleur choisie, et dessine dans le rectangle [0, w] × [0, h].
// Le dos du meuble (côté mur) est en haut (y = 0).

/* ---------- outils ---------- */
const n2 = (v) => Math.round(v * 100) / 100;
const A = (o) => Object.entries(o).filter(([, v]) => v != null && v !== false).map(([k, v]) => `${k}="${typeof v === "number" ? n2(v) : v}"`).join(" ");
const sw = (s, w) => (s ? { stroke: s, "stroke-width": w ?? 0.18 } : {});
const R = (x, y, w, h, r, f, s, k, ex = {}) => `<rect ${A({ x, y, width: Math.max(0, w), height: Math.max(0, h), rx: r || null, fill: f || "none", ...sw(s, k), ...ex })}/>`;
const C = (cx, cy, r, f, s, k, ex = {}) => `<circle ${A({ cx, cy, r: Math.max(0, r), fill: f || "none", ...sw(s, k), ...ex })}/>`;
const E = (cx, cy, rx, ry, f, s, k, ex = {}) => `<ellipse ${A({ cx, cy, rx: Math.max(0, rx), ry: Math.max(0, ry), fill: f || "none", ...sw(s, k), ...ex })}/>`;
const L = (x1, y1, x2, y2, s, k, ex = {}) => `<line ${A({ x1, y1, x2, y2, stroke: s, "stroke-width": k ?? 0.15, "stroke-linecap": "round", ...ex })}/>`;
const P = (d, f, s, k, ex = {}) => `<path ${A({ d, fill: f || "none", ...sw(s, k), "stroke-linecap": s ? "round" : null, "stroke-linejoin": s ? "round" : null, ...ex })}/>`;
const G = (inner, ex = {}) => `<g ${A(ex)}>${inner}</g>`;
const at = (x, y, a = 0, s = 1) => `translate(${n2(x)} ${n2(y)})${a ? ` rotate(${n2(a)})` : ""}${s !== 1 ? ` scale(${n2(s)})` : ""}`;
const hx = (c) => { let s = c.replace("#", ""); if (s.length === 3) s = s.split("").map((x) => x + x).join(""); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)); };
const mix = (a, b, t) => { const p = hx(a), q = hx(b); return "#" + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const lt = (c, t) => mix(c, "#ffffff", t), dk = (c, t) => mix(c, "#000000", t);
let seed = 1; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const reseed = (s) => { seed = Math.abs(Math.round(s * 7919)) % 233280 || 1; };

/* ---------- matières ---------- */
const OAK = "#e6b874", OAKD = "#b07d42", OAKL = "#f3d7a6", WAL = "#a8693f", WALD = "#6f4223", TEAK = "#c98d53", TEAKD = "#8a5a2c";
const WHITE = "#fbfaf6", LINE = "#cfc7b8", CER = "#ffffff", CERS = "#a9bccb", STEEL = "#d3dae1", STEELD = "#87939f";
const BLACK = "#22272e", WATER = "#79c8f0", WATERD = "#2f8fd8", STONE = "#f1ece3", LEAF = "#5cb86b", LEAFD = "#2e7a3f", LEAFL = "#9bdc84";
const POT = "#d27b4c", POTD = "#94502c", SOIL = "#6e4b32", FLAME = "#ff9a2e", GLOW = "#ffd36b";
const PAL = ["#ee7a62", "#e5b13a", "#4f7fd9", "#86b38a", "#9d86d6", "#2f8f9d", "#ee9fb3", "#cf6e46"];

function grain(x, y, w, h, c, k = 3) {
  const out = [], hor = w >= h;
  for (let i = 1; i <= k; i++) {
    if (hor) { const yy = y + (h * i) / (k + 1), a = (i % 2 ? 1 : -1) * Math.min(0.35, h * 0.06); out.push(P(`M${n2(x + w * 0.04)} ${n2(yy)}q${n2(w * 0.23)} ${n2(a)} ${n2(w * 0.46)} 0t${n2(w * 0.46)} 0`, null, dk(c, 0.14), 0.09, { opacity: 0.75 })); }
    else { const xx = x + (w * i) / (k + 1), a = (i % 2 ? 1 : -1) * Math.min(0.35, w * 0.06); out.push(P(`M${n2(xx)} ${n2(y + h * 0.04)}q${n2(a)} ${n2(h * 0.23)} 0 ${n2(h * 0.46)}t0 ${n2(h * 0.46)}`, null, dk(c, 0.14), 0.09, { opacity: 0.75 })); }
  }
  return out.join("");
}
const woodTop = (x, y, w, h, r, c = OAK) => R(x, y, w, h, r, c, dk(c, 0.3), 0.2) + R(x + 0.25, y + 0.25, w - 0.5, Math.min(h * 0.35, 1.2), r, lt(c, 0.25), null, 0, { opacity: 0.6 }) + grain(x, y, w, h, c, Math.max(2, Math.min(5, Math.round(Math.min(w, h) / 2.2))));
const cushion = (x, y, w, h, r, c) => R(x, y, w, h, r, c, dk(c, 0.28), 0.15) + R(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.38, r * 0.7, lt(c, 0.22), null, 0, { opacity: 0.75 });
function pillow(x, y, w, h, c) {
  const r = Math.min(w, h) * 0.38;
  return R(x, y, w, h, r, c, dk(c, 0.2), 0.14) + R(x + w * 0.12, y + h * 0.14, w * 0.5, h * 0.36, r * 0.6, lt(c, 0.35), null, 0, { opacity: 0.8 })
    + P(`M${n2(x + w * 0.2)} ${n2(y + h * 0.75)}q${n2(w * 0.3)} ${n2(-h * 0.2)} ${n2(w * 0.6)} 0`, null, dk(c, 0.12), 0.1, { opacity: 0.6 });
}
function leaf(cx, cy, len, wid, ang, c, cls) {
  const d = `M0 0Q${n2(wid)} ${n2(len * 0.45)} 0 ${n2(len)}Q${n2(-wid)} ${n2(len * 0.45)} 0 0z`;
  return G(P(d, c, dk(c, 0.3), 0.08) + L(0, len * 0.08, 0, len * 0.9, lt(c, 0.35), 0.07), { transform: at(cx, cy, ang), class: cls || null });
}
function flower(cx, cy, r, c) {
  let s = ""; for (let i = 0; i < 5; i++) { const a = (i * 72 * Math.PI) / 180; s += C(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.5, c); }
  return s + C(cx, cy, r * 0.32, "#ffd54a");
}
function plate(cx, cy, r, fork = true) {
  return C(cx, cy, r, CER, "#c9d1d8", 0.1) + C(cx, cy, r * 0.62, null, "#e2e7eb", 0.1)
    + (fork ? L(cx - r * 1.3, cy - r * 0.7, cx - r * 1.3, cy + r * 0.7, "#9aa4ae", 0.12) + L(cx + r * 1.3, cy - r * 0.7, cx + r * 1.3, cy + r * 0.7, "#9aa4ae", 0.12) : "");
}
function chair(cx, cy, s, ang, c) {
  return G(R(-s / 2, -s / 2, s, s, s * 0.22, c, dk(c, 0.3), 0.14) + R(-s * 0.36, -s * 0.36, s * 0.72, s * 0.3, s * 0.12, lt(c, 0.25), null, 0, { opacity: 0.7 })
    + R(-s / 2, -s * 0.66, s, s * 0.24, s * 0.1, dk(c, 0.12), dk(c, 0.35), 0.12), { transform: at(cx, cy, ang) });
}
function books(x, y, w, h, vertical) { // dos de livres alignés
  reseed(x * 3 + y + w); let s = "", p = x;
  while (p < x + w - 0.3) { const bw = Math.min(x + w - p, 0.35 + rnd() * 0.45), c = PAL[Math.floor(rnd() * PAL.length)], bh = h * (0.75 + rnd() * 0.25); s += R(p, y + (h - bh), bw - 0.05, bh, 0.05, c, dk(c, 0.3), 0.05); p += bw; }
  return vertical ? s : s;
}
function bookStack(cx, cy, s, ang) {
  return G(R(-s, -s * 0.7, s * 2, s * 1.4, 0.1, "#4f7fd9", dk("#4f7fd9", 0.3), 0.08) + R(-s * 0.85, -s * 0.55, s * 1.8, s * 1.1, 0.1, "#ee7a62", dk("#ee7a62", 0.3), 0.08, { transform: "rotate(-8)" }), { transform: at(cx, cy, ang) });
}
function smallPlant(cx, cy, r) {
  let s = C(cx, cy, r * 0.62, POT, POTD, 0.1) + C(cx, cy, r * 0.48, SOIL);
  for (let i = 0; i < 6; i++) s += leaf(cx, cy, r * 1.05, r * 0.32, i * 60 + 15, i % 2 ? LEAF : LEAFL);
  return G(s, { class: "lfg" });
}
function mug(cx, cy, r, c = "#ee7a62") { return C(cx, cy, r, c, dk(c, 0.3), 0.1) + C(cx, cy, r * 0.65, "#6b3f22") + R(cx + r * 0.8, cy - r * 0.25, r * 0.6, r * 0.5, 0.1, c); }
function lampTop(cx, cy, r) { return C(cx, cy, r * 2.2, "url(#pfGlow)", null, 0, { class: "glowl" }) + C(cx, cy, r, "#fff3c9", "#e2b13c", 0.15) + C(cx, cy, r * 0.35, GLOW); }
function snow(cx, cy, r, c) { let s = ""; for (let i = 0; i < 3; i++) { const a = (i * 60 * Math.PI) / 180; s += L(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r, c, r * 0.18); } return s; }
function faucet(cx, cy, s) { return C(cx, cy, s * 0.35, STEEL, STEELD, 0.08) + R(cx - s * 0.12, cy, s * 0.24, s, s * 0.1, STEEL, STEELD, 0.06); }
function tiles(x, y, w, h, c, step = 1.5) {
  let s = R(x, y, w, h, 0, c);
  for (let i = step; i < w; i += step) s += L(x + i, y, x + i, y + h, dk(c, 0.12), 0.05);
  for (let j = step; j < h; j += step) s += L(x, y + j, x + w, y + j, dk(c, 0.12), 0.05);
  return s;
}
function bush(cx, cy, r, c, k = 7) {
  reseed(cx * 13 + cy * 7 + r); let s = C(cx + r * 0.12, cy + r * 0.16, r, "rgba(30,60,25,.25)");
  for (let i = 0; i < k; i++) { const a = (i / k) * Math.PI * 2 + rnd(), d = r * (0.35 + rnd() * 0.25); s += C(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.45 + rnd() * 0.2), i % 2 ? c : lt(c, 0.12), dk(c, 0.25), 0.1); }
  return s + C(cx - r * 0.2, cy - r * 0.2, r * 0.35, lt(c, 0.25), null, 0, { opacity: 0.7 });
}

/* ---------- salon ---------- */
function sofa(w, h, c, corner) {
  const arm = Math.min(1.8, w * 0.1), back = Math.min(2.2, h * 0.3), base = dk(c, 0.18);
  let s = R(0, 0, w, h, 1.1, base, dk(c, 0.4), 0.18) + R(0.2, 0.15, w - 0.4, back, 0.8, dk(c, 0.06), null);
  s += R(0, 0, arm, h, 0.9, dk(c, 0.1), dk(c, 0.35), 0.12) + R(w - arm, 0, arm, h, 0.9, dk(c, 0.1), dk(c, 0.35), 0.12);
  const n = w - 2 * arm > 13 ? 3 : 2, cw = (w - 2 * arm - 0.3) / n;
  for (let i = 0; i < n; i++) s += cushion(arm + 0.15 + i * cw, back * 0.25, cw - 0.15, back * 0.8, 0.6, dk(c, 0.02));
  for (let i = 0; i < n; i++) s += cushion(arm + 0.15 + i * cw, back + 0.15, cw - 0.15, h - back - 0.45, 0.7, c);
  s += G(pillow(-1.4, -1.4, 2.8, 2.8, "#e5b13a"), { transform: at(arm + 1.6, back + 1.2, -14) }) + G(pillow(-1.3, -1.3, 2.6, 2.6, "#ee7a62"), { transform: at(w - arm - 1.6, back + 1.1, 12) });
  return s;
}
function sofaCorner(w, h, c) {
  const d = Math.min(7, h * 0.45, w * 0.35), back = 2, base = dk(c, 0.18);
  let s = P(`M0 0H${w}V${d}H${d}V${h}H0z`, base, dk(c, 0.4), 0.18);
  s += R(0.15, 0.15, w - 0.3, back, 0.8, dk(c, 0.06)) + R(0.15, 0.15, back, h - 0.3, 0.8, dk(c, 0.06));
  s += R(w - 1.7, 0, 1.7, d, 0.9, dk(c, 0.1), dk(c, 0.35), 0.12) + R(0, h - 1.7, d, 1.7, 0.9, dk(c, 0.1), dk(c, 0.35), 0.12);
  const run = w - back - 1.9, k = Math.max(2, Math.round(run / 6)), cw = run / k;
  for (let i = 0; i < k; i++) s += cushion(back + 0.1 + i * cw, back + 0.15, cw - 0.15, d - back - 0.4, 0.7, c);
  const runV = h - d - 1.9, kv = Math.max(1, Math.round(runV / 6)), ch = runV / kv;
  for (let i = 0; i < kv; i++) s += cushion(back + 0.15, d + 0.05 + i * ch, d - back - 0.4, ch - 0.15, 0.7, c);
  s += cushion(back + 0.1, back + 0.15, d - back - 0.4, d - back - 0.4, 0.7, lt(c, 0.06));
  s += G(pillow(-1.4, -1.4, 2.8, 2.8, "#e5b13a"), { transform: at(back + 1.8, back + 1.8, 30) }) + G(pillow(-1.3, -1.3, 2.6, 2.6, "#ee9fb3"), { transform: at(w - 3.6, back + 1.3, -10) }) + G(pillow(-1.3, -1.3, 2.6, 2.6, "#4f7fd9"), { transform: at(back + 1.3, h - 3.6, 80) });
  return s;
}
function armchair(w, h, c) {
  const arm = w * 0.2, back = h * 0.26;
  return R(0, 0, w, h, 1.2, dk(c, 0.15), dk(c, 0.4), 0.16) + R(0.2, 0.15, w - 0.4, back, 0.9, dk(c, 0.05))
    + R(0, back * 0.4, arm, h - back * 0.4, 1, dk(c, 0.08), dk(c, 0.35), 0.12) + R(w - arm, back * 0.4, arm, h - back * 0.4, 1, dk(c, 0.08), dk(c, 0.35), 0.12)
    + cushion(arm + 0.1, back + 0.1, w - 2 * arm - 0.2, h - back - 0.4, 0.8, c) + G(pillow(-1.1, -0.9, 2.2, 1.8, "#f6efe2"), { transform: at(w / 2, back + 1, -6) });
}
function pouf(w, h, c) {
  const r = Math.min(w, h) / 2; let s = C(w / 2, h / 2, r, c, dk(c, 0.3), 0.15);
  for (let i = 0; i < 8; i++) { const a = (i * 45 * Math.PI) / 180; s += L(w / 2, h / 2, w / 2 + Math.cos(a) * r * 0.85, h / 2 + Math.sin(a) * r * 0.85, dk(c, 0.18), 0.1); }
  return s + C(w / 2 - r * 0.25, h / 2 - r * 0.25, r * 0.45, lt(c, 0.3), null, 0, { opacity: 0.5 }) + C(w / 2, h / 2, r * 0.12, dk(c, 0.3));
}
function coffeeTable(w, h) {
  return woodTop(0, 0, w, h, Math.min(w, h) * 0.3, WAL) + bookStack(w * 0.25, h * 0.5, Math.min(1.3, h * 0.22), -10) + smallPlant(w * 0.72, h * 0.45, Math.min(1.2, h * 0.24)) + mug(w * 0.5, h * 0.7, Math.min(0.45, h * 0.09));
}
function coffeeRound(w, h) {
  const r = Math.min(w, h) / 2; let s = C(w / 2, h / 2, r, "#f4f2ee", "#b9b2a6", 0.18);
  s += P(`M${n2(w / 2 - r * 0.7)} ${n2(h / 2 - r * 0.3)}q${n2(r * 0.4)} ${n2(r * 0.25)} ${n2(r * 0.8)} ${n2(r * 0.1)}t${n2(r * 0.55)} ${n2(r * 0.45)}`, null, "#c9c2b6", 0.08);
  s += P(`M${n2(w / 2 - r * 0.2)} ${n2(h / 2 + r * 0.6)}q${n2(r * 0.3)} ${n2(-r * 0.4)} ${n2(r * 0.7)} ${n2(-r * 0.35)}`, null, "#d6cfc3", 0.07);
  return s + C(w / 2, h / 2, r * 0.42, "#d9b77d", "#a77f43", 0.1) + C(w / 2 - r * 0.12, h / 2, r * 0.13, CER, "#ddd", 0.06) + C(w / 2 - r * 0.12, h / 2, r * 0.06, FLAME, null, 0, { class: "flame" }) + C(w / 2 + r * 0.18, h / 2 + r * 0.05, r * 0.12, "#ee7a62");
}
function tvStand(w, h) {
  let s = woodTop(0, 0, w, h, 0.3, OAK);
  const k = Math.max(2, Math.round(w / 4)); for (let i = 1; i < k; i++) s += L((w * i) / k, h - 0.5, (w * i) / k, h, OAKD, 0.12);
  s += R(0, h - 0.5, w, 0.5, 0.2, dk(OAK, 0.12));
  return s + R(w * 0.3, h * 0.25, w * 0.4, h * 0.22, 0.1, BLACK) + smallPlant(w * 0.1, h * 0.45, Math.min(1, h * 0.3)) + C(w * 0.88, h * 0.45, Math.min(0.7, h * 0.2), "#3a3f47", "#111", 0.08);
}
function tv(w, h) { return R(0, 0, w, h, 0.25, BLACK, "#000", 0.12) + R(w * 0.05, h * 0.2, w * 0.9, h * 0.25, 0.1, "#4a5562", null, 0, { opacity: 0.8 }) + C(w * 0.95, h * 0.6, Math.min(0.12, h * 0.15), "#46a3ff"); }
function bookcase(w, h) {
  let s = R(0, 0, w, h, 0.2, WAL, WALD, 0.18), k = Math.max(2, Math.round(w / 3));
  for (let i = 0; i < k; i++) { const x = (w * i) / k; s += R(x + 0.25, 0.25, w / k - 0.35, h - 0.5, 0.1, dk(WAL, 0.35)); if (i === 1) s += smallPlant(x + w / k / 2, h / 2, Math.min(1, h * 0.28)); else s += books(x + 0.3, 0.35, w / k - 0.45, h - 0.7); }
  return s;
}
function fireplace(w, h) {
  let s = R(0, 0, w, h, 0.3, "#e9e2d6", "#b8ae9f", 0.18);
  reseed(w + h); for (let i = 0; i < 9; i++) s += R(rnd() * (w - 2), rnd() * (h - 1), 1.2 + rnd() * 1.4, 0.6 + rnd() * 0.5, 0.25, "#dcd3c4", "#c8bdab", 0.06);
  const fx = w * 0.25, fw = w * 0.5, fy = h * 0.18, fh = h * 0.62;
  s += R(fx, fy, fw, fh, 0.5, "#2b2622", "#151210", 0.15) + R(fx + fw * 0.15, fy + fh * 0.55, fw * 0.7, fh * 0.2, 0.2, "#7a4a28", "#4a2b14", 0.08, { transform: `rotate(-6 ${n2(fx + fw / 2)} ${n2(fy + fh * 0.65)})` });
  s += G(E(fx + fw * 0.4, fy + fh * 0.45, fw * 0.12, fh * 0.3, "url(#pfFire)") + E(fx + fw * 0.6, fy + fh * 0.5, fw * 0.1, fh * 0.26, "url(#pfFire)") + E(fx + fw * 0.5, fy + fh * 0.38, fw * 0.08, fh * 0.22, "#ffe08a", null, 0, { opacity: 0.85 }), { class: "flame" });
  return s + R(0, h - 0.6, w, 0.6, 0.2, "#cfc4b2");
}
function stove(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2;
  return C(cx, cy, r, "#2d3238", "#0f1114", 0.2) + C(cx, cy, r * 0.82, "#3a4048") + C(cx - r * 0.25, cy - r * 0.25, r * 0.35, "#5a636d", null, 0, { opacity: 0.6 })
    + C(cx, cy - r * 0.15, r * 0.3, "#1f2328", "#0f1114", 0.1) + C(cx, cy - r * 0.15, r * 0.16, "#4a525c")
    + R(cx - r * 0.55, cy + r * 0.25, r * 1.1, r * 0.55, r * 0.15, "#1a1410", "#0f1114", 0.1)
    + G(E(cx - r * 0.2, cy + r * 0.5, r * 0.16, r * 0.22, "url(#pfFire)") + E(cx + r * 0.15, cy + r * 0.52, r * 0.14, r * 0.2, "url(#pfFire)") + E(cx, cy + r * 0.45, r * 0.1, r * 0.16, "#ffe08a", null, 0, { opacity: 0.85 }), { class: "flame" });
}
function piano(w, h) {
  let s = R(0, 0, w, h * 0.7, 0.3, BLACK, "#000", 0.15) + R(w * 0.03, h * 0.08, w * 0.94, h * 0.12, 0.1, "#3b434d", null, 0, { opacity: 0.8 });
  const ky = h * 0.68, kh = h * 0.32; s += R(0, ky, w, kh, 0.1, "#fdfdfb", "#9a9a9a", 0.08);
  const nk = Math.round(w / 0.45); for (let i = 1; i < nk; i++) s += L((w * i) / nk, ky, (w * i) / nk, ky + kh, "#bdbdbd", 0.04);
  for (let i = 0; i < nk; i++) { const m = i % 7; if (m === 2 || m === 6) continue; s += R((w * (i + 0.7)) / nk, ky, (w / nk) * 0.6, kh * 0.6, 0.03, "#1b1e22"); }
  return s;
}
function floorLamp(w, h) { const r = Math.min(w, h) / 2; return C(w / 2, h / 2, r * 1.6, "url(#pfGlow)", null, 0, { class: "glowl" }) + C(w / 2, h / 2, r, "#fff6d6", "#e0aa2a", 0.18) + C(w / 2, h / 2, r * 0.75, null, "#f2d27a", 0.08) + C(w / 2, h / 2, r * 0.25, GLOW); }
function rug(w, h, c) {
  let s = R(0, 0, w, h, 0.4, lt(c, 0.55), dk(c, 0.1), 0.15) + R(0.6, 0.6, w - 1.2, h - 1.2, 0.3, null, c, 0.35);
  const cx = w / 2, cy = h / 2, rx = w * 0.28, ry = h * 0.3;
  s += P(`M${n2(cx - rx)} ${n2(cy)}L${n2(cx)} ${n2(cy - ry)}L${n2(cx + rx)} ${n2(cy)}L${n2(cx)} ${n2(cy + ry)}z`, lt(c, 0.25), c, 0.2) + P(`M${n2(cx - rx * 0.5)} ${n2(cy)}L${n2(cx)} ${n2(cy - ry * 0.5)}L${n2(cx + rx * 0.5)} ${n2(cy)}L${n2(cx)} ${n2(cy + ry * 0.5)}z`, c);
  for (let x = 1.4; x < w - 1; x += 1.6) s += P(`M${n2(x)} 1.4l.5 .5l-.5 .5l-.5-.5z`, c) + P(`M${n2(x)} ${n2(h - 2.4)}l.5 .5l-.5 .5l-.5-.5z`, c);
  for (let y = 0.4; y < h; y += 0.5) s += L(-0.4, y, 0, y, lt(c, 0.3), 0.08) + L(w, y, w + 0.4, y, lt(c, 0.3), 0.08);
  return s;
}
function rugRound(w, h, c) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = "";
  const rings = [[1, lt(c, 0.6)], [0.82, c], [0.7, lt(c, 0.45)], [0.5, "#e5b13a"], [0.38, lt(c, 0.6)], [0.22, c]];
  rings.forEach(([k, col]) => (s += C(cx, cy, r * k, col)));
  for (let i = 0; i < 24; i++) { const a = (i * 15 * Math.PI) / 180; s += C(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.035, CER); }
  return s + C(cx, cy, r, null, dk(c, 0.15), 0.12);
}
function plant(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = C(cx, cy, r * 0.62, POT, POTD, 0.12) + C(cx, cy, r * 0.5, SOIL);
  let g = ""; for (let i = 0; i < 7; i++) g += leaf(cx, cy, r * 1.05, r * 0.38, i * 51 + 10, i % 2 ? LEAF : LEAFL);
  return s + G(g, { class: "lfg" });
}
function bigPlant(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = C(cx, cy, r * 0.42, POT, POTD, 0.12) + C(cx, cy, r * 0.34, SOIL);
  let g = ""; for (let i = 0; i < 9; i++) g += leaf(cx, cy, r * (0.85 + (i % 3) * 0.08), r * 0.22, i * 40 + 5, i % 3 === 0 ? LEAFD : i % 3 === 1 ? LEAF : LEAFL);
  return s + G(g, { class: "lfg" });
}

/* ---------- repas ---------- */
function table(w, h) {
  let s = woodTop(0, 0, w, h, 0.4, OAK), v = h >= w;
  s += v ? R(w * 0.3, 0.6, w * 0.4, h - 1.2, 0.1, "#efe6d4", "#d8cbb2", 0.06) : R(0.6, h * 0.3, w - 1.2, h * 0.4, 0.1, "#efe6d4", "#d8cbb2", 0.06);
  s += C(w / 2, h / 2, Math.min(w, h) * 0.13, "#9fcfe6", "#5a9ec0", 0.08);
  for (let i = 0; i < 5; i++) s += flower(w / 2 + Math.cos(i * 1.3) * Math.min(w, h) * 0.12, h / 2 + Math.sin(i * 1.3) * Math.min(w, h) * 0.12, Math.min(w, h) * 0.05, PAL[i]);
  return s;
}
function dining(w, h, c) {
  const tx = w * 0.15, ty = h * 0.22, tw = w * 0.7, th = h * 0.56, cs = Math.min(3.6, th * 0.45);
  let s = "";
  for (let i = 0; i < 3; i++) { const x = tx + (tw * (i + 0.5)) / 3; s += chair(x, ty - cs * 0.15, cs, 0, c) + chair(x, ty + th + cs * 0.15, cs, 180, c); }
  s += woodTop(tx, ty, tw, th, 0.4, OAK) + R(tx + 0.6, ty + th * 0.36, tw - 1.2, th * 0.28, 0.1, "#efe6d4", "#d8cbb2", 0.06);
  for (let i = 0; i < 3; i++) { const x = tx + (tw * (i + 0.5)) / 3; s += plate(x, ty + th * 0.2, Math.min(1.1, th * 0.13)) + plate(x, ty + th * 0.8, Math.min(1.1, th * 0.13)); }
  s += smallPlant(tx + tw / 2, ty + th / 2, Math.min(1, th * 0.12));
  return s;
}
function roundTable(w, h) {
  const r = Math.min(w, h) / 2; let s = C(w / 2, h / 2, r, OAK, OAKD, 0.2) + C(w / 2, h / 2, r * 0.8, null, lt(OAK, 0.3), 0.15) + C(w / 2, h / 2, r * 0.5, null, dk(OAK, 0.1), 0.08);
  for (let i = 0; i < 4; i++) { const a = (i * 90 + 45) * Math.PI / 180; s += plate(w / 2 + Math.cos(a) * r * 0.62, h / 2 + Math.sin(a) * r * 0.62, r * 0.18, false); }
  return s + C(w / 2, h / 2, r * 0.16, "#ee7a62", dk("#ee7a62", 0.3), 0.08) + C(w / 2 - r * 0.05, h / 2 - r * 0.05, r * 0.08, "#e5b13a");
}
function roundTableChairs(w, h, c) {
  const r = Math.min(w, h) * 0.3, cs = Math.min(3.6, r * 0.75); let s = "";
  for (let i = 0; i < 4; i++) { const a = i * 90; const rad = (a - 90) * Math.PI / 180; s += chair(w / 2 + Math.cos(rad) * (r + cs * 0.35), h / 2 + Math.sin(rad) * (r + cs * 0.35), cs, a, c); }
  return s + G(roundTable(2 * r, 2 * r), { transform: at(w / 2 - r, h / 2 - r) });
}
function chairOne(w, h, c) { const s = Math.min(w, h); return chair(w / 2, h / 2 + s * 0.08, s * 0.82, 0, c); }

/* ---------- chambre ---------- */
function bed(w, h, c, single) {
  let s = R(0, 0, w, h, 0.5, OAK, OAKD, 0.2) + R(0, 0, w, 1.3, 0.5, dk(OAK, 0.12), OAKD, 0.15) + R(0.5, 1.1, w - 1, h - 1.6, 0.6, WHITE, LINE, 0.12);
  const np = single || w < 12 ? 1 : 2, pw = (w - 1.6 - (np - 1) * 0.4) / np;
  for (let i = 0; i < np; i++) s += pillow(0.8 + i * (pw + 0.4), 1.6, pw, Math.min(3.6, h * 0.17), "#ffffff");
  if (!single) s += G(pillow(-1.4, -1, 2.8, 2, lt(c, 0.1)), { transform: at(w / 2, 4.6, -4) });
  const dy = h * 0.34; s += R(0.5, dy, w - 1, h - dy - 0.5, 0.7, c, dk(c, 0.25), 0.15) + R(0.5, dy, w - 1, 1.5, 0.6, lt(c, 0.3), dk(c, 0.15), 0.1);
  for (let y = dy + 2.6; y < h - 1; y += 2.2) s += L(1, y, w - 1, y, lt(c, 0.25), 0.1, { "stroke-dasharray": ".35 .3" });
  const fc = c === "#e5b13a" ? "#4f7fd9" : "#e5b13a";
  s += R(0.5, h - 4.2, w - 1, 2.4, 0.3, fc, dk(fc, 0.25), 0.12); for (let x = 1; x < w - 0.6; x += 0.5) s += L(x, h - 1.8, x, h - 1.3, dk(fc, 0.15), 0.08);
  return s;
}
function crib(w, h, c) {
  let s = R(0, 0, w, h, 0.5, "#f7f1e6", "#c7b694", 0.18) + R(0.5, 0.5, w - 1, h - 1, 0.4, WHITE, LINE, 0.1);
  for (let x = 0.9; x < w - 0.5; x += 0.7) s += L(x, 0, x, 0.5, "#c7b694", 0.12) + L(x, h - 0.5, x, h, "#c7b694", 0.12);
  s += pillow(1, 1, w - 2, 2.2, "#ffffff") + R(0.6, h * 0.45, w - 1.2, h * 0.5, 0.5, c, dk(c, 0.2), 0.12);
  for (let i = 0; i < 6; i++) s += C(1.4 + (i % 3) * ((w - 2.8) / 2), h * 0.55 + Math.floor(i / 3) * 2.2, 0.25, CER);
  return s + C(w * 0.65, h * 0.33, 0.9, "#c99a6b", "#8a6040", 0.1) + C(w * 0.65 - 0.65, h * 0.33 - 0.6, 0.38, "#c99a6b", "#8a6040", 0.08) + C(w * 0.65 + 0.65, h * 0.33 - 0.6, 0.38, "#c99a6b", "#8a6040", 0.08);
}
function nightstand(w, h) { return woodTop(0, 0, w, h, 0.3, OAK) + lampTop(w * 0.42, h * 0.45, Math.min(w, h) * 0.24) + R(w * 0.7, h * 0.55, w * 0.18, h * 0.3, 0.1, "#4f7fd9"); }
function wardrobe(w, h) {
  let s = woodTop(0, 0, w, h, 0.3, WAL) + R(0, h - 0.5, w, 0.5, 0.15, dk(WAL, 0.15));
  const k = Math.max(2, Math.round(w / 5)); for (let i = 1; i < k; i++) s += L((w * i) / k, h - 0.5, (w * i) / k, h, WALD, 0.12);
  for (let i = 0; i < k; i++) s += R((w * (i + 0.5)) / k - 0.35, h - 0.35, 0.7, 0.18, 0.08, "#e9d7a8");
  const bw = Math.min(3.6, w * 0.32); s += R(w * 0.12, h * 0.2, bw, h * 0.5, 0.3, "#d9b98a", "#a98455", 0.12);
  for (let x = w * 0.12 + 0.4; x < w * 0.12 + bw; x += 0.5) s += L(x, h * 0.2, x, h * 0.7, "#b8935f", 0.06);
  return s + R(w * 0.58, h * 0.25, bw * 0.85, h * 0.42, 0.2, "#f2ede4", "#c7bba7", 0.1);
}
function dresser(w, h, c) {
  let s = R(0, 0, w, h, 0.3, c, dk(c, 0.3), 0.18) + R(0.3, 0.3, w - 0.6, h - 1, 0.2, OAK, OAKD, 0.1) + grain(0.3, 0.3, w - 0.6, h - 1, OAK, 2);
  for (let i = 0; i < 3; i++) s += C((w * (i + 0.5)) / 3, h - 0.35, 0.22, "#e9d7a8", "#a98455", 0.06);
  return s + smallPlant(w * 0.18, h * 0.42, Math.min(1, h * 0.25)) + R(w * 0.42, h * 0.2, w * 0.18, h * 0.42, 0.1, "#fff", "#ccc", 0.08) + R(w * 0.45, h * 0.27, w * 0.12, h * 0.28, 0.05, "#9fcfe6") + E(w * 0.78, h * 0.45, w * 0.1, h * 0.15, "#f2ede4", "#c7bba7", 0.08);
}

/* ---------- bureau ---------- */
function desk(w, h) {
  let s = R(0, 0, w, h, 0.3, "#f5f2ec", OAKD, 0.18) + R(0, 0, w, 0.35, 0.2, OAK);
  const lw = Math.min(5, w * 0.36), lh = Math.min(3.2, h * 0.5), lx = w / 2 - lw / 2, ly = h * 0.3;
  s += R(lx, ly - lh * 0.45, lw, lh * 0.45, 0.2, "#3a4048", "#1d2126", 0.1) + R(lx + 0.2, ly - lh * 0.4, lw - 0.4, lh * 0.33, 0.1, "#6aa5e8") + R(lx, ly, lw, lh * 0.55, 0.2, "#c7ced6", "#8e99a4", 0.1);
  for (let j = 1; j < 4; j++) s += L(lx + 0.4, ly + (lh * 0.5 * j) / 4, lx + lw - 0.4, ly + (lh * 0.5 * j) / 4, "#9aa4ae", 0.06, { "stroke-dasharray": ".25 .12" });
  s += E(lx + lw + 1, ly + lh * 0.3, 0.35, 0.5, "#e8ecf0", "#9aa4ae", 0.06) + R(w * 0.08, h * 0.25, w * 0.16, h * 0.55, 0.1, "#ee7a62", dk("#ee7a62", 0.3), 0.08) + L(w * 0.1, h * 0.35, w * 0.21, h * 0.35, "#fff", 0.08);
  return s + lampTop(w * 0.88, h * 0.3, Math.min(0.9, h * 0.15)) + mug(w * 0.8, h * 0.72, Math.min(0.45, h * 0.08), "#4f7fd9");
}
function officeChair(w, h, c) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = "";
  for (let i = 0; i < 5; i++) { const a = ((i * 72 - 90) * Math.PI) / 180, x = cx + Math.cos(a) * r * 0.9, y = cy + Math.sin(a) * r * 0.9; s += L(cx, cy, x, y, "#555b63", 0.3) + C(x, y, 0.32, "#2a2e33"); }
  return s + R(cx - r * 0.6, cy - r * 0.55, r * 1.2, r * 1.15, r * 0.35, c, dk(c, 0.35), 0.15) + R(cx - r * 0.45, cy - r * 0.4, r * 0.9, r * 0.4, r * 0.2, lt(c, 0.2), null, 0, { opacity: 0.7 }) + P(`M${n2(cx - r * 0.7)} ${n2(cy - r * 0.5)}Q${n2(cx)} ${n2(cy - r * 1.05)} ${n2(cx + r * 0.7)} ${n2(cy - r * 0.5)}`, null, dk(c, 0.15), 0.6);
}

/* ---------- cuisine ---------- */
function counterTop(x, y, w, h) {
  reseed(x + y + w); let s = R(x, y, w, h, 0.2, STONE, "#bdb4a5", 0.15);
  for (let i = 0; i < w * h * 0.6; i++) s += C(x + 0.2 + rnd() * (w - 0.4), y + 0.2 + rnd() * (h - 0.4), 0.05 + rnd() * 0.07, ["#c9b9a0", "#9fb6c6", "#e3a77c", "#b9c9a8"][i % 4], null, 0, { opacity: 0.8 });
  return s;
}
function cabinets(x, y, w) { // poignées des façades, côté pièce
  let s = ""; const k = Math.max(1, Math.round(w / 6));
  for (let i = 0; i < k; i++) s += R(x + (w * (i + 0.5)) / k - 0.6, y - 0.12, 1.2, 0.22, 0.08, STEELD);
  return s;
}
function sink(x, y, w, h, two) {
  let s = R(x, y, w, h, 0.4, STEEL, STEELD, 0.12);
  const nb = two ? 2 : 1, bw = (w - 0.6 - (nb - 1) * 0.4) / nb;
  for (let i = 0; i < nb; i++) { const bx = x + 0.3 + i * (bw + 0.4); s += R(bx, y + 0.5, bw, h - 0.8, 0.5, "#b9c3cc", "#7d8893", 0.1) + C(bx + bw / 2, y + h * 0.6, 0.18, "#7d8893"); }
  return s + faucet(x + w / 2, y + 0.2, Math.min(1.2, h * 0.3)) + R(x + w - 1.1, y + 0.25, 0.8, 0.45, 0.1, "#e5d84a", "#7fb34e", 0.08);
}
function hob(x, y, w, h, glow) {
  let s = R(x, y, w, h, 0.3, "#1e2328", "#0c0f12", 0.12) + R(x + 0.15, y + 0.15, w - 0.3, h * 0.25, 0.2, "#3a424b", null, 0, { opacity: 0.6 });
  const rr = Math.min(w, h) * 0.17;
  [[0.28, 0.3, 1], [0.72, 0.3, 0.8], [0.28, 0.72, 0.8], [0.72, 0.72, 1]].forEach(([fx, fy, k], i) => {
    s += C(x + w * fx, y + h * fy, rr * k, null, "#5a646e", 0.12) + C(x + w * fx, y + h * fy, rr * k * 0.6, null, "#46505a", 0.08);
    if (glow && i === 0) s += C(x + w * fx, y + h * fy, rr * k * 0.9, "#ff6a2a", null, 0, { opacity: 0.55, class: "glowl" });
  });
  return s;
}
function veg(x, y, s) {
  return R(x, y, s * 2.6, s * 1.6, 0.2, "#d9a86c", "#a8783f", 0.08) + C(x + s * 0.8, y + s * 0.8, s * 0.42, "#e5483a", "#a32a1f", 0.06) + C(x + s * 1.75, y + s * 0.75, s * 0.36, "#f2d64a", "#b89a1a", 0.06) + L(x + s * 1.2, y + s * 1.25, x + s * 2.3, y + s * 1.25, "#5cb86b", 0.12);
}
function counterPlain(w, h) {
  let s = counterTop(0, 0, w, h) + R(0, h - 0.3, w, 0.3, 0.1, "#e4dccd") + cabinets(0, h, w);
  s += veg(w * 0.12, h * 0.3, Math.min(1.4, h * 0.25));
  if (w >= 12) s += R(w * 0.45, h * 0.25, Math.min(1.6, w * 0.08), h * 0.45, 0.2, "#ffffff", "#c9d1d8", 0.08) + C(w * 0.45 + Math.min(0.8, w * 0.04), h * 0.47, Math.min(0.45, h * 0.09), "#e5b13a");
  s += C(w * 0.82, h * 0.42, Math.min(0.7, h * 0.13), STEEL, STEELD, 0.1) + C(w * 0.82, h * 0.42, Math.min(0.25, h * 0.05), BLACK);
  if (w >= 16) s += C(w * 0.66, h * 0.45, Math.min(0.55, h * 0.1), "#cf6e46", "#8a4426", 0.08) + L(w * 0.66, h * 0.45, w * 0.66 + 0.3, h * 0.2, "#a8783f", 0.12);
  return s;
}
function bar(w, h) {
  let s = woodTop(0, 0, w, h, 0.4, WAL) + R(0, h - 0.4, w, 0.4, 0.15, dk(WAL, 0.2));
  const n = Math.max(1, Math.round(w / 6));
  for (let i = 0; i < n; i++) { const x = (w * (i + 0.5)) / n; s += C(x - 0.4, h * 0.4, Math.min(0.35, h * 0.08), "#e8f4fa", "#9fb2c0", 0.06) + C(x + 0.5, h * 0.45, Math.min(0.3, h * 0.07), "#f2d6e0", "#b88a9b", 0.06); }
  return s + C(w * 0.5, h * 0.55, Math.min(1, h * 0.2), "#d9a86c", "#a8783f", 0.08) + C(w * 0.48, h * 0.5, Math.min(0.32, h * 0.07), "#e5483a") + C(w * 0.55, h * 0.6, Math.min(0.3, h * 0.06), "#f2d64a");
}
function counter(w, h) {
  let s = counterTop(0, 0, w, h) + R(0, h - 0.3, w, 0.3, 0.1, "#e4dccd") + cabinets(0, h, w);
  if (w >= 10) s += sink(w * 0.55, h * 0.12, Math.min(7, w * 0.28), h * 0.72, false);
  s += veg(w * 0.1, h * 0.3, Math.min(1.4, h * 0.25));
  if (w >= 16) s += hob(w * 0.82 - Math.min(5.4, w * 0.2) / 2, h * 0.1, Math.min(5.4, w * 0.2), h * 0.78, true);
  s += C(w * (w >= 16 ? 0.38 : 0.85), h * 0.4, Math.min(0.7, h * 0.13), STEEL, STEELD, 0.1) + C(w * (w >= 16 ? 0.38 : 0.85), h * 0.4, Math.min(0.25, h * 0.05), BLACK);
  return s;
}
function kitchenCorner(w, h) {
  const d = Math.min(6.5, h * 0.4, w * 0.3);
  let s = counterTop(0, 0, w, d) + counterTop(0, d - 0.2, d, h - d + 0.2) + R(0, d - 0.25, d, 0.3, 0, STONE);
  s += cabinets(d, d, w - d); const kv = Math.max(1, Math.round((h - d) / 6)); for (let i = 0; i < kv; i++) s += R(d - 0.12, d + ((h - d) * (i + 0.5)) / kv - 0.6, 0.22, 1.2, 0.08, STEELD);
  s += sink(w * 0.45, d * 0.12, Math.min(8, w * 0.28), d * 0.72, true) + hob(d * 0.1, h * 0.55, d * 0.78, Math.min(5.4, h * 0.28), true);
  s += veg(w * 0.82, d * 0.25, Math.min(1.4, d * 0.22)) + C(d * 0.5, d * 0.5, 0.8, STEEL, STEELD, 0.1) + smallPlant(w - 1.6, d * 0.45, Math.min(1, d * 0.16));
  return s;
}
function island(w, h, c) {
  const ih = h * 0.66; let s = "";
  const n = Math.max(2, Math.round(w / 5));
  for (let i = 0; i < n; i++) s += stool((w * (i + 0.5)) / n, ih + (h - ih) * 0.55, Math.min(1.5, (h - ih) * 0.48), c);
  s += counterTop(0, 0, w, ih) + R(0, ih - 0.6, w, 0.6, 0.2, "#e4dccd") + hob(w * 0.12, ih * 0.15, Math.min(5.5, w * 0.3), ih * 0.6, false);
  return s + R(w * 0.58, ih * 0.2, w * 0.25, ih * 0.5, 0.2, "#d9a86c", "#a8783f", 0.08) + C(w * 0.66, ih * 0.45, 0.45, "#e5483a") + C(w * 0.76, ih * 0.38, 0.35, "#86b38a") + C(w * 0.92, ih * 0.4, 0.6, STEEL, STEELD, 0.1);
}
function stool(cx, cy, r, c) { return C(cx, cy, r, c, dk(c, 0.3), 0.15) + C(cx, cy, r * 0.65, null, lt(c, 0.25), 0.15) + C(cx - r * 0.25, cy - r * 0.25, r * 0.3, lt(c, 0.3), null, 0, { opacity: 0.6 }); }
function stoolOne(w, h, c) { return C(w / 2, h / 2, Math.min(w, h) / 2, null, "#555b63", 0.2) + stool(w / 2, h / 2, Math.min(w, h) * 0.4, c); }
function sinkUnit(w, h, two) { return counterTop(0, 0, w, h) + sink(w * 0.08, h * 0.1, w * 0.84, h * 0.8, two); }
function cooker(w, h) { return R(0, 0, w, h, 0.3, STEEL, STEELD, 0.15) + hob(0.3, 0.3, w - 0.6, h - 1.4, true) + R(0, h - 1, w, 1, 0.2, "#e6ebef") + [0.2, 0.4, 0.6, 0.8].map((f) => C(w * f, h - 0.5, 0.25, "#5f6b77")).join(""); }
function cooktop(w, h) { return hob(0, 0, w, h, true); }
function fridge(w, h, big) {
  let s = R(0, 0, w, h, 0.4, "#f4f7fa", "#9aa6b2", 0.18) + R(0.25, 0.25, w - 0.5, h * 0.4, 0.3, "#ffffff", null, 0, { opacity: 0.7 });
  if (big) s += L(w / 2, 0.3, w / 2, h, "#9aa6b2", 0.12) + R(w * 0.15, h * 0.35, w * 0.18, h * 0.3, 0.15, "#3b4652");
  s += R(0, h - 0.45, w, 0.45, 0.2, "#dfe5ea") + (big ? R(w / 2 - 0.5, h - 0.4, 0.3, 0.3, 0.05, STEELD) + R(w / 2 + 0.2, h - 0.4, 0.3, 0.3, 0.05, STEELD) : R(w * 0.75, h - 0.42, 0.9, 0.25, 0.08, STEELD));
  s += snow(big ? w * 0.7 : w / 2, h * 0.45, Math.min(w, h) * 0.17, "#6fb6e8");
  return s + C(w * 0.2, h * 0.2, 0.3, "#ee7a62") + C(w * 0.82, h * 0.18, 0.28, "#e5b13a");
}
function dishwasher(w, h) {
  let s = R(0, 0, w, h, 0.3, "#f4f7fa", "#9aa6b2", 0.18) + R(0, h - 0.8, w, 0.8, 0.2, "#dfe5ea") + R(w * 0.3, h - 0.62, w * 0.4, 0.42, 0.1, "#1e2328") + C(w * 0.4, h - 0.41, 0.08, "#59d36b");
  return s + C(w * 0.4, h * 0.42, Math.min(w, h) * 0.22, CER, "#9aa6b2", 0.1) + C(w * 0.6, h * 0.4, Math.min(w, h) * 0.22, CER, "#9aa6b2", 0.1) + C(w * 0.6, h * 0.4, Math.min(w, h) * 0.13, null, "#cfd6dd", 0.08)
    + P(`M${n2(w * 0.25)} ${n2(h * 0.18)}l-.25 .45a.3 .3 0 1 0 .5 0z`, "#6fb6e8") + P(`M${n2(w * 0.78)} ${n2(h * 0.66)}l-.2 .38a.25 .25 0 1 0 .4 0z`, "#6fb6e8");
}
function washer(w, h, dryer) {
  const cx = w / 2, cy = h * 0.55, r = Math.min(w, h) * 0.3;
  let s = R(0, 0, w, h, 0.4, "#f4f7fa", "#9aa6b2", 0.18) + R(0.3, 0.3, w - 0.6, h * 0.16, 0.15, "#e4e9ee") + C(w * 0.22, h * 0.17, 0.32, "#c9d1d9", "#7d8893", 0.08) + R(w * 0.45, h * 0.11, w * 0.35, h * 0.1, 0.05, "#1e2328") + C(w * 0.85, h * 0.16, 0.12, "#59d36b");
  s += C(cx, cy, r * 1.18, "#dfe5ea", "#9aa6b2", 0.15) + C(cx, cy, r, dryer ? "#fbe3c6" : "#bfe3f6", "#7d8893", 0.12);
  s += G(P(`M${n2(cx - r * 0.6)} ${n2(cy)}a${n2(r * 0.6)} ${n2(r * 0.6)} 0 0 1 ${n2(r * 1.2)} 0`, null, dryer ? "#ee7a62" : "#4f7fd9", r * 0.22) + C(cx + r * 0.3, cy + r * 0.35, r * 0.18, dryer ? "#e5b13a" : "#ee9fb3"), { class: "spinw" });
  return s + E(cx - r * 0.35, cy - r * 0.45, r * 0.3, r * 0.15, "#fff", null, 0, { opacity: 0.7 });
}

/* ---------- salle de bain ---------- */
function bathtub(w, h) {
  let s = R(0, 0, w, h, Math.min(w, h) * 0.35, CER, CERS, 0.2) + R(0.7, 0.9, w - 1.4, h - 1.8, Math.min(w, h) * 0.3, "url(#pfWat)", "#8fb4c8", 0.12);
  reseed(w + h); let foam = ""; for (let i = 0; i < 14; i++) foam += C(1.2 + rnd() * (w - 2.4), h * 0.45 + rnd() * h * 0.4, 0.25 + rnd() * 0.45, "#ffffff", null, 0, { opacity: 0.85 });
  s += G(foam) + P(`M1.4 ${n2(h * 0.3)}q${n2((w - 2.8) / 4)} -.4 ${n2((w - 2.8) / 2)} 0t${n2((w - 2.8) / 2)} 0`, null, "#ffffff", 0.12, { class: "rip" });
  s += G(G(E(0, 0.15, 0.85, 0.6, "#f6c61f", "#c99a00", 0.08) + C(-0.45, -0.35, 0.42, "#f6c61f", "#c99a00", 0.08) + P("M-.85 -.4l-.45 .1l.45 .15z", "#f08a24") + C(-0.5, -0.45, 0.07, "#222"), { class: "bob" }), { transform: at(w * 0.6, h * 0.42) });
  return s + faucet(w / 2, 0.15, 1.2) + R(w * 0.15, h - 1.1, w * 0.3, 0.6, 0.2, "#86b38a", null, 0, { opacity: 0.9 });
}
function shower(w, h) {
  let s = tiles(0, 0, w, h, "#d8eef2", Math.max(1.2, Math.min(w, h) / 6)) + R(0, 0, w, h, 0.3, null, CERS, 0.2);
  s += R(w / 2 - 0.9, h / 2 - 0.2, 1.8, 0.4, 0.1, "#9aa4ae") + L(w / 2 - 0.7, h / 2, w / 2 + 0.7, h / 2, "#6f7a85", 0.08, { "stroke-dasharray": ".15 .1" });
  s += R(w - 0.3, 0.3, 0.22, h * 0.7, 0.08, "rgba(150,210,235,.55)", "#7fb8d6", 0.08) + L(w - 0.2, h * 0.1, w - 0.2, h * 0.6, "#fff", 0.06);
  s += C(w * 0.3, h * 0.3, Math.min(w, h) * 0.13, STEEL, STEELD, 0.1);
  let drops = ""; for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; drops += C(w * 0.3 + Math.cos(a) * Math.min(w, h) * 0.06, h * 0.3 + Math.sin(a) * Math.min(w, h) * 0.06, 0.08, "#7fb8d6"); }
  s += G(drops, { class: "rip" });
  return s + R(0.4, h - 1.4, 0.7, 1, 0.2, "#ee9fb3") + R(1.2, h - 1.2, 0.6, 0.8, 0.2, "#86b38a");
}
function basin(w, h) {
  return R(0, 0, w, h, 0.6, CER, CERS, 0.18) + E(w / 2, h * 0.58, w * 0.33, h * 0.3, "url(#pfCer)", "#9fb2c0", 0.12) + C(w / 2, h * 0.62, 0.12, "#7d8893") + faucet(w / 2, 0.2, Math.min(0.9, h * 0.3)) + R(w * 0.08, h * 0.12, 0.45, 0.6, 0.15, "#ee9fb3") + C(w * 0.88, h * 0.25, 0.32, "#86b38a");
}
function vanity(w, h) {
  let s = woodTop(0, 0, w, h, 0.3, OAK); const n = w >= 10 ? 2 : 1;
  for (let i = 0; i < n; i++) { const cx = (w * (i + 0.5)) / n; s += E(cx, h * 0.55, Math.min(2.1, w / n * 0.32), h * 0.3, "url(#pfCer)", CERS, 0.15) + C(cx, h * 0.6, 0.12, "#7d8893") + faucet(cx, 0.2, Math.min(1, h * 0.3)); }
  s += R(w / 2 - 0.9, h * 0.25, 1.8, h * 0.5, 0.2, "#f6efe2", "#d6c9b0", 0.08) + R(w / 2 - 0.7, h * 0.32, 1.4, h * 0.36, 0.15, "#7cc0ea") + C(w * 0.94, h * 0.3, 0.3, "#ee9fb3");
  return s + smallPlant(w * 0.06 + 0.6, h * 0.35, Math.min(0.9, h * 0.2));
}
function toilet(w, h) {
  return R(w * 0.08, 0, w * 0.84, h * 0.22, 0.3, CER, CERS, 0.15) + C(w / 2, h * 0.11, 0.3, STEEL, STEELD, 0.08)
    + E(w / 2, h * 0.58, w * 0.5, h * 0.4, CER, CERS, 0.15) + E(w / 2, h * 0.6, w * 0.32, h * 0.28, "#e8f4fa", "#b7cad6", 0.1) + E(w / 2, h * 0.64, w * 0.18, h * 0.14, "#bfe3f6");
}
function towelRail(w, h, c) {
  let s = R(0, 0, w, h, 0.3, "#f4f7fa", "#9aa6b2", 0.12); for (let x = 0.5; x < w; x += 0.6) s += L(x, 0.15, x, h - 0.15, "#c9d1d9", 0.1);
  return s + R(w * 0.25, -0.15, w * 0.5, h + 0.3, 0.15, c, dk(c, 0.3), 0.1) + L(w * 0.27, h * 0.75, w * 0.73, h * 0.75, lt(c, 0.3), 0.12);
}
function bathMat(w, h, c) { let s = R(0, 0, w, h, Math.min(w, h) * 0.4, c, dk(c, 0.2), 0.12); reseed(w * h); for (let i = 0; i < w * h * 1.5; i++) s += C(0.4 + rnd() * (w - 0.8), 0.4 + rnd() * (h - 0.8), 0.12, lt(c, 0.3), null, 0, { opacity: 0.8 }); return s; }
function radiator(w, h) { let s = R(0, 0, w, h, 0.3, "#f4f7fa", "#9aa6b2", 0.12); for (let x = 0.5; x < w; x += 0.5) s += L(x, 0.15, x, h - 0.15, "#c9d1d9", 0.12); return s + R(w - 0.6, h * 0.2, 0.4, h * 0.6, 0.1, "#ee7a62"); }

/* ---------- jardin ---------- */
function lounger(w, h, c) {
  let s = R(0, 0, w, h, 0.6, TEAK, TEAKD, 0.18);
  for (let y = 0.8; y < h - 0.3; y += 0.8) s += L(0.3, y, w - 0.3, y, TEAKD, 0.08);
  const ty = h * 0.08; s += R(0.5, ty, w - 1, h - ty - 0.6, 0.5, "#fffaf0", "#cbbf9f", 0.1);
  for (let x = 0.5 + (w - 1) / 5; x < w - 0.6; x += ((w - 1) / 5) * 2) s += R(x, ty, (w - 1) / 5, h - ty - 0.6, 0, c, null, 0, { opacity: 0.85 });
  return s + pillow(1, ty + 0.4, w - 2, Math.min(3, h * 0.17), lt(c, 0.5)) + R(w * 0.15, h * 0.62, w * 0.7, h * 0.12, 0.3, "#4f7fd9", null, 0, { opacity: 0.9 });
}
function gardenLounge(w, h, c) {
  const d = Math.min(7, h * 0.4); let s = P(`M0 0H${w}V${d}H${d}V${h}H0z`, "#8b8f94", "#5f6368", 0.18);
  for (let i = 0.6; i < w; i += 0.8) s += L(i, 0.2, i, d - 0.2, "#7a7e83", 0.07); for (let j = d + 0.6; j < h; j += 0.8) s += L(0.2, j, d - 0.2, j, "#7a7e83", 0.07);
  s += sofaCorner(w, h, "#f2ecdf").replace(/^<path[^>]*\/>/, "");
  const tx = d + (w - d) * 0.3, ty = d + (h - d) * 0.25, tw = (w - d) * 0.45, th = (h - d) * 0.4;
  s += woodTop(tx, ty, tw, th, 0.3, TEAK) + C(tx + tw / 2, ty + th / 2, Math.min(tw, th) * 0.18, "#2d3238", "#111", 0.1) + C(tx + tw / 2, ty + th / 2, Math.min(tw, th) * 0.1, FLAME, null, 0, { class: "flame" });
  return s + G(pillow(-1.3, -1.3, 2.6, 2.6, c), { transform: at(w * 0.55, 2.8, 8) }) + G(pillow(-1.3, -1.3, 2.6, 2.6, lt(c, 0.3)), { transform: at(2.8, h * 0.6, -70) });
}
function gardenTable(w, h) {
  const tx = w * 0.18, ty = h * 0.27, tw = w * 0.64, th = h * 0.46, cs = Math.min(3.4, th * 0.5); let s = "";
  const chairT = (cx, cy, a) => G(R(-cs / 2, -cs / 2, cs, cs, 0.3, TEAK, TEAKD, 0.12) + [0.25, 0.5, 0.75].map((f) => L(-cs / 2 + 0.2, -cs / 2 + cs * f, cs / 2 - 0.2, -cs / 2 + cs * f, TEAKD, 0.07)).join("") + R(-cs / 2, -cs * 0.68, cs, cs * 0.22, 0.1, TEAKD), { transform: at(cx, cy, a) });
  for (let i = 0; i < 3; i++) { const x = tx + (tw * (i + 0.5)) / 3; s += chairT(x, ty - cs * 0.2, 0) + chairT(x, ty + th + cs * 0.2, 180); }
  s += R(tx, ty, tw, th, 0.4, TEAK, TEAKD, 0.18); for (let y = ty + 0.7; y < ty + th; y += 0.7) s += L(tx + 0.2, y, tx + tw - 0.2, y, TEAKD, 0.08);
  return s + C(tx + tw / 2, ty + th / 2, 0.5, "#555") + C(tx + tw * 0.25, ty + th * 0.5, 0.55, "#bfe3f6", "#7fb8d6", 0.08) + plate(tx + tw * 0.72, ty + th * 0.5, 0.7, false) + C(tx + tw * 0.72, ty + th * 0.5, 0.35, "#e5483a");
}
function parasol(w, h, c) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = C(cx + r * 0.08, cy + r * 0.1, r, "rgba(30,40,30,.22)");
  for (let i = 0; i < 8; i++) { const a1 = (i * 45 * Math.PI) / 180, a2 = ((i + 1) * 45 * Math.PI) / 180; s += P(`M${n2(cx)} ${n2(cy)}L${n2(cx + Math.cos(a1) * r)} ${n2(cy + Math.sin(a1) * r)}A${n2(r)} ${n2(r)} 0 0 1 ${n2(cx + Math.cos(a2) * r)} ${n2(cy + Math.sin(a2) * r)}z`, i % 2 ? c : "#fff8ec", dk(c, 0.2), 0.1); }
  for (let i = 0; i < 8; i++) { const a = (i * 45 * Math.PI) / 180; s += L(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, dk(c, 0.25), 0.08); }
  return s + C(cx, cy, r * 0.07, "#e9d7a8", "#a98455", 0.08);
}
function bbq(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = C(cx, cy, r, "#2d3238", "#0f1114", 0.18) + C(cx, cy, r * 0.85, "#3c1f12");
  s += G(C(cx - r * 0.3, cy + r * 0.1, r * 0.2, "#ff6a2a") + C(cx + r * 0.25, cy - r * 0.2, r * 0.18, "#ff8c2a") + C(cx + r * 0.1, cy + r * 0.35, r * 0.16, "#ff5a1f"), { class: "glowl" });
  for (let i = -3; i <= 3; i++) s += L(cx - Math.sqrt(Math.max(0, 1 - (i / 4) ** 2)) * r * 0.82, cy + (i * r) / 4.2, cx + Math.sqrt(Math.max(0, 1 - (i / 4) ** 2)) * r * 0.82, cy + (i * r) / 4.2, "#9aa4ae", 0.1);
  return s + R(cx - r * 0.55, cy - r * 0.4, r * 0.7, r * 0.22, r * 0.1, "#9b4a26", "#5e2a12", 0.06) + R(cx - r * 0.1, cy + r * 0.05, r * 0.65, r * 0.2, r * 0.1, "#9b4a26", "#5e2a12", 0.06) + C(cx + r * 0.3, cy - r * 0.35, r * 0.18, "#e5483a") + R(cx + r * 0.9, cy - 0.2, r * 0.4, 0.4, 0.1, "#2d3238");
}
function brasero(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = C(cx, cy, r, "#6b625a", "#3f3934", 0.2) + C(cx, cy, r * 0.8, "#2a2420");
  s += R(cx - r * 0.5, cy - 0.3, r, 0.6, 0.3, "#7a4a28", "#4a2b14", 0.08, { transform: `rotate(30 ${n2(cx)} ${n2(cy)})` }) + R(cx - r * 0.5, cy - 0.3, r, 0.6, 0.3, "#7a4a28", "#4a2b14", 0.08, { transform: `rotate(-30 ${n2(cx)} ${n2(cy)})` });
  return s + G(C(cx, cy, r * 0.45, "url(#pfFire)") + C(cx, cy, r * 0.2, "#fff0a0"), { class: "flame" });
}
function pool(w, h) {
  const b = Math.min(1.6, Math.min(w, h) * 0.06); let s = R(0, 0, w, h, b, "#efe6d6", "#c8b99d", 0.2);
  for (let x = b * 2; x < w; x += b * 2) s += L(x, 0, x, b, "#d8cbb2", 0.08) + L(x, h - b, x, h, "#d8cbb2", 0.08);
  s += R(b, b, w - 2 * b, h - 2 * b, b * 0.6, "url(#pfPool)", "#2f8fd8", 0.18);
  let wav = ""; reseed(w * 3 + h);
  for (let i = 0; i < Math.round((w * h) / 120); i++) { const x = b * 2 + rnd() * (w - b * 5), y = b * 2 + rnd() * (h - b * 5); wav += P(`M${n2(x)} ${n2(y)}q.8 -.5 1.6 0t1.6 0`, null, "#ffffff", 0.14, { opacity: 0.55 }); }
  s += G(wav, { class: "cau" });
  const sw2 = Math.min(8, w * 0.18); for (let i = 0; i < 3; i++) s += R(b, b + i * 1.4, sw2, 1.4, 0, "#ffffff", null, 0, { opacity: 0.12 + i * 0.05 });
  s += P(`M${n2(w - b - 3)} ${n2(b - 0.6)}v1.8M${n2(w - b - 1.6)} ${n2(b - 0.6)}v1.8`, null, STEELD, 0.25) + P(`M${n2(w - b - 3)} ${n2(b - 0.6)}q.7 -.7 1.4 0`, null, STEELD, 0.25);
  const fr = Math.min(2.4, h * 0.08), fx = w * 0.62, fy = h * 0.55;
  return s + G(G(C(0, 0, fr, null, "#ee7a62", fr * 0.55) + C(0, 0, fr, null, "#fff", fr * 0.12, { "stroke-dasharray": `${n2(fr * 0.8)} ${n2(fr * 0.8)}` }), { class: "bob" }), { transform: at(fx, fy) });
}
function spa(w, h) {
  let s = R(0, 0, w, h, 2, "#8a6a4f", "#5e4430", 0.2); for (let y = 0.8; y < h; y += 1) s += L(0.3, y, w - 0.3, y, "#7a5c42", 0.06);
  s += R(1.4, 1.4, w - 2.8, h - 2.8, 3, "url(#pfPool)", "#2f8fd8", 0.18);
  let bub = ""; reseed(w); for (let i = 0; i < 16; i++) bub += C(2.5 + rnd() * (w - 5), 2.5 + rnd() * (h - 5), 0.2 + rnd() * 0.35, "#ffffff", null, 0, { opacity: 0.7 });
  s += G(bub, { class: "rip" }); [[0.5, 1.6], [w - 1.6, 0.5]].forEach(([x, y]) => (s += R(x, y, 1.1, 1.1, 0.4, "#3a3f47")));
  return s + R(w / 2 - 1.2, 1.5, 2.4, 0.9, 0.4, "#3a3f47") + R(w / 2 - 1.2, h - 2.4, 2.4, 0.9, 0.4, "#3a3f47");
}
function pergola(w, h) {
  let s = ""; const p = 0.8;
  [[0, 0], [w - p, 0], [0, h - p], [w - p, h - p]].forEach(([x, y]) => (s += R(x, y, p, p, 0.1, TEAKD, "#5a3a1c", 0.1)));
  s += R(0.2, 0.15, w - 0.4, 0.5, 0.1, TEAK, TEAKD, 0.1) + R(0.2, h - 0.65, w - 0.4, 0.5, 0.1, TEAK, TEAKD, 0.1);
  const k = Math.max(3, Math.round(w / 4)); for (let i = 0; i <= k; i++) { const x = 0.3 + ((w - 0.9) * i) / k; s += R(x, 0, 0.35, h, 0.1, TEAK, TEAKD, 0.08); }
  reseed(w + h * 2); let gl = "";
  for (let i = 0; i < Math.round((w * h) / 9); i++) { // feuillage le long des chevrons
    const bx = 0.3 + ((w - 0.9) * Math.floor(rnd() * (k + 1))) / k + 0.18, x = bx + (rnd() - 0.5) * 2.4, y = 0.8 + rnd() * (h - 1.6);
    gl += leaf(x, y, 1.8 + rnd() * 0.8, 0.6, rnd() * 360, rnd() > 0.5 ? LEAF : LEAFL);
    if (rnd() > 0.5) { const g = rnd() > 0.5 ? "#9d86d6" : "#b9a3ea"; gl += E(x + 0.5, y + 1.2, 0.65, 1.6, g, dk(g, 0.22), 0.07) + E(x + 0.5, y + 0.55, 0.42, 0.65, lt(g, 0.35)) + C(x + 0.3, y + 1.9, 0.18, lt(g, 0.5)); }
  }
  return s + G(gl, { class: "lfg", opacity: 0.95 });
}
function vegPatch(w, h) {
  let s = R(0, 0, w, h, 0.3, TEAK, TEAKD, 0.2) + R(0.5, 0.5, w - 1, h - 1, 0.2, SOIL);
  const rows = Math.max(2, Math.round((h - 1) / 2.6)), rh = (h - 1) / rows;
  for (let r = 0; r < rows; r++) {
    const y = 0.5 + rh * (r + 0.5), kind = r % 4;
    for (let x = 1.4; x < w - 1; x += kind === 1 ? 1.1 : 1.8) {
      if (kind === 0) s += C(x, y, rh * 0.34, LEAFL, LEAF, 0.1) + C(x, y, rh * 0.16, "#c9ef9b");
      else if (kind === 1) s += P(`M${n2(x)} ${n2(y + rh * 0.15)}l-.25 -.7M${n2(x)} ${n2(y + rh * 0.15)}v-.8M${n2(x)} ${n2(y + rh * 0.15)}l.25 -.7`, null, LEAF, 0.14) + E(x, y + rh * 0.28, 0.18, 0.28, "#f08a24");
      else if (kind === 2) s += C(x, y, rh * 0.3, LEAFD, null, 0, { opacity: 0.85 }) + C(x - 0.25, y + 0.1, 0.22, "#e5483a") + C(x + 0.3, y - 0.2, 0.2, "#e5483a") + L(x, y - rh * 0.4, x, y + rh * 0.4, "#a8783f", 0.1);
      else s += C(x, y, rh * 0.32, "#7b4f9e", "#57357a", 0.08) + C(x, y, rh * 0.14, "#b89bd6");
    }
  }
  return s;
}
function flowerBed(w, h) {
  let s = E(w / 2, h / 2, w / 2, h / 2, "#6d8a4c", "#4d6a34", 0.15); reseed(w + h * 3);
  for (let i = 0; i < Math.round(w * h * 0.6); i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 0.88, x = w / 2 + Math.cos(a) * d * w / 2, y = h / 2 + Math.sin(a) * d * h / 2; s += i % 3 === 0 ? leaf(x, y, 0.9, 0.3, rnd() * 360, LEAF) : flower(x, y, 0.45 + rnd() * 0.25, PAL[Math.floor(rnd() * PAL.length)]); }
  return G(s, { class: "lfg" });
}
function lavenders(w, h) {
  let s = ""; const n = Math.max(2, Math.round(w / 3.2)), r = Math.min(h / 2, w / n / 2) * 0.95;
  for (let i = 0; i < n; i++) { const cx = (w * (i + 0.5)) / n, cy = h / 2; s += C(cx, cy, r, "#8f84bf", "#5f548f", 0.1); for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; s += E(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.22, r * 0.12, "#9d86d6", null, 0, { transform: `rotate(${n2((a * 180) / Math.PI)} ${n2(cx + Math.cos(a) * r * 0.55)} ${n2(cy + Math.sin(a) * r * 0.55)})` }); } s += C(cx, cy, r * 0.25, "#b9a3ea"); }
  return G(s, { class: "lfg" });
}
function hedge(w, h) { let s = ""; const n = Math.max(2, Math.round(w / (h * 0.8))); for (let i = 0; i < n; i++) s += bush((w * (i + 0.5)) / n, h / 2, h * 0.62, i % 2 ? "#4f9e55" : "#3f8a4a", 6); return s; }
function olive(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; reseed(r * 5); let s = C(cx + r * 0.12, cy + r * 0.14, r * 0.92, "rgba(30,60,25,.22)");
  for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, d = r * (0.2 + rnd() * 0.55); s += C(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.24 + rnd() * 0.14), i % 3 ? "#86a872" : "#a9c48f", "#58764a", 0.12); }
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, d = rnd() * r * 0.8; s += E(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.07, r * 0.025, "#d9e6cf", null, 0, { transform: `rotate(${n2(rnd() * 180)} ${n2(cx + Math.cos(a) * d)} ${n2(cy + Math.sin(a) * d)})` }); }
  for (let i = 0; i < 12; i++) s += C(cx + (rnd() - 0.5) * r * 1.2, cy + (rnd() - 0.5) * r * 1.2, r * 0.035, "#3d3557");
  return G(s, { class: "lfg" });
}
function palm(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = C(cx + r * 0.1, cy + r * 0.12, r * 0.8, "rgba(30,60,25,.2)");
  for (let i = 0; i < 11; i++) { const a = i * 33 + 7; s += G(P(`M0 0Q${n2(r * 0.25)} ${n2(r * 0.5)} 0 ${n2(r)}Q${n2(-r * 0.25)} ${n2(r * 0.5)} 0 0z`, i % 2 ? "#4fa35a" : "#6fbf6a", "#2e7a3f", 0.1) + L(0, 0, 0, r * 0.95, "#2e7a3f", 0.1) + [0.3, 0.5, 0.7].map((f) => L(0, r * f, r * 0.18, r * (f + 0.08), "#2e7a3f", 0.05) + L(0, r * f, -r * 0.18, r * (f + 0.08), "#2e7a3f", 0.05)).join(""), { transform: at(cx, cy, a) }); }
  return G(s + C(cx, cy, r * 0.12, "#8a6a40", "#5a4020", 0.1), { class: "lfg" });
}
function fruitTree(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = bush(cx, cy, r * 0.92, "#5aa84f", 9); reseed(r * 11);
  for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, d = rnd() * r * 0.75; s += C(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.06, i % 4 ? "#e5483a" : "#f2b33d", dk("#e5483a", 0.3), 0.05); }
  return G(s, { class: "lfg" });
}
function flowerPot(w, h, c) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = C(cx, cy, r, POT, POTD, 0.12) + C(cx, cy, r * 0.82, SOIL);
  for (let i = 0; i < 5; i++) s += leaf(cx, cy, r * 0.95, r * 0.3, i * 72 + 36, LEAF);
  for (let i = 0; i < 4; i++) { const a = (i * 90 * Math.PI) / 180; s += flower(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, r * 0.22, c); }
  return G(s + flower(cx, cy, r * 0.24, c), { class: "lfg" });
}
function hammock(w, h, c) {
  let s = C(0.6, h / 2, 0.55, TEAKD) + C(w - 0.6, h / 2, 0.55, TEAKD) + L(0.6, h / 2, w * 0.18, h / 2, "#cbb38a", 0.12) + L(w - 0.6, h / 2, w * 0.82, h / 2, "#cbb38a", 0.12);
  s += P(`M${n2(w * 0.18)} ${n2(h / 2)}Q${n2(w / 2)} ${n2(-h * 0.45)} ${n2(w * 0.82)} ${n2(h / 2)}Q${n2(w / 2)} ${n2(h * 1.45)} ${n2(w * 0.18)} ${n2(h / 2)}z`, c, dk(c, 0.3), 0.15);
  for (let i = 1; i < 6; i++) { const x = w * 0.18 + (w * 0.64 * i) / 6; s += L(x, h * 0.08, x, h * 0.92, i % 2 ? "#ffffff" : dk(c, 0.15), 0.35, { opacity: 0.7 }); }
  return s + G(pillow(-1, -1, 2, 2, "#fff6e5"), { transform: at(w * 0.28, h / 2, -10) });
}
function trampoline(w, h) {
  const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2; let s = C(cx, cy, r, "#3a7bd5", "#25569a", 0.25) + C(cx, cy, r * 0.88, "#2d3238");
  for (let i = 0; i < 36; i++) { const a = (i * 10 * Math.PI) / 180; s += L(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88, "#c9d1d9", 0.12); }
  return s + C(cx, cy, r * 0.78, "#1f2328") + C(cx, cy, r * 0.2, null, "#3a4048", 0.15) + C(cx - r * 0.25, cy - r * 0.25, r * 0.3, "#ffffff", null, 0, { opacity: 0.05 });
}
function mower(w, h) {
  return E(w / 2, h / 2, w / 2, h / 2, "#3f9b62", "#24603a", 0.15) + E(w / 2, h * 0.45, w * 0.36, h * 0.3, "#5cc27e", null, 0, { opacity: 0.8 }) + R(w * 0.38, h * 0.3, w * 0.24, h * 0.22, 0.2, "#1f2328") + C(w * 0.5, h * 0.41, 0.15, "#ff5a3a", null, 0, { class: "glowl" }) + R(-0.2, h * 0.62, 0.6, 1.2, 0.2, "#222") + R(w - 0.4, h * 0.62, 0.6, 1.2, 0.2, "#222");
}

export const DRAW = {
  canape: (w, h, c) => sofa(w, h, c), canapeangle: sofaCorner, fauteuil: armchair, pouf, tablebasse: coffeeTable, tablebasseronde: coffeeRound,
  meubletv: tvStand, tvx: tv, biblio: bookcase, cheminee: fireplace, poele: stove, piano, lampadaire: floorLamp, tapis: rug, tapisrond: rugRound, plante: plant, grandeplante: bigPlant,
  table, tablerepas: dining, tableronde: roundTable, tablerondechaises: roundTableChairs, chaise: chairOne,
  lit2: (w, h, c) => bed(w, h, c, false), lit1: (w, h, c) => bed(w, h, c, true), litbebe: crib, chevet: nightstand, armoire: wardrobe, commode: dresser,
  bureau: desk, chaisebureau: officeChair,
  cuisine: counter, plantravail: counterPlain, bar, cuisineangle: kitchenCorner, ilot: island, evier: (w, h) => sinkUnit(w, h, false), evierdouble: (w, h) => sinkUnit(w, h, true), four: cooker, plaque: cooktop,
  frigo: (w, h) => fridge(w, h, false), frigoamericain: (w, h) => fridge(w, h, true), lavevaisselle: dishwasher, tabouret: stoolOne,
  baignoirex: bathtub, douchex: shower, lavabo: basin, meublevasque: vanity, wcx: toilet, secheserviette: towelRail, tapisbain: bathMat,
  lavelinge: (w, h) => washer(w, h, false), seche: (w, h) => washer(w, h, true), radiateurx: radiator,
  transat: lounger, salonjardin: gardenLounge, tablejardin: gardenTable, parasol, barbecue: bbq, brasero, piscine: pool, spa, pergola, potager: vegPatch,
  massif: flowerBed, lavandes: lavenders, haie: hedge, olivier: olive, palmier: palm, fruitier: fruitTree, potfleurs: flowerPot, hamac: hammock, trampoline, tondeuse: mower,
};
