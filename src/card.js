// plan-maison-card : plan de maison interactif et éditable pour Home Assistant.
import { ICONS, ALWAYS, ACCENT, guess } from "./icons.js";
import { CAT, FSTYLE } from "./furniture.js";
import { furnSvg, FURN_DEFS } from "./furnart.js";
import { BASE_CSS, WIDGET_CSS, ICON_CSS, WSVG } from "./styles.js";
import * as G from "./geometry.js";
import { toYaml } from "./yaml.js";
import { STUB } from "./stub.js";
import "./editor.js";
import { createPicker, PICKER_CSS, DEVICE_DOMAINS, describe } from "./picker.js";

export const VERSION = "1.5.3";
const NS = "http://www.w3.org/2000/svg";
const FONTS = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&family=JetBrains+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&display=swap";
const TOGGLE = ["light", "switch", "input_boolean", "fan"];
const NA = ["unavailable", "unknown"];
const KIND = { toggle: "t", info: "i", value: "l", widget: "w", t: "t", i: "i", l: "l", w: "w" };
const EXTRA_CSS = `.zone .patch{fill:var(--deck);stroke:var(--deck-line);stroke-width:.4}.zone .pool{fill:#9fd6ef;stroke:#5ba7cc;stroke-width:.6}:host(.dark) .zone .pool{fill:#2f5f78;stroke:#4f8fae}.zone .gravel{fill:#e6e0d4;stroke:#c9bfae;stroke-width:.4}:host(.dark) .zone .gravel{fill:#3a372f;stroke:#57524a}.zone:hover .patch,.zone:hover .pool,.zone:hover .gravel{fill:var(--hover)}.zone.sel .patch,.zone.sel .pool,.zone.sel .gravel{fill:var(--sel-soft)}
.err{padding:16px;color:var(--na);font-family:var(--f-mono);font-size:13px;white-space:pre-wrap}.exp textarea{width:100%;min-height:260px;font-family:var(--f-mono);font-size:11.5px;color:var(--ink);background:var(--paper);border:1px solid var(--line);padding:8px;resize:vertical}.pop.xl{width:min(620px,calc(100% - 16px))}.tb-r{display:inline-flex;gap:6px;align-items:center}`;

const slug = (s) => String(s || "plan").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const fr = (n, d) => (d == null ? String(Math.round(n * 100) / 100) : n.toFixed(d)).replace(".", ",");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const tempColor = (t) => (t == null || isNaN(t) ? "#f5a524" : t < 5 ? "#3e7bfa" : t < 15 ? "#2bb3a3" : t < 25 ? "#f5a524" : t < 32 ? "#f07a2c" : "#e5484d");
const DC_COLOR = { temperature: "temperature", humidity: "#3e7bfa", pressure: "#8e6bd8", atmospheric_pressure: "#8e6bd8", precipitation: "#2bb3a3", precipitation_intensity: "#2bb3a3", wind_speed: "#5aa0ff", battery: "#30a46c", illuminance: "#f5a524", power: "#f07a2c", energy: "#f07a2c" };
const DC_ICON = { temperature: "mdi:thermometer", humidity: "mdi:water-percent", pressure: "mdi:gauge", atmospheric_pressure: "mdi:gauge", precipitation: "mdi:weather-rainy", precipitation_intensity: "mdi:weather-pouring", wind_speed: "mdi:weather-windy", battery: "mdi:battery", illuminance: "mdi:brightness-5", power: "mdi:flash", energy: "mdi:lightning-bolt" };

/** Type de widget animé pour un capteur, d'après sa classe ou son unité. */
function widgetType(st, entity) {
  if (!st || entity.split(".")[0] !== "sensor") return null;
  const a = st.attributes || {}, dc = a.device_class || "", u = a.unit_of_measurement || "", id = entity.toLowerCase();
  if (dc === "temperature" || u === "°C" || u === "°F") return "temp";
  if (dc === "wind_speed" || (/km\/h|m\/s|mph|kn/.test(u) && /vent|wind|anemo/.test(id))) return "wind";
  if (dc === "precipitation" || dc === "precipitation_intensity" || (/^(mm|in)(\/h)?$/.test(u) && /pluie|rain|pluvio/.test(id))) return "rain";
  if (dc === "pressure" || dc === "atmospheric_pressure" || /^(hPa|mbar|inHg)$/.test(u)) return "baro";
  return null;
}

class PlanMaisonCard extends HTMLElement {
  static getStubConfig() { return JSON.parse(JSON.stringify(STUB)); }
  static getConfigElement() { return document.createElement("plan-maison-card-editor"); }
  getCardSize() { return 16; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  setConfig(c) {
    if (!c) throw new Error("Configuration manquante.");
    const model = G.buildModel(c); // lève une erreur lisible si la config est invalide
    this._config = c; this._model = model;
    this._key = c.layout_key || "plan_maison_" + slug(c.title);
    this._defAX = Object.fromEntries(Object.entries(model.axes).map(([k, a]) => [k, a.def]));
    this._NB = G.axisNeighbours(model);
    this._view = this._computeView();
    if (this.shadowRoot && this._hass) this._reconfig();
  }

  set hass(h) {
    const first = !this._hass; this._hass = h;
    if (first) { this._setup(); this._load(); return; }
    this._theme();
    if (this._built) { this._states(); this._meteo(); this._live(); if (!this._dragging) this._panelSoon(); }
  }
  _panelSoon() { clearTimeout(this._pt0); this._pt0 = setTimeout(() => this._panel(), 300); }
  _theme() { const t = this._config.theme; this.classList.toggle("dark", t === "dark" || (t !== "light" && !!(this._hass.themes && this._hass.themes.darkMode))); }

  /* ---------- mise en place ---------- */
  _computeView() {
    const m = this._model;
    if (m.view) return m.view;
    const pts = [];
    m.rooms.forEach((r) => r.pts.forEach((p) => pts.push(G.ptVal(p, this._defAX))));
    m.zones.forEach((z) => { pts.push([z.rect[0], z.rect[1]], [z.rect[2], z.rect[3]]); });
    m.devices.forEach((d) => d.pos && pts.push(d.pos));
    m.garlands.forEach((l) => l.pts.forEach((p) => pts.push(p)));
    if (m.garden) m.garden.trees.forEach((t) => pts.push([t[0] - t[2], t[1] - t[2]], [t[0] + t[2], t[1] + t[2]]));
    if (!pts.length) return [-20, -20, 190, 140];
    const b = G.bboxPts(pts), pad = Math.max(12, 0.12 * Math.max(b.X - b.x, b.Y - b.y));
    // échelle minimale : une petite maison garde des murs et des textes à taille raisonnable
    let w = b.X - b.x + 2 * pad, h = b.Y - b.y + 2 * pad + 22, x = b.x - pad, y = b.y - pad;
    if (w < 190) { x -= (190 - w) / 2; w = 190; }
    if (h < 140) { y -= (140 - h) / 2; h = 140; }
    return [x, y, w, h].map((v) => Math.round(v));
  }
  _dock() { const v = this._view; return { x: v[0] + 4, y: v[1] + v[3] - 26, w: 40, h: 20 }; }

  _setup() {
    if (this._config.fonts !== false && !document.querySelector("link[data-pm-fonts]")) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = FONTS; l.dataset.pmFonts = "1"; document.head.appendChild(l); }
    this._theme();
    this._mode = "view"; this._sel = null; this._focus = null;
    this._L = { axes: {}, pos: {}, furn: {}, added: [], devAdded: [], devHidden: {}, names: {}, icons: {} };
    this._AX = Object.assign({}, this._defAX); this._geo();
    const r = this.attachShadow({ mode: "open" });
    r.innerHTML = `<style>${BASE_CSS}${WIDGET_CSS}${ICON_CSS}${EXTRA_CSS}${PICKER_CSS}</style><ha-card><div class="wrap">
      <header><h1 id="title"></h1><div class="live" id="live"><i></i><span></span></div></header>
      <section class="meteo" id="meteo"></section>
      <div class="main">
        <section class="planbox">
          <div class="toolbar"><span class="lbl">Afficher</span><label class="chk"><input type="checkbox" id="showfurn" checked> Mobilier</label><label class="chk"><input type="checkbox" id="showdev" checked> Équipements</label>
            <span class="sp"></span><span class="tb-r"><span class="lbl">Mode</span><div class="seg" id="seg"><button data-m="view" class="on">Consulter</button><button data-m="dev">Équipements</button><button data-m="furn">Mobilier</button><button data-m="walls">Murs</button></div><button class="btn" id="export" title="Copier la configuration YAML avec la disposition actuelle">Exporter</button></span></div>
          <div class="movebar" id="t-dev" hidden><span>Glisse une pastille pour la placer, touche-la pour changer son icône ou la retirer.</span><span class="sp"></span>
            <span id="ent" style="flex:1;min-width:220px;max-width:340px"></span>
            <select id="restore"></select><button class="btn" id="dev-restore">Remettre</button><button class="btn" id="dev-reset">Rétablir les équipements</button></div>
          <div class="movebar" id="t-furn" hidden><span>Glisse un meuble, touche-le pour le pivoter ou le retirer (clavier : flèches, R, Suppr).</span><span class="sp"></span>
            <button class="btn solid" id="furn-lib">Ajouter un meuble…</button><button class="btn" id="furn-reset">Rétablir le mobilier</button></div>
          <div class="movebar" id="t-walls" hidden><span id="winfo">Glisse une poignée bleue pour déplacer une cloison, au pas de 5 cm. Les cloisons voisines sont poussées si besoin.</span><span class="sp"></span><button class="btn" id="walls-reset">Rétablir les murs</button></div>
          <div class="stage" id="stage"><svg id="svg"></svg><div class="ovl" id="ovl"></div><div class="pop" id="pop" hidden></div></div>
          <div class="legend"><span><i class="dot" style="background:var(--on-fill);border-color:var(--on)"></i>Allumé, ouvert</span><span><i class="dot"></i>Éteint, fermé</span>
            <span><i class="dot" style="border-color:var(--on);border-width:2.5px"></i>À surveiller</span><span><i class="dot" style="background:var(--na-soft);border-color:var(--na);border-style:dashed"></i>Indisponible</span>
            <span>Clic : allumer ou éteindre · appui long : fiche</span></div>
        </section>
        <aside class="panel" id="panel"></aside>
      </div></div></ha-card>`;
    const $ = (id) => r.getElementById(id);
    this.$ = $; this._svg = $("svg"); this._ovl = $("ovl"); this._pop = $("pop"); this._stage = $("stage");
    this._head();
    $("seg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) this._setMode(b.dataset.m); });
    $("showdev").addEventListener("change", () => this._build());
    $("showfurn").addEventListener("change", () => this._build());
    $("export").addEventListener("click", () => this._export());
    $("furn-lib").addEventListener("click", () => this._furnLib());
    $("furn-reset").addEventListener("click", () => this._confirm($("furn-reset"), () => { this._L.furn = {}; this._L.added = []; this._save(); this._build(); }));
    $("walls-reset").addEventListener("click", () => this._confirm($("walls-reset"), () => { this._L.axes = {}; this._AX = Object.assign({}, this._defAX); this._geo(); this._save(); this._build(); this._panel(); }));
    $("dev-reset").addEventListener("click", () => this._confirm($("dev-reset"), () => { this._L.pos = {}; this._L.devAdded = []; this._L.devHidden = {}; this._L.icons = {}; this._save(); this._build(); this._panel(); }));
    $("dev-restore").addEventListener("click", () => { const id = $("restore").value; if (!id) return; delete this._L.devHidden[id]; this._save(); this._build(); });
    { const pk = createPicker({ hass: () => this._hass, keepText: false, domains: DEVICE_DOMAINS, placeholder: "Ajouter un appareil : tape son nom…", onPick: (e) => this._addDev(e) }); pk.style.cssText = "flex:1;min-width:220px;max-width:340px"; $("ent").replaceWith(pk); }
    this._kd = (e) => this._keydown(e); document.addEventListener("keydown", this._kd);
  }
  _head() {
    const c = this._config;
    this.$("title").textContent = c.title != null ? c.title : "Maison";
    this.$("title").parentElement.hidden = c.header === false;
    this._svg.setAttribute("viewBox", this._view.join(" "));
    const mt = this.$("meteo"); mt.textContent = ""; mt.hidden = !(c.banner && c.banner.length);
  }
  _reconfig() {
    this._AX = Object.assign({}, this._defAX);
    Object.keys(this._L.axes || {}).forEach((k) => { if (k in this._AX) this._AX[k] = this._L.axes[k]; });
    this._theme(); this._head(); this._geo(); this._build(); this._meteo(); this._panel();
  }
  connectedCallback() {
    if (this._kd) { document.removeEventListener("keydown", this._kd); document.addEventListener("keydown", this._kd); }
    if (!this._rs) this._rs = (e) => { if (!this._L || !e.detail || e.detail.key !== this._key) return; this._L = { axes: {}, pos: {}, furn: {}, added: [], devAdded: [], devHidden: {}, names: {}, icons: {} }; if (this._built) this._reconfig(); };
    window.addEventListener("plan-maison-layout-reset", this._rs);
  }
  disconnectedCallback() { if (this._kd) document.removeEventListener("keydown", this._kd); if (this._rs) window.removeEventListener("plan-maison-layout-reset", this._rs); }
  _confirm(btn, fn) {
    if (btn.dataset.arm !== "1") { btn.dataset.arm = "1"; const t = btn.textContent; btn.dataset.t = t; btn.textContent = "Confirmer"; setTimeout(() => { if (btn.dataset.arm === "1") { btn.dataset.arm = ""; btn.textContent = t; } }, 3000); return; }
    btn.dataset.arm = ""; btn.textContent = btn.dataset.t || btn.textContent; fn();
  }
  async _load() {
    try { const r = await this._hass.callWS({ type: "frontend/get_user_data", key: this._key }); if (r && r.value) this._L = Object.assign(this._L, r.value); } catch (e) { /* disposition par défaut */ }
    ["axes", "pos", "furn", "devHidden", "names", "icons"].forEach((k) => (this._L[k] = this._L[k] || {}));
    ["added", "devAdded"].forEach((k) => (this._L[k] = this._L[k] || []));
    Object.keys(this._L.axes).forEach((k) => { if (k in this._AX) this._AX[k] = this._L.axes[k]; });
    this._geo(); this._build(); this._built = true; this._meteo(); this._live(); this._panel();
  }
  _save() { clearTimeout(this._st); this._st = setTimeout(() => this._hass.callWS({ type: "frontend/set_user_data", key: this._key, value: this._L }).catch(() => {}), 400); }

  /* ---------- en-tête et bandeau ---------- */
  _num(e) { const s = this._hass.states[e]; if (!s || NA.includes(s.state)) return null; const n = parseFloat(s.state); return isNaN(n) ? null : n; }
  _valTxt(e, d) { const s = this._hass.states[e]; if (!s || NA.includes(s.state)) return "–"; const n = parseFloat(s.state); return isNaN(n) || !/^-?[\d.]+(e[+-]?\d+)?$/i.test(s.state) ? s.state : fr(n, d == null ? undefined : +d); }
  _tpl(str, ctx = {}) {
    if (!str) return "";
    return String(str)
      .replace(/\{([a-z_]+\.[a-z0-9_]+)(?::(\d))?\}/gi, (m, e, d) => this._valTxt(e, d))
      .replace(/\{value(?::(\d))?\}/g, (m, d) => (ctx.entity ? this._valTxt(ctx.entity, d) : ""))
      .replace(/\{state\}/g, () => (ctx.entity ? this._fmt(this._hass.states[ctx.entity]) : ""))
      .replace(/\{name\}/g, () => ctx.name || "")
      .replace(/\{since\}/g, () => { const s = ctx.entity && this._hass.states[ctx.entity]; return s ? new Date(s.last_changed).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""; });
  }
  _live() { const sp = this.$("live").querySelector("span"); sp.textContent = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " · en direct " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  _meteo() {
    const list = this._config.banner || [], box = this.$("meteo");
    if (!list.length) return;
    const tiles = list.map((t) => {
      const s = this._hass.states[t.entity], raw = s ? s.state : null, a = (s && s.attributes) || {}, n = this._num(t.entity);
      const value = !s || NA.includes(raw) ? "–" : n == null ? raw : fr(n, t.decimals);
      const unit = t.unit != null ? t.unit : n == null ? "" : a.unit_of_measurement || "";
      let color = (t.colors && t.colors[raw]) || t.color || DC_COLOR[a.device_class] || "#8a949c";
      if (color === "temperature") color = tempColor(n);
      const icon = (t.icons && t.icons[raw]) || t.icon || a.icon || DC_ICON[a.device_class] || "mdi:information-outline";
      return { e: t.entity, k: t.name || a.friendly_name || t.entity, v: value, u: unit, s: this._tpl(t.secondary, { entity: t.entity }), icon, color };
    });
    if (box.children.length !== tiles.length) { box.innerHTML = tiles.map((t) => `<div class="m" data-e="${esc(t.e)}"><span class="ic"><ha-icon></ha-icon></span><span class="tx"><span class="k"></span><span class="v"></span><span class="s"></span></span></div>`).join(""); box.querySelectorAll(".m").forEach((m) => (m.onclick = () => this._more(m.dataset.e))); }
    [...box.children].forEach((m, i) => { const t = tiles[i]; m.style.setProperty("--ac", t.color); m.querySelector("ha-icon").setAttribute("icon", t.icon); m.querySelector(".k").textContent = t.k; m.querySelector(".v").innerHTML = esc(t.v) + (t.u ? "<small>" + esc(t.u) + "</small>" : ""); m.querySelector(".s").textContent = t.s; });
  }

  /* ---------- géométrie ---------- */
  _geo() {
    const AX = this._AX, m = this._model;
    this._P = {}; this._LB = this._LB || {}; this._LS = this._LS || {};
    m.rooms.forEach((r) => { this._P[r.id] = r.pts.map((q) => G.ptVal(q, AX)); });
    this._labels();
    this._OP = m.openings.map((o) => ({ ...o, p: [G.ptVal(o.a, AX), G.ptVal(o.b, AX)] }));
    this._W = G.computeWalls(Object.values(this._P), this._OP);
  }
  _rname(r) { return (this._L && this._L.names[r.id]) || r.name; }
  /** Place les noms de pièces en évitant meubles et pastilles. */
  _labels() {
    const obs = [];
    if (this._hass && this._L && (!this.$ || this.$("showfurn").checked)) this._furn().forEach((f) => { const b = this._bbox(f.parts); obs.push([f.x + b.x, f.y + b.y, f.x + b.x + b.w, f.y + b.y + b.h]); });
    if (this._hass && this._L) this._devs().forEach((d) => { if (!d.pos) return; const rx = d.kind === "w" ? 14 : d.kind === "l" ? 6.5 : 4.6, ry = d.kind === "w" ? 5.8 : d.kind === "l" ? 2.6 : 4.6; obs.push([d.pos[0] - rx, d.pos[1] - ry, d.pos[0] + rx, d.pos[1] + ry]); });
    this._model.rooms.forEach((r) => {
      const p = this._P[r.id], ar = G.area(p), name = this._rname(r);
      let ls = r.ls || Math.max(2.2, Math.min(4.4, 0.85 * Math.sqrt(ar)));
      let lb;
      if (r.label) lb = G.ptVal(r.label, this._AX);
      else {
        // essaie la taille normale puis des tailles réduites si la pièce est encombrée
        let bs = -Infinity;
        for (const k of [1, 0.82, 0.68]) {
          const c = G.labelPoint(p, obs, [Math.max(4, name.length) * 0.78 * ls * k, ls * k * 1.9]), sc = c.score - (1 - k) * 10;
          if (sc > bs) { bs = sc; lb = c; lb.k = k; }
        }
        if (lb.k) ls *= lb.k;
      }
      ls = Math.max(1.6, Math.min(ls, (G.chord(p, lb[0], lb[1]) * 0.86) / (Math.max(4, name.length) * 0.78)));
      this._LS[r.id] = ls; this._LB[r.id] = [lb[0], lb[1] - ls * 0.1];
    });
  }
  _inRect(p, r) { return p[0] >= r[0] && p[0] <= r[2] && p[1] >= r[1] && p[1] <= r[3]; }
  _bbox(parts) {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9; const e = (p, q, r, s) => { a = Math.min(a, p); b = Math.min(b, q); c = Math.max(c, r); d = Math.max(d, s); };
    parts.forEach((p) => { if (p[0] === "r") e(p[1], p[2], p[1] + p[3], p[2] + p[4]); else if (p[0] === "c") e(p[1] - p[3], p[2] - p[3], p[1] + p[3], p[2] + p[3]); else if (p[0] === "e") e(p[1] - p[3], p[2] - p[4], p[1] + p[3], p[2] + p[4]); else e(Math.min(p[1], p[3]), Math.min(p[2], p[4]), Math.max(p[1], p[3]), Math.max(p[2], p[4])); });
    return { x: a, y: b, w: c - a, h: d - b, cx: (a + c) / 2, cy: (b + d) / 2 };
  }

  /* ---------- données ---------- */
  _devInfo(d) {
    const st = this._hass && this._hass.states[d.entity], dom = d.entity.split(".")[0];
    let kind = KIND[d.kind] || null;
    const wg = d.widget === false ? null : widgetType(st, d.entity);
    const ov = this._L.icons[d.id], chosen = !!ov || (!!d.icon && (!!ICONS[d.icon] || /^mdi:/.test(d.icon)));
    const unit = dom === "sensor" && !!st && !!st.attributes.unit_of_measurement;
    // une icône choisie (éditeur ou carte) l'emporte sur l'affichage automatique en valeur, la valeur restant en pastille ;
    // les widgets météo (température, vent, pluie, pression) restent prioritaires (widget: false pour afficher l'icône)
    if (!kind) kind = TOGGLE.includes(dom) ? "t" : unit && (!chosen || wg) ? "l" : "i";
    if (kind === "l" && wg) kind = "w";
    let ik = ov || (d.icon && ICONS[d.icon] ? d.icon : null), mdi = null;
    if (!ik && d.icon && /^mdi:/.test(d.icon)) mdi = d.icon;
    if (!ik) ik = guess(st, d.entity);
    return { ...d, kind, wg: kind === "w" ? wg || "temp" : null, ik, mdi: ov ? null : mdi, val: kind === "i" && unit };
  }
  _devs() {
    const L = this._L;
    const base = this._model.devices.filter((d) => !L.devHidden[d.id]).map((d) => this._devInfo({ ...d, pos: L.pos[d.id] || d.pos }));
    const added = L.devAdded.map((a) => this._devInfo({ id: a.id, entity: a.entity, icon: a.ik || null, kind: a.kind, pos: L.pos[a.id] || a.pos, added: true }));
    return base.concat(added);
  }
  _where(d) {
    const p = d.pos; if (!p) return { k: "none" };
    const r = this._model.rooms.find((r) => G.inPoly(p[0], p[1], this._P[r.id]));
    if (r) return { k: "room", id: r.id };
    const z = this._model.zones.find((z) => { const q = z.rect; return z.type === "shed" ? this._inRect(p, [q[0] - 3, q[1] - 3, q[2] + 13, q[3] + 3]) : this._inRect(p, q); });
    return z ? { k: "spot", id: z.id } : { k: "spot", id: "jardin" };
  }
  _devsAt(id) { return this._devs().filter((d) => this._where(d).id === id); }
  _furn() {
    const L = this._L;
    const base = this._model.furniture.filter((f) => !(L.furn[f.id] && L.furn[f.id].del) && (f.parts || CAT[f.type])).map((f) => {
      const o = L.furn[f.id] || {}, c = CAT[f.type];
      return { id: f.id, name: f.name || (c && c[0]) || "Meuble", x: o.x ?? f.x, y: o.y ?? f.y, rot: o.rot ?? f.rot ?? 0, parts: f.parts || c[1], st: f.style || FSTYLE[f.type] || "wood" };
    });
    const added = L.added.filter((a) => CAT[a.type]).map((a) => ({ id: a.id, name: CAT[a.type][0], x: a.x, y: a.y, rot: a.rot || 0, parts: CAT[a.type][1], st: FSTYLE[a.type] || "wood", added: true }));
    return base.concat(added);
  }
  _setFurn(f, patch) { if (f.added) Object.assign(this._L.added.find((a) => a.id === f.id) || {}, patch); else this._L.furn[f.id] = Object.assign({}, this._L.furn[f.id] || {}, patch); this._save(); }
  _stateOf(d) {
    const st = this._hass.states[d.entity], s = st ? st.state : "unavailable";
    if (NA.includes(s)) return { c: "na", t: "Indisponible" };
    const w = d.warn;
    if (w) {
      const e = w.entity || d.entity, v = this._num(e);
      if (v != null && ((w.above != null && v > w.above) || (w.below != null && v < w.below))) return { c: "warn", t: (w.prefix || "") + this._fmt(this._hass.states[e]) };
    }
    if (d.kind === "l" || d.kind === "w" || d.val) return { c: "ok", t: this._fmt(st) };
    if (d.entity.split(".")[0] === "binary_sensor") {
      const dc = st.attributes.device_class, on = s === "on", door = ["door", "window", "opening", "garage_door"].includes(dc), occ = ["occupancy", "motion", "presence"].includes(dc);
      return { c: on ? "on" : "off", t: on ? (door ? "Ouverte" : occ ? "Présence" : "Actif") : door ? "Fermée" : "Calme" };
    }
    if (["on", "open", "playing", "heat", "home", "cool", "heat_cool"].includes(s)) return { c: "on", t: s === "home" ? "Présent" : "Allumé" };
    if (["off", "closed", "idle", "standby", "not_home", "paused"].includes(s)) return { c: "off", t: s === "idle" ? "En veille" : s === "not_home" ? "Absent" : "Éteint" };
    return { c: "off", t: this._fmt(st) };
  }
  _fmt(st) { if (!st) return "–"; const u = st.attributes.unit_of_measurement, n = parseFloat(st.state); return (isNaN(n) || !/^-?[\d.]+(e[+-]?\d+)?$/i.test(st.state) ? st.state : String(Math.round(n * 10) / 10).replace(".", ",")) + (u ? " " + u : ""); }
  _el(tag, attrs, parent) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }

  /* ---------- modes ---------- */
  _setMode(m) {
    this._mode = m; this._sel = null; this._pop.hidden = true;
    this.$("seg").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
    ["dev", "furn", "walls"].forEach((k) => (this.$("t-" + k).hidden = m !== k));
    if (m === "dev") this.$("showdev").checked = true;
    if (m === "furn") this.$("showfurn").checked = true;
    this._build(); this._panel();
  }
  _center() { if (this._focus && this._LB[this._focus]) return this._LB[this._focus].slice(); const v = this._view; return [v[0] + v[2] / 2, v[1] + v[3] / 2]; }
  _addDev(e) {
    const st = this._hass.states[e]; if (!st) return;
    const c = this._center(), nid = "u" + Date.now().toString(36);
    this._L.devAdded.push({ id: nid, entity: e, pos: [Math.round(c[0] + 6), Math.round(c[1] + 5)], ik: guess(st, e) });
    this._save(); this._sel = { k: "d", id: nid }; this._build();
    const nd = this._devs().find((x) => x.id === nid); if (nd && this._mk[nid]) this._devPop(nd);
  }

  /* ---------- dessin ---------- */
  _build() {
    const s = this._svg, el = this._el.bind(this);
    s.textContent = "";
    this._stage.className = "stage m-" + this._mode + (this._mode !== "view" ? " editing" : "") + (this.$("showdev").checked ? "" : " hide-dev");
    const defs = el("defs", {}, s);
    const pat = el("pattern", { id: "pmh", width: 3, height: 3, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 3, height: 3, class: "hb" }, pat); el("line", { x1: 0, y1: 0, x2: 0, y2: 3, class: "hl" }, pat);
    el("feGaussianBlur", { stdDeviation: 0.8 }, el("filter", { id: "pmb" }, defs));
    const lw = el("pattern", { id: "pml", width: 24, height: 24, patternUnits: "userSpaceOnUse", patternTransform: "rotate(-18)" }, defs); el("rect", { width: 12, height: 24, class: "lawn-a" }, lw);
    const tf = el("pattern", { id: "pmg", width: 7, height: 7, patternUnits: "userSpaceOnUse" }, defs); el("path", { d: "M1 6l.5-1.6M1.6 6l.1-1.8M2.2 6l-.4-1.5M4.6 3l.5-1.5M5.2 3l.1-1.7", class: "tuft" }, tf);
    const rg = el("radialGradient", { id: "pmt", cx: 0.38, cy: 0.34, r: 0.7 }, defs); el("stop", { offset: 0, class: "hi0" }, rg); el("stop", { offset: 0.55, class: "hi1" }, rg); el("stop", { offset: 1, class: "hi2" }, rg);
    const rug = el("pattern", { id: "pmrug", width: 2, height: 2, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs); el("rect", { width: 2, height: 2, class: "rg1" }, rug); el("rect", { width: 1, height: 2, class: "rg2" }, rug);
    const gv = el("pattern", { id: "pmgv", width: 2.4, height: 2.4, patternUnits: "userSpaceOnUse" }, defs); el("circle", { cx: 0.6, cy: 0.6, r: 0.28, fill: "#b9ad97" }, gv); el("circle", { cx: 1.8, cy: 1.7, r: 0.22, fill: "#a99c84" }, gv);
    const fsh = el("filter", { id: "pmfs", x: "-40%", y: "-40%", width: "180%", height: "180%" }, defs); el("feDropShadow", { dx: 0.25, dy: 0.35, stdDeviation: 0.35, "flood-opacity": 0.25 }, fsh); defs.insertAdjacentHTML("beforeend", FURN_DEFS);
    this._cg = el("g", {}, s); this._content(this._cg);
    if (this._mode === "walls") this._handles(el("g", {}, s));
    this._overlay(); this._states();
  }
  _pick(id) { if (this._mode !== "view") return; this._focus = this._focus === id ? null : id; this._build(); this._panel(); }
  _autoTrees() {
    if (this._trees) return this._trees;
    const v = this._view, m = this._model, out = [];
    const busy = (x, y, r) => m.rooms.some((rm) => { const b = G.bboxPts(this._P[rm.id]); return x + r > b.x - 4 && x - r < b.X + 4 && y + r > b.y - 4 && y - r < b.Y + 4; }) || m.zones.some((z) => x + r > z.rect[0] - 3 && x - r < z.rect[2] + 3 && y + r > z.rect[1] - 3 && y - r < z.rect[3] + 3) || out.some((t) => Math.hypot(t[0] - x, t[1] - y) < t[2] + r + 2) || m.devices.some((d) => d.pos && Math.abs(d.pos[0] - x) < r + 14 && Math.abs(d.pos[1] - y) < r + 6) || (x - r < v[0] + 40 && y - r < v[1] + 16) || (x - r < v[0] + 48 && y + r > v[1] + v[3] - 30);
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 160 && out.length < 9; i++) {
      const r = 4 + rnd() * 9, x = v[0] + r + rnd() * (v[2] - 2 * r), y = v[1] + r + rnd() * (v[3] - 26 - 2 * r);
      if (!busy(x, y, r)) out.push([x, y, r, ["t1", "t2", "t3"][i % 3]]);
    }
    return (this._trees = out);
  }
  _content(g) {
    const el = this._el.bind(this), m = this._model, f = this._focus, V = this._view;
    this._labels();
    const garden = el("rect", { x: V[0], y: V[1], width: V[2], height: V[3], class: "garden" + (f === "jardin" ? " sel" : "") }, g);
    garden.onclick = () => this._pick("jardin");
    if (m.garden) {
      if (m.garden.label) el("text", { x: V[0] + 6, y: V[1] + 10, class: "glab", "font-size": 3.4 }, g).textContent = m.garden.label;
      el("rect", { x: V[0], y: V[1], width: V[2], height: V[3], fill: "url(#pml)", class: "deco" }, g);
      el("rect", { x: V[0], y: V[1], width: V[2], height: V[3], fill: "url(#pmg)", class: "deco" }, g);
      m.garden.flowers.forEach(([x, y, c]) => { el("circle", { cx: x, cy: y, r: 2.6, class: "bush" }, g); [0, 1, 2, 3, 4].forEach((k) => el("circle", { cx: x + Math.cos(k * 1.26 + x) * 1.3, cy: y + Math.sin(k * 1.26 + x) * 1.3, r: 0.55, fill: c, class: "deco" }, g)); });
      const tree = (x, y, r, t) => {
        const n = r > 6 ? 8 : 5;
        const blob = (dx, dy, cls) => { const gg = el("g", { class: cls }, g); for (let i = 0; i < n; i++) { const a = (i * 2 * Math.PI) / n + x * 0.7, rr = r * (0.5 + 0.08 * Math.sin(i * 2.3 + y)); el("circle", { cx: x + dx + Math.cos(a) * r * 0.5, cy: y + dy + Math.sin(a) * r * 0.5, r: rr }, gg); } el("circle", { cx: x + dx, cy: y + dy, r: r * 0.62 }, gg); };
        blob(r * 0.14, r * 0.18, "tsh"); blob(0, 0, "tree " + t);
        el("circle", { cx: x, cy: y, r: r * 0.98, fill: "url(#pmt)", class: "deco" }, g);
        el("circle", { cx: x - r * 0.05, cy: y - r * 0.05, r: Math.max(0.5, r * 0.07), class: "trunk" }, g);
      };
      (m.garden.autoTrees ? this._autoTrees() : m.garden.trees).forEach((t) => tree(...t));
      m.garden.paths.forEach((p) => el("path", { d: "M" + p.map((q) => q.join(" ")).join("L"), class: "dash", fill: "none" }, g));
    }
    m.zones.forEach((z) => {
      const [x1, y1, x2, y2] = z.rect, w = x2 - x1, h = y2 - y1;
      const zg = el("g", { class: (z.type === "shed" ? "shed" : "zone") + (f === z.id ? " sel" : "") }, g);
      zg.onclick = (e) => { e.stopPropagation(); this._pick(z.id); };
      if (z.type === "shed") {
        el("rect", { x: x1, y: y1, width: w, height: h, class: "box" }, zg);
        el("path", { d: `M${x1} ${y1}L${x2} ${y2}M${x2} ${y1}L${x1} ${y2}`, class: "l" }, zg);
        el("text", { x: x1 + w / 2, y: y1 - 2.5, "text-anchor": "middle", class: "lab", "font-size": 2.6 }, zg).textContent = z.name;
        return;
      }
      const zr = el("rect", { x: x1, y: y1, width: w, height: h, rx: z.type === "pool" ? 1.5 : z.type === "patch" ? 1 : 0, class: z.type === "deck" ? "deck" : z.type }, zg);
      if (z.type === "gravel") zr.style.fill = "url(#pmgv)";
      if (z.type === "deck" && z.pattern === "tiles") { for (let x = x1 + 5; x < x2; x += 5) el("line", { x1: x, y1, x2: x, y2, class: "slat" }, zg); for (let y = y1 + 5; y < y2; y += 5) el("line", { x1, y1: y, x2, y2: y, class: "slat" }, zg); }
      if (z.type === "deck" && z.pattern === "slats") for (let y = y1 + 2.5; y < y2; y += 2.5) el("line", { x1, y1: y, x2, y2: y, class: "slat" }, zg);
      if (z.posts) [[x1, y1], [x2, y1], [x1, y2], [x2, y2], ...(h > 30 ? [[x1, (y1 + y2) / 2], [x2, (y1 + y2) / 2]] : []), ...(w > 30 ? [[(x1 + x2) / 2, y1], [(x1 + x2) / 2, y2]] : [])].forEach(([px, py]) => el("rect", { x: px - 1, y: py - 1, width: 2, height: 2, class: "post" }, zg));
      const above = z.posts || h < 12;
      el("text", above ? { x: x1 + w / 2, y: y1 - 2, "text-anchor": "middle", class: "lab", "font-size": 2.8 } : { x: x2 - 2, y: y2 - 2.5, "text-anchor": "end", class: "lab", "font-size": 2.8 }, zg).textContent = z.name;
      if (z.size) el("text", { x: x1 + w / 2, y: y2 + 3.6, "text-anchor": "middle", class: "area", "font-size": 2 }, zg).textContent = `${fr(w / 10)} × ${fr(h / 10)} m`;
    });
    const D = this._dock(), dk = el("g", { class: "dock" }, g);
    el("rect", { x: D.x, y: D.y, width: D.w, height: D.h }, dk);
    el("text", { x: D.x + 2, y: D.y + 3.6, class: "glab", "font-size": 2.4 }, dk).textContent = "À placer";
    m.rooms.forEach((r) => { el("polygon", { points: this._P[r.id].map((p) => p.join(",")).join(" "), class: "room " + r.kind + (f === r.id ? " sel" : "") }, g).onclick = (e) => { e.stopPropagation(); this._pick(r.id); }; });
    if (this.$("showfurn").checked) {
      const fg = el("g", {}, g);
      this._furn().forEach((it) => {
        const b = this._bbox(it.parts);
        const pg = el("g", { class: "piece fs-" + it.st + (this._sel && this._sel.k === "f" && this._sel.id === it.id ? " sel" : ""), "data-id": it.id, transform: `translate(${it.x},${it.y}) rotate(${it.rot},${b.cx},${b.cy})` }, fg);
        el("rect", { x: b.x - 0.6, y: b.y - 0.6, width: b.w + 1.2, height: b.h + 1.2, class: "hitr" }, pg);
        pg.insertAdjacentHTML("beforeend", furnSvg(it.parts, it.st));
        this._dragPiece(pg, it, b);
      });
    }
    this._W.forEach(([x1, y1, x2, y2, c]) => el("line", { x1, y1, x2, y2, class: c }, g));
    this._OP.forEach((o) => {
      const [[x1, y1], [x2, y2]] = o.p;
      if (o.type === "window") { el("rect", y1 === y2 ? { x: Math.min(x1, x2), y: y1 - 1.6, width: Math.abs(x2 - x1), height: 3.2, class: "win" } : { x: x1 - 1.6, y: Math.min(y1, y2), width: 3.2, height: Math.abs(y2 - y1), class: "win" }, g); el("line", { x1, y1, x2, y2, class: "win" }, g); }
      else if (o.type === "open" && o.dashed) el("line", { x1, y1, x2, y2, class: "open" }, g);
      else if (o.type === "door" && o.swing) {
        const r = Math.hypot(x2 - x1, y2 - y1), d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[o.swing] || [0, -1];
        const tx = x1 + d[0] * r, ty = y1 + d[1] * r, cr = (tx - x1) * (y2 - y1) - (ty - y1) * (x2 - x1);
        el("path", { d: `M${x1} ${y1}L${tx} ${ty}A${r} ${r} 0 0 ${cr > 0 ? 1 : 0} ${x2} ${y2}`, class: "door" }, g);
      }
      if (o.label) {
        const d = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[o.swing] || (y1 === y2 ? [0, 1] : [1, 0]);
        el("text", { x: (x1 + x2) / 2 + d[0] * 5, y: (y1 + y2) / 2 + d[1] * 4.6 + (d[1] < 0 ? 0 : 0) + (d[0] ? 0.8 : 0), "text-anchor": d[0] < 0 ? "end" : d[0] > 0 ? "start" : "middle", class: "glab", "font-size": 2.3 }, g).textContent = o.label;
      }
    });
    this._lightsDraw(g);
    if (!m.rooms.length) {
      el("text", { x: V[0] + V[2] / 2, y: V[1] + V[3] / 2 - 4, "text-anchor": "middle", class: "lab", "font-size": 5 }, g).textContent = "Plan vide";
      el("text", { x: V[0] + V[2] / 2, y: V[1] + V[3] / 2 + 3, "text-anchor": "middle", class: "glab", "font-size": 3 }, g).textContent = "Modifie la carte pour dessiner tes pièces dans l'éditeur visuel.";
    }
    m.rooms.forEach((r) => {
      const [x, y] = this._LB[r.id], fs = this._LS[r.id], a = Math.round(G.area(this._P[r.id]) * 2) / 2;
      el("text", { x, y, "text-anchor": "middle", class: "lab" + (f === r.id ? " sel" : ""), "font-size": fs }, g).textContent = this._rname(r);
      el("text", { x, y: y + fs * 0.95, "text-anchor": "middle", class: "area", "font-size": Math.max(1.9, fs * 0.62) }, g).textContent = (r.area != null ? "" : "≈ ") + fr(a) + " m²";
    });
  }
  _lightsDraw(g) {
    const el = this._el.bind(this);
    const path = (pts, sag) => { let d = ""; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; d += `M${a[0]} ${a[1]}Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 + sag} ${b[0]} ${b[1]}`; } return d; };
    this._lg = {};
    this._model.garlands.forEach((l) => {
      if (l.pts.length < 2) return;
      const d = path(l.pts, l.sag), gg = el("g", { class: "lights" }, g), cols = l.colors, sp = l.gap, w = l.w;
      (this._lg[l.entity] = this._lg[l.entity] || []).push(gg);
      const st = this._hass.states[l.entity];
      el("title", {}, gg).textContent = (l.name || (st && st.attributes.friendly_name) || l.entity || "Guirlande") + (l.entity ? " · clic pour allumer ou éteindre" : " · à relier à un interrupteur dans l'éditeur");
      el("path", { d, class: "cable" }, gg);
      cols.forEach((c, i) => el("path", { d, class: "glow", stroke: c, "stroke-width": w * 2.4, "stroke-linecap": "round", "stroke-dasharray": "0 " + sp * cols.length, "stroke-dashoffset": -sp * i, fill: "none" }, gg));
      cols.forEach((c, i) => el("path", { d, stroke: c, "stroke-width": w, "stroke-linecap": "round", "stroke-dasharray": "0 " + sp * cols.length, "stroke-dashoffset": -sp * i, fill: "none" }, gg));
      el("path", { d, class: "hit" }, gg);
      gg.onclick = (e) => { e.stopPropagation(); if (this._mode === "view" && l.entity) this._tap({ entity: l.entity, kind: "t" }); };
    });
  }

  /* ---------- poignées des cloisons ---------- */
  _axisLabel(k) { return G.axisLabel(k, this._model, this._AX, (r) => this._rname(r)); }
  _handles(g) {
    const el = this._el.bind(this), V = this._view;
    Object.keys(this._model.axes).forEach((k) => {
      if (!G.handlePos(k, this._model, this._AX)) return;
      const dir = this._model.axes[k].dir, hg = el("g", { class: "hdl " + dir }, g);
      el("title", {}, hg).textContent = this._axisLabel(k);
      const guide = el("line", { class: "guide" }, hg), knob = el("rect", { class: "knob", width: dir === "x" ? 3 : 9, height: dir === "x" ? 9 : 3, rx: 1.3 }, hg);
      hg._place = () => {
        const p = G.handlePos(k, this._model, this._AX); if (!p) return;
        const [x, y] = p;
        if (dir === "x") { knob.setAttribute("x", x - 1.5); knob.setAttribute("y", y - 4.5); guide.setAttribute("x1", x); guide.setAttribute("x2", x); guide.setAttribute("y1", V[1]); guide.setAttribute("y2", V[1] + V[3]); }
        else { knob.setAttribute("x", x - 4.5); knob.setAttribute("y", y - 1.5); guide.setAttribute("y1", y); guide.setAttribute("y2", y); guide.setAttribute("x1", V[0]); guide.setAttribute("x2", V[0] + V[2]); }
      };
      hg._place();
      let start = null, v0 = 0;
      hg.addEventListener("pointerdown", (e) => { e.preventDefault(); try { hg.setPointerCapture(e.pointerId); } catch (x) {} start = this._pt(e); v0 = this._AX[k]; hg.classList.add("drag"); this._dragging = true; });
      hg.addEventListener("pointermove", (e) => {
        if (!start) return;
        const p = this._pt(e), want = Math.round((v0 + (dir === "x" ? p.x - start.x : p.y - start.y)) * 2) / 2;
        if (want === this._AX[k]) return;
        const before = JSON.stringify(this._AX);
        const bounds = dir === "x" ? [V[0] + 2, V[0] + V[2] - 2] : [V[1] + 2, V[1] + V[3] - 2];
        G.moveAxis(k, want, this._AX, this._NB, bounds, this._defAX);
        if (JSON.stringify(this._AX) === before) return;
        this._geo(); this._cg.textContent = ""; this._content(this._cg); this._overlay(); this._states();
        g.querySelectorAll(".hdl").forEach((h) => h._place && h._place());
        this.$("winfo").textContent = `${this._axisLabel(k)} : ${fr(this._AX[k] / 10, 2)} m du bord ${dir === "x" ? "ouest" : "nord"}`;
        this._panel();
      });
      const end = () => { if (!start) return; start = null; this._dragging = false; hg.classList.remove("drag"); this._L.axes = Object.fromEntries(Object.entries(this._AX).filter(([kk, v]) => v !== this._defAX[kk])); this._save(); };
      hg.addEventListener("pointerup", end); hg.addEventListener("pointercancel", end);
    });
  }
  _pt(e) { const p = this._svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(this._svg.getScreenCTM().inverse()); }
  _dragPiece(node, it, b) {
    let start = null, moved = false, nx = it.x, ny = it.y;
    node.addEventListener("pointerdown", (e) => { if (this._mode !== "furn") return; e.preventDefault(); e.stopPropagation(); try { node.setPointerCapture(e.pointerId); } catch (x) {} start = this._pt(e); moved = false; this._dragging = true; });
    node.addEventListener("pointermove", (e) => {
      if (!start) return; const p = this._pt(e);
      if (!moved && Math.hypot(p.x - start.x, p.y - start.y) > 0.8) { moved = true; this._pop.hidden = true; }
      if (moved) { nx = Math.round((it.x + p.x - start.x) * 2) / 2; ny = Math.round((it.y + p.y - start.y) * 2) / 2; node.setAttribute("transform", `translate(${nx},${ny}) rotate(${it.rot},${b.cx},${b.cy})`); }
    });
    node.addEventListener("pointerup", () => { if (!start) return; start = null; this._dragging = false; if (moved) this._setFurn(it, { x: nx, y: ny }); this._sel = { k: "f", id: it.id }; this._build(); this._furnPop(it.id); });
  }

  /* ---------- pastilles ---------- */
  _pct(p) { const V = this._view; return [((p[0] - V[0]) / V[2]) * 100, ((p[1] - V[1]) / V[3]) * 100]; }
  _overlay() {
    const o = this._ovl; o.textContent = ""; this._mk = {};
    const hidden = this._model.devices.filter((d) => this._L.devHidden[d.id]);
    this.$("restore").innerHTML = hidden.length ? hidden.map((d) => `<option value="${esc(d.id)}">${esc(this._nm(d))}</option>`).join("") : '<option value="">Aucun équipement retiré</option>';
    let n = 0; const D = this._dock();
    this._devs().forEach((d) => {
      let p = d.pos; if (!p) { p = [D.x + 6 + n * 7.5, D.y + 12]; n++; }
      const [l, t] = this._pct(p), m = document.createElement("div");
      m.className = "mk" + (d.kind === "l" ? " lab" : d.kind === "w" ? " wg wg-" + d.wg : "") + (this._sel && this._sel.k === "d" && this._sel.id === d.id ? " sel" : "");
      m.style.left = l + "%"; m.style.top = t + "%";
      if (d.kind === "w") m.innerHTML = WSVG[d.wg] + '<span class="v"></span>';
      else if (d.kind !== "l") { if (d.mdi) { const i = document.createElement("ha-icon"); i.setAttribute("icon", d.mdi); m.appendChild(i); } else { m.innerHTML = (ICONS[d.ik] || ICONS.generic)[1]; if (ACCENT[d.ik]) m.style.setProperty("--ac", ACCENT[d.ik]); } if (d.val) { m.classList.add("hasv"); m.insertAdjacentHTML("beforeend", '<span class="vb"></span>'); } }
      o.appendChild(m); this._mk[d.id] = { el: m, d }; this._devEvents(m, d, p);
    });
  }
  _devEvents(m, d, p0) {
    let start = null, moved = false, np = null, lp = null, longDone = false;
    m.addEventListener("contextmenu", (e) => { e.preventDefault(); this._more(d.entity); });
    m.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation(); start = this._pt(e); moved = false; longDone = false;
      try { m.setPointerCapture(e.pointerId); } catch (x) {}
      if (this._mode === "view") lp = setTimeout(() => { longDone = true; this._more(d.entity); }, 550); else this._dragging = true;
    });
    m.addEventListener("pointermove", (e) => {
      if (!start || this._mode !== "dev") return;
      const p = this._pt(e);
      if (!moved && Math.hypot(p.x - start.x, p.y - start.y) > 0.8) { moved = true; this._pop.hidden = true; }
      if (moved) { np = [Math.round((p0[0] + p.x - start.x) * 2) / 2, Math.round((p0[1] + p.y - start.y) * 2) / 2]; const [l, t] = this._pct(np); m.style.left = l + "%"; m.style.top = t + "%"; }
    });
    m.addEventListener("pointerup", () => {
      clearTimeout(lp); if (!start) return; start = null; this._dragging = false;
      if (this._mode === "view") { if (!longDone) this._tap(d); return; }
      if (moved && np) { this._L.pos[d.id] = np; this._save(); this._build(); this._panel(); return; }
      this._sel = { k: "d", id: d.id }; this._overlay(); this._states(); this._devPop(d);
    });
    m.addEventListener("pointercancel", () => { clearTimeout(lp); start = null; this._dragging = false; });
  }
  _tap(d) {
    const dom = d.entity.split(".")[0], st = this._hass.states[d.entity];
    if (d.kind === "t" && TOGGLE.includes(dom) && st && !NA.includes(st.state)) this._hass.callService(dom, "toggle", { entity_id: d.entity });
    else this._more(d.entity);
  }
  _more(e) { this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: e }, bubbles: true, composed: true })); }
  _nm(d) { if (d.name) return d.name; const s = this._hass.states[d.entity]; return (s && s.attributes.friendly_name) || d.entity; }
  _wgUpd(m, d) {
    const S = this._hass.states, st = S[d.entity], v = this._num(d.entity), cl = (a, b, x) => Math.max(a, Math.min(b, x));
    const u = st && st.attributes.unit_of_measurement ? st.attributes.unit_of_measurement : "";
    m.querySelector(".v").innerHTML = v == null ? "–" : fr(Math.round(v * 10) / 10) + "<small>" + esc(u) + "</small>";
    const s = m.style;
    if (d.wg === "temp") {
      const t = v == null ? 15 : u === "°F" ? ((v - 32) * 5) / 9 : v;
      s.setProperty("--lvl", cl(0.08, 1, (t + 5) / 45).toFixed(3)); s.setProperty("--tc", tempColor(t));
      s.setProperty("--sun", this._where(d).k !== "room" && t >= 22 ? 1 : 0);
    }
    if (d.wg === "wind") {
      const w = v || 0, gu = (d.gust && this._num(d.gust)) || w;
      s.setProperty("--spd", cl(0.18, 6, 9 / Math.max(w, 0.1)).toFixed(2) + "s"); s.setProperty("--play", w < 0.5 ? "paused" : "running"); s.setProperty("--gust", gu >= 15 ? 1 : w >= 6 ? 0.55 : 0);
    }
    if (d.wg === "baro") s.setProperty("--ang", cl(-90, 90, ((v == null ? 1013 : u === "inHg" ? v * 33.8639 : v) - 1013) * 2.25).toFixed(1) + "deg");
    if (d.wg === "rain") {
      const ri = (d.intensity && this._num(d.intensity)) || 0;
      s.setProperty("--lvl", cl(0, 1, (v || 0) / 20).toFixed(3)); s.setProperty("--rain", ri > 0 ? "running" : "paused"); m.classList.toggle("raining", ri > 0);
    }
  }
  _act(m, d, s) {
    const st = this._hass.states[d.entity];
    let on = s.c === "on" || (!!ALWAYS[d.ik] && s.c !== "na") || (!!d.val && parseFloat(st && st.state) > 0);
    if (d.ik === "solar") on = parseFloat(st && st.state) > 0;
    if (d.ik === "printer") on = !!st && ["home", "printing", "on"].includes(st.state);
    if (d.ik === "tablet") on = on || (!!st && st.state === "on");
    const S = st ? st.state : "";
    if (d.ik === "lock") on = S === "locked" || S === "on";
    if (d.ik === "vacuum") on = ["cleaning", "returning", "on"].includes(S);
    if (d.ik === "speaker" || d.ik === "tv") on = on || ["playing", "on", "buffering"].includes(S);
    if (d.ik === "garage") on = on || ["open", "opening"].includes(S);
    if (d.ik === "ev") on = on || ["charging", "on"].includes(S) || parseFloat(S) > 0;
    if (d.ik === "washer" || d.ik === "dishwasher" || d.ik === "coffee" || d.ik === "oven") on = on || ["running", "on", "heating", "washing", "drying"].includes(String(S).toLowerCase());
    if (d.ik === "thermostat" || d.ik === "radiator" || d.ik === "fire") on = on || (st && ["heating", "heat"].includes(st.attributes.hvac_action || S));
    m.classList.toggle("act", !!on);
  }
  _states() {
    if (!this._mk) return;
    Object.values(this._mk).forEach(({ el, d }) => {
      const s = this._stateOf(d);
      el.classList.toggle("na", s.c === "na"); el.classList.toggle("on", s.c === "on"); el.classList.toggle("warn", s.c === "warn");
      if (d.kind === "w") this._wgUpd(el, d); else if (d.kind === "l") el.textContent = s.c === "na" ? "–" : this._fmt(this._hass.states[d.entity]); else { this._act(el, d, s); if (d.val) el.querySelector(".vb").textContent = s.c === "na" ? "–" : this._fmt(this._hass.states[d.entity]); }
      el.title = `${this._nm(d)} : ${s.t}`;
    });
    if (this._lg) Object.entries(this._lg).forEach(([e, gs]) => gs.forEach((g) => g.classList.toggle("lit", (this._hass.states[e] || {}).state === "on")));
  }

  /* ---------- panneau latéral ---------- */
  _watch() {
    const S = this._hass.states, cfg = this._config.alerts || {}, out = [], ruled = new Set();
    (cfg.rules || []).forEach((r) => {
      const st = S[r.entity]; ruled.add(r.entity);
      const state = st ? st.state : "unavailable", v = this._num(r.entity);
      let hit = false;
      if (r.state != null) hit = [].concat(r.state).map(String).includes(state);
      else if (r.not != null) hit = ![].concat(r.not).map(String).includes(state);
      else if (r.above != null || r.below != null) hit = v != null && ((r.above != null && v > r.above) || (r.below != null && v < r.below));
      if (hit) { const ctx = { entity: r.entity, name: st ? st.attributes.friendly_name : r.entity }; out.push([r.level || "warn", this._tpl(r.title || "{name} : {state}", ctx), this._tpl(r.text || "", ctx)]); }
    });
    if (cfg.auto !== false) {
      this._devs().filter((d) => d.pos && !ruled.has(d.entity)).forEach((d) => {
        const st = S[d.entity];
        if (!st || NA.includes(st.state)) out.push(["na", this._nm(d) + " indisponible", "Ne répond plus."]);
        else if (d.entity.startsWith("binary_sensor.") && st.state === "on" && ["door", "window", "opening", "garage_door"].includes(st.attributes.device_class)) out.push(["warn", this._nm(d) + " ouverte", "Depuis " + new Date(st.last_changed).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + "."]);
        else if (this._stateOf(d).c === "warn" && !(d.warn && d.warn.entity && ruled.has(d.warn.entity))) out.push(["warn", this._nm(d), this._stateOf(d).t]);
      });
    }
    const bat = cfg.battery === undefined ? 20 : cfg.battery;
    if (bat !== false) Object.values(S).forEach((st) => {
      if (ruled.has(st.entity_id) || st.attributes.device_class !== "battery" || !st.entity_id.startsWith("sensor.")) return;
      const v = parseFloat(st.state); if (!isNaN(v) && v < bat) out.push(["info", `Pile faible : ${st.attributes.friendly_name || st.entity_id} à ${Math.round(v)} %`, ""]);
    });
    if (cfg.updates !== false) Object.values(S).forEach((st) => { if (st.entity_id.startsWith("update.") && st.state === "on" && !ruled.has(st.entity_id)) out.push(["info", "Mise à jour : " + (st.attributes.title || st.attributes.friendly_name || st.entity_id), st.attributes.latest_version ? "Version " + st.attributes.latest_version : ""]); });
    const n = this._devs().filter((d) => !d.pos).length;
    if (n) out.push(["info", n + " équipement" + (n > 1 ? "s" : "") + " à placer", "Mode Équipements : glisse-les depuis la case « À placer »."]);
    const rank = { na: 0, warn: 1, info: 2 };
    return out.sort((a, b) => (rank[a[0]] ?? 3) - (rank[b[0]] ?? 3));
  }
  _devList(list) {
    if (!list.length) return '<p class="muted">Aucun équipement placé ici.</p>';
    return '<ul class="devs">' + list.map((d) => {
      const s = this._stateOf(d), dom = d.entity.split(".")[0], tg = d.kind === "t" && TOGGLE.includes(dom) && s.c !== "na";
      return `<li class="dev" data-id="${esc(d.id)}"><span class="n">${esc(this._nm(d))}</span><span class="ctl"><span class="chip ${s.c}">${esc(s.t)}</span>${tg ? `<button class="tgl ${s.c === "on" ? "on" : ""}" data-t="${esc(d.id)}" aria-label="Basculer"></button>` : ""}</span><span class="d" title="${esc(d.entity)}">${esc(describe(this._hass, d.entity))}</span></li>`;
    }).join("") + "</ul>";
  }
  _wire(p) {
    p.querySelectorAll(".dev").forEach((li) => {
      const d = this._devs().find((x) => x.id === li.dataset.id); if (!d) return;
      li.onmouseenter = () => this._mk[d.id] && this._mk[d.id].el.classList.add("hl");
      li.onmouseleave = () => this._mk[d.id] && this._mk[d.id].el.classList.remove("hl");
      li.onclick = (e) => { if (!e.target.closest(".tgl")) this._more(d.entity); };
    });
    p.querySelectorAll(".tgl").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const d = this._devs().find((x) => x.id === b.dataset.t); if (d) this._tap(d); }));
    p.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { this._focus = b.dataset.go; this._build(); this._panel(); }));
    const back = p.querySelector("#back"); if (back) back.onclick = () => { this._focus = null; this._build(); this._panel(); };
  }
  _spots() { const o = {}; this._model.zones.forEach((z) => (o[z.id] = z.name)); if (this._model.garden) o.jardin = this._model.garden.label || "Jardin"; return o; }
  _panel() {
    const p = this.$("panel"); if (!p || !this._P) return;
    const rooms = this._model.rooms, spots = this._spots();
    if (this._mode === "walls") {
      const rows = rooms.map((r) => { const a = G.area(this._P[r.id]), t = r.area, dlt = t != null ? a - t : null, cls = dlt == null ? "" : Math.abs(dlt) < 0.25 ? "ok" : "off"; return `<tr><td>${esc(this._rname(r))}</td><td class="n">${fr(a, 1)}</td><td class="n">${t ?? "–"}</td><td class="n ${cls}">${dlt == null ? "" : Math.abs(dlt) < 0.05 ? "0" : (dlt > 0 ? "+" : "−") + fr(Math.abs(dlt), 1)}</td></tr>`; }).join("");
      p.innerHTML = `<div><div class="eyebrow">Mode murs</div><h2>Cloisons et surfaces</h2></div><p class="muted">Chaque poignée bleue déplace une cloison entière ; les cloisons voisines sont poussées si besoin. « Cote » = surface indiquée dans la configuration.</p>
        <table><thead><tr><th>Pièce</th><th style="text-align:right">m²</th><th style="text-align:right">Cote</th><th style="text-align:right">Écart</th></tr></thead><tbody>${rows}</tbody></table>`;
      return;
    }
    const f = this._focus;
    if (f) {
      const r = rooms.find((x) => x.id === f), devs = this._devsAt(f);
      let head, extra = "";
      if (r) {
        const a = Math.round(G.area(this._P[f]) * 2) / 2;
        head = `<div class="eyebrow">${G.KIND_LABEL[r.kind]} · ${r.area != null ? "" : "≈ "}${fr(a)} m²</div><h2>${esc(this._rname(r))}</h2>`;
        const rd = devs.filter((d) => { const st = this._hass.states[d.entity]; const dc = st && st.attributes.device_class; return dc === "temperature" || dc === "humidity" || d.wg === "temp"; }).slice(0, 4);
        if (rd.length) extra = `<div class="readings">${rd.map((d) => { const st = this._hass.states[d.entity]; return `<div class="rd"><div class="k">${st && st.attributes.device_class === "humidity" ? "Humidité" : "Température"}</div><div class="v">${esc(this._fmt(st))}</div></div>`; }).join("")}</div>`;
        if (r.kind === "todo") extra += '<p class="muted">Espace dont l\'usage reste à préciser.</p>';
      } else head = `<div class="eyebrow">Extérieur</div><h2>${esc(spots[f] || f)}</h2>`;
      p.innerHTML = `<button class="btn" id="back" style="align-self:flex-start">← Vue d'ensemble</button><div>${head}</div>${extra}<h3>Équipements</h3>${this._devList(devs)}`;
    } else {
      const w = this._watch(), all = this._devs(), cnt = (id) => this._devsAt(id).length;
      p.innerHTML = `<div><div class="eyebrow">Vue d'ensemble</div><h2>${rooms.length} pièce${rooms.length > 1 ? "s" : ""}, ${all.length} équipement${all.length > 1 ? "s" : ""}</h2></div>
        <p class="muted">Touche une pastille pour allumer ou éteindre, appui long pour sa fiche. Touche une pièce pour voir ce qu'elle contient.</p>
        <h3>À regarder</h3><ul class="watch">${w.length ? w.map(([c, t, d]) => `<li><span class="bar ${c}"></span><div><div class="t">${esc(t)}</div>${d ? `<div class="d">${esc(d)}</div>` : ""}</div></li>`).join("") : '<li><span class="bar ok"></span><div><div class="t">Rien à signaler</div></div></li>'}</ul>
        <h3>Pièces et extérieur</h3><div class="rooms">${rooms.map((r) => `<button class="rl" data-go="${esc(r.id)}"><span>${esc(this._rname(r))}</span><span class="c">${cnt(r.id) || "–"}</span></button>`).join("")}
        ${Object.keys(spots).map((k) => `<button class="rl" data-go="${esc(k)}"><span>${esc(spots[k])}</span><span class="c">${cnt(k) || "–"}</span></button>`).join("")}</div>`;
    }
    this._wire(p);
  }

  /* ---------- fenêtres contextuelles ---------- */
  _placePop(anchor) {
    const pop = this._pop, sr = this._stage.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    pop.hidden = false;
    let l = ar.left - sr.left + ar.width / 2 - pop.offsetWidth / 2; l = Math.max(8, Math.min(sr.width - pop.offsetWidth - 8, l));
    let t = ar.bottom - sr.top + 6; if (t + pop.offsetHeight > sr.height) t = Math.max(4, ar.top - sr.top - pop.offsetHeight - 6);
    pop.style.left = l + "px"; pop.style.top = t + "px";
  }
  _devPop(d) {
    const pop = this._pop, pick = d.kind !== "w", asVal = d.kind === "l", ov = !!this._L.icons[d.id];
    pop.classList.remove("xl"); pop.classList.toggle("wide", pick);
    pop.innerHTML = `<div><div class="t">${esc(this._nm(d))}</div><div class="s" title="${esc(d.entity)}">${esc(describe(this._hass, d.entity))}</div></div>` +
      (pick ? `<div class="s">${asVal ? "Affiché en valeur. Touche une icône pour afficher l'icône animée (la valeur reste en pastille)" : `Icône animée${ov ? "" : " (choisie automatiquement)"} : touche pour changer`}</div><div class="ipk">${Object.entries(ICONS).map(([k, v]) => `<button data-k="${k}" style="--ac:${ACCENT[k] || "var(--sel)"}" class="${d.ik === k && !d.mdi ? "cur" : ""}" title="${esc(v[0])}">${v[1]}<span>${esc(v[0])}</span></button>`).join("")}</div>` : "") +
      `<div class="row"><button class="btn" id="pm-more">Fiche</button>${ov ? `<button class="btn" id="pm-auto">${d.val && !d.icon ? "Revenir à la valeur" : "Icône auto"}</button>` : ""}<button class="btn danger" id="pm-del">Retirer du plan</button><button class="btn" id="pm-x">Fermer</button></div>`;
    const reopen = () => { this._save(); this._sel = { k: "d", id: d.id }; this._build(); const nd = this._devs().find((x) => x.id === d.id); if (nd && this._mk[d.id]) this._devPop(nd); };
    pop.querySelectorAll(".ipk button").forEach((b) => (b.onclick = () => { this._L.icons[d.id] = b.dataset.k; reopen(); }));
    const au = pop.querySelector("#pm-auto"); if (au) au.onclick = () => { delete this._L.icons[d.id]; reopen(); };
    pop.querySelector("#pm-more").onclick = () => this._more(d.entity);
    pop.querySelector("#pm-x").onclick = () => { pop.hidden = true; this._sel = null; this._overlay(); this._states(); };
    const del = pop.querySelector("#pm-del");
    del.onclick = () => this._confirm(del, () => {
      if (d.added) this._L.devAdded = this._L.devAdded.filter((a) => a.id !== d.id); else this._L.devHidden[d.id] = true;
      delete this._L.pos[d.id]; delete this._L.icons[d.id]; this._save(); pop.hidden = true; this._sel = null; this._build(); this._panel();
    });
    this._placePop(this._mk[d.id].el);
  }
  _furnLib() {
    const pop = this._pop; pop.classList.remove("xl"); pop.classList.add("wide");
    const th = (k) => {
      const parts = CAT[k][1], b = this._bbox(parts), m = Math.max(b.w, b.h) * 0.12 + 0.6, st = FSTYLE[k] || "wood";
      return `<svg class="fth" viewBox="${b.x - m} ${b.y - m} ${b.w + 2 * m} ${b.h + 2 * m}"><g class="fs-${st}">${furnSvg(parts, st)}</g></svg>`;
    };
    pop.innerHTML = `<div><div class="t">Bibliothèque de mobilier</div><div class="s">Touche un meuble pour l'ajouter${this._focus ? " dans la pièce sélectionnée" : " au centre du plan (sélectionne d'abord une pièce en mode Consulter pour l'y placer)"}.</div></div><div class="ipk">${Object.keys(CAT).map((k) => `<button data-k="${k}" title="${esc(CAT[k][0])}">${th(k)}<span>${esc(CAT[k][0])}</span></button>`).join("")}</div><div class="row"><button class="btn" id="pm-x">Fermer</button></div>`;
    pop.querySelectorAll(".ipk button").forEach((b) => (b.onclick = () => this._addFurn(b.dataset.k)));
    pop.querySelector("#pm-x").onclick = () => { pop.hidden = true; };
    pop.hidden = false; pop.style.left = "8px"; pop.style.top = "8px";
  }
  _addFurn(type) {
    const b = this._bbox(CAT[type][1]), c = this._center(); if (this._focus) c[1] += 6;
    const id = "a" + Date.now().toString(36);
    this._L.added.push({ id, type, x: Math.round((c[0] - b.w / 2) * 2) / 2, y: Math.round((c[1] - b.h / 2) * 2) / 2, rot: 0 });
    this._save(); this._sel = { k: "f", id }; this._build(); this._furnPop(id);
  }
  _furnPop(id) {
    const it = this._furn().find((x) => x.id === id); if (!it) return;
    const pop = this._pop; pop.classList.remove("wide", "xl");
    pop.innerHTML = `<div><div class="t">${esc(it.name)}</div><div class="s">Orientation ${it.rot}°</div></div><div class="row"><button class="btn" id="pm-rot">Pivoter de 90°</button><button class="btn danger" id="pm-del">Retirer</button><button class="btn" id="pm-x">Fermer</button></div>`;
    pop.querySelector("#pm-rot").onclick = () => { this._setFurn(it, { rot: (it.rot + 90) % 360 }); this._build(); this._furnPop(id); };
    pop.querySelector("#pm-del").onclick = () => this._delFurn(it);
    pop.querySelector("#pm-x").onclick = () => { pop.hidden = true; this._sel = null; this._build(); };
    const n = this._svg.querySelector(`.piece[data-id="${id}"]`); if (n) this._placePop(n);
  }
  _delFurn(it) {
    if (it.added) this._L.added = this._L.added.filter((a) => a.id !== it.id); else this._L.furn[it.id] = Object.assign({}, this._L.furn[it.id] || {}, { del: true });
    this._save(); this._pop.hidden = true; this._sel = null; this._build();
  }
  _keydown(e) {
    if (this._mode !== "furn" || !this._sel || this._sel.k !== "f") return;
    if ((e.composedPath ? e.composedPath() : []).some((n) => ["INPUT", "SELECT", "TEXTAREA"].includes(n.tagName))) return;
    const it = this._furn().find((x) => x.id === this._sel.id); if (!it) return;
    const st = e.shiftKey ? 5 : 1, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (mv) { e.preventDefault(); this._setFurn(it, { x: it.x + mv[0], y: it.y + mv[1] }); this._build(); this._furnPop(it.id); }
    else if (e.key === "r" || e.key === "R") { e.preventDefault(); this._setFurn(it, { rot: (it.rot + 90) % 360 }); this._build(); this._furnPop(it.id); }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); this._delFurn(it); }
  }

  /* ---------- export de la configuration ---------- */
  _exportConfig() {
    const c = JSON.parse(JSON.stringify(this._config)), m = this._model, AX = this._AX, L = this._L, r1 = (v) => Math.round(v * 100) / 1000;
    delete c.type;
    if (m.auto) {
      const conv = (p) => G.ptVal(p, AX).map(r1);
      c.rooms = c.rooms.map((r, i) => { const o = { ...r, points: m.rooms[i].pts.map(conv) }; delete o.rect; return o; });
      if (c.openings) c.openings = c.openings.map((o, i) => ({ ...o, from: conv(m.openings[i].a), to: conv(m.openings[i].b) }));
    } else if (c.axes) {
      for (const k of Object.keys(c.axes)) { const v = r1(AX[k]); if (typeof c.axes[k] === "object" && c.axes[k] !== null) c.axes[k].value = v; else c.axes[k] = v; }
    }
    if (Object.keys(L.names).length) c.rooms = c.rooms.map((r, i) => (L.names[m.rooms[i].id] ? { ...r, name: L.names[m.rooms[i].id] } : r));
    const devs = (c.devices || []).map((d, i) => {
      const id = m.devices[i].id; if (L.devHidden[id]) return null;
      const o = { ...d }; if (L.pos[id]) { o.x = r1(L.pos[id][0]); o.y = r1(L.pos[id][1]); }
      if (L.icons[id]) o.icon = L.icons[id];
      return o;
    }).filter(Boolean);
    L.devAdded.forEach((a) => { const o = { entity: a.entity }; const p = L.pos[a.id] || a.pos; if (p) { o.x = r1(p[0]); o.y = r1(p[1]); } const ic = L.icons[a.id] || a.ik; if (ic) o.icon = ic; devs.push(o); });
    if (devs.length || c.devices) c.devices = devs;
    const furn = (c.furniture || []).map((f, i) => {
      const id = m.furniture[i].id, o = L.furn[id]; if (o && o.del) return null;
      const n = { ...f }; if (o) { if (o.x != null) n.x = r1(o.x); if (o.y != null) n.y = r1(o.y); if (o.rot != null) n.rot = o.rot; }
      return n;
    }).filter(Boolean);
    L.added.forEach((a) => furn.push({ type: a.type, x: r1(a.x), y: r1(a.y), ...(a.rot ? { rot: a.rot } : {}) }));
    if (furn.length || c.furniture) c.furniture = furn;
    return "type: custom:plan-maison-card\n" + toYaml(c) + "\n";
  }
  _export() {
    const pop = this._pop, y = this._exportConfig();
    pop.classList.remove("wide"); pop.classList.add("xl");
    pop.innerHTML = `<div><div class="t">Configuration de la carte</div><div class="s">Elle reprend la disposition actuelle (cloisons, équipements, meubles, icônes). Colle-la dans l'éditeur YAML de la carte, ou partage-la pour reproduire le plan sur un autre Home Assistant.</div></div><div class="exp"><textarea readonly spellcheck="false"></textarea></div><div class="row"><button class="btn solid" id="pm-copy">Copier</button><button class="btn" id="pm-x">Fermer</button></div>`;
    const ta = pop.querySelector("textarea"); ta.value = y;
    pop.querySelector("#pm-copy").onclick = async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(y); b.textContent = "Copié"; } catch (x) { ta.focus(); ta.select(); b.textContent = "Sélectionné, fais Ctrl+C"; }
    };
    pop.querySelector("#pm-x").onclick = () => { pop.hidden = true; pop.classList.remove("xl"); };
    pop.hidden = false; pop.style.left = "8px"; pop.style.top = "8px";
  }
}

if (!customElements.get("plan-maison-card")) customElements.define("plan-maison-card", PlanMaisonCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "plan-maison-card")) window.customCards.push({ type: "plan-maison-card", name: "Plan maison", description: "Plan de maison interactif : pièces, cloisons déplaçables, équipements animés, mobilier et météo.", preview: true });
console.info(`%c PLAN-MAISON-CARD %c v${VERSION} `, "background:#1b252d;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px", "background:#f2b33d;color:#1b1406;border-radius:0 3px 3px 0;padding:2px 4px");
