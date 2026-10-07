// État général d'un appareil : on rassemble toutes les entités du même appareil Home Assistant
// (registre hass.entities / hass.devices) et on en tire des indicateurs (processeur, mémoire, disque,
// température interne, pile, signal, dernière connexion, mises à jour, problèmes signalés) et un niveau global.

const NA = ["unavailable", "unknown"];
const N = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const RANK = { ok: 0, info: 1, warn: 2, bad: 3, na: 4 };
export const HEALTH_LABEL = { ok: "En bonne santé", info: "À jour bientôt", warn: "À surveiller", bad: "Problème", na: "Hors ligne" };

/** Nature d'une entité de l'appareil, ou null si elle n'est pas un indicateur de santé. */
function kindOf(eid, st, reg) {
  const dom = eid.split(".")[0], a = st.attributes || {}, dc = a.device_class || "", u = a.unit_of_measurement || "", n = N((a.friendly_name || "") + " " + eid);
  if (dom === "update") return "update";
  if (dom === "binary_sensor") {
    if (dc === "connectivity") return "conn";
    if (["problem", "safety", "tamper"].includes(dc)) return "problem";
    if (dc === "battery") return "batlow";
    if (dc === "update") return "update";
    return null;
  }
  if (dom !== "sensor") return null;
  if (dc === "battery" || (/batter|\bpile/.test(n) && u === "%")) return "battery";
  if (/linkquality|\blqi\b|qualite.{0,4}lien/.test(n)) return "lqi";
  if (dc === "signal_strength" || /rssi|signal/.test(n)) return "signal";
  if (/cpu|processeur|processor/.test(n) && u === "%") return "cpu";
  if (/load|charge.{0,6}(syst|moy)/.test(n) && !u) return "load";
  if (/memo|\bram\b|swap/.test(n) && u === "%") return "mem";
  if (/disk|disque|storage|stockage|volume|espace|\bdisk\b|\/|root|partition/.test(n) && u === "%") return "disk";
  if (dc === "temperature" && /cpu|processeur|\bsoc\b|chip|puce|core|board|carte|syst|nvme|ssd|hdd|disque|interne|internal|esp|module/.test(n)) return "temp";
  if (dc === "timestamp" && /boot|demarr|start|uptime|en ligne depuis/.test(n)) return "boot";
  if (dc === "timestamp" && /last.?seen|dernier|derniere|vu le|last.?update|last.?contact/.test(n)) return "seen";
  if (/uptime|duree.{0,10}fonction/.test(n)) return "uptime";
  if (dc === "power") return "power";
  if (dc === "voltage") return "voltage";
  if (reg && reg.entity_category === "diagnostic" && !NA.includes(st.state)) return "diag";
  return null;
}
const ORDER = ["conn", "problem", "cpu", "load", "mem", "disk", "temp", "battery", "batlow", "signal", "lqi", "power", "voltage", "seen", "boot", "uptime", "update", "diag"];
const NAME = { conn: "Connexion", problem: "Problème", cpu: "Processeur", load: "Charge", mem: "Mémoire", disk: "Disque", temp: "Température interne", battery: "Pile", batlow: "Pile", signal: "Signal", lqi: "Qualité du lien", power: "Consommation", voltage: "Tension", seen: "Dernière connexion", boot: "Démarré", uptime: "Fonctionne depuis", update: "Mise à jour", diag: "" };

const num = (st) => { const v = parseFloat(st.state); return isNaN(v) ? null : v; };
const ago = (t) => {
  const ms = Date.now() - new Date(t).getTime(); if (isNaN(ms)) return "";
  const m = Math.round(ms / 60000); if (m < 1) return "à l'instant"; if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60); if (h < 48) return `il y a ${h} h`; return `il y a ${Math.round(h / 24)} j`;
};
const since = (t) => { const s = ago(t); return s.replace(/^il y a /, "depuis "); };
const fr = (v, d = 0) => Number(v).toLocaleString("fr-FR", { maximumFractionDigits: d });
const lvl = (v, warn, bad, below) => (v == null ? "ok" : below ? (v < bad ? "bad" : v < warn ? "warn" : "ok") : v >= bad ? "bad" : v >= warn ? "warn" : "ok");

/** Entités du même appareil que eid (hors entités masquées). */
const IDX = new WeakMap(); // registre → { device_id: [entrées] }, recalculé seulement quand le registre change
function byDevice(entities) {
  let m = IDX.get(entities);
  if (!m) { m = {}; for (const e of Object.values(entities)) if (e.device_id) (m[e.device_id] = m[e.device_id] || []).push(e); IDX.set(entities, m); }
  return m;
}
export function deviceEntities(hass, eid) {
  if (!hass || !hass.entities) return null;
  const reg = hass.entities[eid]; if (!reg || !reg.device_id) return null;
  const list = (byDevice(hass.entities)[reg.device_id] || []).filter((e) => !e.hidden && hass.states[e.entity_id]);
  return { id: reg.device_id, dev: (hass.devices && hass.devices[reg.device_id]) || {}, list };
}

/** Bilan de santé d'un appareil. Renvoie null si l'entité n'est rattachée à aucun appareil ou n'a pas d'indicateur. */
export function deviceHealth(hass, eid, ignore) {
  const ign = new Set(ignore || []);
  const d = deviceEntities(hass, eid); if (!d) return null;
  const devName = d.dev.name_by_user || d.dev.name || "";
  const metrics = [];
  let off = 0;
  for (const e of d.list) {
    const st = hass.states[e.entity_id]; if (!st) continue;
    if (NA.includes(st.state)) { off++; }
    const k = kindOf(e.entity_id, st, e); if (!k) continue;
    const a = st.attributes || {}, u = a.unit_of_measurement || "", v = num(st), na = NA.includes(st.state);
    let label = a.friendly_name || NAME[k] || e.entity_id;
    if (devName && N(label).startsWith(N(devName)) && label.length > devName.length + 1) label = label.slice(devName.length).replace(/^[\s:·-]+/, "");
    const m = { k, eid: e.entity_id, label: NAME[k] && k !== "diag" && !/^\d/.test(label) && label.length > 24 ? NAME[k] : label || NAME[k], text: na ? "–" : st.state, level: na ? "na" : "ok", pct: null };
    if (!na) switch (k) {
      case "cpu": m.pct = v; m.level = lvl(v, 85, 95); m.text = fr(v) + " %"; break;
      case "mem": m.pct = v; m.level = lvl(v, 90, 97); m.text = fr(v) + " %"; break;
      case "disk": m.pct = v; m.level = lvl(v, 85, 95); m.text = fr(v) + " %"; break;
      case "battery": m.pct = v; m.level = lvl(v, 20, 10, true); m.text = fr(v) + " %"; break;
      case "temp": m.level = lvl(v, 70, 85); m.text = fr(v, 1) + " " + u; break;
      case "signal": m.level = u === "%" ? lvl(v, 40, 20, true) : lvl(v, -80, -90, true); m.text = fr(v) + " " + u; m.pct = u === "%" ? v : Math.max(0, Math.min(100, (v + 100) * 2)); break;
      case "lqi": m.level = lvl(v, 50, 20, true); m.text = fr(v); m.pct = Math.min(100, (v / 255) * 100); break;
      case "load": m.text = fr(v, 2); break;
      case "conn": m.level = st.state === "on" ? "ok" : "bad"; m.text = st.state === "on" ? "Connecté" : "Déconnecté"; break;
      case "problem": m.level = st.state === "on" ? "bad" : "ok"; m.text = st.state === "on" ? "Signalé" : "Aucun"; break;
      case "batlow": m.level = st.state === "on" ? "warn" : "ok"; m.text = st.state === "on" ? "Faible" : "Correcte"; break;
      case "update": m.level = st.state === "on" ? "info" : "ok"; m.text = st.state === "on" ? "Disponible" + (a.latest_version ? " (" + a.latest_version + ")" : "") : "À jour"; m.label = a.title || m.label; break;
      case "seen": { const h = (Date.now() - new Date(st.state).getTime()) / 3600000; m.level = h > 72 ? "bad" : h > 24 ? "warn" : "ok"; m.text = ago(st.state); break; }
      case "boot": m.text = since(st.state); break;
      default: m.text = v != null ? fr(v, 1) + (u ? " " + u : "") : st.state;
    }
    metrics.push(m);
  }
  if (!metrics.length) return null;
  metrics.sort((x, y) => ORDER.indexOf(x.k) - ORDER.indexOf(y.k));
  const main = hass.states[eid], mainOff = !main || NA.includes(main.state);
  metrics.forEach((m) => (m.ign = ign.has(m.eid))); // indicateurs ignorés : affichés, mais sans effet sur l'état
  const live = metrics.filter((m) => !m.ign);
  let level = live.reduce((acc, m) => (m.level !== "na" && RANK[m.level] > RANK[acc] ? m.level : acc), "ok");
  if (mainOff && off >= d.list.length * 0.5) level = "na";
  const reasons = level === "na" ? ["Ne répond plus"] : live.filter((m) => m.level === "bad" || m.level === "warn" || m.level === "info").sort((x, y) => RANK[y.level] - RANK[x.level]).map((m) => `${m.label} : ${m.text}`);
  return { device: { id: d.id, name: devName, model: [d.dev.manufacturer, d.dev.model].filter(Boolean).join(" · "), sw: d.dev.sw_version || "" }, level, label: HEALTH_LABEL[level], reasons, metrics, count: d.list.length };
}

export const HEALTH_CSS = `
.mk.h-warn:not(.na){box-shadow:0 0 0 3px color-mix(in srgb,#f0a020 55%,transparent),0 1px 2px rgba(0,0,0,.18)}
.mk.h-bad:not(.na){box-shadow:0 0 0 3px color-mix(in srgb,#e5484d 60%,transparent),0 1px 2px rgba(0,0,0,.18);animation:pmhb 2s ease-in-out infinite}
@keyframes pmhb{50%{box-shadow:0 0 0 6px color-mix(in srgb,#e5484d 25%,transparent),0 1px 2px rgba(0,0,0,.18)}}
.hsheet{display:flex;flex-direction:column;gap:8px}
.hhead{display:flex;align-items:center;gap:10px}.hhead .t{font-weight:600}.hhead .s{font-size:12px;color:var(--ink-2)}
.hst{display:inline-flex;align-items:center;gap:6px;font-family:var(--f-mono);font-size:12px;padding:2px 9px;border-radius:12px;white-space:nowrap;margin-left:auto}
.hst::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}
.hst.ok{background:var(--ok-soft);color:var(--ok)}.hst.info{background:#dfe9fb;color:#2f5fb8}.hst.warn{background:var(--on-soft);color:var(--on)}.hst.bad{background:var(--na-soft);color:var(--na)}.hst.na{background:var(--idle-soft);color:var(--idle)}
:host(.dark) .hst.info{background:#22324e;color:#8fb1f5}
.hwhy{margin:0;padding:6px 9px;border-radius:6px;background:var(--paper);font-size:12.5px;list-style:none}.hwhy li{padding:1px 0}
.hgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.hm{border:1px solid var(--line);border-radius:7px;padding:6px 8px;min-width:0;cursor:pointer}.hm:hover{border-color:var(--sel)}
.hm .k{font-size:11.5px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hm .v{font-family:var(--f-mono);font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hm.warn .v{color:var(--on)}.hm.bad .v{color:var(--na)}.hm.info .v{color:#2f6fe0}.hm.na .v{color:var(--ink-2)}
.hm .bar{height:4px;border-radius:2px;background:var(--idle-soft);margin-top:4px;overflow:hidden}.hm .bar i{display:block;height:100%;border-radius:2px;background:var(--ok)}
.hm.warn .bar i{background:var(--on)}.hm.bad .bar i{background:var(--na)}
.hm{position:relative}.hm .hig{position:absolute;top:4px;right:4px;font:inherit;font-size:10.5px;line-height:1.4;padding:0 6px;border-radius:9px;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);cursor:pointer;opacity:0;transition:opacity .15s}
.hm:hover .hig,.hm.ign .hig{opacity:1}@media (hover:none){.hm .hig{opacity:1}}.hm .hig:hover{border-color:var(--sel);color:var(--sel)}
.hm.ign{opacity:.55;border-style:dashed}.hm.ign .v{color:var(--ink-2)!important;text-decoration:line-through}.hm.ign .bar i{background:var(--idle)!important}
.hnote{font-size:11.5px;color:var(--ink-2);margin:0}
.hdot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-left:6px;vertical-align:middle}.hdot.warn{background:var(--on)}.hdot.bad{background:var(--na)}.hdot.info{background:#2f6fe0}
`;
