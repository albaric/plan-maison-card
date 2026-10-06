// Éditeur visuel de la carte : dessiner le plan, placer équipements et meubles, régler le bandeau.
// Home Assistant l'affiche dans la fenêtre « Modifier la carte » ; chaque modification émet « config-changed ».
import { ICONS, ACCENT, guess } from "./icons.js";
import { CAT, FSTYLE } from "./furniture.js";
import { BASE_CSS, ICON_CSS } from "./styles.js";
import { furnSvg, FURN_DEFS } from "./furnart.js";
import * as G from "./geometry.js";
import { createPicker, PICKER_CSS, DEVICE_DOMAINS, friendly } from "./picker.js";

const M = 10;
const NS = "http://www.w3.org/2000/svg";
const m2 = (v) => Math.round(v * 10) / 100; // décimètres → mètres, au centimètre
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fr = (n, d = 2) => (Math.round(n * 10 ** d) / 10 ** d).toString().replace(".", ",");
const clone = (o) => JSON.parse(JSON.stringify(o));
const clean = (o) => { Object.keys(o).forEach((k) => (o[k] === undefined || o[k] === null || o[k] === "") && delete o[k]); return o; };
export const slug = (s) => String(s || "plan").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const KINDS = [["jour", "Pièce de vie"], ["nuit", "Chambre"], ["eau", "Pièce d'eau"], ["service", "Bureau, cellier"], ["circ", "Couloir, entrée"], ["todo", "À préciser"]];
const ZTYPES = [["deck", "Terrasse, pergola"], ["shed", "Abri, garage"], ["patch", "Massif, potager"], ["pool", "Piscine, bassin"], ["gravel", "Allée, gravier"]];
const OTYPES = [["door", "Porte"], ["window", "Fenêtre"], ["open", "Ouverture sans mur"], ["passage", "Passage"]];
const OW = { door: 9, window: 12, open: 10, passage: 9 };
const SWING = [["", "Sans arc"], ["up", "S'ouvre vers le haut"], ["down", "S'ouvre vers le bas"], ["left", "S'ouvre vers la gauche"], ["right", "S'ouvre vers la droite"]];
const DKIND = [["", "Automatique"], ["toggle", "Bascule au clic"], ["info", "Ouvre la fiche"], ["value", "Affiche la valeur"]];
const TOOLS = [
  ["select", "Sélection", "M5 3l13 8-6 1.5L9 19z"],
  ["room", "Pièce", "M4 4h16v16H4z"],
  ["poly", "Forme libre", "M4 4h9v6h7v10H4z"],
  ["door", "Porte", "M5 20V4h10v16M5 20h14M13 12h.01"],
  ["window", "Fenêtre", "M4 6h16v12H4zM12 6v12M4 12h16"],
  ["open", "Ouverture", "M3 12h5M16 12h5M8 9v6M16 9v6"],
  ["zone", "Extérieur", "M3 17l5-9 4 6 3-4 6 7z"],
  ["garland", "Guirlande", "M2 7q5 7 10 0t10 0M7 10.5v2M12 7v2M17 10.5v2"],
];
const HINT = {
  select: "Touche une pièce pour la modifier : glisse-la, glisse ses coins (ronds) ou ses murs. Le « + » au milieu d'un mur ajoute un coin : tire-le pour changer la forme. Molette : zoom ; glisser le fond : déplacer la vue.",
  room: "Fais glisser sur le plan pour dessiner une pièce rectangulaire. Les bords s'aimantent aux murs existants.",
  poly: "Clique pour poser chaque coin de la pièce, puis clique sur le premier coin (ou double-clic) pour la fermer. Les traits s'alignent à l'horizontale et à la verticale. Échap pour annuler.",
  garland: "Clique pour poser les points d'accroche de la guirlande (zigzag, ligne droite…), puis double-clique ou appuie sur Entrée pour terminer. Choisis ensuite l'interrupteur qui l'allume.",
  door: "Touche un mur pour y poser une porte.",
  window: "Touche un mur pour y poser une fenêtre.",
  open: "Touche un mur pour l'ouvrir (pièces communicantes sans cloison).",
  zone: "Fais glisser pour dessiner un espace extérieur : terrasse, abri, piscine, potager…",
};

const CSS = `
:host{display:block}
.ed{display:flex;flex-direction:column;gap:10px;font-family:var(--f-body);color:var(--ink);font-size:14px}
.tabs{display:flex;border-bottom:1px solid var(--line);gap:2px;flex-wrap:wrap}
.tabs button{font:inherit;font-size:14px;border:0;background:none;color:var(--ink-2);padding:8px 12px;border-bottom:2px solid transparent;cursor:pointer}
.tabs button.on{color:var(--ink);border-bottom-color:var(--sel);font-weight:600}
.note[hidden],section[hidden]{display:none!important}
.note{background:var(--sel-soft);border:1px solid var(--sel);padding:9px 11px;font-size:13px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.note.err{background:var(--na-soft);border-color:var(--na);color:var(--na)}
.tools{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.tool{font:inherit;font-size:12.5px;display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:5px 9px;cursor:pointer;border-radius:6px}
.tool svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linejoin:round;stroke-linecap:round}
.tool.on{background:var(--ink);color:var(--surface);border-color:var(--ink)}
.tool:disabled{opacity:.4;cursor:default}
.hint{font-size:12.5px;color:var(--ink-2);min-height:2.4em;padding:0 2px}
.cv{border:1px solid var(--line);background:var(--paper);position:relative;border-radius:6px;overflow:hidden}
.cv svg{display:block;width:100%;height:auto;max-height:68vh;touch-action:none;user-select:none;-webkit-user-select:none}
.cv.t-room svg,.cv.t-zone svg,.cv.t-poly svg,.cv.t-garland svg{cursor:crosshair}.cv.t-door svg,.cv.t-window svg,.cv.t-open svg{cursor:copy}
.layers{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:13px}
.layers label{display:inline-flex;gap:5px;align-items:center;cursor:pointer}
.props{border:1px solid var(--line);background:var(--surface);padding:11px 12px;display:flex;flex-direction:column;gap:9px;border-radius:6px}
.props h4{margin:0;font-family:var(--f-display);font-weight:600;font-size:15px;letter-spacing:.06em;text-transform:uppercase}
.props .s{font-size:12.5px;color:var(--ink-2)}
.f2{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.fld{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--ink-2);min-width:0}
.fld input,.fld select,.row-e input,.row-e select{font:inherit;font-size:13.5px;color:var(--ink);background:var(--paper);border:1px solid var(--line);padding:5px 7px;border-radius:5px;min-width:0;width:100%;box-sizing:border-box}
.fld input[type=checkbox]{width:auto}
.chk2{display:flex;gap:6px;align-items:center;font-size:13px;color:var(--ink)}
.btns{display:flex;flex-wrap:wrap;gap:6px}
.btn{font:inherit;font-size:13px;background:var(--surface);color:var(--ink);border:1px solid var(--line);padding:5px 10px;cursor:pointer;border-radius:5px}
.btn:hover{border-color:var(--ink-2)}.btn.solid{background:var(--ink);color:var(--surface);border-color:var(--ink)}.btn.danger{color:var(--na);border-color:var(--na)}
.list{display:flex;flex-direction:column;gap:6px}
.row-e{display:grid;grid-template-columns:30px minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) auto;gap:6px;align-items:center;border:1px solid var(--line);background:var(--surface);padding:6px;border-radius:6px}
.row-e .ic{width:28px;height:28px;display:grid;place-items:center}.row-e .ic .ico{width:24px;height:24px;overflow:visible}
.row-b{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) auto}
.mini{font:inherit;font-size:12px;border:1px solid var(--line);background:var(--paper);color:var(--ink);padding:3px 7px;border-radius:5px;cursor:pointer}
.mini.danger{color:var(--na)}
.add .epk{flex:1;min-width:200px}
.add{display:flex;gap:6px;flex-wrap:wrap}.add input{flex:1;min-width:180px;font:inherit;font-size:13.5px;padding:5px 7px;border:1px solid var(--line);border-radius:5px;background:var(--paper);color:var(--ink)}
.muted{color:var(--ink-2);font-size:12.5px;margin:0}
.tile .f2{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}.tile .th{display:flex;align-items:baseline;gap:10px}.tile .th b{font-size:14.5px}.tile .tv{font-family:var(--f-mono);color:var(--ink-2);font-size:13px}.tile .th .btns{margin-left:auto}.mini:disabled{opacity:.35;cursor:default}
svg .grid{fill:url(#eg)}svg .g1{stroke:var(--line);stroke-width:.25}svg .g5{stroke:var(--ink-2);stroke-width:.3;opacity:.5}
svg .ax{stroke:var(--ink-2);stroke-width:.35;opacity:.5}
svg .room{cursor:pointer;stroke:none}svg .room.sel{fill:var(--sel-soft)}
svg .rlab{font-family:var(--f-display);font-weight:600;letter-spacing:.06em;text-transform:uppercase;fill:var(--ink);pointer-events:none}
svg .rar{font-family:var(--f-mono);fill:var(--ink-2);pointer-events:none}
svg .zn{cursor:pointer;stroke:var(--deck-line);stroke-width:.5}svg .zn.sel{stroke:var(--sel);stroke-width:1}
svg .z-deck{fill:var(--deck)}svg .z-shed{fill:var(--furn-fill);stroke:var(--ink)}svg .z-patch{fill:#cfe6b8}svg .z-pool{fill:#9fd6ef;stroke:#5ba7cc}svg .z-gravel{fill:#e6e0d4}
:host(.dark) svg .z-patch{fill:#35502f}:host(.dark) svg .z-pool{fill:#2f5f78}:host(.dark) svg .z-gravel{fill:#3a372f}
svg .zlab{font-family:var(--f-display);font-weight:600;letter-spacing:.06em;text-transform:uppercase;fill:var(--ink-2);pointer-events:none}
svg .ophit{fill:transparent;stroke:transparent;cursor:pointer}svg .op-sel{stroke:var(--sel);stroke-width:1.2;fill:none;pointer-events:none}
svg .vtx{fill:var(--surface);stroke:var(--sel);stroke-width:.6;cursor:move}
svg .edg{fill:var(--sel);stroke:var(--surface);stroke-width:.4;cursor:move}
svg .edghit{stroke:transparent;stroke-width:3;cursor:move}svg .edghit:hover{stroke:var(--sel);stroke-opacity:.35}
svg .addpt circle{fill:var(--surface);stroke:var(--sel);stroke-width:.5}svg .addpt path{stroke:var(--sel);stroke-width:.55;stroke-linecap:round}svg .addpt{cursor:copy}svg .addpt:hover circle{fill:var(--sel-soft)}
svg .vtx.on{fill:var(--sel)}
svg .gcab{fill:none;stroke:var(--ink-2);stroke-width:.3;pointer-events:none}svg .ghit{fill:none;stroke:transparent;stroke-width:3.2;cursor:move;pointer-events:stroke}svg .ghit.sel,svg .ghit:hover{stroke:var(--sel);stroke-opacity:.3}svg .gnew{fill:none;stroke:var(--sel);stroke-width:.6;stroke-dasharray:1.4 1;pointer-events:none}svg .pline{fill:var(--sel-soft);fill-opacity:.5;stroke:var(--sel);stroke-width:.7;pointer-events:none}svg .pdot{fill:var(--sel);pointer-events:none}svg .pfirst{fill:var(--surface);stroke:var(--sel);stroke-width:.6;pointer-events:none}
svg .zc{fill:var(--sel);stroke:var(--surface);stroke-width:.4;cursor:nwse-resize}
svg .ghost{fill:var(--sel-soft);stroke:var(--sel);stroke-width:.6;stroke-dasharray:1.5 1;pointer-events:none}
svg .dim{font-family:var(--f-mono);fill:var(--sel);pointer-events:none}
svg .dimbg{fill:var(--surface);opacity:.85;pointer-events:none}
svg .dv circle{fill:var(--surface);stroke:var(--ink-2);stroke-width:.4}svg .dv{cursor:move}svg .dv.sel circle{stroke:var(--sel);stroke-width:.9}
svg .dv .ico{overflow:visible}
svg .piece{cursor:move;filter:none}svg .piece.sel .f{stroke:var(--sel);stroke-width:.7}
svg .empty{font-family:var(--f-body);fill:var(--ink-2);pointer-events:none}
svg .wall{pointer-events:none}svg .wext{pointer-events:none}
`;

class PlanMaisonCardEditor extends HTMLElement {
  constructor() {
    super();
    this._tab = "plan"; this._tool = "select"; this._sel = null; this._undo = []; this._showDev = true; this._showFurn = true;
  }
  set hass(h) {
    const first = !this._hass; this._hass = h;
    this.classList.toggle("dark", !!(h.themes && h.themes.darkMode));
    if (first && this._cfg) { this._render(); this._checkLayout(); }
  }
  setConfig(c) {
    const s = JSON.stringify(c);
    if (s === this._emitted) return; // notre propre modification qui revient
    this._cfg = clone(c || {}); this._emitted = s;
    this._load();
    if (!this.shadowRoot) this._setup();
    this._fit(); this._render();
    if (this._hass) this._checkLayout();
  }

  /* ---------- lecture de la configuration ---------- */
  _load(AXover) {
    const c = this._cfg; this._err = null;
    const S = { rooms: [], openings: [], zones: [], devices: [], furniture: [], garlands: [] };
    let model = null;
    try { model = G.buildModel(Object.assign({}, c, { rooms: c.rooms || [] })); } catch (e) { this._err = e.message; }
    if (model) {
      const AX = Object.fromEntries(Object.entries(model.axes).map(([k, a]) => [k, AXover && AXover[k] != null ? AXover[k] : a.def]));
      this._named = !model.auto && Object.keys(model.axes).length > 0;
      S.rooms = model.rooms.map((r, i) => ({ id: r.id, name: r.name, kind: r.kind, area: r.area, pts: r.pts.map((p) => G.ptVal(p, AX)), raw: (c.rooms || [])[i] || {} }));
      S.openings = model.openings.map((o, i) => ({ type: o.type, a: G.ptVal(o.a, AX), b: G.ptVal(o.b, AX), swing: o.swing, label: o.label, dashed: o.dashed, raw: (c.openings || [])[i] || {} }));
      S.zones = model.zones.map((z, i) => ({ ...z, rect: z.rect.slice(), raw: (c.zones || [])[i] || {} }));
      S.devices = model.devices.map((d, i) => ({ id: d.id, entity: d.entity, pos: d.pos, raw: clone((c.devices || [])[i] || {}) }));
      S.furniture = model.furniture.map((f, i) => ({ ...f, raw: clone((c.furniture || [])[i] || {}) }));
      S.garlands = model.garlands.map((g, i) => ({ entity: g.entity || "", name: g.name, pts: g.pts.map((q) => q.slice()), sag: g.sag, style: g.colors.length === 1 ? "warm" : "multi", raw: clone((c.garlands || [])[i] || {}) }));
    }
    this._S = S; this._geoDirty = false; this._zonesDirty = false; this._garDirty = false;
  }

  /* ---------- écriture de la configuration ---------- */
  _emit() {
    const c = clone(this._cfg), S = this._S, pt = (p) => [m2(p[0]), m2(p[1])];
    if (this._geoDirty) {
      delete c.axes; delete c.auto_axes;
      c.rooms = S.rooms.map((r) => {
        const o = clean({ id: r.id, name: r.name, kind: r.kind, area: r.area ?? undefined, label_size: r.raw.label_size });
        const rc = rectOf(r.pts);
        if (rc) o.rect = rc.map(m2); else o.points = r.pts.map(pt);
        return o;
      });
      c.openings = S.openings.map((o) => clean({ type: o.type, from: pt(o.a), to: pt(o.b), swing: o.swing || undefined, label: o.label || undefined, dashed: o.type === "open" && o.dashed === false ? false : undefined }));
      if (!c.openings.length) delete c.openings;
    } else if (c.rooms) {
      c.rooms = c.rooms.map((r, i) => { const s = S.rooms[i]; if (!s) return r; const o = { ...r, name: s.name, kind: s.kind }; if (s.area != null) o.area = s.area; else delete o.area; return o; });
    }
    if (this._garDirty) {
      c.garlands = S.garlands.map((g) => {
        const o = { ...g.raw, entity: g.entity || undefined, name: g.name || undefined, points: g.pts.map(pt), sag: m2(g.sag) };
        if (g.style === "warm") { o.style = "warm"; delete o.colors; } else { delete o.style; if (!Array.isArray(o.colors) || o.colors.length < 2) delete o.colors; }
        if (g.restyled) { delete o.spacing; delete o.size; }
        return clean(o);
      });
      if (!c.garlands.length) delete c.garlands;
    }
    if (this._zonesDirty) {
      c.zones = S.zones.map((z) => clean({ id: z.id, name: z.name, type: z.type, rect: z.rect.map(m2), pattern: z.type === "deck" ? z.pattern : undefined, posts: z.posts || undefined, show_size: z.size || undefined }));
      if (!c.zones.length) delete c.zones;
    }
    c.devices = S.devices.map((d) => { const o = { ...d.raw, entity: d.entity }; if (d.id !== d.entity) o.id = d.id; else delete o.id; if (d.pos) { o.x = m2(d.pos[0]); o.y = m2(d.pos[1]); } else { delete o.x; delete o.y; } return clean(o); });
    if (!c.devices.length) delete c.devices;
    c.furniture = S.furniture.map((f) => { const o = { ...f.raw }; o.x = m2(f.x); o.y = m2(f.y); if (f.rot) o.rot = f.rot; else delete o.rot; if (!o.type && !o.parts && f.type) o.type = f.type; return clean(o); });
    if (!c.furniture.length) delete c.furniture;
    if (!c.rooms) c.rooms = [];
    this._cfg = c; this._emitted = JSON.stringify(c);
    // Home Assistant gèle (Object.freeze) la config reçue : on lui passe une copie pour garder la nôtre modifiable
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: clone(c) }, bubbles: true, composed: true }));
  }
  _push() { this._undo.push(JSON.stringify({ cfg: this._cfg, S: this._S, g: this._geoDirty, z: this._zonesDirty, l: this._garDirty })); if (this._undo.length > 60) this._undo.shift(); }
  _back() {
    const u = this._undo.pop(); if (!u) return;
    const o = JSON.parse(u); this._cfg = o.cfg; this._S = o.S; this._geoDirty = o.g; this._zonesDirty = o.z; this._garDirty = !!o.l; this._sel = null;
    this._emit(); this._render();
  }
  /** Applique une modification : mémorise l'état précédent, émet la config et redessine. */
  _change(fn, opts = {}) {
    if (!opts.noUndo) this._push();
    fn();
    if (opts.geo) this._geoDirty = true;
    if (opts.zone) this._zonesDirty = true;
    if (opts.gar) this._garDirty = true;
    this._emit(); this._render(opts.keepProps);
    // garde le clavier sur l'éditeur (R, Suppr, Ctrl+Z) sauf si un champ vient de prendre la main
    const a = this.shadowRoot && this.shadowRoot.activeElement;
    if (this._tab === "plan" && (!a || !["INPUT", "SELECT", "TEXTAREA"].includes(a.tagName))) this.focus({ preventScroll: true });
  }

  /* ---------- squelette ---------- */
  _setup() {
    const r = this.attachShadow({ mode: "open" });
    r.innerHTML = `<style>${BASE_CSS}${ICON_CSS}${CSS}${PICKER_CSS}</style><div class="ed">
      <div class="tabs" id="tabs"><button data-t="plan">Plan</button><button data-t="dev">Équipements</button><button data-t="ban">Bandeau</button><button data-t="set">Réglages</button></div>
      <div id="note" class="note" hidden></div>
      <section id="p-plan">
        <div class="tools" id="tools">${TOOLS.map(([k, l, d]) => `<button class="tool" data-tool="${k}" title="${l}"><svg viewBox="0 0 24 24"><path d="${d}"/></svg>${l}</button>`).join("")}
          <span style="flex:1"></span><button class="tool" id="undo" title="Annuler (Ctrl+Z)"><svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2"/></svg>Annuler</button><button class="tool" id="fit" title="Recadrer le plan"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>Recadrer</button></div>
        <div class="hint" id="hint"></div>
        <div class="cv" id="cv"><svg id="svg"></svg></div>
        <div class="layers"><label><input type="checkbox" id="l-dev" checked> Équipements</label><label><input type="checkbox" id="l-furn" checked> Mobilier</label><span style="flex:1"></span><button class="btn" id="add-furn">Ajouter un meuble…</button><button class="btn danger" id="clear">Tout effacer</button></div>
        <div class="props" id="props"></div>
      </section>
      <section id="p-dev" hidden></section>
      <section id="p-ban" hidden></section>
      <section id="p-set" hidden></section>
    </div>`;
    const $ = (id) => r.getElementById(id); this.$ = $; this._svg = $("svg");
    $("tabs").onclick = (e) => { const b = e.target.closest("button"); if (b) { this._tab = b.dataset.t; this._render(); } };
    $("tools").onclick = (e) => { const b = e.target.closest("[data-tool]"); if (b) { this._tool = b.dataset.tool; this._poly = null; this._polyHover = null; if (this._tool !== "select") this._sel = null; this._render(); } };
    $("undo").onclick = () => this._back();
    $("fit").onclick = () => { this._fit(); this._drawPlan(); };
    $("l-dev").onchange = (e) => { this._showDev = e.target.checked; this._drawPlan(); };
    $("l-furn").onchange = (e) => { this._showFurn = e.target.checked; this._drawPlan(); };
    $("add-furn").onclick = () => { const s = this._sel; this._prevRoomCenter = s && s.k === "room" && this._S.rooms[s.i] ? G.labelPoint(this._S.rooms[s.i].pts).slice(0, 2) : null; this._sel = { k: "lib" }; this._props(); };
    $("clear").onclick = (e) => this._confirm(e.currentTarget, () => this._change(() => { this._S.rooms = []; this._S.openings = []; this._S.zones = []; this._S.furniture = []; this._sel = null; }, { geo: true, zone: true }));
    this._svg.addEventListener("pointerdown", (e) => this._down(e));
    this._svg.addEventListener("pointermove", (e) => this._move(e));
    this._svg.addEventListener("pointerup", (e) => this._up(e));
    this._svg.addEventListener("pointercancel", () => { this._drag = null; this._drawPlan(); });
    this._svg.addEventListener("dblclick", (e) => this._dbl(e));
    this._svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const f = e.deltaY > 0 ? 1.15 : 1 / 1.15, V = this._vb, nw = Math.max(30, Math.min(2000, V[2] * f)), k = nw / V[2], [px, py] = this._pt(e);
      this._vb = [px - (px - V[0]) * k, py - (py - V[1]) * k, nw, V[3] * k]; this._drawPlan();
    }, { passive: false });
    this.addEventListener("keydown", (e) => this._key(e));
    this.tabIndex = 0;
  }
  _confirm(btn, fn) {
    if (btn.dataset.arm !== "1") { btn.dataset.arm = "1"; const t = btn.textContent; btn.dataset.t = t; btn.textContent = "Confirmer ?"; setTimeout(() => { if (btn.dataset.arm === "1") { btn.dataset.arm = ""; btn.textContent = t; } }, 3000); return; }
    btn.dataset.arm = ""; btn.textContent = btn.dataset.t; fn();
  }

  /* ---------- rendu général ---------- */
  _render(keepProps) {
    if (!this.shadowRoot) return;
    const $ = this.$;
    $("tabs").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.t === this._tab));
    ["plan", "dev", "ban", "set"].forEach((t) => ($("p-" + t).hidden = t !== this._tab));
    this._noteRender();
    if (this._tab === "plan") {
      $("tools").querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === this._tool));
      $("undo").disabled = !this._undo.length;
      $("hint").textContent = HINT[this._tool];
      $("cv").className = "cv t-" + this._tool;
      this._drawPlan(); if (!keepProps) this._props();
    } else if (this._tab === "dev") this._devTab();
    else if (this._tab === "ban") this._banTab();
    else this._setTab();
  }
  _noteRender() {
    const n = this.$("note");
    if (this._err) { n.className = "note err"; n.hidden = false; n.textContent = "Configuration illisible : " + this._err; return; }
    if (this._layout) {
      n.className = "note"; n.hidden = false;
      n.innerHTML = `<span>Des réglages faits directement sur le plan (cloisons, positions, icônes, meubles) sont enregistrés pour ton compte et ne figurent pas encore dans la configuration.</span><button class="btn solid" id="absorb">Les intégrer ici</button>`;
      n.querySelector("#absorb").onclick = () => this._absorb();
      return;
    }
    if (this._named && !this._geoDirty) {
      n.className = "note"; n.hidden = false;
      n.textContent = "Ce plan utilise des cloisons nommées. Les modifier ici les convertit en cotes simples ; le mode Murs de la carte continue de fonctionner.";
      return;
    }
    n.hidden = true;
  }

  /* ---------- cadrage ---------- */
  _bounds() {
    const pts = [], S = this._S;
    S.rooms.forEach((r) => pts.push(...r.pts));
    S.zones.forEach((z) => pts.push([z.rect[0], z.rect[1]], [z.rect[2], z.rect[3]]));
    S.devices.forEach((d) => d.pos && pts.push(d.pos));
    S.furniture.forEach((f) => pts.push([f.x, f.y]));
    (S.garlands || []).forEach((g) => pts.push(...g.pts));
    return pts.length ? G.bboxPts(pts) : null;
  }
  _fit() {
    const b = this._bounds();
    if (!b) { this._vb = [-20, -20, 160, 110]; return; }
    const pad = 32; let x = b.x - pad, y = b.y - pad, w = b.X - b.x + 2 * pad, h = b.Y - b.y + 2 * pad;
    if (w < 120) { x -= (120 - w) / 2; w = 120; } if (h < 80) { y -= (80 - h) / 2; h = 80; }
    if (h > w * 1.1) { x -= (h / 1.1 - w) / 2; w = h / 1.1; }
    this._vb = [x, y, w, h].map((v) => Math.round(v));
  }
  _pt(e) { const p = this._svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(this._svg.getScreenCTM().inverse()); return [q.x, q.y]; }

  /* ---------- aimantation ---------- */
  _magnets(skip) {
    const xs = [], ys = [];
    this._S.rooms.forEach((r, ri) => r.pts.forEach((p, vi) => { if (skip && skip(ri, vi)) return; xs.push(p[0]); ys.push(p[1]); }));
    this._S.zones.forEach((z, zi) => { if (skip && skip(-1, zi)) return; xs.push(z.rect[0], z.rect[2]); ys.push(z.rect[1], z.rect[3]); });
    return [xs, ys];
  }
  _snap(v, list) {
    let best = null, bd = 2.6;
    for (const c of list || []) { const d = Math.abs(c - v); if (d < bd) { bd = d; best = c; } }
    return best != null ? best : Math.round(v);
  }

  /* ---------- dessin du plan ---------- */
  _el(t, a, p) { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); if (p) p.appendChild(n); return n; }
  _drawPlan() {
    const s = this._svg, el = this._el.bind(this), S = this._S, V = this._vb, sel = this._sel || {};
    if (!s || !V) return;
    s.setAttribute("viewBox", V.join(" ")); s.textContent = "";
    const defs = el("defs", {}, s);
    const g1 = el("pattern", { id: "eg", width: 10, height: 10, patternUnits: "userSpaceOnUse" }, defs);
    el("path", { d: "M10 0H0V10", class: "g1", fill: "none" }, g1);
    const hp = el("pattern", { id: "pmh", width: 3, height: 3, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 3, height: 3, class: "hb" }, hp); el("line", { x1: 0, y1: 0, x2: 0, y2: 3, class: "hl" }, hp);
    const rug = el("pattern", { id: "pmrug", width: 2, height: 2, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs); el("rect", { width: 2, height: 2, class: "rg1" }, rug); el("rect", { width: 1, height: 2, class: "rg2" }, rug); const fsh = el("filter", { id: "pmfs", x: "-40%", y: "-40%", width: "180%", height: "180%" }, defs); el("feDropShadow", { dx: 0.25, dy: 0.35, stdDeviation: 0.35, "flood-opacity": 0.25 }, fsh); defs.insertAdjacentHTML("beforeend", FURN_DEFS);
    el("rect", { x: V[0], y: V[1], width: V[2], height: V[3], class: "grid", "data-k": "bg" }, s);
    for (let x = Math.ceil(V[0] / 50) * 50; x < V[0] + V[2]; x += 50) el("line", { x1: x, y1: V[1], x2: x, y2: V[1] + V[3], class: "g5" }, s);
    for (let y = Math.ceil(V[1] / 50) * 50; y < V[1] + V[3]; y += 50) el("line", { x1: V[0], y1: y, x2: V[0] + V[2], y2: y, class: "g5" }, s);
    // échelle
    el("line", { x1: V[0] + 4, y1: V[1] + V[3] - 4, x2: V[0] + 14, y2: V[1] + V[3] - 4, stroke: "var(--ink)", "stroke-width": 0.6 }, s);
    el("text", { x: V[0] + 16, y: V[1] + V[3] - 3, class: "rar", "font-size": 2.6 }, s).textContent = "1 m";
    // zones
    S.zones.forEach((z, i) => {
      const [x1, y1, x2, y2] = z.rect, on = sel.k === "zone" && sel.i === i;
      el("rect", { x: x1, y: y1, width: x2 - x1, height: y2 - y1, rx: z.type === "pool" ? 1.5 : 0, class: `zn z-${z.type}${on ? " sel" : ""}`, "data-k": "zone", "data-i": i }, s);
      el("text", { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 1, "text-anchor": "middle", class: "zlab", "font-size": Math.max(2, Math.min(3, (x2 - x1) / 8)) }, s).textContent = z.name;
    });
    // pièces
    S.rooms.forEach((r, i) => el("polygon", { points: r.pts.map((p) => p.join(",")).join(" "), class: `room ${r.kind}${sel.k === "room" && sel.i === i ? " sel" : ""}`, "data-k": "room", "data-i": i }, s));
    // mobilier
    if (this._showFurn) S.furniture.forEach((f, i) => {
      const parts = f.parts || (CAT[f.type] && CAT[f.type][1]); if (!parts) return;
      const b = bbox(parts), st = f.style || FSTYLE[f.type] || "wood";
      const g = el("g", { class: `piece fs-${st}${sel.k === "furn" && sel.i === i ? " sel" : ""}`, transform: `translate(${f.x},${f.y}) rotate(${f.rot || 0},${b.cx},${b.cy})`, "data-k": "furn", "data-i": i }, s);
      el("rect", { x: b.x - 0.6, y: b.y - 0.6, width: b.w + 1.2, height: b.h + 1.2, fill: "transparent" }, g);
      g.insertAdjacentHTML("beforeend", furnSvg(parts, st));
    });
    // murs et ouvertures
    const ops = S.openings.map((o) => ({ ...o, p: [o.a, o.b] }));
    G.computeWalls(S.rooms.map((r) => r.pts), ops).forEach(([x1, y1, x2, y2, c]) => el("line", { x1, y1, x2, y2, class: c }, s));
    ops.forEach((o, i) => {
      const [[x1, y1], [x2, y2]] = o.p, h = Math.abs(y1 - y2) < 0.01;
      if (o.type === "window") { el("rect", h ? { x: Math.min(x1, x2), y: y1 - 1.6, width: Math.abs(x2 - x1), height: 3.2, class: "win" } : { x: x1 - 1.6, y: Math.min(y1, y2), width: 3.2, height: Math.abs(y2 - y1), class: "win" }, s); el("line", { x1, y1, x2, y2, class: "win" }, s); }
      else if (o.type === "open") el("line", { x1, y1, x2, y2, class: "open" }, s);
      else if (o.type === "door" && o.swing) {
        const r = Math.hypot(x2 - x1, y2 - y1), d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[o.swing] || [0, -1];
        const tx = x1 + d[0] * r, ty = y1 + d[1] * r, cr = (tx - x1) * (y2 - y1) - (ty - y1) * (x2 - x1);
        el("path", { d: `M${x1} ${y1}L${tx} ${ty}A${r} ${r} 0 0 ${cr > 0 ? 1 : 0} ${x2} ${y2}`, class: "door" }, s);
      }
      el("rect", h ? { x: Math.min(x1, x2), y: y1 - 2.4, width: Math.max(2, Math.abs(x2 - x1)), height: 4.8, class: "ophit", "data-k": "op", "data-i": i } : { x: x1 - 2.4, y: Math.min(y1, y2), width: 4.8, height: Math.max(2, Math.abs(y2 - y1)), class: "ophit", "data-k": "op", "data-i": i }, s);
      if (sel.k === "op" && sel.i === i) el("rect", h ? { x: Math.min(x1, x2) - 0.6, y: y1 - 2.6, width: Math.abs(x2 - x1) + 1.2, height: 5.2, class: "op-sel" } : { x: x1 - 2.6, y: Math.min(y1, y2) - 0.6, width: 5.2, height: Math.abs(y2 - y1) + 1.2, class: "op-sel" }, s);
    });
    // noms des pièces
    S.rooms.forEach((r) => {
      if (r.pts.length < 3) return;
      const a = G.area(r.pts), lp = G.labelPoint(r.pts), fs = Math.max(1.8, Math.min(3.6, 0.75 * Math.sqrt(a)));
      const ls = Math.min(fs, (G.chord(r.pts, lp[0], lp[1]) * 0.86) / (Math.max(4, r.name.length) * 0.78));
      el("text", { x: lp[0], y: lp[1], "text-anchor": "middle", class: "rlab", "font-size": Math.max(1.5, ls) }, s).textContent = r.name;
      el("text", { x: lp[0], y: lp[1] + Math.max(1.5, ls) * 1.05, "text-anchor": "middle", class: "rar", "font-size": 1.9 }, s).textContent = fr(a, 1) + " m²";
    });
    // guirlandes
    (S.garlands || []).forEach((g, i) => {
      if (g.pts.length < 2) return;
      const dd = garPath(g.pts, g.sag), on = sel.k === "gar" && sel.i === i, cols = g.style === "warm" ? ["#ffcf70"] : (Array.isArray(g.raw.colors) && g.raw.colors.length > 1 ? g.raw.colors : MULTI);
      const gap = g.style === "warm" ? 4.6 : 3.3, w = g.style === "warm" ? 2 : 1.15;
      el("path", { d: dd, class: "gcab" }, s);
      cols.forEach((c, k) => el("path", { d: dd, stroke: c, "stroke-width": w, "stroke-linecap": "round", "stroke-dasharray": "0 " + gap * cols.length, "stroke-dashoffset": -gap * k, fill: "none", "pointer-events": "none" }, s));
      const hit = el("path", { d: dd, class: "ghit" + (on ? " sel" : ""), "data-k": "gar", "data-i": i }, s);
      el("title", {}, hit).textContent = (g.name || (g.entity ? friendly(this._hass, g.entity) : "Guirlande non reliée")) + " · touche pour la régler";
      if (on) {
        g.pts.forEach((a, k) => {
          const b = g.pts[k + 1]; if (!b || Math.hypot(b[0] - a[0], b[1] - a[1]) < 5) return;
          const ad = el("g", { class: "addpt", "data-k": "gadd", "data-i": i, "data-v": k, transform: `translate(${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2 + g.sag / 2})` }, s);
          el("title", {}, ad).textContent = "Ajouter un point d'accroche"; el("circle", { r: 1.4 }, ad); el("path", { d: "M-.8 0H.8M0 -.8V.8" }, ad);
        });
        g.pts.forEach((a, k) => el("circle", { cx: a[0], cy: a[1], r: 1.3, class: "vtx", "data-k": "gvtx", "data-i": i, "data-v": k }, s));
      }
    });
    // équipements
    if (this._showDev) S.devices.forEach((d, i) => {
      if (!d.pos) return;
      const g = el("g", { class: "dv" + (sel.k === "dev" && sel.i === i ? " sel" : ""), "data-k": "dev", "data-i": i, transform: `translate(${d.pos[0]},${d.pos[1]})` }, s);
      const ik = this._devIcon(d); el("circle", { r: 3, style: `stroke:${ACCENT[ik] || "var(--ink-2)"}` }, g);
      const inner = el("g", {}, g);
      inner.innerHTML = (ICONS[ik] || ICONS.generic)[1].replace('<svg class="ico', '<svg x="-2.1" y="-2.1" width="4.2" height="4.2" style="width:4.2px;height:4.2px;display:inline" class="ico');
      el("title", {}, g).textContent = this._devName(d);
    });
    if (!S.rooms.length) {
      el("text", { x: V[0] + V[2] / 2, y: V[1] + V[3] / 2 - 3, "text-anchor": "middle", class: "empty", "font-size": 4 }, s).textContent = "Plan vide";
      el("text", { x: V[0] + V[2] / 2, y: V[1] + V[3] / 2 + 3, "text-anchor": "middle", class: "empty", "font-size": 2.6 }, s).textContent = "Choisis l'outil « Pièce » et fais glisser pour dessiner ta première pièce.";
    }
    // poignées de la sélection
    if (sel.k === "room" && S.rooms[sel.i]) {
      const p = S.rooms[sel.i].pts;
      p.forEach((a, k) => {
        const b = p[(k + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: "edghit", "data-k": "edge", "data-i": sel.i, "data-v": k }, s);
        if (L > 6) {
          const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, h = Math.abs(a[1] - b[1]) < 0.01, v = Math.abs(a[0] - b[0]) < 0.01;
          this._dim(s, mx, my, fr(L / M) + " m", h ? [0, -3.4] : v ? [4.6, 0] : [0, -3.4]);
          const ad = el("g", { class: "addpt", "data-k": "addpt", "data-i": sel.i, "data-v": k, transform: `translate(${mx},${my})` }, s);
          el("title", {}, ad).textContent = "Ajouter un coin ici (tire-le pour changer la forme)";
          el("circle", { r: 1.6 }, ad); el("path", { d: "M-.9 0H.9M0 -.9V.9" }, ad);
        }
      });
      p.forEach((a, k) => el("circle", { cx: a[0], cy: a[1], r: 1.5, class: "vtx" + (sel.v === k ? " on" : ""), "data-k": "vtx", "data-i": sel.i, "data-v": k }, s));
    }
    if (sel.k === "zone" && S.zones[sel.i]) { const z = S.zones[sel.i].rect; el("rect", { x: z[2] - 1.4, y: z[3] - 1.4, width: 2.8, height: 2.8, class: "zc", "data-k": "zc", "data-i": sel.i }, s); this._dim(s, (z[0] + z[2]) / 2, z[3] + 3.5, `${fr((z[2] - z[0]) / M)} × ${fr((z[3] - z[1]) / M)} m`); }
    // guirlande en cours
    if (this._tool === "garland" && this._poly && this._poly.length) {
      const P = this._poly, all = this._polyHover ? P.concat([this._polyHover]) : P;
      if (all.length > 1) el("path", { d: garPath(all, 1.6), class: "gnew" }, s);
      P.forEach((q) => el("circle", { cx: q[0], cy: q[1], r: 1, class: "pdot" }, s));
    }
    // forme libre en cours
    if (this._tool === "poly" && this._poly && this._poly.length) {
      const P = this._poly, H = this._polyHover, all = H ? P.concat([H]) : P;
      el(all.length > 2 ? "polygon" : "polyline", { points: all.map((q) => q.join(",")).join(" "), class: "pline" }, s);
      P.forEach((q, k) => el("circle", { cx: q[0], cy: q[1], r: k ? 0.9 : 1.6, class: k ? "pdot" : "pfirst" }, s));
      if (H) { const a = P[P.length - 1]; this._dim(s, (a[0] + H[0]) / 2, (a[1] + H[1]) / 2, fr(Math.hypot(H[0] - a[0], H[1] - a[1]) / M) + " m", [0, -3.2]); }
    }
    // tracé en cours
    const d = this._drag;
    if (d && d.type === "new") {
      const [a, b] = [d.a, d.b || d.a], x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(a[0] - b[0]), h = Math.abs(a[1] - b[1]);
      el("rect", { x, y, width: w, height: h, class: "ghost" }, s);
      this._dim(s, x + w / 2, y + h / 2, `${fr(w / M)} × ${fr(h / M)} m · ${fr((w * h) / 100, 1)} m²`);
    }
  }
  _dim(s, x, y, txt, off = [0, 0]) {
    const t = this._el("text", { x: x + off[0], y: y + off[1] + 0.9, "text-anchor": "middle", class: "dim", "font-size": 2.4 }, s); t.textContent = txt;
    const w = txt.length * 1.45 + 1.6; const bg = this._el("rect", { x: x + off[0] - w / 2, y: y + off[1] - 1.6, width: w, height: 3.4, rx: 0.8, class: "dimbg" }); s.insertBefore(bg, t);
  }
  _devIcon(d) { const ic = d.raw.icon; if (ic && ICONS[ic]) return ic; return guess(this._hass && this._hass.states[d.entity], d.entity); }
  _devName(d) { if (d.raw.name) return d.raw.name; const s = this._hass && this._hass.states[d.entity]; return (s && s.attributes.friendly_name) || d.entity; }

  /* ---------- interactions sur le plan ---------- */
  _target(e) { const t = e.target.closest && e.target.closest("[data-k]"); return t ? { k: t.dataset.k, i: +t.dataset.i, v: t.dataset.v != null ? +t.dataset.v : null } : { k: "bg" }; }
  _down(e) {
    if (e.button && e.button !== 0) return;
    this.focus({ preventScroll: true });
    const p = this._pt(e), t = this._target(e), S = this._S, tool = this._tool;
    try { this._svg.setPointerCapture(e.pointerId); } catch (x) {}
    e.preventDefault();
    if (tool === "room" || tool === "zone") { const [xs, ys] = this._magnets(); this._drag = { type: "new", kind: tool, a: [this._snap(p[0], xs), this._snap(p[1], ys)] }; return; }
    if (tool === "door" || tool === "window" || tool === "open") { this._placeOpening(tool, p); return; }
    if (tool === "poly") { this._polyClick(p); return; }
    if (tool === "garland") { this._garClick(p); return; }
    // sélection
    if (t.k === "bg") { this._drag = { type: "pan", sx: e.clientX, sy: e.clientY, vb: this._vb.slice(), moved: false }; return; }
    if (t.k === "addpt") { // ajoute un coin au milieu du mur et le prend aussitôt en main
      this._push();
      const P = S.rooms[t.i].pts, a = P[t.v], b = P[(t.v + 1) % P.length];
      P.splice(t.v + 1, 0, [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)]);
      this._geoDirty = true; this._sel = { k: "room", i: t.i, v: t.v + 1 };
      this._drag = { type: "vtx", ri: t.i, vi: t.v + 1, start: p, snap: JSON.stringify(S), moved: false, inserted: true, noUndo: true };
      this._drawPlan(); return;
    }
    if (t.k === "gadd") {
      this._push();
      const P = S.garlands[t.i].pts, a = P[t.v], b = P[t.v + 1];
      P.splice(t.v + 1, 0, [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)]);
      this._garDirty = true; this._sel = { k: "gar", i: t.i };
      this._drag = { type: "gvtx", gi: t.i, vi: t.v + 1, start: p, snap: JSON.stringify(S), moved: false, inserted: true, noUndo: true };
      this._drawPlan(); return;
    }
    if (t.k === "gvtx") { this._drag = { type: "gvtx", gi: t.i, vi: t.v, start: p, snap: JSON.stringify(S), moved: false }; return; }
    if (t.k === "vtx" || t.k === "edge") { this._drag = { type: t.k, ri: t.i, vi: t.v, start: p, snap: JSON.stringify(S), moved: false }; return; }
    if (t.k === "zc") { this._drag = { type: "zc", zi: t.i, start: p, snap: JSON.stringify(S), moved: false }; return; }
    this._sel = { k: t.k, i: t.i };
    this._drag = { type: "body", k: t.k, i: t.i, start: p, snap: JSON.stringify(S), moved: false };
    this._drawPlan(); this._props();
  }
  _move(e) {
    if ((this._tool === "poly" || this._tool === "garland") && this._poly && this._poly.length) { this._polyHover = this._polySnap(this._pt(e)); this._drawPlan(); return; }
    const d = this._drag; if (!d) return;
    if (d.type === "pan") {
      const k = this._vb[2] / this._svg.clientWidth, dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (!d.moved && Math.hypot(dx, dy) < 4) return;
      d.moved = true; this._vb = [d.vb[0] - dx * k, d.vb[1] - dy * k, d.vb[2], d.vb[3]]; this._drawPlan(); return;
    }
    const p = this._pt(e);
    if (d.type === "new") { const [xs, ys] = this._magnets(); d.b = [this._snap(p[0], xs), this._snap(p[1], ys)]; this._drawPlan(); return; }
    const dx = p[0] - d.start[0], dy = p[1] - d.start[1];
    if (!d.moved && Math.hypot(dx, dy) < 0.8) return;
    if (!d.moved && d.noUndo) d.moved = true;
    if (!d.moved) { d.moved = true; this._undo.push(JSON.stringify({ cfg: this._cfg, S: JSON.parse(d.snap), g: this._geoDirty, z: this._zonesDirty, l: this._garDirty })); }
    const O = JSON.parse(d.snap), S = this._S;
    if (d.type === "gvtx") {
      const o = O.garlands[d.gi].pts[d.vi], [xs, ys] = this._magnets();
      S.garlands[d.gi].pts[d.vi] = [this._snap(o[0] + dx, xs), this._snap(o[1] + dy, ys)]; this._garDirty = true;
    } else if (d.type === "vtx") {
      const o = O.rooms[d.ri].pts[d.vi], same = (q) => Math.abs(q[0] - o[0]) < 0.01 && Math.abs(q[1] - o[1]) < 0.01;
      const [xs, ys] = this._magnets((ri, vi) => ri >= 0 && same(O.rooms[ri].pts[vi]));
      const nx = this._snap(o[0] + dx, xs), ny = this._snap(o[1] + dy, ys);
      S.rooms.forEach((r, ri) => r.pts.forEach((q, vi) => { if (same(O.rooms[ri].pts[vi])) { q[0] = nx; q[1] = ny; } }));
      this._geoDirty = true;
    } else if (d.type === "edge") {
      const P = O.rooms[d.ri].pts, a = P[d.vi], b = P[(d.vi + 1) % P.length], h = Math.abs(a[1] - b[1]) < 0.01, v = Math.abs(a[0] - b[0]) < 0.01;
      if (h || v) {
        const ax = h ? 1 : 0, c = a[ax], lo = Math.min(a[1 - ax], b[1 - ax]) - 0.01, hi = Math.max(a[1 - ax], b[1 - ax]) + 0.01;
        const on = (q) => Math.abs(q[ax] - c) < 0.01 && q[1 - ax] >= lo && q[1 - ax] <= hi;
        const ml = this._magnets((ri, vi) => ri >= 0 && on(O.rooms[ri].pts[vi]))[ax];
        const nc = this._snap(c + (h ? dy : dx), ml);
        S.rooms.forEach((r, ri) => r.pts.forEach((q, vi) => { if (on(O.rooms[ri].pts[vi])) q[ax] = nc; }));
        S.openings.forEach((o, oi) => { const A = O.openings[oi].a, B = O.openings[oi].b; if (on(A) && on(B)) { o.a[ax] = nc; o.b[ax] = nc; } });
      } else { // bord en biais : on déplace ses deux extrémités
        [d.vi, (d.vi + 1) % P.length].forEach((k) => { S.rooms[d.ri].pts[k][0] = Math.round(P[k][0] + dx); S.rooms[d.ri].pts[k][1] = Math.round(P[k][1] + dy); });
      }
      this._geoDirty = true;
    } else if (d.type === "zc") {
      const z = O.zones[d.zi].rect, [xs, ys] = this._magnets((ri, zi) => ri < 0 && zi === d.zi);
      S.zones[d.zi].rect[2] = Math.max(z[0] + 4, this._snap(z[2] + dx, xs)); S.zones[d.zi].rect[3] = Math.max(z[1] + 4, this._snap(z[3] + dy, ys));
      this._zonesDirty = true;
    } else if (d.type === "body") {
      if (d.k === "room") {
        const P = O.rooms[d.i].pts, b = G.bboxPts(P), [xs, ys] = this._magnets((ri) => ri === d.i);
        const sx = this._snap(b.x + dx, xs) - b.x, sy = this._snap(b.y + dy, ys) - b.y;
        const sx2 = this._snap(b.X + dx, xs) - b.X, sy2 = this._snap(b.Y + dy, ys) - b.Y;
        const mx = Math.abs(sx - dx) <= Math.abs(sx2 - dx) ? sx : sx2, my = Math.abs(sy - dy) <= Math.abs(sy2 - dy) ? sy : sy2;
        S.rooms[d.i].pts = P.map((q) => [q[0] + mx, q[1] + my]);
        // les ouvertures portées par cette pièce suivent
        S.openings.forEach((o, oi) => { const A = O.openings[oi].a, B = O.openings[oi].b; if (onPoly(A, P) && onPoly(B, P) && !onOther(A, B, O.rooms, d.i)) { o.a = [A[0] + mx, A[1] + my]; o.b = [B[0] + mx, B[1] + my]; } });
        this._geoDirty = true;
      } else if (d.k === "zone") {
        const z = O.zones[d.i].rect, [xs, ys] = this._magnets((ri, zi) => ri < 0 && zi === d.i);
        const mx = this._snap(z[0] + dx, xs) - z[0], my = this._snap(z[1] + dy, ys) - z[1];
        S.zones[d.i].rect = [z[0] + mx, z[1] + my, z[2] + mx, z[3] + my]; this._zonesDirty = true;
      } else if (d.k === "op") {
        const o = O.openings[d.i], h = Math.abs(o.a[1] - o.b[1]) < 0.01, m = Math.round(h ? dx : dy);
        S.openings[d.i].a = h ? [o.a[0] + m, o.a[1]] : [o.a[0], o.a[1] + m]; S.openings[d.i].b = h ? [o.b[0] + m, o.b[1]] : [o.b[0], o.b[1] + m]; this._geoDirty = true;
      } else if (d.k === "dev") {
        const o = O.devices[d.i]; S.devices[d.i].pos = [Math.round((o.pos[0] + dx) * 2) / 2, Math.round((o.pos[1] + dy) * 2) / 2];
      } else if (d.k === "gar") {
        const mx = Math.round(dx), my = Math.round(dy);
        S.garlands[d.i].pts = O.garlands[d.i].pts.map((q) => [q[0] + mx, q[1] + my]); this._garDirty = true;
      } else if (d.k === "furn") {
        const o = O.furniture[d.i]; S.furniture[d.i].x = Math.round((o.x + dx) * 2) / 2; S.furniture[d.i].y = Math.round((o.y + dy) * 2) / 2;
      }
    }
    this._drawPlan();
  }
  _up() {
    const d = this._drag; this._drag = null; if (!d) return;
    if (d.type === "pan") { if (!d.moved) { this._sel = null; this._render(); } return; }
    if (d.type === "new") {
      const a = d.a, b = d.b || d.a, x1 = Math.min(a[0], b[0]), y1 = Math.min(a[1], b[1]), x2 = Math.max(a[0], b[0]), y2 = Math.max(a[1], b[1]);
      if (x2 - x1 < 4 || y2 - y1 < 4) { this._drawPlan(); return; }
      if (d.kind === "room") this._change(() => {
        const n = this._S.rooms.length + 1; let id = "piece" + n; while (this._S.rooms.some((r) => r.id === id)) id += "b";
        this._S.rooms.push({ id, name: "Pièce " + n, kind: "jour", area: null, pts: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], raw: {} });
        this._sel = { k: "room", i: this._S.rooms.length - 1, fresh: true }; this._tool = "select";
      }, { geo: true });
      else this._change(() => {
        let id = "zone" + (this._S.zones.length + 1); while (this._S.zones.some((z) => z.id === id)) id += "b";
        this._S.zones.push({ id, name: "Terrasse", type: "deck", rect: [x1, y1, x2, y2], pattern: "tiles", posts: false, size: false, raw: {} });
        this._sel = { k: "zone", i: this._S.zones.length - 1, fresh: true }; this._tool = "select";
      }, { zone: true });
      return;
    }
    if (d.moved || d.inserted) { this._emit(); this._render(); return; }
    if (d.type === "vtx") { this._sel = { k: "room", i: d.ri, v: d.vi }; this._drawPlan(); this._props(); }
  }
  _dbl(e) {
    if (this._tool === "poly") { this._polyClose(); return; }
    if (this._tool === "garland") { this._garClose(); return; }
    if (this._tool !== "select") return;
    const hit = this.shadowRoot.elementFromPoint(e.clientX, e.clientY), t = this._target({ target: hit || e.target }), S = this._S;
    if (t.k === "gvtx" && S.garlands[t.i].pts.length > 2) { this._change(() => S.garlands[t.i].pts.splice(t.v, 1), { gar: true }); return; }
    if (t.k === "vtx" && S.rooms[t.i].pts.length > 3) this._change(() => S.rooms[t.i].pts.splice(t.v, 1), { geo: true });
    else if (t.k === "edge") { const p = S.rooms[t.i].pts, a = p[t.v], b = p[(t.v + 1) % p.length]; this._change(() => p.splice(t.v + 1, 0, [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)]), { geo: true }); }
  }
  _polySnap(p) {
    const [xs, ys] = this._magnets(), P = this._poly || [], last = P[P.length - 1];
    let x = this._snap(p[0], xs), y = this._snap(p[1], ys);
    if (last) { // alignement horizontal ou vertical avec le coin précédent ou le premier
      if (Math.abs(x - last[0]) < 2.5) x = last[0];
      if (Math.abs(y - last[1]) < 2.5) y = last[1];
      const f = P[0]; if (P.length > 1) { if (Math.abs(x - f[0]) < 2.5) x = f[0]; if (Math.abs(y - f[1]) < 2.5) y = f[1]; }
    }
    return [x, y];
  }
  _polyClick(p) {
    const P = this._poly || (this._poly = []), q = this._polySnap(p);
    if (P.length >= 3 && Math.hypot(q[0] - P[0][0], q[1] - P[0][1]) < 2.5) { this._polyClose(); return; }
    const last = P[P.length - 1]; if (last && last[0] === q[0] && last[1] === q[1]) return;
    P.push(q); this._polyHover = null; this._drawPlan();
    this.$("hint").textContent = P.length < 3 ? HINT.poly : `${P.length} coins posés. Clique sur le premier coin, double-clique ou appuie sur Entrée pour fermer la pièce.`;
  }
  _polyClose() {
    const P = (this._poly || []).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
    if (P.length > 1 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1]) P.pop();
    this._poly = null; this._polyHover = null;
    if (P.length < 3 || G.area(P) < 0.2) { this._drawPlan(); return; }
    this._change(() => {
      const n = this._S.rooms.length + 1; let id = "piece" + n; while (this._S.rooms.some((r) => r.id === id)) id += "b";
      this._S.rooms.push({ id, name: "Pièce " + n, kind: "jour", area: null, pts: P, raw: {} });
      this._sel = { k: "room", i: this._S.rooms.length - 1, fresh: true }; this._tool = "select";
    }, { geo: true });
  }
  _garClick(p) {
    const P = this._poly || (this._poly = []), q = this._polySnap(p), last = P[P.length - 1];
    if (last && Math.hypot(q[0] - last[0], q[1] - last[1]) < 1) { this._garClose(); return; }
    P.push(q); this._polyHover = null; this._drawPlan();
    this.$("hint").textContent = P.length < 2 ? HINT.garland : `${P.length} points posés. Double-clique ou appuie sur Entrée pour terminer la guirlande.`;
  }
  _garClose() {
    const P = (this._poly || []).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
    this._poly = null; this._polyHover = null;
    if (P.length < 2) { this._drawPlan(); return; }
    this._change(() => {
      this._S.garlands.push({ entity: "", name: null, pts: P, sag: 1.6, style: "multi", raw: {} });
      this._sel = { k: "gar", i: this._S.garlands.length - 1, fresh: true }; this._tool = "select";
    }, { gar: true });
  }
  _placeOpening(type, p) {
    let best = null, bd = 4.5;
    this._S.rooms.forEach((r) => r.pts.forEach((a, k) => {
      const b = r.pts[(k + 1) % r.pts.length], h = Math.abs(a[1] - b[1]) < 0.01, v = Math.abs(a[0] - b[0]) < 0.01; if (!h && !v) return;
      const ax = h ? 0 : 1, lo = Math.min(a[ax], b[ax]), hi = Math.max(a[ax], b[ax]), t = Math.max(lo, Math.min(hi, p[ax]));
      const dist = Math.hypot(h ? p[0] - t : p[0] - a[0], h ? p[1] - a[1] : p[1] - t);
      if (dist < bd) { bd = dist; best = { h, c: h ? a[1] : a[0], lo, hi, t }; }
    }));
    if (!best) { this.$("hint").textContent = "Touche plus près d'un mur pour y poser l'ouverture."; return; }
    const w = Math.min(OW[type], best.hi - best.lo - 1), m = Math.max(best.lo + w / 2 + 0.5, Math.min(best.hi - w / 2 - 0.5, Math.round(best.t)));
    const a = best.h ? [Math.round(m - w / 2), best.c] : [best.c, Math.round(m - w / 2)], b = best.h ? [Math.round(m + w / 2), best.c] : [best.c, Math.round(m + w / 2)];
    this._change(() => { this._S.openings.push({ type, a, b, swing: null, label: null, dashed: true, raw: {} }); this._sel = { k: "op", i: this._S.openings.length - 1 }; }, { geo: true });
  }
  _key(e) {
    if ((e.composedPath ? e.composedPath() : []).some((n) => ["INPUT", "SELECT", "TEXTAREA"].includes(n.tagName))) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); this._back(); return; }
    if (e.key === "Escape") { this._poly = null; this._polyHover = null; this._sel = null; this._tool = "select"; this._render(); return; }
    if (e.key === "Enter" && this._tool === "poly") { this._polyClose(); return; }
    if (e.key === "Enter" && this._tool === "garland") { this._garClose(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && this._sel && this._tab === "plan") { e.preventDefault(); this._delete(); }
    if ((e.key === "r" || e.key === "R") && this._sel && this._sel.k === "furn") { e.preventDefault(); this._change(() => { const f = this._S.furniture[this._sel.i]; f.rot = ((f.rot || 0) + 90) % 360; }, { keepProps: true }); }
  }
  _delete() {
    const s = this._sel, S = this._S; if (!s) return;
    const list = { room: S.rooms, op: S.openings, zone: S.zones, furn: S.furniture, gar: S.garlands }[s.k];
    if (list) this._change(() => { list.splice(s.i, 1); this._sel = null; }, { geo: s.k === "room" || s.k === "op", zone: s.k === "zone", gar: s.k === "gar" });
    else if (s.k === "dev") this._change(() => { S.devices[s.i].pos = null; this._sel = null; });
  }

  /* ---------- panneau des propriétés ---------- */
  _props() {
    const box = this.$("props"), s = this._sel, S = this._S;
    if (!s) {
      box.innerHTML = `<h4>Ton plan</h4><p class="muted">${S.rooms.length} pièce${S.rooms.length > 1 ? "s" : ""}, ${S.openings.length} ouverture${S.openings.length > 1 ? "s" : ""}, ${S.zones.length} espace${S.zones.length > 1 ? "s" : ""} extérieur${S.zones.length > 1 ? "s" : ""}, ${S.devices.filter((d) => d.pos).length} équipement(s) placé(s), ${S.furniture.length} meuble(s).</p>
        <p class="muted">Commence par dessiner les pièces avec l'outil « Pièce » : les murs se tracent tout seuls, épais en façade, fins entre deux pièces. Pose ensuite portes et fenêtres en touchant un mur. Les cotes s'affichent en mètres ; la grille fait 1 m.</p>`;
      return;
    }
    const field = (lab, html) => `<label class="fld">${lab}${html}</label>`;
    const num = (id, v, step = 0.05) => `<input type="number" id="${id}" step="${step}" value="${v}">`;
    if (s.k === "lib") {
      const th = (k) => { const b = bbox(CAT[k][1]), m = Math.max(b.w, b.h) * 0.12 + 0.6, st = FSTYLE[k] || "wood"; return `<svg class="fth" viewBox="${b.x - m} ${b.y - m} ${b.w + 2 * m} ${b.h + 2 * m}"><g class="fs-${st}">${furnSvg(CAT[k][1], st)}</g></svg>`; };
      box.innerHTML = `<h4>Ajouter un meuble</h4><p class="muted">Touche un meuble : il se pose au centre du plan (ou dans la pièce sélectionnée juste avant), puis glisse-le à sa place.</p><div class="ipk">${Object.keys(CAT).map((k) => `<button data-k="${k}" title="${esc(CAT[k][0])}">${th(k)}<span>${esc(CAT[k][0])}</span></button>`).join("")}</div><div class="btns"><button class="btn" id="x">Fermer</button></div>`;
      box.querySelectorAll(".ipk button").forEach((b) => (b.onclick = () => this._addFurn(b.dataset.k)));
      box.querySelector("#x").onclick = () => { this._sel = null; this._props(); };
      return;
    }
    if (s.k === "room") {
      const r = S.rooms[s.i]; if (!r) return;
      const rc = rectOf(r.pts);
      box.innerHTML = `<h4>Pièce</h4><div class="f2">${field("Nom", `<input id="nm" value="${esc(r.name)}">`)}${field("Type", `<select id="kd">${KINDS.map(([k, l]) => `<option value="${k}" ${r.kind === k ? "selected" : ""}>${l}</option>`).join("")}</select>`)}${field("Surface réelle (m², facultatif)", num("ar", r.area ?? "", 0.5))}</div>
        ${rc ? `<div class="f2">${field("Gauche (m)", num("rx", m2(rc[0])))}${field("Haut (m)", num("ry", m2(rc[1])))}${field("Largeur (m)", num("rw", m2(rc[2] - rc[0])))}${field("Profondeur (m)", num("rh", m2(rc[3] - rc[1])))}</div>` : ""}
        <p class="s">${rc ? "Pièce rectangulaire." : `Forme libre de ${r.pts.length} coins.`} Pour changer la forme, touche un « + » au milieu d'un mur et tire le nouveau coin ; touche un coin pour le régler au centimètre ou le supprimer.</p>
        ${s.v != null && r.pts[s.v] ? `<div class="f2">${field(`Coin ${s.v + 1} : X (m)`, num("vx", m2(r.pts[s.v][0])))}${field(`Coin ${s.v + 1} : Y (m)`, num("vy", m2(r.pts[s.v][1])))}</div><div class="btns">${r.pts.length > 3 ? '<button class="btn" id="vdel">Supprimer ce coin</button>' : ""}</div>` : ""}
        <p class="s">Surface dessinée : ${fr(G.area(r.pts), 1)} m²</p>
        <div class="btns"><button class="btn" id="dup">Dupliquer</button><button class="btn danger" id="del">Supprimer la pièce</button></div>`;
      const set = (fn, geo) => this._change(fn, { geo: !!geo });
      box.querySelector("#nm").onchange = (e) => set(() => (r.name = e.target.value.trim() || r.name));
      box.querySelector("#kd").onchange = (e) => set(() => (r.kind = e.target.value));
      box.querySelector("#ar").onchange = (e) => set(() => (r.area = e.target.value === "" ? null : parseFloat(e.target.value)));
      if (rc) ["rx", "ry", "rw", "rh"].forEach((id) => (box.querySelector("#" + id).onchange = () => {
        const g = (k) => parseFloat(box.querySelector("#" + k).value) * M;
        const x = g("rx"), y = g("ry"), w = Math.max(4, g("rw")), h = Math.max(4, g("rh"));
        if ([x, y, w, h].some(isNaN)) return;
        set(() => (r.pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map((p) => p.map((v) => Math.round(v * 10) / 10))), true);
      }));
      const vx = box.querySelector("#vx");
      if (vx) [vx, box.querySelector("#vy")].forEach((inp) => (inp.onchange = () => {
        const x = parseFloat(box.querySelector("#vx").value) * M, y = parseFloat(box.querySelector("#vy").value) * M; if (isNaN(x) || isNaN(y)) return;
        const o = r.pts[s.v].slice(), same = (q) => Math.abs(q[0] - o[0]) < 0.01 && Math.abs(q[1] - o[1]) < 0.01;
        set(() => S.rooms.forEach((rr) => rr.pts.forEach((q) => { if (same(q)) { q[0] = Math.round(x * 10) / 10; q[1] = Math.round(y * 10) / 10; } })), true);
      }));
      const vd = box.querySelector("#vdel"); if (vd) vd.onclick = () => set(() => { r.pts.splice(s.v, 1); this._sel = { k: "room", i: s.i }; }, true);
      box.querySelector("#dup").onclick = () => this._change(() => { const n = clone(r); n.id = r.id + "_2"; while (S.rooms.some((x) => x.id === n.id)) n.id += "b"; n.name = r.name + " (copie)"; const b = G.bboxPts(r.pts); n.pts = r.pts.map((p) => [p[0] + (b.X - b.x), p[1]]); S.rooms.push(n); this._sel = { k: "room", i: S.rooms.length - 1 }; }, { geo: true });
      box.querySelector("#del").onclick = (e) => this._confirm(e.currentTarget, () => this._delete());
      if (s.fresh) { s.fresh = false; const i = box.querySelector("#nm"); i.focus(); i.select(); }
      return;
    }
    if (s.k === "op") {
      const o = S.openings[s.i]; if (!o) return;
      const w = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
      box.innerHTML = `<h4>Ouverture</h4><div class="f2">${field("Type", `<select id="ty">${OTYPES.map(([k, l]) => `<option value="${k}" ${o.type === k ? "selected" : ""}>${l}</option>`).join("")}</select>`)}${field("Largeur (m)", num("wd", m2(w)))}
        ${o.type === "door" ? field("Arc d'ouverture", `<select id="sw">${SWING.map(([k, l]) => `<option value="${k}" ${(o.swing || "") === k ? "selected" : ""}>${l}</option>`).join("")}</select>`) : ""}${o.type === "door" ? field("Libellé (facultatif)", `<input id="lb" value="${esc(o.label || "")}" placeholder="Entrée">`) : ""}</div>
        <p class="s">Glisse l'ouverture le long du mur pour la déplacer.</p><div class="btns"><button class="btn danger" id="del">Supprimer</button></div>`;
      const set = (fn) => this._change(fn, { geo: true });
      box.querySelector("#ty").onchange = (e) => set(() => (o.type = e.target.value));
      box.querySelector("#wd").onchange = (e) => { const nw = parseFloat(e.target.value) * M; if (!(nw > 1)) return; set(() => { const h = Math.abs(o.a[1] - o.b[1]) < 0.01, ax = h ? 0 : 1, c = (o.a[ax] + o.b[ax]) / 2; o.a[ax] = Math.round((c - nw / 2) * 10) / 10; o.b[ax] = Math.round((c + nw / 2) * 10) / 10; }); };
      const sw = box.querySelector("#sw"); if (sw) sw.onchange = (e) => set(() => (o.swing = e.target.value || null));
      const lb = box.querySelector("#lb"); if (lb) lb.onchange = (e) => set(() => (o.label = e.target.value.trim() || null));
      box.querySelector("#del").onclick = () => this._delete();
      return;
    }
    if (s.k === "zone") {
      const z = S.zones[s.i]; if (!z) return;
      box.innerHTML = `<h4>Espace extérieur</h4><div class="f2">${field("Nom", `<input id="nm" value="${esc(z.name)}">`)}${field("Type", `<select id="ty">${ZTYPES.map(([k, l]) => `<option value="${k}" ${z.type === k ? "selected" : ""}>${l}</option>`).join("")}</select>`)}
        ${z.type === "deck" ? field("Revêtement", `<select id="pt"><option value="tiles" ${z.pattern === "tiles" ? "selected" : ""}>Dalles</option><option value="slats" ${z.pattern === "slats" ? "selected" : ""}>Lames</option></select>`) : ""}</div>
        <div class="f2">${field("Gauche (m)", num("rx", m2(z.rect[0])))}${field("Haut (m)", num("ry", m2(z.rect[1])))}${field("Largeur (m)", num("rw", m2(z.rect[2] - z.rect[0])))}${field("Profondeur (m)", num("rh", m2(z.rect[3] - z.rect[1])))}</div>
        <div class="btns"><label class="chk2"><input type="checkbox" id="po" ${z.posts ? "checked" : ""}> Poteaux (pergola)</label><label class="chk2"><input type="checkbox" id="sz" ${z.size ? "checked" : ""}> Afficher les dimensions</label></div>
        <div class="btns"><button class="btn danger" id="del">Supprimer</button></div>`;
      const set = (fn) => this._change(fn, { zone: true });
      box.querySelector("#nm").onchange = (e) => set(() => (z.name = e.target.value.trim() || z.name));
      box.querySelector("#ty").onchange = (e) => set(() => { z.type = e.target.value; if (z.type === "deck" && !z.pattern) z.pattern = "tiles"; });
      const pt = box.querySelector("#pt"); if (pt) pt.onchange = (e) => set(() => (z.pattern = e.target.value));
      box.querySelector("#po").onchange = (e) => set(() => (z.posts = e.target.checked));
      box.querySelector("#sz").onchange = (e) => set(() => (z.size = e.target.checked));
      ["rx", "ry", "rw", "rh"].forEach((id) => (box.querySelector("#" + id).onchange = () => { const g = (k) => parseFloat(box.querySelector("#" + k).value) * M; const x = g("rx"), y = g("ry"), w = Math.max(4, g("rw")), h = Math.max(4, g("rh")); if ([x, y, w, h].some(isNaN)) return; set(() => (z.rect = [x, y, x + w, y + h].map((v) => Math.round(v * 10) / 10))); }));
      box.querySelector("#del").onclick = () => this._delete();
      return;
    }
    if (s.k === "dev") { this._devProps(box, S.devices[s.i], s.i); return; }
    if (s.k === "gar") {
      const g = S.garlands[s.i]; if (!g) return;
      box.innerHTML = `<h4>Guirlande lumineuse</h4>${g.entity ? "" : '<p class="s" style="color:var(--na)">Choisis l\'interrupteur ou la lumière qui commande cette guirlande.</p>'}
        <div class="f2"><div class="fld">Commandée par<span id="gen"></span></div>${field("Nom (facultatif)", `<input id="nm" value="${esc(g.name || "")}" placeholder="${esc(g.entity ? friendly(this._hass, g.entity) : "Guinguette")}">`)}
        ${field("Ampoules", `<select id="st"><option value="multi" ${g.style !== "warm" ? "selected" : ""}>Multicolores (guinguette)</option><option value="warm" ${g.style === "warm" ? "selected" : ""}>Blanc chaud</option></select>`)}${field("Affaissement (m)", num("sg", m2(g.sag), 0.05))}</div>
        <p class="s">Sur la carte, la guirlande s'illumine quand l'appareil est allumé, et un clic dessus l'allume ou l'éteint. Glisse-la pour la déplacer, glisse ses points d'accroche, ou touche un « + » pour en ajouter ; double-clic sur un point pour le retirer.</p>
        <div class="btns"><button class="btn danger" id="del">Supprimer la guirlande</button></div>`;
      const set = (fn) => this._change(fn, { gar: true });
      const pk = this._picker(box.querySelector("#gen"), g.entity, (v) => set(() => (g.entity = v)), { domains: ["light", "switch", "input_boolean", "fan"], placeholder: "Tape le nom de l'interrupteur…" });
      box.querySelector("#nm").onchange = (e) => set(() => (g.name = e.target.value.trim() || null));
      box.querySelector("#st").onchange = (e) => set(() => { g.style = e.target.value; g.restyled = true; });
      box.querySelector("#sg").onchange = (e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) set(() => (g.sag = Math.max(0, v * M))); };
      box.querySelector("#del").onclick = () => this._delete();
      if (s.fresh && !g.entity) { s.fresh = false; setTimeout(() => pk.querySelector("input").focus(), 30); }
      return;
    }
    if (s.k === "furn") {
      const f = S.furniture[s.i]; if (!f) return;
      const name = f.name || (CAT[f.type] && CAT[f.type][0]) || "Meuble";
      box.innerHTML = `<h4>Meuble</h4><div class="f2">${field("Nom", `<input id="nm" value="${esc(name)}">`)}<div class="fld">Orientation<span style="color:var(--ink)">${f.rot || 0}°</span></div></div>
        <div class="btns"><button class="btn" id="rot">Pivoter de 90° (R)</button><button class="btn" id="dup">Dupliquer</button><button class="btn danger" id="del">Supprimer</button></div>`;
      box.querySelector("#nm").onchange = (e) => this._change(() => { f.name = e.target.value.trim() || null; f.raw.name = f.name || undefined; });
      box.querySelector("#rot").onclick = () => this._change(() => (f.rot = ((f.rot || 0) + 90) % 360));
      box.querySelector("#dup").onclick = () => this._change(() => { const n = clone(f); n.id = "m" + Date.now().toString(36); n.raw.id = n.id; n.x += 4; n.y += 4; S.furniture.push(n); this._sel = { k: "furn", i: S.furniture.length - 1 }; });
      box.querySelector("#del").onclick = () => this._delete();
    }
  }
  _devProps(box, d, i) {
    if (!d) return;
    const field = (lab, html) => `<label class="fld">${lab}${html}</label>`, ik = this._devIcon(d);
    box.innerHTML = `<h4>Équipement</h4><div class="f2"><div class="fld">Appareil<span id="en"></span></div>${field("Nom affiché", `<input id="nm" value="${esc(d.raw.name || "")}" placeholder="${esc(this._devName(d))}">`)}${field("Au clic", `<select id="kd">${DKIND.map(([k, l]) => `<option value="${k}" ${(d.raw.kind || "") === k ? "selected" : ""}>${l}</option>`).join("")}</select>`)}</div>
      <div class="s">Icône animée${d.raw.icon ? "" : " (choisie automatiquement)"} :</div><div class="ipk">${Object.entries(ICONS).map(([k, v]) => `<button data-k="${k}" style="--ac:${ACCENT[k] || "var(--sel)"}" class="${ik === k ? "cur" : ""}" title="${esc(v[0])}">${v[1]}<span>${esc(v[0])}</span></button>`).join("")}</div>
      <div class="btns">${d.raw.icon ? '<button class="btn" id="auto">Icône automatique</button>' : ""}<button class="btn" id="unplace">Retirer du plan</button><button class="btn danger" id="del">Supprimer l'équipement</button></div>`;
    const S = this._S;
    this._picker(box.querySelector("#en"), d.entity, (v) => this._setEntity(d, v), { domains: DEVICE_DOMAINS });
    box.querySelector("#nm").onchange = (e) => this._change(() => (d.raw.name = e.target.value.trim() || undefined));
    box.querySelector("#kd").onchange = (e) => this._change(() => (d.raw.kind = e.target.value || undefined));
    box.querySelectorAll(".ipk button").forEach((b) => (b.onclick = () => this._change(() => (d.raw.icon = b.dataset.k))));
    const au = box.querySelector("#auto"); if (au) au.onclick = () => this._change(() => delete d.raw.icon);
    box.querySelector("#unplace").onclick = () => this._change(() => { d.pos = null; this._sel = null; });
    box.querySelector("#del").onclick = (e) => this._confirm(e.currentTarget, () => this._change(() => { S.devices.splice(i, 1); this._sel = null; }));
  }
  _picker(slot, value, onPick, o = {}) {
    const pk = createPicker({ hass: () => this._hass, value, placeholder: o.placeholder, domains: o.domains, keepText: o.keepText, onPick });
    slot.replaceWith(pk); return pk;
  }
  _setEntity(d, v) { this._change(() => { if (d.id === d.entity) d.id = v; d.entity = v; }); }
  _addDevice(v) {
    const S = this._S, c = this._center();
    this._change(() => { let id = v; while (S.devices.some((d) => d.id === id)) id += "_2"; S.devices.push({ id, entity: v, pos: [Math.round(c[0]), Math.round(c[1])], raw: id !== v ? { id } : {} }); });
  }
  _center() {
    const s = this._sel, S = this._S;
    if (s && s.k === "room" && S.rooms[s.i]) return G.labelPoint(S.rooms[s.i].pts).slice(0, 2);
    const b = this._bounds(); if (b) return [(b.x + b.X) / 2, (b.y + b.Y) / 2];
    return [this._vb[0] + this._vb[2] / 2, this._vb[1] + this._vb[3] / 2];
  }
  _addFurn(type) {
    const b = bbox(CAT[type][1]), c = this._prevRoomCenter || this._center();
    this._change(() => { const id = "m" + Date.now().toString(36); this._S.furniture.push({ id, type, name: null, x: Math.round(c[0] - b.w / 2), y: Math.round(c[1] - b.h / 2), rot: 0, parts: null, style: null, raw: { id, type } }); this._sel = { k: "furn", i: this._S.furniture.length - 1 }; });
  }

  /* ---------- onglet Équipements ---------- */
  _devTab() {
    const box = this.$("p-dev"), S = this._S;
    box.innerHTML = `<p class="muted">Tape le nom d'un appareil (« lampe salon », « porte entrée »…) et choisis-le dans la liste : il est ajouté au centre du plan. Glisse-le ensuite à sa place dans l'onglet Plan. L'icône animée est choisie d'après l'appareil ; touche sa pastille sur le plan pour la changer.</p>
      <div class="add"><span id="new"></span></div>
      <div class="list">${S.devices.map((d, i) => `<div class="row-e" data-i="${i}"><span class="ic">${(ICONS[this._devIcon(d)] || ICONS.generic)[1]}</span><span class="en"></span><input class="nm" value="${esc(d.raw.name || "")}" placeholder="Nom affiché (facultatif)" title="Nom affiché sur la carte, si différent du nom Home Assistant"><select class="kd" title="Au clic">${DKIND.map(([k, l]) => `<option value="${k}" ${(d.raw.kind || "") === k ? "selected" : ""}>${l}</option>`).join("")}</select><span class="btns"><button class="mini pl">${d.pos ? "Voir" : "Placer"}</button><button class="mini danger rm" title="Supprimer">✕</button></span></div>`).join("") || '<p class="muted">Aucun équipement pour l\'instant.</p>'}</div>`;
    this._picker(box.querySelector("#new"), "", (v) => this._addDevice(v), { domains: DEVICE_DOMAINS, keepText: false, placeholder: "Ajouter un appareil : tape son nom…" });
    box.querySelectorAll(".row-e").forEach((row) => {
      const d = S.devices[+row.dataset.i];
      this._picker(row.querySelector(".en"), d.entity, (v) => this._setEntity(d, v), { domains: DEVICE_DOMAINS });
      row.querySelector(".nm").onchange = (e) => this._change(() => (d.raw.name = e.target.value.trim() || undefined));
      row.querySelector(".kd").onchange = (e) => this._change(() => (d.raw.kind = e.target.value || undefined));
      row.querySelector(".pl").onclick = () => { if (!d.pos) { const c = this._center(); this._change(() => (d.pos = [Math.round(c[0]), Math.round(c[1])]), { noUndo: false }); } this._tab = "plan"; this._tool = "select"; this._sel = { k: "dev", i: +row.dataset.i }; this._render(); };
      row.querySelector(".rm").onclick = (e) => this._confirm(e.currentTarget, () => this._change(() => S.devices.splice(+row.dataset.i, 1)));
    });
  }

  /* ---------- onglet Bandeau ---------- */
  _banTab() {
    const box = this.$("p-ban"), list = this._cfg.banner || [], H = this._hass;
    const val = (e, d) => { const st = H && H.states[e]; if (!st) return "–"; const n = parseFloat(st.state); const u = st.attributes.unit_of_measurement || ""; return (isNaN(n) || !/^-?[\d.]+$/.test(st.state) ? st.state : (d != null ? n.toFixed(+d) : String(Math.round(n * 10) / 10)).replace(".", ",")) + (u && !isNaN(n) ? " " + u : ""); };
    const prev = (t) => String(t || "").replace(/\{([a-z_]+\.[\w]+)(?::(\d))?\}/gi, (m, e, d) => { const st = H && H.states[e]; return st && !isNaN(parseFloat(st.state)) ? (d != null ? parseFloat(st.state).toFixed(+d) : String(Math.round(parseFloat(st.state) * 10) / 10)).replace(".", ",") : st ? st.state : "?"; });
    box.innerHTML = `<p class="muted">Les tuiles s'affichent sous le titre de la carte (météo ou n'importe quel capteur), dans cet ordre. Sans tuile, le bandeau est masqué.</p>
      <div class="list">${list.map((t, i) => `<div class="props tile" data-i="${i}">
        <div class="th"><b>${esc(t.name || friendly(H, t.entity))}</b><span class="tv">${esc(val(t.entity, t.decimals))}</span><span class="btns"><button class="mini up" title="Monter" ${i ? "" : "disabled"}>↑</button><button class="mini dn" title="Descendre" ${i < list.length - 1 ? "" : "disabled"}>↓</button><button class="mini danger rm" title="Supprimer la tuile">✕</button></span></div>
        <div class="f2"><div class="fld">Capteur affiché<span class="en"></span></div><label class="fld">Titre (facultatif)<input class="nm" value="${esc(t.name || "")}" placeholder="${esc(friendly(H, t.entity))}"></label></div>
        <label class="fld">Ligne secondaire (facultatif)<input class="sc" value="${esc(t.secondary || "")}" placeholder="ex. station météo"></label>
        <div class="btns"><button class="mini addv">+ Ajouter la valeur d'un autre capteur dans cette ligne</button><span class="vslot" style="flex:1;min-width:200px"></span></div>
        ${t.secondary ? `<div class="s">Aperçu : ${esc(prev(t.secondary))}</div>` : ""}
      </div>`).join("") || '<p class="muted">Aucune tuile pour l\'instant.</p>'}</div>
      <div class="add" id="addz"><button class="btn solid" id="addb">+ Ajouter une tuile</button></div>`;
    const upd = (fn) => this._change(() => { const b = clone(this._cfg.banner || []); fn(b); if (b.length) this._cfg.banner = b; else delete this._cfg.banner; });
    box.querySelector("#addb").onclick = (e) => {
      const pk = this._picker(e.currentTarget, "", (v) => upd((b) => b.push({ entity: v })), { keepText: false, placeholder: "Tape le nom du capteur à afficher (température, humidité…)" });
      setTimeout(() => pk.querySelector("input").focus(), 20);
    };
    box.querySelectorAll(".tile").forEach((row) => {
      const i = +row.dataset.i;
      this._picker(row.querySelector(".en"), list[i].entity, (v) => upd((b) => (b[i].entity = v)));
      row.querySelector(".nm").onchange = (e) => upd((b) => { b[i].name = e.target.value.trim(); clean(b[i]); });
      row.querySelector(".sc").onchange = (e) => upd((b) => { b[i].secondary = e.target.value.trim(); clean(b[i]); });
      row.querySelector(".up").onclick = () => i && upd((b) => b.splice(i - 1, 0, b.splice(i, 1)[0]));
      row.querySelector(".dn").onclick = () => i < list.length - 1 && upd((b) => b.splice(i + 1, 0, b.splice(i, 1)[0]));
      row.querySelector(".rm").onclick = () => upd((b) => b.splice(i, 1));
      row.querySelector(".addv").onclick = (e) => {
        e.currentTarget.hidden = true;
        const pk = this._picker(row.querySelector(".vslot"), "", (v) => upd((b) => { b[i].secondary = ((b[i].secondary || "") + " {" + v + "}").trim(); }), { keepText: false, placeholder: "Tape le nom du capteur…" });
        setTimeout(() => pk.querySelector("input").focus(), 20);
      };
    });
  }


  /* ---------- onglet Réglages ---------- */
  _setTab() {
    const box = this.$("p-set"), c = this._cfg, al = c.alerts || {}, gd = c.garden === false ? null : c.garden || {};
    const field = (lab, html) => `<label class="fld">${lab}${html}</label>`;
    box.innerHTML = `<div class="props"><h4>Général</h4><div class="f2">${field("Titre", `<input id="ti" value="${esc(c.title ?? "")}" placeholder="Ma maison">`)}${field("Thème", `<select id="th"><option value="">Comme Home Assistant</option><option value="light" ${c.theme === "light" ? "selected" : ""}>Toujours clair</option><option value="dark" ${c.theme === "dark" ? "selected" : ""}>Toujours sombre</option></select>`)}</div>
        <div class="btns"><label class="chk2"><input type="checkbox" id="hd" ${c.header === false ? "" : "checked"}> Afficher le titre et l'heure</label><label class="chk2"><input type="checkbox" id="fo" ${c.fonts === false ? "" : "checked"}> Polices de la carte (Google Fonts)</label></div></div>
      <div class="props"><h4>Jardin</h4><div class="btns"><label class="chk2"><input type="checkbox" id="gd" ${gd ? "checked" : ""}> Dessiner le jardin autour de la maison</label></div>
        ${gd ? `<div class="f2">${field("Libellé", `<input id="gl" value="${esc(gd.label ?? "Jardin")}">`)}</div><div class="btns"><label class="chk2"><input type="checkbox" id="at" ${gd.trees ? "" : "checked"}> Arbres placés automatiquement</label></div>` : ""}
        ${c.view ? '<div class="btns"><button class="btn" id="vw">Cadrage automatique (supprimer « view »)</button></div>' : ""}</div>
      <div class="props"><h4>Panneau « À regarder »</h4><div class="btns"><label class="chk2"><input type="checkbox" id="aa" ${al.auto === false ? "" : "checked"}> Équipements indisponibles et portes ouvertes</label><label class="chk2"><input type="checkbox" id="au" ${al.updates === false ? "" : "checked"}> Mises à jour disponibles</label></div>
        <div class="f2">${field("Piles faibles sous (%) — vide pour ignorer", `<input type="number" id="ab" min="0" max="100" value="${al.battery === false ? "" : al.battery ?? 20}">`)}</div>
        ${al.rules && al.rules.length ? `<p class="muted">${al.rules.length} règle(s) personnalisée(s) définie(s) en YAML.</p>` : ""}</div>`;
    const upd = (fn) => this._change(() => { fn(this._cfg); });
    const $ = (id) => box.querySelector("#" + id);
    $("ti").onchange = (e) => upd((c) => (c.title = e.target.value));
    $("th").onchange = (e) => upd((c) => { if (e.target.value) c.theme = e.target.value; else delete c.theme; });
    $("hd").onchange = (e) => upd((c) => { if (e.target.checked) delete c.header; else c.header = false; });
    $("fo").onchange = (e) => upd((c) => { if (e.target.checked) delete c.fonts; else c.fonts = false; });
    $("gd").onchange = (e) => upd((c) => { if (e.target.checked) { if (c.garden === false) delete c.garden; } else c.garden = false; });
    if ($("gl")) $("gl").onchange = (e) => upd((c) => { c.garden = Object.assign({}, c.garden || {}, { label: e.target.value }); });
    if ($("at")) $("at").onchange = (e) => upd((c) => { c.garden = Object.assign({}, c.garden || {}); if (e.target.checked) delete c.garden.trees; else c.garden.trees = []; });
    if ($("vw")) $("vw").onclick = () => upd((c) => delete c.view);
    const alu = (fn) => upd((c) => { c.alerts = Object.assign({}, c.alerts || {}); fn(c.alerts); clean(c.alerts); if (!Object.keys(c.alerts).length) delete c.alerts; });
    $("aa").onchange = (e) => alu((a) => (a.auto = e.target.checked ? undefined : false));
    $("au").onchange = (e) => alu((a) => (a.updates = e.target.checked ? undefined : false));
    $("ab").onchange = (e) => alu((a) => (a.battery = e.target.value === "" ? false : parseFloat(e.target.value)));
  }

  /* ---------- disposition enregistrée par la carte ---------- */
  _lkey() { return this._cfg.layout_key || "plan_maison_" + slug(this._cfg.title); }
  async _checkLayout() {
    if (!this._hass || !this._hass.callWS) return;
    try {
      const r = await this._hass.callWS({ type: "frontend/get_user_data", key: this._lkey() }), L = r && r.value;
      const has = L && (["axes", "pos", "furn", "names", "icons", "devHidden"].some((k) => L[k] && Object.keys(L[k]).length) || (L.added && L.added.length) || (L.devAdded && L.devAdded.length));
      this._layout = has ? L : null;
    } catch (e) { this._layout = null; }
    this._noteRender();
  }
  async _absorb() {
    const L = this._layout; if (!L) return;
    this._push();
    if (L.axes && Object.keys(L.axes).length) {
      if (this._named) { const ax = clone(this._cfg.axes || {}); Object.entries(L.axes).forEach(([k, v]) => { if (ax[k] == null) return; if (typeof ax[k] === "object") ax[k].value = m2(v); else ax[k] = m2(v); }); this._cfg.axes = ax; this._load(); }
      else { this._load(L.axes); this._geoDirty = true; }
    }
    const S = this._S;
    if (L.names) S.rooms.forEach((r) => { if (L.names[r.id]) r.name = L.names[r.id]; });
    S.devices = S.devices.filter((d) => !(L.devHidden && L.devHidden[d.id]));
    S.devices.forEach((d) => { if (L.pos && L.pos[d.id]) d.pos = L.pos[d.id]; if (L.icons && L.icons[d.id]) d.raw.icon = L.icons[d.id]; });
    (L.devAdded || []).forEach((a) => S.devices.push({ id: a.entity, entity: a.entity, pos: (L.pos && L.pos[a.id]) || a.pos || null, raw: clean({ icon: (L.icons && L.icons[a.id]) || a.ik }) }));
    S.furniture = S.furniture.filter((f) => !(L.furn && L.furn[f.id] && L.furn[f.id].del));
    S.furniture.forEach((f) => { const o = L.furn && L.furn[f.id]; if (o) { if (o.x != null) f.x = o.x; if (o.y != null) f.y = o.y; if (o.rot != null) f.rot = o.rot; } });
    (L.added || []).forEach((a) => { if (CAT[a.type]) S.furniture.push({ id: a.id, type: a.type, name: null, x: a.x, y: a.y, rot: a.rot || 0, parts: null, style: null, raw: { id: a.id, type: a.type } }); });
    this._emit();
    try { await this._hass.callWS({ type: "frontend/set_user_data", key: this._lkey(), value: {} }); } catch (e) { /* rien */ }
    window.dispatchEvent(new CustomEvent("plan-maison-layout-reset", { detail: { key: this._lkey() } }));
    this._layout = null; this._fit(); this._render();
  }
}

/* ---------- utilitaires ---------- */
const MULTI = ["#e5484d", "#f5a524", "#30a46c", "#3e7bfa", "#c04bd8"];
function garPath(pts, sag) { let d = ""; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; d += `M${a[0]} ${a[1]}Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 + sag} ${b[0]} ${b[1]}`; } return d; }
function rectOf(p) {
  if (p.length !== 4) return null;
  const xs = [...new Set(p.map((q) => q[0]))], ys = [...new Set(p.map((q) => q[1]))];
  if (xs.length !== 2 || ys.length !== 2) return null;
  for (let i = 0; i < 4; i++) { const a = p[i], b = p[(i + 1) % 4]; if (a[0] !== b[0] && a[1] !== b[1]) return null; }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
function onSeg(q, a, b) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return Math.abs(Math.hypot(q[0] - a[0], q[1] - a[1]) + Math.hypot(q[0] - b[0], q[1] - b[1]) - L) < 0.05; }
function onPoly(q, p) { return p.some((a, i) => onSeg(q, a, p[(i + 1) % p.length])); }
function onOther(A, B, rooms, skip) { return rooms.some((r, i) => i !== skip && onPoly(A, r.pts) && onPoly(B, r.pts)); }
function bbox(parts) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9; const e = (p, q, r, s) => { a = Math.min(a, p); b = Math.min(b, q); c = Math.max(c, r); d = Math.max(d, s); };
  parts.forEach((p) => { if (p[0] === "r") e(p[1], p[2], p[1] + p[3], p[2] + p[4]); else if (p[0] === "c") e(p[1] - p[3], p[2] - p[3], p[1] + p[3], p[2] + p[3]); else if (p[0] === "e") e(p[1] - p[3], p[2] - p[4], p[1] + p[3], p[2] + p[4]); else e(Math.min(p[1], p[3]), Math.min(p[2], p[4]), Math.max(p[1], p[3]), Math.max(p[2], p[4])); });
  return { x: a, y: b, w: c - a, h: d - b, cx: (a + c) / 2, cy: (b + d) / 2 };
}

if (!customElements.get("plan-maison-card-editor")) customElements.define("plan-maison-card-editor", PlanMaisonCardEditor);
