// Sélecteur d'entité par nom courant : on tape « lampe salon », on choisit dans la liste,
// l'identifiant technique (light.xxx) reste caché.

export const DOMAIN_LABEL = {
  light: "Lumière", switch: "Interrupteur, prise", sensor: "Capteur", binary_sensor: "Détecteur", climate: "Chauffage, climatisation",
  camera: "Caméra", media_player: "Lecteur multimédia", cover: "Volet, porte motorisée", fan: "Ventilateur", lock: "Serrure",
  input_boolean: "Interrupteur virtuel", device_tracker: "Présence", valve: "Vanne", vacuum: "Aspirateur", alarm_control_panel: "Alarme",
  weather: "Météo", update: "Mise à jour", person: "Personne", scene: "Scène", script: "Script", automation: "Automatisation",
  button: "Bouton", number: "Réglage", input_number: "Réglage", select: "Choix", input_select: "Choix", humidifier: "Humidificateur",
  water_heater: "Chauffe-eau", siren: "Sirène", lawn_mower: "Tondeuse", sun: "Soleil", zone: "Zone", event: "Évènement", remote: "Télécommande",
};
export const DEVICE_DOMAINS = ["light", "switch", "sensor", "binary_sensor", "climate", "camera", "media_player", "cover", "fan", "lock", "input_boolean", "device_tracker", "valve", "vacuum", "alarm_control_panel", "humidifier", "water_heater", "siren", "lawn_mower", "button", "scene", "script", "remote"];

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Nom courant d'une entité (nom HA, sinon identifiant). */
export function friendly(hass, eid) {
  const s = hass && hass.states && hass.states[eid];
  if (s && s.attributes && s.attributes.friendly_name) return s.attributes.friendly_name;
  const o = String(eid || "").split(".")[1] || eid || ""; // à défaut : « porte_abri » → « Porte abri »
  return o ? o.charAt(0).toUpperCase() + o.slice(1).replace(/_/g, " ") : "";
}
/** Pièce (zone HA) d'une entité, d'après le registre si disponible. */
export function areaOf(hass, eid) {
  if (!hass || !hass.entities || !hass.areas) return "";
  const e = hass.entities[eid]; if (!e) return "";
  const a = e.area_id || (e.device_id && hass.devices && hass.devices[e.device_id] && hass.devices[e.device_id].area_id);
  return (a && hass.areas[a] && hass.areas[a].name) || "";
}
/** Description courte : « Lumière · Salon ». */
export function describe(hass, eid) {
  const d = DOMAIN_LABEL[String(eid).split(".")[0]] || "Entité", a = areaOf(hass, eid);
  return a ? `${d} · ${a}` : d;
}

export const PICKER_CSS = `
.epk{position:relative;min-width:0}
.epk input{font:inherit;font-size:13.5px;color:var(--ink);background:var(--paper);border:1px solid var(--line);padding:5px 7px;border-radius:5px;width:100%;box-sizing:border-box;min-width:0}
.epk input:focus{outline:none;border-color:var(--sel);box-shadow:0 0 0 2px var(--sel-soft)}
.epk .cur{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--ink-2);pointer-events:none;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.epk ul{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 3px);margin:0;padding:4px;list-style:none;background:var(--surface);border:1px solid var(--line);border-radius:7px;box-shadow:0 10px 28px rgba(0,0,0,.22);max-height:280px;overflow:auto;min-width:240px}
.epk ul[hidden]{display:none}
.epk li{display:flex;flex-direction:column;gap:1px;padding:6px 8px;border-radius:5px;cursor:pointer}
.epk li.on,.epk li:hover{background:var(--sel-soft)}
.epk li b{font-weight:600;font-size:13.5px;color:var(--ink)}
.epk li span{font-size:11.5px;color:var(--ink-2)}
.epk li.none{cursor:default;color:var(--ink-2);font-size:12.5px}
`;

/**
 * Crée un champ de recherche d'entité.
 * opts : hass (fonction qui renvoie hass), value, placeholder, domains (filtre), onPick(entity_id), keepText (garder le texte après choix)
 */
export function createPicker(opts) {
  const root = document.createElement("div"); root.className = "epk";
  root.innerHTML = `<input type="text" autocomplete="off" spellcheck="false"><span class="cur"></span><ul hidden role="listbox"></ul>`;
  const inp = root.querySelector("input"), cur = root.querySelector(".cur"), ul = root.querySelector("ul");
  let value = opts.value || "", items = [], idx = -1;
  const H = () => (typeof opts.hass === "function" ? opts.hass() : opts.hass);
  const show = () => { inp.value = value ? friendly(H(), value) : ""; inp.placeholder = opts.placeholder || "Rechercher un appareil…"; cur.textContent = value ? describe(H(), value) : ""; root.title = value || ""; };
  const search = (q) => {
    const h = H(); if (!h) return [];
    const words = norm(q).split(/\s+/).filter(Boolean);
    const out = [];
    for (const eid of Object.keys(h.states)) {
      const dom = eid.split(".")[0];
      if (opts.domains && !opts.domains.includes(dom)) continue;
      const name = friendly(h, eid), area = areaOf(h, eid), hay = norm(`${name} ${area} ${eid} ${DOMAIN_LABEL[dom] || ""}`);
      if (words.length && !words.every((w) => hay.includes(w))) continue;
      const n = norm(name), score = !words.length ? 2 : n.startsWith(words[0]) ? 0 : n.includes(words[0]) ? 1 : 2;
      out.push({ eid, name, desc: describe(h, eid), score });
    }
    out.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "fr"));
    return out.slice(0, 40);
  };
  const render = () => {
    ul.innerHTML = items.length ? items.map((it, i) => `<li data-i="${i}" class="${i === idx ? "on" : ""}" role="option"><b>${esc(it.name)}</b><span>${esc(it.desc)}</span></li>`).join("") : '<li class="none">Aucun appareil ne correspond.</li>';
    ul.hidden = false;
    const on = ul.querySelector("li.on"); if (on) on.scrollIntoView({ block: "nearest" });
  };
  const open = () => { items = search(inp.value === friendly(H(), value) ? "" : inp.value); idx = items.length ? 0 : -1; cur.textContent = ""; render(); };
  const close = () => { ul.hidden = true; show(); };
  const pick = (it) => { if (!it) return; ul.hidden = true; if (opts.keepText === false) { value = ""; } else value = it.eid; show(); if (opts.keepText === false) inp.value = ""; opts.onPick && opts.onPick(it.eid); };
  inp.addEventListener("focus", () => { inp.select(); open(); });
  inp.addEventListener("input", () => { items = search(inp.value); idx = items.length ? 0 : -1; render(); });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (ul.hidden) open(); idx = Math.min(items.length - 1, idx + 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(0, idx - 1); render(); }
    else if (e.key === "Enter") { e.preventDefault(); if (!ul.hidden) pick(items[idx]); }
    else if (e.key === "Escape") { e.stopPropagation(); close(); inp.blur(); }
    e.stopPropagation(); // évite les raccourcis du plan pendant la saisie
  });
  inp.addEventListener("blur", () => setTimeout(() => { if (!root.contains(root.getRootNode().activeElement)) close(); }, 150));
  ul.addEventListener("pointerdown", (e) => { e.preventDefault(); const li = e.target.closest("li[data-i]"); if (li) pick(items[+li.dataset.i]); });
  root.setValue = (v) => { value = v || ""; show(); };
  root.getValue = () => value;
  show();
  return root;
}
