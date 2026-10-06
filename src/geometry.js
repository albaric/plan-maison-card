// Lecture de la configuration et géométrie du plan.
// La configuration est en mètres ; en interne tout est en décimètres (1 unité = 10 cm).

const M = 10;
const EPS = 1e-6;
const MIN_EDGE = 4; // longueur minimale d'un bord de pièce pendant le déplacement d'une cloison (40 cm)

export const KIND_ALIAS = {
  jour: "jour", living: "jour", day: "jour", kitchen: "jour",
  nuit: "nuit", bedroom: "nuit", night: "nuit", chambre: "nuit",
  eau: "eau", bathroom: "eau", wet: "eau", bath: "eau",
  service: "service", utility: "service", office: "service",
  circ: "circ", hall: "circ", corridor: "circ", circulation: "circ",
  todo: "todo", unknown: "todo",
};
export const KIND_LABEL = { jour: "Pièce de jour", nuit: "Chambre", eau: "Pièce d'eau", service: "Pièce de service", circ: "Circulation", todo: "Espace à préciser" };

const REF_RE = /^\s*([A-Za-z_][\w]*)\s*(?:([+-])\s*(\d+(?:[.,]\d+)?))?\s*$/;

const num = (v) => (typeof v === "string" ? parseFloat(v.replace(",", ".")) : +v);

/** Coordonnée : nombre (m) ou "axe", "axe+0.5", "axe-1.1". Retourne {a: nom d'axe|null, o: décalage en dm}. */
export function parseCoord(v, axes, dir, auto) {
  if (typeof v === "number" || (typeof v === "string" && /^\s*-?\d+(?:[.,]\d+)?\s*$/.test(v))) {
    const d = round(num(v) * M);
    if (auto) { const name = dir + fmtNum(d / M); if (!axes[name]) axes[name] = { dir, def: d, label: "", auto: true }; return { a: name, o: 0 }; }
    return { a: null, o: d };
  }
  const m = typeof v === "string" && v.match(REF_RE);
  if (!m) throw new Error(`Coordonnée illisible : ${JSON.stringify(v)}`);
  const name = m[1];
  if (!axes[name]) throw new Error(`Axe inconnu : « ${name} ». Déclare-le dans « axes ».`);
  if (!axes[name].dir) axes[name].dir = dir;
  const off = m[2] ? (m[2] === "-" ? -1 : 1) * num(m[3]) * M : 0;
  return { a: name, o: round(off) };
}
const round = (x) => Math.round(x * 1000) / 1000;
const fmtNum = (x) => String(round(x));

function point(p, axes, auto) {
  if (!Array.isArray(p) || p.length !== 2) throw new Error(`Point illisible : ${JSON.stringify(p)}`);
  return [parseCoord(p[0], axes, "x", auto), parseCoord(p[1], axes, "y", auto)];
}
const fixedPt = (p) => [num(p[0]) * M, num(p[1]) * M];
const rectPts = (r) => [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];

/** Transforme la configuration YAML en modèle interne. */
export function buildModel(cfg) {
  const axes = {};
  const declared = cfg.axes && typeof cfg.axes === "object" ? cfg.axes : null;
  if (declared) for (const [k, v] of Object.entries(declared)) {
    const o = typeof v === "object" && v !== null ? v : { value: v };
    axes[k] = { dir: o.dir || null, def: round(num(o.value) * M), label: o.label || "" };
  }
  const auto = cfg.auto_axes != null ? !!cfg.auto_axes : !declared;
  if (!Array.isArray(cfg.rooms) || !cfg.rooms.length) throw new Error("Il faut au moins une pièce dans « rooms ».");

  const rooms = cfg.rooms.map((r, i) => {
    const raw = r.points || (r.rect && rectPts(r.rect));
    if (!raw) throw new Error(`Pièce ${r.name || i + 1} : il faut « points » ou « rect ».`);
    return {
      id: String(r.id || "r" + (i + 1)), name: r.name || "Pièce " + (i + 1), kind: KIND_ALIAS[r.kind] || "jour",
      pts: raw.map((p) => point(p, axes, auto)), area: r.area != null ? num(r.area) : null,
      label: r.label ? point(r.label, axes, false) : null, ls: r.label_size != null ? num(r.label_size) * M : null,
    };
  });

  // ouvertures : la coordonnée qui porte le mur suit l'axe correspondant en mode automatique
  const openings = (cfg.openings || []).map((o) => {
    const t = ["door", "window", "open", "passage"].includes(o.type) ? o.type : "door";
    const a = o.from, b = o.to;
    if (!a || !b) throw new Error("Chaque ouverture a besoin de « from » et « to ».");
    const same = (u, v) => (typeof u === "number" && typeof v === "number" ? u === v : String(u).trim() === String(v).trim());
    const horiz = same(a[1], b[1]);
    // en mode automatique, la coordonnée du mur suit l'axe de même valeur s'il existe
    const wallC = (v, dir) => {
      if (typeof v !== "number" && !/^\s*-?\d+(?:[.,]\d+)?\s*$/.test(String(v))) return parseCoord(v, axes, dir, false);
      const name = dir + fmtNum(round(num(v) * M) / M);
      return axes[name] ? { a: name, o: 0 } : parseCoord(v, axes, dir, false);
    };
    const mk = (p) => {
      if (!auto) return point(p, axes, false);
      return horiz ? [parseCoord(p[0], axes, "x", false), wallC(p[1], "y")] : [wallC(p[0], "x"), parseCoord(p[1], axes, "y", false)];
    };
    return { type: t, a: mk(a), b: mk(b), swing: o.swing || null, dashed: o.dashed !== false, label: o.label || null };
  });

  for (const [k, ax] of Object.entries(axes)) if (!ax.dir) ax.dir = /^y/i.test(k) ? "y" : "x";

  const zones = (cfg.zones || []).map((z, i) => ({
    id: String(z.id || "z" + (i + 1)), name: z.name || "Zone " + (i + 1), type: ["deck", "shed", "patch", "pool", "gravel"].includes(z.type) ? z.type : "deck",
    rect: (z.rect || [0, 0, 1, 1]).map((v) => num(v) * M), pattern: z.pattern || (z.type === "deck" || !z.type ? "tiles" : null),
    posts: !!z.posts, size: !!z.show_size,
  }));

  const g = cfg.garden === false ? null : cfg.garden || {};
  const garden = g && {
    label: g.label != null ? g.label : "Jardin",
    trees: (g.trees || []).map((t) => [num(t[0]) * M, num(t[1]) * M, num(t[2] || 1) * M, t[3] || "t1"]),
    flowers: (g.flowers || []).map((f) => [num(f[0]) * M, num(f[1]) * M, f[2] || "#f6c84c"]),
    paths: (g.paths || []).map((p) => p.map(fixedPt)),
    autoTrees: !g.trees,
  };

  const garlands = (cfg.garlands || []).map((l) => ({
    entity: l.entity, name: l.name || null, pts: (l.points || []).map(fixedPt), sag: num(l.sag ?? 0.15) * M,
    colors: l.colors === "warm" || l.style === "warm" ? ["#ffcf70"] : Array.isArray(l.colors) ? l.colors : ["#e5484d", "#f5a524", "#30a46c", "#3e7bfa", "#c04bd8"],
    gap: num(l.spacing ?? (l.style === "warm" ? 0.46 : 0.33)) * M, w: num(l.size ?? (l.style === "warm" ? 0.2 : 0.11)) * M,
  }));

  const devices = (cfg.devices || []).map((d, i) => {
    if (!d.entity) throw new Error(`Équipement ${i + 1} : « entity » manquant.`);
    const pos = d.x != null && d.y != null ? [num(d.x) * M, num(d.y) * M] : null;
    return {
      id: String(d.id || d.entity), entity: d.entity, name: d.name || null, icon: d.icon || null, pos, kind: d.kind || null,
      warn: d.warn || null, gust: d.gust || null, intensity: d.intensity || null, outdoor: d.outdoor,
    };
  });

  const furniture = (cfg.furniture || []).map((f, i) => ({
    id: String(f.id || "f" + (i + 1)), type: f.type || null, name: f.name || null, x: num(f.x || 0) * M, y: num(f.y || 0) * M, rot: num(f.rot || 0),
    parts: f.parts ? f.parts.map((p) => [p[0], ...p.slice(1).map((v) => num(v) * M)]) : null, style: f.style || null,
  }));

  return { axes, auto, rooms, openings, zones, garden, garlands, devices, furniture, view: cfg.view ? cfg.view.map((v) => num(v) * M) : null };
}

/* ---------- calculs à partir des valeurs d'axes ---------- */

export const val = (c, AX) => (c.a ? AX[c.a] : 0) + c.o;
export const ptVal = (p, AX) => [val(p[0], AX), val(p[1], AX)];

export function area(p) { let s = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(s) / 200; }
export function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
function segDist(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
  let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
}
function bboxPts(p) { const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); return { x: Math.min(...xs), y: Math.min(...ys), X: Math.max(...xs), Y: Math.max(...ys) }; }

/** Point le plus « à l'intérieur » du polygone (recherche sur grille), pour poser l'étiquette.
 *  obstacles : rectangles [x1, y1, x2, y2] (meubles, pastilles) à éviter ; box : [largeur, hauteur] du texte. */
export function labelPoint(p, obstacles = [], box = [0, 0]) {
  const b = bboxPts(p), n = 24, cx = (b.x + b.X) / 2, cy = (b.y + b.Y) / 2;
  let best = [cx, cy], bd = -Infinity;
  const bw = box[0] / 2 + 1.5, bh = box[1] / 2 + 2, ba = Math.max(1, box[0] * box[1]);
  for (let i = 1; i < n; i++) for (let j = 1; j < n; j++) {
    const x = b.x + ((b.X - b.x) * i) / n, y = b.y + ((b.Y - b.y) * j) / n;
    if (!inPoly(x, y, p)) continue;
    let d = Infinity; for (let k = 0, l = p.length - 1; k < p.length; l = k++) d = Math.min(d, segDist(x, y, p[l], p[k]));
    // le texte doit tenir dans la largeur de la pièce à cette hauteur
    const [cl, cr] = chordAt(p, x, y), [ct, cb] = chordAt(p.map((q) => [q[1], q[0]]), y, x);
    const out = Math.max(0, cl - (x - bw)) + Math.max(0, x + bw - cr) + 3 * (Math.max(0, ct - (y - bh)) + Math.max(0, y + bh - cb));
    let ov = 0;
    for (const o of obstacles) {
      const w = Math.min(x + bw, o[2]) - Math.max(x - bw, o[0]), h = Math.min(y + bh, o[3]) - Math.max(y - bh, o[1]);
      if (w > 0 && h > 0) ov += w * h;
    }
    // loin des murs, sans chevaucher meubles ni pastilles, et plutôt vers le centre
    const c = Math.min(d, bh * 1.6 + 2) - 120 * (ov / ba) - 5 * out - 0.02 * Math.hypot(x - cx, y - cy);
    if (c > bd) { bd = c; best = [x, y]; }
  }
  best.score = bd;
  return best;
}
/** Largeur de la corde horizontale qui passe par (x, y) à l'intérieur du polygone. */
export function chordAt(p, x, y) {
  const xs = [];
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y)) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi); }
  xs.sort((a, b) => a - b);
  for (let i = 0; i + 1 < xs.length; i += 2) if (x >= xs[i] && x <= xs[i + 1]) return [xs[i], xs[i + 1]];
  return [x, x];
}
export function chord(p, x, y) {
  const xs = [];
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y)) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi); }
  xs.sort((a, b) => a - b);
  for (let i = 0; i + 1 < xs.length; i += 2) if (x >= xs[i] && x <= xs[i + 1]) return xs[i + 1] - xs[i];
  return bboxPts(p).X - bboxPts(p).x;
}

/** Murs déduits des pièces : bords partagés = cloisons, bords seuls = façade ; portes et ouvertures découpent. */
export function computeWalls(polys, openings) {
  const lines = new Map(), diag = [];
  const add = (key, a, b, extra) => { if (b - a < EPS) return; if (!lines.has(key)) lines.set(key, { ivs: [], cuts: [] }); lines.get(key)[extra ? "cuts" : "ivs"].push([a, b]); };
  polys.forEach((p) => {
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      if (Math.abs(a[1] - b[1]) < EPS) add("h" + round(a[1]), Math.min(a[0], b[0]), Math.max(a[0], b[0]));
      else if (Math.abs(a[0] - b[0]) < EPS) add("v" + round(a[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]));
      else diag.push([a, b]);
    }
  });
  openings.forEach((o) => {
    if (o.type === "window") return;
    const [a, b] = o.p;
    if (Math.abs(a[1] - b[1]) < EPS) add("h" + round(a[1]), Math.min(a[0], b[0]), Math.max(a[0], b[0]), true);
    else if (Math.abs(a[0] - b[0]) < EPS) add("v" + round(a[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), true);
  });
  const out = [];
  for (const [key, { ivs, cuts }] of lines) {
    if (!ivs.length) continue;
    const c = +key.slice(1), h = key[0] === "h";
    const xs = [...new Set(ivs.flat().concat(cuts.flat()).map(round))].sort((a, b) => a - b);
    let cur = null;
    const flush = () => { if (cur) out.push(h ? [cur[0], c, cur[1], c, cur[2]] : [c, cur[0], c, cur[1], cur[2]]); cur = null; };
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = xs[i], b = xs[i + 1], m = (a + b) / 2;
      const n = ivs.filter(([p, q]) => p <= m && m <= q).length, cut = cuts.some(([p, q]) => p <= m && m <= q);
      const cls = !n || cut ? null : n === 1 ? "wext" : "wall";
      if (cls && cur && cur[2] === cls && Math.abs(cur[1] - a) < EPS) cur[1] = b;
      else { flush(); if (cls) cur = [a, b, cls]; }
    }
    flush();
  }
  diag.forEach(([a, b]) => out.push([a[0], a[1], b[0], b[1], "wall"]));
  return out;
}

/** Voisins d'un axe : autres extrémités des bords perpendiculaires qui le touchent. */
export function axisNeighbours(model) {
  const nb = {};
  Object.keys(model.axes).forEach((k) => (nb[k] = []));
  model.rooms.forEach((r) => {
    const p = r.pts;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      // bord horizontal (même y) : relie deux coordonnées x ; bord vertical : deux coordonnées y
      const sameRef = (u, v) => u.a === v.a && u.o === v.o;
      if (sameRef(a[1], b[1])) { if (a[0].a) nb[a[0].a].push({ self: a[0], other: b[0] }); if (b[0].a) nb[b[0].a].push({ self: b[0], other: a[0] }); }
      if (sameRef(a[0], b[0])) { if (a[1].a) nb[a[1].a].push({ self: a[1], other: b[1] }); if (b[1].a) nb[b[1].a].push({ self: b[1], other: a[1] }); }
    }
  });
  return nb;
}

/** Déplace un axe en poussant les cloisons voisines si nécessaire. Retourne la valeur atteinte. */
export function moveAxis(k, v, AX, NB, bounds, DEF = AX, seen = new Set()) {
  if (seen.has(k)) return AX[k];
  seen.add(k);
  v = Math.max(bounds[0], Math.min(bounds[1], v));
  for (const { self, other } of NB[k] || []) {
    if (other.a === k) continue;
    // le sens d'un bord est celui du plan d'origine : un bord nul (forme en L) peut s'inverser librement
    const ov = val(other, AX), s = Math.sign(val(other, DEF) - (DEF[k] + self.o));
    if (!s) continue;
    const mine = v + self.o;
    if (s > 0 && mine > ov - MIN_EDGE) {
      if (other.a) { const want = mine + MIN_EDGE - other.o; const got = moveAxis(other.a, want, AX, NB, bounds, DEF, seen); v = Math.min(v, got + other.o - MIN_EDGE - self.o); }
      else v = Math.min(v, ov - MIN_EDGE - self.o);
    } else if (s < 0 && mine < ov + MIN_EDGE) {
      if (other.a) { const want = mine - MIN_EDGE - other.o; const got = moveAxis(other.a, want, AX, NB, bounds, DEF, seen); v = Math.max(v, got + other.o + MIN_EDGE - self.o); }
      else v = Math.max(v, ov + MIN_EDGE - self.o);
    }
  }
  AX[k] = Math.round(v * 2) / 2;
  seen.delete(k);
  return AX[k];
}

/** Position de la poignée d'un axe : milieu du plus long bord de pièce porté par cet axe. */
export function handlePos(k, model, AX) {
  let best = null, bl = -1;
  model.rooms.forEach((r) => {
    const p = r.pts;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      const ax = model.axes[k].dir === "x" ? 0 : 1;
      if (a[ax].a === k && b[ax].a === k && a[ax].o === b[ax].o) {
        const A = ptVal(a, AX), B = ptVal(b, AX), l = Math.hypot(A[0] - B[0], A[1] - B[1]);
        if (l > bl) { bl = l; best = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; }
      }
    }
  });
  if (!best) (model.openings || []).forEach((o) => [o.a, o.b].forEach((p) => {
    const ax = model.axes[k].dir === "x" ? 0 : 1;
    if (!best && p[ax].a === k) best = ptVal(p, AX);
  }));
  return best;
}

/** Libellé lisible d'un axe : les pièces de part et d'autre. */
export function axisLabel(k, model, AX, names) {
  if (model.axes[k].label) return model.axes[k].label;
  const d = model.axes[k].dir === "x" ? 0 : 1, lo = new Set(), hi = new Set();
  model.rooms.forEach((r) => {
    const p = r.pts.map((q) => ptVal(q, AX));
    const on = r.pts.some((q) => q[d].a === k);
    if (!on) return;
    const c = p.reduce((s, q) => s + q[d], 0) / p.length;
    (c < AX[k] ? lo : hi).add(names(r));
  });
  const a = [...lo].join(", "), b = [...hi].join(", ");
  return a && b ? `${a} | ${b}` : `Façade ${d ? (a ? "sud" : "nord") : a ? "est" : "ouest"} (${a || b})`;
}

export { M, EPS, bboxPts, rectPts };
