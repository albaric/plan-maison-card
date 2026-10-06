// Mobilier illustré, vu de dessus. Chaque meuble garde ses formes (rect, cercle, ellipse, trait, en décimètres)
// et reçoit un habillage selon son style : bois veiné, tissu et coussins, couette, feuillage, céramique, eau…

const n2 = (v) => Math.round(v * 100) / 100;
const box = (q) => q[0] === "r" ? { x: q[1], y: q[2], w: q[3], h: q[4] } : q[0] === "c" ? { x: q[1] - q[3], y: q[2] - q[3], w: 2 * q[3], h: 2 * q[3] } : q[0] === "e" ? { x: q[1] - q[3], y: q[2] - q[4], w: 2 * q[3], h: 2 * q[4] } : { x: Math.min(q[1], q[3]), y: Math.min(q[2], q[4]), w: Math.abs(q[3] - q[1]), h: Math.abs(q[4] - q[2]) };
const attrs = (a) => Object.entries(a).filter(([, v]) => v != null).map(([k, v]) => `${k}="${typeof v === "number" ? n2(v) : v}"`).join(" ");
/** Forme de base d'une pièce de meuble. */
function shape(q, i, a = {}) {
  const cls = (q[0] === "l" ? "fpl" : "fp") + " p" + i + (a.cls ? " " + a.cls : "");
  const o = { ...a }; delete o.cls;
  if (q[0] === "r") return `<rect class="${cls}" ${attrs({ x: q[1], y: q[2], width: q[3], height: q[4], rx: q[5] || 0, ...o })}/>`;
  if (q[0] === "c") return `<circle class="${cls}" ${attrs({ cx: q[1], cy: q[2], r: q[3], ...o })}/>`;
  if (q[0] === "e") return `<ellipse class="${cls}" ${attrs({ cx: q[1], cy: q[2], rx: q[3], ry: q[4], ...o })}/>`;
  return `<line class="${cls}" ${attrs({ x1: q[1], y1: q[2], x2: q[3], y2: q[4], ...o })}/>`;
}
const rr = (x, y, w, h, r, a) => `<rect ${attrs({ x, y, width: Math.max(0, w), height: Math.max(0, h), rx: r, ...a })}/>`;
const line = (x1, y1, x2, y2, a) => `<line ${attrs({ x1, y1, x2, y2, ...a })}/>`;
const circ = (cx, cy, r, a) => `<circle ${attrs({ cx, cy, r, ...a })}/>`;
const scaled = (q, k, a) => { // même forme, réduite autour de son centre
  const b = box(q), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  if (q[0] === "c") return circ(cx, cy, q[3] * k, a);
  if (q[0] === "e") return `<ellipse ${attrs({ cx, cy, rx: q[3] * k, ry: q[4] * k, ...a })}/>`;
  const w = b.w * k, h = b.h * k; return rr(cx - w / 2, cy - h / 2, w, h, (q[5] || 0) * k, a);
};
const areaOf = (q) => { const b = box(q); return b.w * b.h; };
const biggest = (parts) => parts.reduce((m, q, i) => (q[0] !== "l" && (m < 0 || areaOf(q) > areaOf(parts[m])) ? i : m), -1);

/* ---------- motifs ---------- */
function grain(b, a = {}) { // veinage du bois le long du grand côté
  const horiz = b.w >= b.h, L = horiz ? b.w : b.h, S = horiz ? b.h : b.w, out = [];
  if (L * S < 12) return "";
  const n = Math.max(2, Math.min(5, Math.round(S / 1.6)));
  for (let k = 1; k <= n; k++) {
    const t = (k / (n + 1)) * S, wob = 0.25 + 0.15 * (k % 2);
    if (horiz) out.push(`<path d="M${n2(b.x + 0.5)} ${n2(b.y + t)}Q${n2(b.x + L * 0.3)} ${n2(b.y + t - wob)} ${n2(b.x + L * 0.55)} ${n2(b.y + t)}T${n2(b.x + L - 0.5)} ${n2(b.y + t)}"/>`);
    else out.push(`<path d="M${n2(b.x + t)} ${n2(b.y + 0.5)}Q${n2(b.x + t - wob)} ${n2(b.y + L * 0.3)} ${n2(b.x + t)} ${n2(b.y + L * 0.55)}T${n2(b.x + t)} ${n2(b.y + L - 0.5)}"/>`);
  }
  return `<g class="grain" fill="none" stroke="var(--fws)" stroke-width=".14" stroke-opacity=".38" stroke-linecap="round">${out.join("")}</g>${a.bevel === false ? "" : rr(b.x + 0.35, b.y + 0.35, b.w - 0.7, b.h - 0.7, 0.3, { fill: "none", stroke: "#fff", "stroke-opacity": 0.35, "stroke-width": 0.18 })}`;
}
function leafPath(cx, cy, L, W, ang, fill) {
  const r = (ang * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), P = (x, y) => `${n2(cx + x * c - y * s)} ${n2(cy + x * s + y * c)}`;
  return `<path d="M${P(0, 0)}Q${P(L * 0.45, -W)} ${P(L, 0)}Q${P(L * 0.45, W)} ${P(0, 0)}Z" fill="${fill}" stroke="var(--leaf2)" stroke-width=".12"/><path d="M${P(L * 0.12, 0)}L${P(L * 0.85, 0)}" stroke="var(--leaf2)" stroke-width=".1" stroke-opacity=".7"/>`;
}

/* ---------- habillage par style ---------- */
const ART = {
  wood(parts) {
    return parts.map((q, i) => {
      if (q[0] === "l") return shape(q, i, { stroke: "var(--fws)", "stroke-width": 0.3 });
      const b = box(q);
      return shape(q, i, { fill: "url(#pfWood)", stroke: "var(--fws)", "stroke-width": 0.35 }) + (q[0] === "r" ? grain(b) : q[0] === "c" ? circ(q[1], q[2], q[3] * 0.62, { fill: "none", stroke: "var(--fws)", "stroke-opacity": 0.3, "stroke-width": 0.14 }) + circ(q[1], q[2], q[3] * 0.32, { fill: "none", stroke: "var(--fws)", "stroke-opacity": 0.3, "stroke-width": 0.14 }) : "");
    }).join("");
  },
  dining(parts) {
    const t = biggest(parts), T = parts[t], tb = box(T), out = [];
    parts.forEach((q, i) => {
      if (i === t) return;
      if (q[0] === "l") { out.push(shape(q, i, { stroke: "var(--fab2)", "stroke-width": 0.3 })); return; }
      out.push(shape(q, i, { fill: "url(#pfFab)", stroke: "var(--fab2)", "stroke-width": 0.3 }) + scaled(q, 0.55, { fill: "none", stroke: "#fff", "stroke-opacity": 0.45, "stroke-width": 0.15 }));
    });
    out.push(shape(T, t, { fill: "url(#pfWood)", stroke: "var(--fws)", "stroke-width": 0.35 }) + (T[0] === "r" ? grain(tb) : ""));
    // une assiette devant chaque chaise
    parts.forEach((q, i) => {
      if (i === t || q[0] === "l") return;
      const b = box(q), cx = b.x + b.w / 2, cy = b.y + b.h / 2, px = Math.max(tb.x + 1.2, Math.min(tb.x + tb.w - 1.2, cx)), py = Math.max(tb.y + 1.2, Math.min(tb.y + tb.h - 1.2, cy));
      if (Math.hypot(px - cx, py - cy) < 6) out.push(circ(px, py, 0.85, { fill: "#fff", stroke: "#d8d2c6", "stroke-width": 0.12 }) + circ(px, py, 0.5, { fill: "none", stroke: "#e6dfd2", "stroke-width": 0.1 }));
    });
    return out.join("");
  },
  sofa(parts) {
    const thin = (q) => q[0] === "r" && Math.min(q[3], q[4]) <= 2.6, out = [], deco = [];
    parts.forEach((q, i) => {
      if (q[0] === "l") return out.push(shape(q, i, { stroke: "var(--fab2)", "stroke-width": 0.3 }));
      out.push(shape(q, i, { fill: thin(q) ? "url(#pfFab2)" : "url(#pfFab)", stroke: "var(--fab2)", "stroke-width": 0.32 }));
      if (q[0] !== "r" || thin(q)) return;
      // assise : retire le dossier, pose accoudoirs et coussins
      const P = box(q); let s = { ...P }, back = null;
      parts.forEach((t) => {
        if (!thin(t)) return; const T = box(t);
        if (Math.abs(T.y - P.y) < 0.05 && T.w >= P.w * 0.6 && T.h < P.h) { s = { x: s.x, y: P.y + T.h, w: s.w, h: P.h - T.h }; back = "top"; }
        else if (Math.abs(T.y + T.h - P.y - P.h) < 0.05 && T.w >= P.w * 0.6 && T.h < P.h) { s = { x: s.x, y: P.y, w: s.w, h: P.h - T.h }; back = "bottom"; }
        else if (Math.abs(T.x - P.x) < 0.05 && T.h >= P.h * 0.6 && T.w < P.w) { s = { x: P.x + T.w, y: s.y, w: P.w - T.w, h: s.h }; back = "left"; }
        else if (Math.abs(T.x + T.w - P.x - P.w) < 0.05 && T.h >= P.h * 0.6 && T.w < P.w) { s = { x: P.x, y: s.y, w: P.w - T.w, h: s.h }; back = "right"; }
      });
      const horiz = s.w >= s.h, L = horiz ? s.w : s.h, arm = L > 5 ? 0.85 : 0;
      if (arm) deco.push(horiz ? rr(s.x, s.y, arm, s.h, 0.45, { fill: "url(#pfFab2)" }) + rr(s.x + s.w - arm, s.y, arm, s.h, 0.45, { fill: "url(#pfFab2)" }) : rr(s.x, s.y, s.w, arm, 0.45, { fill: "url(#pfFab2)" }) + rr(s.x, s.y + s.h - arm, s.w, arm, 0.45, { fill: "url(#pfFab2)" }));
      const inner = L - 2 * arm, n = Math.max(1, Math.round(inner / 6.2)), cl = inner / n;
      for (let k = 0; k < n; k++) {
        const c = horiz ? { x: s.x + arm + k * cl + 0.15, y: s.y + 0.2, w: cl - 0.3, h: s.h - 0.4 } : { x: s.x + 0.2, y: s.y + arm + k * cl + 0.15, w: s.w - 0.4, h: cl - 0.3 };
        deco.push(rr(c.x, c.y, c.w, c.h, 0.7, { fill: "url(#pfFab)", stroke: "var(--fab2)", "stroke-width": 0.14 }) + rr(c.x + 0.4, c.y + 0.4, c.w - 0.8, c.h - 0.8, 0.5, { fill: "none", stroke: "#fff", "stroke-opacity": 0.3, "stroke-width": 0.12, "stroke-dasharray": ".35 .3" }));
      }
      // deux coussins décoratifs contre le dossier
      if (back && L > 6) {
        const cols = ["#f2b33d", "#e98fa0"], sz = Math.min(2.4, (horiz ? s.h : s.w) * 0.45);
        [0, 1].forEach((k) => {
          const along = arm + 0.5 + sz / 2 + (k ? inner - sz - 1 : 0), cx = horiz ? s.x + along : back === "left" ? s.x + sz / 2 + 0.4 : s.x + s.w - sz / 2 - 0.4, cy = horiz ? (back === "top" ? s.y + sz / 2 + 0.4 : s.y + s.h - sz / 2 - 0.4) : s.y + along;
          deco.push(`<rect ${attrs({ x: cx - sz / 2, y: cy - sz / 2, width: sz, height: sz, rx: 0.5, fill: cols[k], stroke: "rgba(0,0,0,.25)", "stroke-width": 0.1, transform: `rotate(${k ? -14 : 12} ${n2(cx)} ${n2(cy)})` })}/>`);
        });
      }
    });
    return out.join("") + deco.join("");
  },
  bed(parts) {
    const m = biggest(parts), M = parts[m], mb = box(M), out = [], pil = parts.map((q, i) => [q, i]).filter(([q, i]) => i !== m && q[0] === "r");
    out.push(shape(M, m, { fill: "url(#pfBed)", stroke: "var(--fws)", "stroke-width": 0.35 }));
    // berceau : barreaux autour d'un matelas
    const crib = pil.length === 1 && (() => { const b = box(pil[0][0]); return b.w * b.h > mb.w * mb.h * 0.5; })();
    if (crib) {
      const b = box(pil[0][0]);
      out.push(rr(mb.x + 0.3, mb.y + 0.3, mb.w - 0.6, mb.h - 0.6, 0.3, { fill: "none", stroke: "var(--fws)", "stroke-width": 0.25, "stroke-dasharray": ".25 .45" }));
      out.push(shape(pil[0][0], pil[0][1], { fill: "url(#pfDuvet)", stroke: "#b9c4d6", "stroke-width": 0.15 }) + circ(b.x + b.w / 2, b.y + b.h * 0.35, Math.min(b.w, b.h) * 0.18, { fill: "#f6c177", stroke: "rgba(0,0,0,.2)", "stroke-width": 0.08 }));
      return out.join("");
    }
    // côté tête : là où sont les oreillers
    let hx = 0, hy = -1;
    if (pil.length) { const c = pil.reduce((a, [q]) => { const b = box(q); return [a[0] + b.x + b.w / 2, a[1] + b.y + b.h / 2]; }, [0, 0]).map((v) => v / pil.length); const dx = c[0] - (mb.x + mb.w / 2), dy = c[1] - (mb.y + mb.h / 2); if (Math.abs(dx) > Math.abs(dy)) { hx = Math.sign(dx); hy = 0; } else { hx = 0; hy = Math.sign(dy) || -1; } }
    const d = 0.6; // tête de lit
    out.push(hy ? rr(mb.x, hy < 0 ? mb.y : mb.y + mb.h - d, mb.w, d, 0.25, { fill: "url(#pfWood)", stroke: "var(--fws)", "stroke-width": 0.12 }) : rr(hx < 0 ? mb.x : mb.x + mb.w - d, mb.y, d, mb.h, 0.25, { fill: "url(#pfWood)", stroke: "var(--fws)", "stroke-width": 0.12 }));
    // couette sur les deux tiers côté pieds, avec drap retourné
    const k = 0.64;
    let du, band;
    if (hy) { const h = mb.h * k, y = hy < 0 ? mb.y + mb.h - h : mb.y; du = [mb.x + 0.25, y, mb.w - 0.5, h - 0.25 * (hy < 0 ? 1 : -1) * 0]; band = rr(mb.x + 0.25, hy < 0 ? y : y + h - 1.1, mb.w - 0.5, 1.1, 0.3, { fill: "#fffdf8", "fill-opacity": 0.92 }); }
    else { const w = mb.w * k, x = hx < 0 ? mb.x + mb.w - w : mb.x; du = [x, mb.y + 0.25, w, mb.h - 0.5]; band = rr(hx < 0 ? x : x + w - 1.1, mb.y + 0.25, 1.1, mb.h - 0.5, 0.3, { fill: "#fffdf8", "fill-opacity": 0.92 }); }
    out.push(rr(du[0], du[1], du[2], du[3] - (hy > 0 ? 0 : 0.25), 0.6, { fill: "url(#pfDuvet)", stroke: "rgba(0,0,0,.12)", "stroke-width": 0.12 }) + band);
    // pli de couette
    out.push(hy ? `<path d="M${n2(du[0] + du[2] * 0.15)} ${n2(du[1] + du[3] * 0.55)}q${n2(du[2] * 0.35)} ${n2(-du[3] * 0.08)} ${n2(du[2] * 0.7)} 0" fill="none" stroke="rgba(0,0,0,.14)" stroke-width=".14" stroke-linecap="round"/>` : `<path d="M${n2(du[0] + du[2] * 0.55)} ${n2(du[1] + du[3] * 0.15)}q${n2(-du[2] * 0.08)} ${n2(du[3] * 0.35)} 0 ${n2(du[3] * 0.7)}" fill="none" stroke="rgba(0,0,0,.14)" stroke-width=".14" stroke-linecap="round"/>`);
    pil.forEach(([q, i]) => { const b = box(q), h = b.w >= b.h; out.push(shape(q, i, { fill: "url(#pfPil)", stroke: "#cfc6b4", "stroke-width": 0.14 }) + (h ? line(b.x + b.w * 0.18, b.y + b.h / 2, b.x + b.w * 0.82, b.y + b.h / 2, { stroke: "#d9d1c2", "stroke-width": 0.1 }) : line(b.x + b.w / 2, b.y + b.h * 0.18, b.x + b.w / 2, b.y + b.h * 0.82, { stroke: "#d9d1c2", "stroke-width": 0.1 }))); });
    parts.forEach((q, i) => { if (q[0] !== "r" && i !== m) out.push(shape(q, i, { fill: "url(#pfPil)", stroke: "#cfc6b4", "stroke-width": 0.14 })); });
    return out.join("");
  },
  rug(parts) {
    return parts.map((q, i) => {
      if (q[0] === "l") return "";
      const b = box(q), fr = q[0] === "r" ? (() => { const h = b.w >= b.h, o = []; for (let t = 0.4; t < (h ? b.h : b.w) - 0.2; t += 0.55) o.push(h ? `M${n2(b.x)} ${n2(b.y + t)}h-.7M${n2(b.x + b.w)} ${n2(b.y + t)}h.7` : `M${n2(b.x + t)} ${n2(b.y)}v-.7M${n2(b.x + t)} ${n2(b.y + b.h)}v.7`); return `<path d="${o.join("")}" stroke="var(--rug1)" stroke-width=".12"/>`; })() : "";
      return fr + shape(q, i, { fill: "url(#pfRug)", stroke: "var(--rug1)", "stroke-width": 0.45 }) + scaled(q, 0.84, { fill: "none", stroke: "var(--rug1)", "stroke-width": 0.32, "stroke-dasharray": ".6 .35" }) + scaled(q, 0.36, { fill: "var(--rug1)", "fill-opacity": 0.55, stroke: "#fff", "stroke-opacity": 0.5, "stroke-width": 0.12 });
    }).join("");
  },
  plant(parts) {
    const p = biggest(parts), P = parts[p], b = box(P), cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = Math.min(b.w, b.h) / 2, out = [];
    parts.forEach((q, i) => out.push(i === p ? shape(q, i, { fill: "url(#pfPot)", stroke: "#8a5c3a", "stroke-width": 0.25 }) : shape(q, i, { fill: "#5a3d2b", stroke: "none" })));
    const lv = [];
    for (let k = 0; k < 7; k++) lv.push(leafPath(cx, cy, r * 1.25, r * 0.36, k * (360 / 7) + 10, k % 2 ? "url(#pfLeaf)" : "url(#pfLeafB)"));
    for (let k = 0; k < 5; k++) lv.push(leafPath(cx, cy, r * 0.85, r * 0.3, k * 72 + 46, "url(#pfLeafB)"));
    out.push(`<g class="lfg">${lv.join("")}${circ(cx, cy, r * 0.16, { fill: "var(--leaf2)" })}</g>`);
    return out.join("");
  },
  ceramic(parts) {
    return parts.map((q, i) => {
      if (q[0] === "l") return shape(q, i, { stroke: "var(--cers)", "stroke-width": 0.25 });
      const b = box(q), round = q[0] !== "r";
      return shape(q, i, { fill: "url(#pfCer)", stroke: "var(--cers)", "stroke-width": 0.3 }) + (round ? scaled(q, 0.64, { fill: "url(#pfWat)", stroke: "var(--cers)", "stroke-width": 0.12 }) + `<ellipse ${attrs({ cx: b.x + b.w * 0.36, cy: b.y + b.h * 0.3, rx: b.w * 0.1, ry: b.h * 0.07, fill: "#fff", "fill-opacity": 0.8 })}/>` : rr(b.x + 0.3, b.y + 0.3, b.w * 0.5, Math.min(0.5, b.h * 0.2), 0.2, { fill: "#fff", "fill-opacity": 0.6 }));
    }).join("");
  },
  bath(parts) {
    const o = biggest(parts), O = parts[o], ob = box(O), out = [shape(O, o, { fill: "url(#pfCer)", stroke: "var(--cers)", "stroke-width": 0.35 })];
    parts.forEach((q, i) => {
      if (i === o || q[0] === "l") return;
      const b = box(q), h = b.w >= b.h;
      out.push(shape(q, i, { fill: "url(#pfWat)", stroke: "var(--cers)", "stroke-width": 0.2 }));
      out.push(`<g class="rip" fill="none" stroke="#fff" stroke-width=".16" stroke-opacity=".7" stroke-linecap="round">${h ? `<path d="M${n2(b.x + b.w * 0.3)} ${n2(b.y + b.h * 0.4)}q${n2(b.w * 0.1)} ${n2(-b.h * 0.15)} ${n2(b.w * 0.2)} 0"/><path d="M${n2(b.x + b.w * 0.55)} ${n2(b.y + b.h * 0.65)}q${n2(b.w * 0.1)} ${n2(-b.h * 0.15)} ${n2(b.w * 0.2)} 0"/>` : `<path d="M${n2(b.x + b.w * 0.35)} ${n2(b.y + b.h * 0.3)}q${n2(b.w * 0.15)} ${n2(-b.h * 0.05)} ${n2(b.w * 0.3)} 0"/><path d="M${n2(b.x + b.w * 0.3)} ${n2(b.y + b.h * 0.6)}q${n2(b.w * 0.2)} ${n2(-b.h * 0.05)} ${n2(b.w * 0.4)} 0"/>`}</g>`);
    });
    // robinet et bonde aux deux bouts
    const h = ob.w >= ob.h;
    out.push(h ? circ(ob.x + 0.75, ob.y + ob.h / 2, 0.45, { fill: "url(#pfMet)", stroke: "#8a949c", "stroke-width": 0.1 }) + circ(ob.x + ob.w - 1.6, ob.y + ob.h / 2, 0.3, { fill: "#8a949c" }) : circ(ob.x + ob.w / 2, ob.y + 0.75, 0.45, { fill: "url(#pfMet)", stroke: "#8a949c", "stroke-width": 0.1 }) + circ(ob.x + ob.w / 2, ob.y + ob.h - 1.6, 0.3, { fill: "#8a949c" }));
    return out.join("");
  },
  shower(parts) {
    const o = biggest(parts), O = parts[o], b = box(O), out = [shape(O, o, { fill: "url(#pfTile)", stroke: "var(--cers)", "stroke-width": 0.35 })];
    // paroi vitrée sur le grand côté libre, siphon et pomme de douche
    out.push(line(b.x + 0.3, b.y + b.h - 0.3, b.x + b.w - 0.3, b.y + b.h - 0.3, { stroke: "#9fd3f0", "stroke-width": 0.45, "stroke-opacity": 0.85, "stroke-linecap": "round" }));
    const c = parts.find((q, i) => i !== o && q[0] === "c"), dx = c ? c[1] : b.x + b.w / 2, dy = c ? c[2] : b.y + b.h / 2;
    out.push(circ(dx, dy, 0.9, { fill: "url(#pfMet)", stroke: "#8a949c", "stroke-width": 0.12 }) + `<path d="M${n2(dx - 0.5)} ${n2(dy)}h1M${n2(dx)} ${n2(dy - 0.5)}v1" stroke="#6f7a85" stroke-width=".12"/>`);
    out.push(circ(b.x + 1.4, b.y + 1.4, 0.9, { fill: "#dfe5ea", stroke: "#8a949c", "stroke-width": 0.12 }) + [0, 1, 2, 3, 4, 5].map((k) => circ(b.x + 1.4 + Math.cos(k * 1.047) * 0.45, b.y + 1.4 + Math.sin(k * 1.047) * 0.45, 0.09, { fill: "#6f7a85" })).join(""));
    return out.join("");
  },
  counter(parts) {
    const o = biggest(parts), O = parts[o], out = [shape(O, o, { fill: "url(#pfStone)", stroke: "var(--fws)", "stroke-width": 0.35 })], ob = box(O);
    out.push(rr(ob.x + 0.25, ob.y + 0.25, ob.w - 0.5, ob.h - 0.5, 0.2, { fill: "none", stroke: "#fff", "stroke-opacity": 0.4, "stroke-width": 0.14 }));
    parts.forEach((q, i) => {
      if (i === o) return;
      const b = box(q);
      if (q[0] === "c") out.push(circ(q[1], q[2], q[3] + 0.25, { fill: "url(#pfGlass)", stroke: "none" }) + shape(q, i, { fill: "none", stroke: "#e5484d", "stroke-opacity": 0.55, "stroke-width": 0.18 }) + circ(q[1], q[2], q[3] * 0.55, { fill: "none", stroke: "#8a949c", "stroke-opacity": 0.6, "stroke-width": 0.1 }));
      else if (q[0] === "r") out.push(shape(q, i, { fill: "url(#pfMet)", stroke: "#8a949c", "stroke-width": 0.18 }) + rr(b.x + 0.35, b.y + 0.35, b.w - 0.7, b.h - 0.7, Math.min(0.8, (q[5] || 0) + 0.3), { fill: "#aeb8c1", stroke: "#8a949c", "stroke-width": 0.1 }) + circ(b.x + b.w / 2, b.y + b.h / 2, 0.22, { fill: "#6f7a85" }) + circ(b.x + b.w / 2, b.y - 0.35, 0.3, { fill: "url(#pfMet)", stroke: "#6f7a85", "stroke-width": 0.08 }));
      else out.push(shape(q, i, { stroke: "var(--fws)", "stroke-width": 0.25 }));
    });
    return out.join("");
  },
  app(parts) {
    const o = biggest(parts), O = parts[o], ob = box(O), out = [shape(O, o, { fill: "url(#pfApp)", stroke: "var(--apps)", "stroke-width": 0.3 })];
    const h = ob.w >= ob.h, strip = Math.min(1, Math.min(ob.w, ob.h) * 0.16);
    out.push(rr(ob.x + 0.2, ob.y + 0.2, ob.w - 0.4, strip, 0.2, { fill: "var(--apps)", "fill-opacity": 0.25 }) + circ(ob.x + 0.8, ob.y + 0.2 + strip / 2, strip * 0.28, { fill: "var(--apps)" }) + circ(ob.x + 1.6, ob.y + 0.2 + strip / 2, strip * 0.22, { fill: "#22c55e", "fill-opacity": 0.8 }));
    parts.forEach((q, i) => {
      if (i === o) return;
      if (q[0] === "c") out.push(shape(q, i, { fill: "#cfd6dc", stroke: "var(--apps)", "stroke-width": 0.2 }) + scaled(q, 0.74, { fill: "url(#pfGlass)" }) + `<path d="M${n2(q[1] - q[3] * 0.45)} ${n2(q[2] - q[3] * 0.1)}a${n2(q[3] * 0.5)} ${n2(q[3] * 0.5)} 0 0 1 ${n2(q[3] * 0.45)} ${n2(-q[3] * 0.38)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".14" stroke-linecap="round"/>`);
      else if (q[0] === "l") out.push(shape(q, i, { stroke: "var(--apps)", "stroke-width": 0.22 }) + rr(Math.min(q[1], q[3]) + 0.6, Math.min(q[2], q[4]) + 0.35, 0.35, 1.6, 0.15, { fill: "var(--apps)" }));
      else out.push(shape(q, i, { fill: "url(#pfApp)", stroke: "var(--apps)", "stroke-width": 0.2 }));
    });
    return out.join("");
  },
  metal(parts) {
    return parts.map((q, i) => {
      const b = box(q); if (q[0] === "l") return shape(q, i, { stroke: "var(--apps)", "stroke-width": 0.2 });
      const h = b.w >= b.h, L = h ? b.w : b.h, o = [];
      for (let t = 0.6; t < L - 0.3; t += 0.7) o.push(h ? `M${n2(b.x + t)} ${n2(b.y + 0.15)}v${n2(b.h - 0.3)}` : `M${n2(b.x + 0.15)} ${n2(b.y + t)}h${n2(b.w - 0.3)}`);
      return shape(q, i, { fill: "url(#pfMet)", stroke: "var(--apps)", "stroke-width": 0.2 }) + `<path d="${o.join("")}" stroke="var(--apps)" stroke-width=".1" stroke-opacity=".8"/>`;
    }).join("");
  },
  stove(parts) {
    const o = biggest(parts), O = parts[o], b = box(O), cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = Math.min(b.w, b.h) / 2, out = [shape(O, o, { fill: "url(#pfStove)", stroke: "#1c1f23", "stroke-width": 0.3 })];
    parts.forEach((q, i) => { if (i !== o) out.push(shape(q, i, { fill: "url(#pfFire)", stroke: "none", cls: "flame" })); });
    const f = r * 0.5;
    out.push(`<g class="flame"><path d="M${n2(cx)} ${n2(cy - f)}c${n2(f * 0.7)} ${n2(f * 0.6)} ${n2(f * 0.8)} ${n2(f * 1.2)} 0 ${n2(f * 1.7)}c${n2(-f * 0.8)} ${n2(-f * 0.5)} ${n2(-f * 0.7)} ${n2(-f * 1.1)} 0 ${n2(-f * 1.7)}z" fill="#ffd34d" fill-opacity=".9"/></g>`);
    out.push(circ(cx, cy, r * 0.94, { fill: "none", stroke: "#8a949c", "stroke-opacity": 0.4, "stroke-width": 0.12 }));
    return out.join("");
  },
  stool(parts) { return parts.map((q, i) => shape(q, i, { fill: "url(#pfWood)", stroke: "var(--fws)", "stroke-width": 0.25 }) + (q[0] === "l" ? "" : scaled(q, 0.68, { fill: "url(#pfFab)", stroke: "var(--fab2)", "stroke-width": 0.1 }) + scaled(q, 0.12, { fill: "var(--fab2)" }))).join(""); },
  garden(parts) {
    const t = biggest(parts), out = [];
    parts.forEach((q, i) => {
      if (i === t) { const b = box(q), h = b.w >= b.h, o = []; for (let k = 0.9; k < (h ? b.h : b.w) - 0.3; k += 0.9) o.push(h ? `M${n2(b.x + 0.2)} ${n2(b.y + k)}h${n2(b.w - 0.4)}` : `M${n2(b.x + k)} ${n2(b.y + 0.2)}v${n2(b.h - 0.4)}`); out.push(shape(q, i, { fill: "url(#pfTeak)", stroke: "#7d5d3a", "stroke-width": 0.3 }) + `<path d="${o.join("")}" stroke="#7d5d3a" stroke-width=".12" stroke-opacity=".7"/>`); }
      else if (q[0] === "l") out.push(shape(q, i, { stroke: "#7d5d3a", "stroke-width": 0.25 }));
      else out.push(shape(q, i, { fill: "url(#pfCush)", stroke: "#b8a98f", "stroke-width": 0.2 }) + scaled(q, 0.6, { fill: "none", stroke: "#b8a98f", "stroke-width": 0.1, "stroke-dasharray": ".3 .25" }));
    });
    return out.join("");
  },
  lamp(parts) {
    const o = biggest(parts), b = box(parts[o]), cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = Math.min(b.w, b.h) / 2;
    return circ(cx, cy, r * 1.75, { fill: "url(#pfGlow)", class: "glowl" }) + parts.map((q, i) => shape(q, i, i === o ? { fill: "url(#pfShade)", stroke: "#d9a400", "stroke-width": 0.2 } : { fill: "#fff6d0", stroke: "#d9a400", "stroke-width": 0.1 })).join("");
  },
  tv(parts) {
    return parts.map((q, i) => { const b = box(q); return shape(q, i, { fill: "url(#pfTv)", stroke: "#111", "stroke-width": 0.25 }) + (q[0] === "r" ? line(b.x + b.w * 0.15, b.y + b.h * 0.2, b.x + b.w * 0.45, b.y + b.h * 0.2, { stroke: "#fff", "stroke-opacity": 0.25, "stroke-width": Math.min(0.3, b.h * 0.2), "stroke-linecap": "round" }) + circ(b.x + b.w - 0.5, b.y + b.h / 2, 0.15, { fill: "#e5484d" }) : ""); }).join("");
  },
  parasol(parts) {
    const o = biggest(parts), b = box(parts[o]), cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = Math.min(b.w, b.h) / 2, n = 8, out = [];
    out.push(circ(cx + r * 0.12, cy + r * 0.12, r, { fill: "rgba(0,0,0,.12)" }));
    for (let k = 0; k < n; k++) { const a1 = (k / n) * 2 * Math.PI, a2 = ((k + 1) / n) * 2 * Math.PI; out.push(`<path d="M${n2(cx)} ${n2(cy)}L${n2(cx + r * Math.cos(a1))} ${n2(cy + r * Math.sin(a1))}A${n2(r)} ${n2(r)} 0 0 1 ${n2(cx + r * Math.cos(a2))} ${n2(cy + r * Math.sin(a2))}Z" fill="${k % 2 ? "#fff3e0" : "#f2a65a"}" stroke="#c97a2e" stroke-width=".14"/>`); }
    out.push(shape(parts[o], o, { fill: "none", stroke: "#c97a2e", "stroke-width": 0.3 }) + circ(cx, cy, r * 0.08, { fill: "#8a5c3a" }));
    return out.join("");
  },
  piano(parts) {
    const o = biggest(parts), out = [shape(parts[o], o, { fill: "url(#pfPiano)", stroke: "#111", "stroke-width": 0.25 })], ob = box(parts[o]);
    out.push(line(ob.x + ob.w * 0.1, ob.y + 0.5, ob.x + ob.w * 0.6, ob.y + 0.5, { stroke: "#fff", "stroke-opacity": 0.2, "stroke-width": 0.25, "stroke-linecap": "round" }));
    parts.forEach((q, i) => {
      if (i === o || q[0] !== "r") return;
      const b = box(q), h = b.w >= b.h, L = h ? b.w : b.h, D = h ? b.h : b.w, n = Math.max(7, Math.round(L / 0.75)), kw = L / n, keys = [];
      const toward = h ? (b.y + b.h / 2 > ob.y + ob.h / 2 ? -1 : 1) : (b.x + b.w / 2 > ob.x + ob.w / 2 ? -1 : 1); // les touches noires partent du côté du corps
      for (let k = 1; k < n; k++) keys.push(h ? `M${n2(b.x + k * kw)} ${n2(b.y)}v${n2(b.h)}` : `M${n2(b.x)} ${n2(b.y + k * kw)}h${n2(b.w)}`);
      out.push(shape(q, i, { fill: "#fdfdfd", stroke: "#999", "stroke-width": 0.12 }) + `<path d="${keys.join("")}" stroke="#bbb" stroke-width=".06"/>`);
      for (let k = 0; k < n - 1; k++) { if (![0, 1, 3, 4, 5].includes(k % 7)) continue; const p = (k + 1) * kw - kw * 0.3, bl = D * 0.6, s = toward < 0 ? 0 : D - bl; out.push(h ? rr(b.x + p, b.y + (toward < 0 ? 0 : D - bl), kw * 0.6, bl, 0.05, { fill: "#1c1f23" }) : rr(b.x + s, b.y + p, bl, kw * 0.6, 0.05, { fill: "#1c1f23" })); }
    });
    return out.join("");
  },
};

/** Rendu SVG d'un meuble (à placer dans un groupe déjà translaté et tourné). */
export function furnSvg(parts, st) {
  const f = ART[st] || ART.wood;
  try { return `<g class="fa">${f(parts)}</g>`; } catch (e) { return `<g class="fa">${ART.wood(parts)}</g>`; }
}

/** Dégradés et motifs utilisés par le mobilier (à mettre dans <defs>). */
export const FURN_DEFS = `
<linearGradient id="pfWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--fw) 80%,#fff)"/><stop offset=".6" style="stop-color:var(--fw)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--fw) 82%,#000)"/></linearGradient>
<radialGradient id="pfFab" cx=".35" cy=".3" r=".9"><stop offset="0" style="stop-color:color-mix(in srgb,var(--fab) 70%,#fff)"/><stop offset="1" style="stop-color:var(--fab)"/></radialGradient>
<linearGradient id="pfFab2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--fab2) 85%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--fab2) 85%,#000)"/></linearGradient>
<linearGradient id="pfBed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--bed) 70%,#fff)"/><stop offset="1" style="stop-color:var(--bed)"/></linearGradient>
<linearGradient id="pfDuvet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--duv) 70%,#fff)"/><stop offset="1" style="stop-color:var(--duv)"/></linearGradient>
<radialGradient id="pfPil" cx=".4" cy=".35" r=".8"><stop offset="0" style="stop-color:#fff"/><stop offset="1" style="stop-color:var(--pil)"/></radialGradient>
<radialGradient id="pfCer" cx=".3" cy=".25" r=".95"><stop offset="0" style="stop-color:#fff"/><stop offset=".7" style="stop-color:var(--cer)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--cers) 40%,var(--cer))"/></radialGradient>
<radialGradient id="pfWat" cx=".4" cy=".35" r=".85"><stop offset="0" style="stop-color:color-mix(in srgb,var(--wat) 45%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--wat) 80%,#2f8ce0)"/></radialGradient>
<linearGradient id="pfMet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:#eef2f5"/><stop offset=".45" style="stop-color:var(--met)"/><stop offset=".7" style="stop-color:#b5bec6"/><stop offset="1" style="stop-color:var(--met)"/></linearGradient>
<linearGradient id="pfApp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:#fff"/><stop offset="1" style="stop-color:var(--app)"/></linearGradient>
<radialGradient id="pfGlass" cx=".35" cy=".3" r=".9"><stop offset="0" style="stop-color:#6b7d90"/><stop offset="1" style="stop-color:#1c2530"/></radialGradient>
<radialGradient id="pfGlow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
<radialGradient id="pfShade" cx=".45" cy=".4"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#ffd36b"/></radialGradient>
<radialGradient id="pfFire"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#ff8a1a"/><stop offset="1" stop-color="#c2410c"/></radialGradient>
<radialGradient id="pfStove" cx=".4" cy=".35"><stop offset="0" style="stop-color:#5f666e"/><stop offset="1" style="stop-color:var(--stv)"/></radialGradient>
<radialGradient id="pfPot" cx=".4" cy=".35"><stop offset="0" stop-color="#e6ad82"/><stop offset=".7" stop-color="#c0875c"/><stop offset="1" stop-color="#8a5c3a"/></radialGradient>
<linearGradient id="pfLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--leaf) 75%,#fff)"/><stop offset="1" style="stop-color:var(--leaf)"/></linearGradient>
<linearGradient id="pfLeafB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--leaf)"/><stop offset="1" style="stop-color:var(--leaf2)"/></linearGradient>
<linearGradient id="pfTeak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--teak) 80%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--teak) 85%,#000)"/></linearGradient>
<radialGradient id="pfCush" cx=".4" cy=".35"><stop offset="0" style="stop-color:#fff"/><stop offset="1" style="stop-color:var(--cush)"/></radialGradient>
<linearGradient id="pfTv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4048"/><stop offset="1" stop-color="#15181c"/></linearGradient>
<linearGradient id="pfPiano" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#40464e"/><stop offset="1" stop-color="#0e1013"/></linearGradient>
<pattern id="pfTile" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" style="fill:color-mix(in srgb,var(--wat) 40%,var(--cer))"/><path d="M3 0H0V3" fill="none" style="stroke:var(--cers)" stroke-width=".12"/></pattern>
<pattern id="pfStone" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" style="fill:var(--cnt)"/><circle cx=".7" cy=".9" r=".14" fill="#9a8f7c" fill-opacity=".5"/><circle cx="2.6" cy="1.7" r=".1" fill="#9a8f7c" fill-opacity=".45"/><circle cx="1.6" cy="3.1" r=".12" fill="#fff" fill-opacity=".6"/><circle cx="3.4" cy="3.4" r=".09" fill="#9a8f7c" fill-opacity=".5"/></pattern>
<pattern id="pfRug" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.4" height="2.4" style="fill:var(--rug2)"/><rect width="1.2" height="2.4" style="fill:color-mix(in srgb,var(--rug1) 55%,var(--rug2))"/><circle cx="1.8" cy="1.2" r=".25" style="fill:var(--rug1)"/></pattern>
`;

export const FURN_CSS = `
:host{--duv:#dce7f7}:host(.dark){--duv:#4b5a70}
.fa .fp,.fa .fpl{transition:stroke .2s}
.piece.sel .fp,.piece.sel .fpl{stroke:var(--sel)!important;stroke-width:.7!important}
.m-furn .piece:hover .fp{stroke:var(--sel)}
.fa .lfg{transform-box:fill-box;transform-origin:center;animation:pmleaf 7s ease-in-out infinite}
.fa .rip{animation:pmrip 3.2s ease-in-out infinite}
.fa .flame{transform-box:fill-box;transform-origin:50% 70%;animation:pmflame 1.1s ease-in-out infinite alternate}
.fa .glowl{animation:pmglowl 4s ease-in-out infinite}
@keyframes pmleaf{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes pmrip{0%,100%{opacity:.25}50%{opacity:.9}}
@keyframes pmflame{from{transform:scale(1)}to{transform:scale(.88,1.08)}}
@keyframes pmglowl{0%,100%{opacity:.9}50%{opacity:.6}}
@media (prefers-reduced-motion:reduce){.fa *{animation:none!important}}
`;
