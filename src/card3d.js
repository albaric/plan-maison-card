// Plan maison 3D : maquette en volume construite à partir de la même configuration que la carte plan.
// three.js est chargé à la demande (seulement si cette carte est utilisée), le rendu n'a lieu que quand la vue change.
import * as G from "./geometry.js";
import { META } from "./furniture.js";
import { guess, ACCENT } from "./icons.js";

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js";
const ORBIT_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js";
let threeP = null;
function loadThree() {
  if (window.THREE && window.THREE.OrbitControls) return Promise.resolve(window.THREE);
  if (threeP) return threeP;
  const add = (src) => new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => ko(new Error("Impossible de charger " + src)); document.head.appendChild(s); });
  threeP = (window.THREE ? Promise.resolve() : add(THREE_URL)).then(() => add(ORBIT_URL)).then(() => window.THREE);
  threeP.catch(() => (threeP = null));
  return threeP;
}

const slug = (s) => String(s || "plan").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const NA = ["unavailable", "unknown"];
const LIGHT_ICONS = new Set(["bulb", "bulbrgb", "lamp", "ceiling", "spot", "flood", "string", "guinguette"]);
const FLOOR_STYLES = { light: ["#d9d8d3", "#c4c2bc", 0.6], tiles: ["#d9d8d3", "#c4c2bc", 0.6], dark: ["#5f5c59", "#4b4845", 0.45], brown: ["#5b3d35", "#4a312b", 0.45], terracotta: ["#b8623e", "#e8d9c6", 0.33], wood: ["#b98a5a", null, 1.4], bluewood: ["#6f819b", null, 1.6], concrete: ["#a9a8a2", "#8f8e88", 2.5] };
const KIND_FLOOR = { jour: "light", nuit: "light", circ: "light", todo: "light", service: "light", eau: "brown" };

const CSS = `:host{display:block}
ha-card{overflow:hidden;position:relative;height:var(--pm3-h,560px);background:#cfe3f1}
.host{position:absolute;inset:0;touch-action:none}.host canvas{display:block;width:100%!important;height:100%!important;outline:none}
.bar{position:absolute;top:10px;left:10px;right:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;pointer-events:none}
.bar .t{font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:600;font-size:17px;letter-spacing:.06em;text-transform:uppercase;color:#24303a;background:rgba(255,253,248,.88);padding:3px 10px;border-radius:8px;margin-right:4px}
.bar button{pointer-events:auto;font:inherit;font-size:13px;border:1px solid #d8d2c4;background:rgba(255,253,248,.9);color:#24303a;padding:4px 10px;border-radius:999px;cursor:pointer}
.bar button[aria-pressed="true"]{background:#5f8fb8;border-color:#5f8fb8;color:#fff}
.msg{position:absolute;inset:0;display:grid;place-items:center;font-size:14px;color:#24303a;padding:20px;text-align:center}
.lab{position:absolute;left:0;top:0;font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:600;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:#24303a;background:rgba(255,253,248,.85);padding:1px 6px;border-radius:4px;pointer-events:none;white-space:nowrap}
.labs[hidden]{display:none}
.tip{position:absolute;bottom:8px;left:8px;right:8px;text-align:center;font-size:12px;color:#3d4a52;pointer-events:none;text-shadow:0 1px 0 rgba(255,255,255,.6)}`;

class PlanMaison3DCard extends HTMLElement {
  static getStubConfig() { return { title: "Maison", rooms: [{ name: "Séjour", rect: [0, 0, 6, 4] }, { name: "Chambre", rect: [6, 0, 10, 4] }], openings: [{ type: "door", from: [6, 1.5], to: [6, 2.3] }, { type: "window", from: [1, 0], to: [2.4, 0] }] }; }
  getCardSize() { return 9; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 9, min_rows: 5 }; }

  setConfig(c) {
    if (!c) throw new Error("Configuration manquante.");
    this._model = G.buildModel(c); // erreur lisible si la config est invalide
    this._config = c; this._key = c.layout_key || "plan_maison_" + slug(c.title);
    if (this._ready) this._rebuild();
  }
  set hass(h) {
    const prev = this._hass; this._hass = h;
    if (!prev) { this._init(); return; }
    if (this._ready && this._watch && this._watch.some((e) => prev.states[e] !== h.states[e])) this._live();
  }
  connectedCallback() { if (this._ready) this._ask(); }
  disconnectedCallback() { /* rien ne tourne en continu : pas de boucle à arrêter */ }

  async _init() {
    const r = this.shadowRoot || this.attachShadow({ mode: "open" });
    r.innerHTML = `<style>${CSS}</style><ha-card><div class="host" id="host"></div><div class="labs" id="labs" hidden></div>
      <div class="bar"><span class="t" id="ttl"></span><button id="bRoof" aria-pressed="true">Toit</button><button id="bLow" aria-pressed="false">Murs bas</button><button id="bNight" aria-pressed="false">Soirée</button><button id="bLab" aria-pressed="false">Pièces</button><button id="bHome">Recentrer</button></div>
      <div class="tip">Glisser pour tourner · molette ou pincer pour zoomer · clic droit pour déplacer · touche un équipement pour l'ouvrir</div><div class="msg" id="msg">Chargement de la 3D…</div></ha-card>`;
    const h = this._config.height; if (h) this.style.setProperty("--pm3-h", typeof h === "number" ? h + "px" : h);
    this.$ = (id) => r.getElementById(id);
    this.$("ttl").textContent = this._config.title != null ? this._config.title : "Maison";
    try {
      const [T] = await Promise.all([loadThree(), this._loadLayout()]);
      this.T = T; this._setup(); this._ready = true; this._rebuild();
      this.$("msg").remove();
    } catch (e) { this.$("msg").textContent = "La vue 3D n'a pas pu démarrer : " + e.message + ". Elle a besoin d'accéder à cdn.jsdelivr.net."; }
  }
  async _loadLayout() {
    this._L = { axes: {}, pos: {}, furn: {}, added: [], devAdded: [], devHidden: {}, icons: {} };
    try { const v = await this._hass.callWS({ type: "frontend/get_user_data", key: this._key }); if (v && v.value) Object.assign(this._L, v.value); } catch (e) { /* disposition de la config */ }
  }

  /* ---------- scène ---------- */
  _setup() {
    const T = this.T, host = this.$("host");
    const R = (this._r = new T.WebGLRenderer({ antialias: true }));
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.outputEncoding = T.sRGBEncoding;
    host.appendChild(R.domElement);
    this._scene = new T.Scene(); this._cam = new T.PerspectiveCamera(42, 1, 0.1, 400);
    const C = (this._ctl = new T.OrbitControls(this._cam, R.domElement));
    C.enableDamping = true; C.dampingFactor = 0.09; C.maxPolarAngle = Math.PI * 0.495; C.minDistance = 3; C.maxDistance = 90;
    C.addEventListener("change", () => this._ask());
    new ResizeObserver(() => this._resize()).observe(host);
    // lumière : soleil rasant de fin de journée, ciel
    const S = this._scene;
    this._hemi = new T.HemisphereLight(0xdfeefe, 0x8a7a5a, 0.55); S.add(this._hemi);
    const sun = (this._sun = new T.DirectionalLight(0xffe2b8, 1.25)); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; S.add(sun, sun.target);
    S.background = new T.Color(0xcfe3f1); S.fog = new T.Fog(0xcfe3f1, 50, 140);
    // boutons
    this._S = { roof: true, low: false, night: null, labels: false };
    const tog = (id, k, side) => (this.$(id).onclick = () => { this._S[k] = !this._view(k); if (side) side(); this._apply(); });
    tog("bRoof", "roof"); tog("bLow", "low", () => this._S.low && (this._S.roof = false)); tog("bNight", "night"); tog("bLab", "labels", () => this._S.labels && (this._S.roof = false));
    this.$("bHome").onclick = () => this._home();
    // clic sur un équipement : fiche Home Assistant
    const ray = new T.Raycaster(), v = new T.Vector2(); let down = null;
    R.domElement.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
    R.domElement.addEventListener("pointerup", (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const b = R.domElement.getBoundingClientRect(); v.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(v, this._cam); const hit = ray.intersectObjects(this._pick || [], false)[0];
      if (hit && hit.object.userData.entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: hit.object.userData.entity }, bubbles: true, composed: true }));
    });
  }
  _view(k) { return k === "night" ? (this._S.night != null ? this._S.night : this._autoNight()) : this._S[k]; }
  _autoNight() { const s = this._hass.states["sun.sun"]; return !!s && s.state === "below_horizon"; }
  _resize() { const h = this.$("host"), w = h.clientWidth, H = h.clientHeight; if (!w || !H) return; this._r.setSize(w, H, false); this._cam.aspect = w / H; this._cam.updateProjectionMatrix(); this._ask(); }
  _ask() { if (this._pend || !this._r) return; this._pend = true; requestAnimationFrame(() => { this._pend = false; const mv = this._ctl.update(); this._r.render(this._scene, this._cam); this._labels(); if (mv) this._ask(); }); }
  _home() { const b = this._bb; const cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2, s = Math.max(b[2] - b[0], b[3] - b[1]); this._ctl.target.set(cx, 1, cz); this._cam.position.set(cx - s * 0.85, s * 0.8, cz + s * 1.05); this._ctl.update(); this._ask(); }

  /* ---------- construction ---------- */
  _rebuild() {
    const T = this.T, S = this._scene;
    if (this._root) { S.remove(this._root); this._root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    const root = (this._root = new T.Group()); S.add(root);
    const g = (this._g = { floors: new T.Group(), walls: new T.Group(), roof: new T.Group(), furn: new T.Group(), out: new T.Group(), dev: new T.Group(), lights: new T.Group() });
    Object.values(g).forEach((x) => root.add(x));
    const c = this._config, m = this._model, L = this._L;
    const AX = Object.fromEntries(Object.entries(m.axes).map(([k, a]) => [k, L.axes && L.axes[k] != null ? L.axes[k] : a.def]));
    const P = (q) => G.ptVal(q, AX).map((v) => v / 10);
    const rooms = m.rooms.map((r) => ({ id: r.id, name: (L.names && L.names[r.id]) || r.name, kind: r.kind, p: r.pts.map(P) }));
    this._rooms = rooms;
    const ops = m.openings.map((o) => ({ type: o.type, a: P(o.a), b: P(o.b) }));
    this._M = this._materials();
    const grid = this._footprint(rooms);
    this._grid = grid;
    const bb = (this._bb = [grid.x0, grid.z0, grid.x1, grid.z1]);
    // sol et terrasses
    const lawn = new T.Mesh(new T.PlaneGeometry(200, 200), this._M.lawn); lawn.rotation.x = -Math.PI / 2; lawn.position.set((bb[0] + bb[2]) / 2, -0.02, (bb[1] + bb[3]) / 2); lawn.receiveShadow = true; root.add(lawn);
    m.zones.forEach((z) => { const [a, b, cc, d] = z.rect.map((v) => v / 10); if (z.type === "shed") this._box(cc - a, 2.2, d - b, this._mat(0x3f8f7d), (a + cc) / 2, 1.1, (b + d) / 2, g.out); else this._box(cc - a, 0.08, d - b, this._M.concrete, (a + cc) / 2, 0, (b + d) / 2, g.out, false); if (z.posts) this._pergola(a, b, cc, d); });
    // dalle, sols
    grid.rects.forEach(([a, b, cc, d]) => { this._box(cc - a, 0.12, d - b, this._M.wallTop, (a + cc) / 2, -0.01, (b + d) / 2, g.floors, false); this._slab([[a, b], [cc, b], [cc, d], [a, d]], this._floorMat("light"), 0.051); });
    const floors = c.floors || {};
    rooms.forEach((r) => this._slab(r.p, this._floorMat(floors[r.id] || floors[r.name] || KIND_FLOOR[r.kind] || "light"), 0.055));
    this._walls(rooms, ops);
    if (c.roof !== false) grid.rects.forEach((q) => this._hip(...q));
    this._furniture();
    this._garlands();
    this._devices();
    // soleil cadré sur la maison
    const s = Math.max(bb[2] - bb[0], bb[3] - bb[1]) * 0.8 + 6, cx = (bb[0] + bb[2]) / 2, cz = (bb[1] + bb[3]) / 2;
    this._sun.position.set(cx - s, s * 0.8, cz + s * 0.6); this._sun.target.position.set(cx, 0, cz);
    Object.assign(this._sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: s * 4 }); this._sun.shadow.camera.updateProjectionMatrix();
    // étiquettes
    const labs = this.$("labs"); labs.textContent = "";
    this._lab = rooms.map((r) => { const xs = r.p.map((q) => q[0]), zs = r.p.map((q) => q[1]); const el = document.createElement("div"); el.className = "lab"; el.textContent = r.name; labs.appendChild(el); return { el, v: new T.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, 1.2, (Math.min(...zs) + Math.max(...zs)) / 2) }; });
    if (!this._homed) { this._homed = true; this._home(); }
    this._live(); this._apply(); this._resize();
  }
  _apply() {
    const S = this._S, n = this._view("night"), g = this._g;
    g.roof.visible = S.roof; g.walls.scale.y = S.low ? 0.42 : 1;
    this._scene.background.set(n ? 0x1b2638 : 0xcfe3f1); this._scene.fog.color.copy(this._scene.background);
    this._hemi.intensity = n ? 0.14 : 0.55; this._sun.intensity = n ? 0.08 : 1.25; this._sun.color.set(n ? 0x8fa6d6 : 0xffe2b8);
    this.$("labs").hidden = !S.labels;
    [["bRoof", S.roof], ["bLow", S.low], ["bNight", n], ["bLab", S.labels]].forEach(([id, v]) => this.$(id).setAttribute("aria-pressed", v ? "true" : "false"));
    this._live();
  }
  /** État réel : lampes allumées, guirlandes, équipements indisponibles. */
  _live() {
    if (!this._ready || !this._g) return;
    const st = this._hass.states, n = this._view("night");
    (this._gl || []).forEach((gl) => { const on = !gl.entity || (st[gl.entity] && st[gl.entity].state === "on"); gl.bulbs.forEach((b) => (b.material.emissiveIntensity = on ? (n ? 2.2 : 0.9) : 0.05)); gl.glows.forEach((s) => (s.visible = on && n)); gl.light.intensity = on && n ? 1.3 : 0; });
    (this._dv || []).forEach((d) => {
      const s = st[d.entity], v = s ? s.state : "unavailable", on = ["on", "open", "playing", "heat", "heating", "home", "cleaning"].includes(v) || (d.light && v === "on");
      const na = NA.includes(v); d.mesh.material.color.set(na ? 0xd8574a : on ? d.accent : 0x9aa3a8); d.mesh.material.emissive.set(on ? d.accent : 0x000000); d.mesh.material.emissiveIntensity = on ? 0.8 : 0;
      if (d.lamp) d.lamp.intensity = on && n ? 1.6 : 0;
    });
    this._ask();
  }
  _labels() {
    if (!this._S || !this._S.labels || !this._lab) return;
    const h = this.$("host"), w = h.clientWidth, H = h.clientHeight, v = new this.T.Vector3();
    this._lab.forEach(({ el, v: p }) => { v.copy(p).project(this._cam); el.style.display = v.z < 1 ? "" : "none"; el.style.transform = `translate(${((v.x + 1) / 2) * w}px,${((1 - v.y) / 2) * H}px) translate(-50%,-50%)`; });
  }

  /* ---------- emprise : cases de 10 cm, trous intérieurs (couloirs sans pièce) bouchés ---------- */
  _footprint(rooms) {
    const pts = rooms.flatMap((r) => r.p), xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    const x0 = Math.floor(Math.min(...xs)) - 1, z0 = Math.floor(Math.min(...zs)) - 1, x1 = Math.ceil(Math.max(...xs)) + 1, z1 = Math.ceil(Math.max(...zs)) + 1;
    const N = 0.1, W = Math.round((x1 - x0) / N), H = Math.round((z1 - z0) / N), cell = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = x0 + (i + 0.5) * N, z = z0 + (j + 0.5) * N; if (rooms.some((r) => G.inPoly(x, z, r.p))) cell[j * W + i] = 1; }
    // tout ce qui n'est pas atteignable depuis le bord est intérieur
    const out = new Uint8Array(W * H), st = []; for (let i = 0; i < W; i++) st.push(i, (H - 1) * W + i); for (let j = 0; j < H; j++) st.push(j * W, j * W + W - 1);
    while (st.length) { const k = st.pop(); if (out[k] || cell[k]) continue; out[k] = 1; const i = k % W, j = (k / W) | 0; if (i > 0) st.push(k - 1); if (i < W - 1) st.push(k + 1); if (j > 0) st.push(k - W); if (j < H - 1) st.push(k + W); }
    const ins = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) ins[k] = out[k] ? 0 : 1;
    const inside = (x, z) => { const i = Math.floor((x - x0) / N), j = Math.floor((z - z0) / N); return i >= 0 && j >= 0 && i < W && j < H && !!ins[j * W + i]; };
    // découpe en grands rectangles (un toit en croupe chacun)
    const left = ins.slice(), rects = [];
    for (let it = 0; it < 10; it++) {
      let best = null; const hgt = new Int32Array(W);
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) hgt[i] = left[j * W + i] ? hgt[i] + 1 : 0;
        const stk = [];
        for (let i = 0; i <= W; i++) { const hh = i < W ? hgt[i] : 0; let s = i; while (stk.length && stk[stk.length - 1][1] >= hh) { const [si, sh] = stk.pop(); const a = sh * (i - si); if (sh && (!best || a > best.a)) best = { a, i0: si, i1: i, j0: j - sh + 1, j1: j + 1 }; s = si; } stk.push([s, hh]); }
      }
      if (!best || best.a * N * N < 3) break;
      for (let j = best.j0; j < best.j1; j++) for (let i = best.i0; i < best.i1; i++) left[j * W + i] = 0;
      rects.push([x0 + best.i0 * N, z0 + best.j0 * N, x0 + best.i1 * N, z0 + best.j1 * N]);
    }
    return { inside, rects, x0, z0, x1, z1 };
  }

  /* ---------- matériaux ---------- */
  _mat(color, o) { return new this.T.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, o)); }
  _tex(w, h, draw, rep) { const T = this.T, c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
  _materials() {
    const c = this._config.colors || {}, T = this.T;
    const crepi = this._tex(256, 256, (g, w, h) => { const r = rnd(5); g.fillStyle = c.facade || "#e2c99d"; g.fillRect(0, 0, w, h); for (let k = 0; k < 9000; k++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.18)" : "rgba(90,60,30,.12)"; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); } });
    const canal = this._tex(256, 256, (g, w, h) => { const r = rnd(11), base = c.roof || "#b8653f", cw = w / 8, rh = h / 6; for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) { const x = i * cw, y = j * rh, top = i % 2 === 0, cc = shade(base, (r() - 0.5) * 30); const gr = g.createLinearGradient(x, 0, x + cw, 0); gr.addColorStop(0, shade(cc, top ? -30 : -45)); gr.addColorStop(0.5, shade(cc, top ? 18 : -8)); gr.addColorStop(1, shade(cc, top ? -30 : -45)); g.fillStyle = gr; g.fillRect(x, y, cw, rh); g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(x, y + rh - 4, cw, 4); if (r() < 0.3) { g.fillStyle = `rgba(${150 + r() * 40},${150 + r() * 30},70,${0.25 + r() * 0.3})`; g.beginPath(); g.ellipse(x + cw / 2, y + rh * r(), cw * 0.35, rh * 0.3, 0, 0, 7); g.fill(); } } });
    const conc = FLOOR_STYLES.concrete;
    return {
      crepi: this._mat(0xffffff, { map: crepi }), wallIn: this._mat(0xf3f0e8), wallTop: this._mat(0xd9d0bf),
      shutter: this._mat(new T.Color(c.shutters || "#7ea7cf"), { roughness: 0.6 }), frame: this._mat(0xf7f6f1, { roughness: 0.5 }),
      glass: new T.MeshStandardMaterial({ color: 0xbfd9ea, roughness: 0.05, transparent: true, opacity: 0.35 }),
      roof: this._mat(0xffffff, { map: canal, side: T.DoubleSide, roughness: 0.95 }), gutter: this._mat(0xf2f0ea, { roughness: 0.4 }),
      pine: this._mat(0xd4ab72, { roughness: 0.8 }), lawn: this._mat(0x86a95a, { roughness: 1 }),
      concrete: this._mat(0xffffff, { map: this._tileTex(conc[0], conc[1], conc[2]) }),
      white: this._mat(0xf6f5f1, { roughness: 0.5 }), dark: this._mat(0x2b2f33, { roughness: 0.6 }), teak: this._mat(0xa8774a, { roughness: 0.7 }), oak: this._mat(0xc58e52, { roughness: 0.7 }),
      leather: this._mat(0x263443, { roughness: 0.45 }), linen: this._mat(0xeeeae1), leaf: this._mat(0x5f8f3e), leaf2: this._mat(0x7ea04a), olive: this._mat(0x8fa17a), bark: this._mat(0x7b6650),
      cream: this._mat(0xefe6cf, { roughness: 0.55 }), granite: this._mat(0x8b8a86, { roughness: 0.4 }), steel: this._mat(0xc9ccce, { metalness: 0.6, roughness: 0.35 }), water: this._mat(0x9fd1e6, { roughness: 0.1 }), soil: this._mat(0x7a5a3d),
    };
  }
  _tileTex(base, grout, size) {
    const r = rnd(3);
    if (!grout) return this._tex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = shade(base, (r() - 0.5) * 18); g.fillRect(0, i * 32, w, 31); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(r() * w, i * 32, 2, 31); } }, [1 / size, 1 / size]);
    return this._tex(256, 256, (g, w, h) => { g.fillStyle = grout; g.fillRect(0, 0, w, h); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = shade(base, (r() - 0.5) * 8); g.fillRect(i * w / 2 + 2, j * h / 2 + 2, w / 2 - 4, h / 2 - 4); } }, [1 / (size * 2), 1 / (size * 2)]);
  }
  _floorMat(k) {
    this._fm = this._fm || {};
    if (!this._fm[k]) { const s = FLOOR_STYLES[k] || (/^#/.test(k) ? [k, shade(k, -18), 0.6] : FLOOR_STYLES.light); this._fm[k] = this._mat(0xffffff, { map: this._tileTex(s[0], s[1], s[2]) }); }
    return this._fm[k];
  }

  /* ---------- primitives ---------- */
  _box(w, h, d, m, x, y, z, parent, cast = true) { const T = this.T, o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; (parent || this._root).add(o); return o; }
  _cyl(rt, rb, h, m, x, y, z, parent, seg = 14) { const T = this.T, o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
  _ball(r, m, x, y, z, parent, sx = 1, sy = 1, sz = 1) { const T = this.T, o = new T.Mesh(new T.IcosahedronGeometry(r, 1), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
  _slab(pts, m, y) { const T = this.T, s = new T.Shape(pts.map(([x, z]) => new T.Vector2(x, -z))), geo = new T.ShapeGeometry(s); geo.rotateX(-Math.PI / 2); const o = new T.Mesh(geo, m); o.position.y = y; o.receiveShadow = true; this._g.floors.add(o); }

  /* ---------- murs et ouvertures ---------- */
  _walls(rooms, ops) {
    const T = this.T, M = this._M, g = this._g, inside = this._grid.inside, c = this._config;
    const WH = +c.wall_height || 2.6, EXT = 0.3, INT = 0.1, SILL = 0.95, HEAD = 2.15, DOOR = 2.1;
    const lines = {}, diag = [];
    rooms.forEach((r) => r.p.forEach((a, i) => {
      const b = r.p[(i + 1) % r.p.length];
      if (Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(a[0] - b[0]) > 1e-6) (lines["h:" + a[1]] = lines["h:" + a[1]] || []).push([Math.min(a[0], b[0]), Math.max(a[0], b[0])]);
      else if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) > 1e-6) (lines["v:" + a[0]] = lines["v:" + a[0]] || []).push([Math.min(a[1], b[1]), Math.max(a[1], b[1])]);
      else if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-6) diag.push([a, b]);
    }));
    const merge = (iv) => { iv.sort((p, q) => p[0] - q[0]); const o = []; iv.forEach((s) => { const l = o[o.length - 1]; if (l && s[0] <= l[1] + 1e-6) l[1] = Math.max(l[1], s[1]); else o.push(s.slice()); }); return o; };
    // ouvertures rattachées à la ligne de mur la plus proche
    const byLine = {}, seen = new Set();
    ops.forEach((o) => {
      const h = Math.abs(o.a[1] - o.b[1]) < Math.abs(o.a[0] - o.b[0]), at = h ? (o.a[1] + o.b[1]) / 2 : (o.a[0] + o.b[0]) / 2;
      let best = null, bd = 0.35; Object.keys(lines).forEach((k) => { if ((k[0] === "h") !== h) return; const d = Math.abs(+k.slice(2) - at); if (d < bd) { bd = d; best = k; } });
      if (!best) return;
      const s = h ? [Math.min(o.a[0], o.b[0]), Math.max(o.a[0], o.b[0])] : [Math.min(o.a[1], o.b[1]), Math.max(o.a[1], o.b[1])];
      const key = best + s.join(",") + o.type; if (seen.has(key)) return; seen.add(key);
      (byLine[best] = byLine[best] || []).push({ type: o.type, s });
    });
    const crepiCache = {};
    const crepiFor = (L, H) => { const k = Math.round(L * 2) + ":" + Math.round(H * 2); if (!crepiCache[k]) { const m = M.crepi.clone(); m.map = M.crepi.map.clone(); m.map.needsUpdate = true; m.map.repeat.set(L / 2, H / 2); crepiCache[k] = m; } return crepiCache[k]; };
    const piece = (k, a, b, y0, y1, ext, sg) => {
      if (b - a < 0.01 || y1 - y0 < 0.01) return;
      const h = k[0] === "h", cc = +k.slice(2), t = ext ? EXT : INT, L = b - a;
      const mats = [M.wallIn, M.wallIn, M.wallTop, M.wallIn, M.wallIn, M.wallIn];
      if (ext) mats[h ? (sg > 0 ? 4 : 5) : sg > 0 ? 0 : 1] = crepiFor(L, y1 - y0);
      const off = ext ? sg * (t / 2 - 0.05) : 0, o = new T.Mesh(new T.BoxGeometry(h ? L : t, y1 - y0, h ? t : L), mats);
      o.position.set(h ? (a + b) / 2 : cc + off, (y0 + y1) / 2, h ? cc + off : (a + b) / 2); o.castShadow = o.receiveShadow = true; g.walls.add(o);
    };
    const win = (k, a, b, y0, y1, ext, sg, french) => {
      const h = k[0] === "h", cc = +k.slice(2), w = b - a, mid = (a + b) / 2;
      const add = (gw, gh, gd, m, u, y, v) => this._box(h ? gw : gd, gh, h ? gd : gw, m, h ? u : cc + v, y, h ? cc + v : u, g.walls, false);
      add(w, 0.06, 0.08, M.frame, mid, y1 - 0.03, 0); add(w, 0.06, 0.08, M.frame, mid, y0 + 0.03, 0);
      add(0.06, y1 - y0, 0.08, M.frame, a + 0.03, (y0 + y1) / 2, 0); add(0.06, y1 - y0, 0.08, M.frame, b - 0.03, (y0 + y1) / 2, 0);
      if (w > 0.7) add(0.05, y1 - y0, 0.07, M.frame, mid, (y0 + y1) / 2, 0);
      add(w - 0.1, y1 - y0 - 0.1, 0.02, M.glass, mid, (y0 + y1) / 2, 0);
      if (!ext || w > 2.05 || c.shutters === false) return;
      const sw = w / 2, so = sg * (EXT / 2 + 0.03);
      [a - sw / 2 - 0.04, b + sw / 2 + 0.04].forEach((u) => { const s = add(sw, y1 - y0, 0.04, M.shutter, u, (y0 + y1) / 2, so); s.castShadow = true; [0.25, 0.75].forEach((f) => add(sw * 0.7, 0.04, 0.02, M.dark, u, y0 + (y1 - y0) * f, so + sg * 0.03)); });
      if (!french) add(w + 0.16, 0.05, 0.2, M.wallTop, mid, y0 - 0.03, sg * 0.12);
    };
    Object.entries(lines).forEach(([k, iv]) => {
      const h = k[0] === "h", cc = +k.slice(2);
      merge(iv).forEach(([a, b]) => {
        const cuts = new Set([a, b]), oo = (byLine[k] || []).filter((o) => o.s[1] > a && o.s[0] < b);
        oo.forEach((o) => { cuts.add(Math.max(a, o.s[0])); cuts.add(Math.min(b, o.s[1])); });
        // changements de nature façade / cloison le long du mur (tous les 10 cm)
        let prev = null; for (let u = a + 0.05; u < b; u += 0.1) { const e = (h ? inside(u, cc - 0.2) : inside(cc - 0.2, u)) !== (h ? inside(u, cc + 0.2) : inside(cc + 0.2, u)); if (prev != null && e !== prev) cuts.add(Math.round((u - 0.05) * 10) / 10); prev = e; }
        const xs = [...cuts].sort((p, q) => p - q);
        for (let i = 0; i < xs.length - 1; i++) {
          const u0 = xs[i], u1 = xs[i + 1], um = (u0 + u1) / 2;
          const pA = h ? inside(um, cc - 0.2) : inside(cc - 0.2, um), pB = h ? inside(um, cc + 0.2) : inside(cc + 0.2, um), ext = pA !== pB, sg = pA ? 1 : -1;
          const o = oo.find((q) => q.s[0] <= um && q.s[1] >= um);
          if (!o) { piece(k, u0, u1, 0, WH, ext, sg); continue; }
          if (o.type === "open") continue;
          if (o.type === "passage" || o.type === "door") { piece(k, u0, u1, DOOR, WH, ext, sg); if (ext) win(k, u0, u1, 0.06, DOOR, true, sg, true); continue; }
          const french = u1 - u0 >= 1.5, y0 = french ? 0.06 : SILL;
          if (!french) piece(k, u0, u1, 0, y0, ext, sg);
          piece(k, u0, u1, HEAD, WH, ext, sg); win(k, u0, u1, y0, HEAD, ext, sg, french);
        }
      });
    });
    diag.forEach(([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), o = this._box(L, WH, EXT, M.crepi, (a[0] + b[0]) / 2, WH / 2, (a[1] + b[1]) / 2, g.walls); o.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); });
    this._WH = WH;
  }

  /* ---------- toit en croupe ---------- */
  _hip(x0, z0, x1, z1) {
    const T = this.T, M = this._M, g = this._g, c = this._config, PITCH = c.roof_pitch != null ? +c.roof_pitch : 0.3, OV = 0.45, Y = (this._WH || 2.6) + 0.05;
    x0 -= OV; z0 -= OV; x1 += OV; z1 += OV;
    const w = x1 - x0, d = z1 - z0, alongX = w >= d, half = Math.min(w, d) / 2, H = half * PITCH, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const r1 = alongX ? [x0 + half, Y + H, cz] : [cx, Y + H, z0 + half], r2 = alongX ? [x1 - half, Y + H, cz] : [cx, Y + H, z1 - half];
    const A = [x0, Y, z0], B = [x1, Y, z0], C = [x1, Y, z1], D = [x0, Y, z1];
    const faces = alongX ? [[A, B, r2, r1], [C, D, r1, r2], [D, A, r1], [B, C, r2]] : [[B, C, r2, r1], [D, A, r1, r2], [A, B, r1], [C, D, r2]];
    const pos = [], uv = [], cs = Math.sqrt(1 + PITCH * PITCH);
    faces.forEach((f) => {
      const e = new T.Vector3(f[1][0] - f[0][0], 0, f[1][2] - f[0][2]).normalize(), s = new T.Vector3(-e.z, 0, e.x);
      (f.length === 4 ? [f[0], f[1], f[2], f[0], f[2], f[3]] : f).forEach((p) => { pos.push(...p); uv.push((p[0] * e.x + p[2] * e.z) / 0.9, ((p[0] * s.x + p[2] * s.z) * cs) / 1.2); });
    });
    const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const m = new T.Mesh(geo, M.roof); m.castShadow = m.receiveShadow = true; g.roof.add(m);
    this._box(w, 0.1, 0.12, M.gutter, cx, Y - 0.02, z0, g.roof); this._box(w, 0.1, 0.12, M.gutter, cx, Y - 0.02, z1, g.roof);
    this._box(0.12, 0.1, d, M.gutter, x0, Y - 0.02, cz, g.roof); this._box(0.12, 0.1, d, M.gutter, x1, Y - 0.02, cz, g.roof);
  }
  _pergola(a, b, c, d) {
    const M = this._M, g = this._g.out, H = 2.4, along = d - b >= c - a;
    const posts = along ? [[a + 0.08, b + 0.08], [a + 0.08, d - 0.08], [a + 0.08, (b + d) / 2]] : [[a + 0.08, d - 0.08], [c - 0.08, d - 0.08], [(a + c) / 2, d - 0.08]];
    posts.forEach(([x, z]) => this._box(0.12, H, 0.12, M.pine, x, H / 2, z, g));
    if (along) { this._box(0.08, 0.2, d - b, M.pine, a + 0.08, H + 0.1, (b + d) / 2, g); for (let z = b + 0.1; z < d; z += 0.55) this._box(c - a + 0.3, 0.16, 0.06, M.pine, (a + c) / 2, H + 0.26, z, g); }
    else { this._box(c - a, 0.2, 0.08, M.pine, (a + c) / 2, H + 0.1, d - 0.08, g); for (let x = a + 0.1; x < c; x += 0.55) this._box(0.06, 0.16, d - b + 0.3, M.pine, x, H + 0.26, (b + d) / 2, g); }
  }

  /* ---------- mobilier ---------- */
  _furniture() {
    const T = this.T, L = this._L, m = this._model, inside = this._grid.inside;
    const list = m.furniture.filter((f) => f.type && !(L.furn[f.id] && L.furn[f.id].del)).map((f) => { const o = L.furn[f.id] || {}; return { type: f.type, x: o.x ?? f.x, y: o.y ?? f.y, rot: o.rot ?? f.rot ?? 0, w: o.w ?? f.w, h: o.h ?? f.h }; })
      .concat((L.added || []).map((a) => ({ type: a.type, x: a.x, y: a.y, rot: a.rot || 0, w: a.w, h: a.h })));
    list.forEach((f) => {
      const meta = META[f.type]; if (!meta) return;
      const W = (f.w || meta[2]) / 10, D = (f.h || meta[3]) / 10, grp = new T.Group();
      (BUILD[f.type] || BUILD._generic).call(this, grp, W, D, meta);
      const x = f.x / 10 + W / 2, z = f.y / 10 + D / 2;
      grp.position.set(x, 0.06, z); grp.rotation.y = -((f.rot || 0) * Math.PI) / 180;
      (inside(x, z) ? this._g.furn : this._g.out).add(grp);
    });
  }

  /* ---------- guirlandes (allumées selon leur entité) ---------- */
  _garlands() {
    const T = this.T, g = this._g.lights, inside = this._grid.inside;
    const glowTex = this._glowTex || (this._glowTex = this._tex(64, 64, (c, w) => { const r = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(255,240,200,1)"); r.addColorStop(0.35, "rgba(255,210,140,.45)"); r.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = r; c.fillRect(0, 0, w, w); }));
    this._gl = this._model.garlands.filter((l) => l.pts.length >= 2).map((l) => {
      const pts = l.pts.map(([x, y]) => [x / 10, y / 10]), H = 2.4, sag = 0.2, curve = [];
      for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1]; for (let t = 0; t < 1; t += 0.05) curve.push(new T.Vector3(x0 + (x1 - x0) * t, H - sag * 4 * t * (1 - t), z0 + (z1 - z0) * t)); }
      curve.push(new T.Vector3(pts[pts.length - 1][0], H, pts[pts.length - 1][1]));
      g.add(new T.Line(new T.BufferGeometry().setFromPoints(curve), new T.LineBasicMaterial({ color: 0x222222 })));
      const bulbs = [], glows = []; let acc = 0, n = 0;
      for (let i = 1; i < curve.length; i++) {
        acc += curve[i].distanceTo(curve[i - 1]); if (acc < 0.38) continue; acc = 0; n++;
        const col = new T.Color(l.colors[n % l.colors.length]);
        const b = new T.Mesh(new T.SphereGeometry(0.055, 10, 8), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.1, roughness: 0.3 }));
        b.position.copy(curve[i]); b.position.y -= 0.07; b.userData.entity = l.entity; g.add(b); bulbs.push(b);
        const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); s.scale.set(0.55, 0.55, 1); s.position.copy(b.position); s.visible = false; g.add(s); glows.push(s);
      }
      const mid = curve[Math.floor(curve.length / 2)], light = new T.PointLight(0xffb867, 0, 10, 2); light.position.copy(mid); g.add(light);
      return { entity: l.entity, bulbs, glows, light };
    });
    this._pick = this._gl.flatMap((x) => x.bulbs);
    this._watch = ["sun.sun"].concat(this._gl.map((x) => x.entity).filter(Boolean));
  }

  /* ---------- équipements : pastilles cliquables, lumières réelles ---------- */
  _devices() {
    const T = this.T, g = this._g.dev, L = this._L, inside = this._grid.inside, st = this._hass.states;
    const base = this._model.devices.filter((d) => !(L.devHidden && L.devHidden[d.id])).map((d) => ({ ...d, pos: (L.pos && L.pos[d.id]) || d.pos, icon: (L.icons && L.icons[d.id]) || d.icon }));
    const added = (L.devAdded || []).map((a) => ({ id: a.id, entity: a.entity, icon: (L.icons && L.icons[a.id]) || a.ik, pos: (L.pos && L.pos[a.id]) || a.pos }));
    let lamps = 0;
    this._dv = base.concat(added).filter((d) => d.pos).map((d) => {
      const x = d.pos[0] / 10, z = d.pos[1] / 10, ins = inside(x, z), ik = d.icon && !/^mdi:/.test(d.icon) ? d.icon : guess(st[d.entity], d.entity);
      const light = LIGHT_ICONS.has(ik) || /^light\./.test(d.entity), y = light && ins ? 2.35 : light ? 1.9 : 1.1;
      const accent = new T.Color(ACCENT[ik] || (light ? "#f5b301" : "#3e7bfa"));
      const mesh = new T.Mesh(new T.SphereGeometry(light ? 0.12 : 0.1, 14, 10), new T.MeshStandardMaterial({ color: 0x9aa3a8, roughness: 0.4 }));
      mesh.position.set(x, y, z); mesh.userData.entity = d.entity; g.add(mesh);
      if (!light) { const stem = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, y, 6), this._M.dark); stem.position.set(x, y / 2, z); g.add(stem); }
      let lamp = null; if (light && lamps < 10) { lamps++; lamp = new T.PointLight(0xffd29a, 0, ins ? 7 : 10, 2); lamp.position.set(x, y - 0.15, z); g.add(lamp); }
      return { entity: d.entity, mesh, accent, light, lamp };
    });
    this._pick = (this._pick || []).concat(this._dv.map((d) => d.mesh));
    this._watch = (this._watch || []).concat(this._dv.map((d) => d.entity));
  }
}

/* ---------- formes des meubles (dimensions du catalogue de la carte) ---------- */
const legs4 = (self, g, W, D, h, m, inset = 0.05) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => self._box(0.05, h, 0.05, m, i * (W / 2 - inset), h / 2, j * (D / 2 - inset), g));
const BUILD = {
  _generic(g, W, D, meta) { const M = this._M, cat = meta[1], h = { salon: 0.6, repas: 0.75, chambre: 0.7, bureau: 0.75, cuisine: 0.9, sdb: 0.6, jardin: 0.5 }[cat] || 0.6; this._box(W, h, D, cat === "jardin" ? M.leaf2 : cat === "cuisine" ? M.cream : M.oak, 0, h / 2, 0, g); },
  canape(g, W, D) { const m = this._M.leather; this._box(W, 0.42, D, m, 0, 0.21, 0, g); this._box(W, 0.45, 0.2, m, 0, 0.6, -D / 2 + 0.1, g); this._box(0.18, 0.25, D, m, -W / 2 + 0.09, 0.55, 0, g); this._box(0.18, 0.25, D, m, W / 2 - 0.09, 0.55, 0, g); },
  tablebasse(g, W, D) { this._box(W, 0.05, D, this._M.teak, 0, 0.42, 0, g); legs4(this, g, W, D, 0.4, this._M.teak); },
  meubletv(g, W, D) { this._box(W * 0.5, 0.6, D, this._M.oak, 0, 0.3, 0, g); this._box(W * 0.95, 0.62, 0.06, this._M.dark, 0, 0.95, 0, g); },
  biblio(g, W, D) { this._box(W, 1.8, D, this._M.white, 0, 0.9, 0, g); [0x9b3d33, 0x3d5f8a, 0xd9b34a, 0x4e7a4f].forEach((c, i) => this._box(W - 0.06, 0.25, 0.04, this._mat(c), 0, 0.35 + i * 0.38, D / 2 - 0.03, g, false)); },
  grandeplante(g, W) { this._cyl(W * 0.3, W * 0.25, 0.4, this._mat(0x5b5754), 0, 0.2, 0, g); for (let i = 0; i < 9; i++) { const a = i * 2.4, l = 1.1 + (i % 3) * 0.25, f = this._box(0.04, l, 0.18, this._M.leaf, Math.cos(a) * 0.12, 0.4 + l / 2, Math.sin(a) * 0.12, g, false); f.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); } },
  tablerepas(g, W, D) { const M = this._M; this._box(W * 0.7, 0.05, D * 0.6, this._mat(0x4a4744), 0, 0.75, 0, g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => this._box(0.06, 0.73, 0.06, M.dark, i * W * 0.32, 0.37, j * D * 0.26, g)); [-0.6, 0, 0.6].forEach((f) => [-1, 1].forEach((s) => { const cx = f * W * 0.38, cz = s * D * 0.42; this._box(0.42, 0.06, 0.42, M.dark, cx, 0.47, cz, g); this._box(0.42, 0.55, 0.06, M.dark, cx, 0.78, cz + s * 0.2, g); })); },
  lit2(g, W, D) { const M = this._M; this._box(W, 0.32, D, M.dark, 0, 0.16, 0, g); this._box(W - 0.06, 0.2, D - 0.06, M.linen, 0, 0.42, 0.02, g); this._box(W, 0.9, 0.08, M.white, 0, 0.45, -D / 2 + 0.04, g); [-1, 1].forEach((s) => this._box(W * 0.4, 0.12, 0.4, M.white, s * W * 0.23, 0.58, -D / 2 + 0.35, g)); this._box(W - 0.04, 0.06, D * 0.6, this._mat(0x8aa7c8), 0, 0.54, D * 0.18, g); },
  chevet(g, W, D) { this._box(W, 0.5, D, this._M.oak, 0, 0.25, 0, g); },
  armoire(g, W, D) { this._box(W, 2.0, D, this._M.white, 0, 1.0, 0, g); },
  commode(g, W, D) { this._box(W, 0.85, D, this._M.oak, 0, 0.42, 0, g); },
  bureau(g, W, D) { const M = this._M; this._box(W, 0.04, D, M.white, 0, 0.74, 0, g); legs4(this, g, W, D, 0.72, M.white); this._box(0.55, 0.32, 0.03, M.dark, 0, 0.98, -D / 2 + 0.12, g); },
  chaisebureau(g, W) { this._cyl(W * 0.4, W * 0.4, 0.1, this._M.dark, 0, 0.48, 0, g); this._box(W * 0.7, 0.45, 0.06, this._M.dark, 0, 0.78, -W * 0.3, g); },
  cuisineangle(g, W, D) { const M = this._M, t = 0.62; this._box(W, 0.88, t, M.cream, 0, 0.44, -D / 2 + t / 2, g); this._box(t, 0.88, D - t, M.cream, -W / 2 + t / 2, 0.44, t / 2, g); this._box(W, 0.04, t + 0.02, M.granite, 0, 0.9, -D / 2 + t / 2, g); this._box(t + 0.02, 0.04, D - t, M.granite, -W / 2 + t / 2, 0.9, t / 2, g); this._cyl(0.12, 0.35, 0.35, M.steel, W / 2 - 0.9, 1.75, -D / 2 + 0.3, g); this._box(0.6, 1.9, t, M.cream, W / 2 - 0.3, 0.95, -D / 2 + t / 2, g); },
  ilot(g, W, D) { this._box(W * 0.45, 0.95, D, this._mat(0xb98348), 0, 0.47, 0, g); },
  evier(g, W, D) { const M = this._M; this._box(W, 0.88, D, M.cream, 0, 0.44, 0, g); this._box(W, 0.04, D, M.granite, 0, 0.9, 0, g); this._box(W * 0.5, 0.02, D * 0.5, M.steel, 0, 0.92, 0, g, false); },
  frigo(g, W, D) { this._box(W * 0.9, 1.75, D * 0.9, this._M.white, 0, 0.88, 0, g); },
  baignoirex(g, W, D) { this._box(W, 0.55, D, this._M.white, 0, 0.27, 0, g); this._box(W - 0.16, 0.02, D - 0.16, this._M.water, 0, 0.53, 0, g, false); },
  douchex(g, W, D) { this._box(W, 0.08, D, this._M.white, 0, 0.04, 0, g); this._box(0.02, 1.95, D, this._mat(0xffffff, { transparent: true, opacity: 0.55 }), W / 2, 1.0, 0, g, false); },
  wcx(g, W, D) { this._box(W * 0.8, 0.4, D * 0.55, this._M.white, 0, 0.2, D * 0.1, g); this._box(W * 0.9, 0.4, D * 0.18, this._M.white, 0, 0.55, -D * 0.38, g); },
  tapisbain(g, W, D) { this._box(W, 0.01, D, this._mat(0xc9a227), 0, 0.065, 0, g, false); },
  lavelinge(g, W, D) { this._box(W * 0.95, 0.85, D * 0.95, this._M.white, 0, 0.42, 0, g); },
  radiateurx(g, W) { for (let y = 0.25; y < 1.5; y += 0.12) this._box(W * 0.6, 0.05, 0.04, this._M.white, 0, y, 0, g, false); },
  tablejardin(g, W, D) { const M = this._M; this._box(W * 0.45, 0.06, D * 0.85, M.teak, 0, 0.76, 0, g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => this._box(0.08, 0.74, 0.08, M.teak, i * W * 0.18, 0.37, j * D * 0.36, g)); [-1, 1].forEach((s) => this._box(0.3, 0.05, D * 0.8, M.teak, s * W * 0.38, 0.45, 0, g)); },
  barbecue(g, W) { this._box(W * 0.8, 0.12, W * 0.6, this._M.dark, 0, 0.85, 0, g); },
  potager(g, W, D) { const M = this._M; this._box(W, 0.3, D, M.oak, 0, 0.15, 0, g); this._box(W - 0.1, 0.02, D - 0.1, M.soil, 0, 0.3, 0, g, false); for (let x = -W / 2 + 0.3; x < W / 2; x += 0.45) for (let z = -D / 2 + 0.25; z < D / 2; z += 0.4) this._ball(0.13, M.leaf2, x, 0.38, z, g); },
  massif(g, W, D) { for (let x = -W / 2 + 0.25; x < W / 2; x += 0.35) this._ball(0.22, Math.round(x * 3) & 1 ? this._M.leaf : this._M.leaf2, x, 0.18, (Math.sin(x * 3) * D) / 4, g, 1, 0.8, 1); },
  lavandes(g, W) { const lav = this._mat(0x9a7cc9); for (let x = -W / 2 + 0.2; x < W / 2; x += 0.32) { this._ball(0.17, this._M.olive, x, 0.15, 0, g, 1, 0.8, 1); this._ball(0.12, lav, x, 0.32, 0, g, 1, 0.6, 1); } },
  potfleurs(g, W) { this._cyl(W * 0.4, W * 0.3, 0.35, this._mat(0xb8673f), 0, 0.17, 0, g); this._ball(W * 0.45, this._mat(0xe0607a), 0, 0.5, 0, g, 1, 0.7, 1); },
  olivier(g, W) { tree(this, g, W * 0.45, 2.6, this._M.olive, 0.16); },
  fruitier(g, W) { tree(this, g, W * 0.4, 2.8, this._M.leaf2, 0.13); },
  palmier(g) { const M = this._M; this._cyl(0.16, 0.22, 2.3, M.bark, 0, 1.15, 0, g, 10); for (let i = 0; i < 14; i++) { const a = i * 0.9, rr = 1 + (i % 3) * 0.7; this._ball(0.95, i % 2 ? M.leaf : M.leaf2, Math.cos(a) * rr, 3.4 + (i % 4) * 0.18, Math.sin(a) * rr, g, 1.2, 0.55, 1.2); } },
};
function tree(self, g, r, h, leaf, tr) { self._cyl(tr * 0.7, tr, h * 0.55, self._M.bark, 0, h * 0.27, 0, g, 8); [[0, 0, 0, 1], [0.5, 0.2, 0.3, 0.7], [-0.45, 0.1, -0.35, 0.75], [0.1, 0.35, -0.5, 0.65], [-0.2, 0.3, 0.5, 0.6]].forEach(([dx, dy, dz, s]) => self._ball(r * s, leaf, dx * r, h * 0.7 + dy * r, dz * r, g, 1, 0.8, 1)); }
function rnd(s) { return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
function shade(hex, d) { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v + d))); return "#" + ((1 << 24) + (f(n >> 16) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1); }

if (!customElements.get("plan-maison-3d-card")) customElements.define("plan-maison-3d-card", PlanMaison3DCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "plan-maison-3d-card")) window.customCards.push({ type: "plan-maison-3d-card", name: "Plan maison 3D", description: "Maquette 3D de la maison, construite à partir de la même configuration que la carte Plan maison (expérimental).", preview: false });
