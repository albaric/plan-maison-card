// Catalogue de mobilier (unités internes : décimètres, 1 = 10 cm).
// Chaque meuble : [nom, catégorie, largeur, profondeur, options, couleur par défaut]
// options : « o » rond, « s » redimensionnable dans l'éditeur, « c » couleur au choix.
// Les anciennes clés gardent leur taille d'origine pour ne pas décaler les plans existants.
export const META = {
  // salon
  canape: ["Canapé", "salon", 18, 7, "sc", "canard"],
  canapeangle: ["Canapé d'angle", "salon", 22, 18, "c", "sauge"],
  fauteuil: ["Fauteuil", "salon", 7, 7, "c", "moutarde"],
  pouf: ["Pouf", "salon", 5, 5, "oc", "corail"],
  tablebasse: ["Table basse", "salon", 10, 5, "s"],
  tablebasseronde: ["Table basse ronde", "salon", 8, 8, "o"],
  meubletv: ["Meuble TV", "salon", 12, 3.5, "s"],
  tvx: ["Télévision", "salon", 12, 1.2, "s"],
  biblio: ["Bibliothèque", "salon", 12, 3.5, "s"],
  cheminee: ["Cheminée", "salon", 14, 5, ""],
  piano: ["Piano", "salon", 15, 6, ""],
  lampadaire: ["Lampadaire", "salon", 3.6, 3.6, "o"],
  tapis: ["Tapis", "salon", 14, 8, "sc", "terracotta"],
  tapisrond: ["Tapis rond", "salon", 12, 12, "oc", "bleu"],
  poele: ["Poêle", "salon", 5.6, 5.6, "o"],
  plante: ["Plante", "salon", 4, 4, "o"],
  escalier: ["Escalier droit", "salon", 9, 30, "s"],
  escalierquart: ["Escalier quart tournant", "salon", 22, 26, "s"],
  grandeplante: ["Grande plante", "salon", 7, 7, "o"],
  // repas
  table: ["Table", "repas", 8, 14, "s"],
  tablerepas: ["Table et 6 chaises", "repas", 20, 14, "c", "moutarde"],
  tableronde: ["Table ronde", "repas", 10, 10, "o"],
  tablerondechaises: ["Table ronde et 4 chaises", "repas", 16, 16, "oc", "sauge"],
  chaise: ["Chaise", "repas", 3.2, 3.2, "c", "moutarde"],
  // chambre
  lit2: ["Lit double", "chambre", 16, 20, "sc", "bleu"],
  lit1: ["Lit simple", "chambre", 9, 19, "c", "sauge"],
  litbebe: ["Lit bébé", "chambre", 7, 13, "c", "rose"],
  chevet: ["Table de chevet", "chambre", 4.5, 4, ""],
  armoire: ["Armoire", "chambre", 10, 6, "s"],
  commode: ["Commode", "chambre", 10, 5, "c", "sauge"],
  // bureau
  bureau: ["Bureau", "bureau", 12, 6, "s"],
  chaisebureau: ["Fauteuil de bureau", "bureau", 6, 6, "oc", "anthracite"],
  // cuisine
  cuisine: ["Cuisine équipée", "cuisine", 24, 6, "s"],
  plantravail: ["Plan de travail", "cuisine", 24, 6, "s"],
  bar: ["Bar", "cuisine", 12, 5, "s"],
  cuisineangle: ["Cuisine d'angle", "cuisine", 24, 18, "s"],
  ilot: ["Îlot central", "cuisine", 18, 9, "sc", "moutarde"],
  evier: ["Évier", "cuisine", 8, 5, ""],
  evierdouble: ["Évier double", "cuisine", 12, 6, ""],
  four: ["Cuisinière", "cuisine", 6, 6, ""],
  plaque: ["Plaque de cuisson", "cuisine", 6, 5.2, ""],
  frigo: ["Réfrigérateur", "cuisine", 6.5, 6.5, ""],
  frigoamericain: ["Frigo américain", "cuisine", 9.2, 7, ""],
  lavevaisselle: ["Lave-vaisselle", "cuisine", 6, 6, ""],
  tabouret: ["Tabouret", "cuisine", 3.6, 3.6, "oc", "corail"],
  // salle de bain et buanderie
  baignoirex: ["Baignoire", "sdb", 8, 17, ""],
  douchex: ["Douche", "sdb", 9, 9, "s"],
  lavabo: ["Lavabo", "sdb", 5, 4, ""],
  meublevasque: ["Meuble double vasque", "sdb", 14, 5.5, "s"],
  wcx: ["WC", "sdb", 4.8, 10.2, ""],
  secheserviette: ["Sèche-serviettes", "sdb", 6, 1.2, "c", "corail"],
  tapisbain: ["Tapis de bain", "sdb", 6, 4, "c", "ciel"],
  lavelinge: ["Lave-linge", "sdb", 6, 6, ""],
  seche: ["Sèche-linge", "sdb", 6, 6, ""],
  radiateurx: ["Radiateur", "sdb", 8, 1.2, "s"],
  // jardin
  transat: ["Transat", "jardin", 6, 18, "c", "corail"],
  salonjardin: ["Salon de jardin", "jardin", 22, 18, "c", "canard"],
  tablejardin: ["Table de jardin", "jardin", 18, 14, ""],
  parasol: ["Parasol", "jardin", 14, 14, "oc", "corail"],
  barbecue: ["Barbecue", "jardin", 6, 6, "o"],
  brasero: ["Brasero", "jardin", 7, 7, "o"],
  piscine: ["Piscine", "jardin", 80, 40, "s"],
  spa: ["Spa", "jardin", 20, 20, ""],
  pergola: ["Pergola glycine", "jardin", 30, 30, "s"],
  potager: ["Potager", "jardin", 24, 12, "s"],
  massif: ["Massif fleuri", "jardin", 16, 8, "s"],
  lavandes: ["Rang de lavandes", "jardin", 14, 3.5, "s"],
  haie: ["Haie", "jardin", 30, 4, "s"],
  olivier: ["Olivier", "jardin", 22, 22, "o"],
  palmier: ["Palmier", "jardin", 20, 20, "o"],
  fruitier: ["Arbre fruitier", "jardin", 24, 24, "o"],
  potfleurs: ["Pot de fleurs", "jardin", 3.4, 3.4, "oc", "corail"],
  hamac: ["Hamac", "jardin", 24, 7, "c", "moutarde"],
  trampoline: ["Trampoline", "jardin", 30, 30, "o"],
  tondeuse: ["Robot tondeuse", "jardin", 6, 5, ""],
  voiture: ["Voiture", "jardin", 18, 45, "c", "bleu"],
  velo: ["Vélo", "jardin", 6, 18, "c", "corail"],
};

export const CATS = [["salon", "Salon"], ["repas", "Repas"], ["chambre", "Chambre"], ["bureau", "Bureau"], ["cuisine", "Cuisine"], ["sdb", "Salle de bain"], ["jardin", "Jardin"]];

export const COLORS = {
  canard: "#2f8f9d", bleu: "#4f7fd9", ciel: "#7cc0ea", marine: "#34508f", sauge: "#86b38a", vert: "#3f9b62",
  moutarde: "#e5b13a", corail: "#ee7a62", terracotta: "#cf6e46", rose: "#ee9fb3", lavande: "#9d86d6",
  gris: "#97a1ab", anthracite: "#4a5058", lin: "#e6dcc8",
};
export const COLOR_NAMES = { canard: "Bleu canard", bleu: "Bleu", ciel: "Bleu ciel", marine: "Marine", sauge: "Vert sauge", vert: "Vert", moutarde: "Moutarde", corail: "Corail", terracotta: "Terracotta", rose: "Rose", lavande: "Lavande", gris: "Gris", anthracite: "Anthracite", lin: "Lin" };

/** Couleur effective d'un meuble (nom de la palette ou #hex). */
export function furnColor(type, color) {
  if (color && COLORS[color]) return COLORS[color];
  if (color && /^#[0-9a-f]{3,8}$/i.test(color)) return color;
  const m = META[type];
  return COLORS[(m && m[5]) || "gris"];
}

/** Formes de sélection (dm) d'un meuble du catalogue, à sa taille par défaut ou redimensionné. */
export function furnParts(type, w, h) {
  const m = META[type]; if (!m) return null;
  const W = w || m[2], H = h || m[3];
  return m[4].includes("o") && !w && !h ? [["c", W / 2, W / 2, W / 2]] : m[4].includes("o") ? [["e", W / 2, H / 2, W / 2, H / 2]] : [["r", 0, 0, W, H, 0.4]];
}

// Compatibilité : CAT[k] = [nom, formes] ; FSTYLE pour les meubles dessinés à la main (parts).
export const CAT = Object.fromEntries(Object.entries(META).map(([k, m]) => [k, [m[0], furnParts(k)]]));
export const FSTYLE = { lit2: "bed", lit1: "bed", litbebe: "bed", canape: "sofa", canapeangle: "sofa", fauteuil: "sofa", pouf: "sofa", table: "wood", tableronde: "wood", tablebasse: "wood", chaise: "wood", armoire: "wood", bureau: "wood", commode: "wood", meubletv: "wood", biblio: "wood", lavelinge: "app", seche: "app", frigo: "app", plante: "plant", grandeplante: "plant", tapis: "rug", tapisrond: "rug", transat: "garden", lampadaire: "lamp", tvx: "tv", piano: "piano", four: "counter", evier: "counter", lavabo: "ceramic", wcx: "ceramic", douchex: "shower", baignoirex: "bath", radiateurx: "metal", barbecue: "stove", parasol: "parasol" };

/* ---------- conversion des meubles dessinés à la main (parts) en meubles du catalogue ---------- */
const NORM = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const BY_NAME = [[/bebe/, "litbebe"], [/\blit\b|literie/, "lit"], [/canape d.angle|angle/, "canapeangle"], [/canape|sofa/, "canape"], [/fauteuil de bureau|chaise de bureau/, "chaisebureau"], [/fauteuil/, "fauteuil"], [/pouf/, "pouf"],
  [/table basse/, "tablebasse"], [/table ronde/, "tableronde"], [/salon de jardin/, "salonjardin"], [/table de jardin/, "tablejardin"], [/table.*chaise|chaises/, "tablerepas"], [/\btable\b/, "table"], [/tabouret/, "tabouret"], [/chaise/, "chaise"],
  [/armoire|penderie|dressing/, "armoire"], [/commode|rangement|buffet|grand meuble|console/, "commode"], [/biblio|etagere/, "biblio"], [/meuble tv|television|\btv\b/, "meubletv"], [/bureau/, "bureau"], [/chevet/, "chevet"],
  [/poele|cheminee|insert/, "poele"], [/piano/, "piano"], [/lampadaire|lampe/, "lampadaire"], [/tapis/, "tapis"], [/plante|ficus|palmier/, "plante"],
  [/\bwc\b|toilette/, "wcx"], [/vasque/, "meublevasque"], [/lave.mains|lavabo/, "lavabo"], [/douche/, "douchex"], [/baignoire|bain/, "baignoirex"], [/seche.serviette/, "secheserviette"], [/radiateur/, "radiateurx"],
  [/lave.linge/, "lavelinge"], [/seche.linge/, "seche"], [/lave.vaisselle/, "lavevaisselle"], [/frigo|refrigerateur/, "frigo"], [/\bbar\b|comptoir/, "bar"], [/plan de travail/, "plantravail"], [/plaque|cuisson/, "plaque"], [/evier/, "evier"], [/cuisine/, "cuisine"],
  [/transat|bain de soleil/, "transat"], [/parasol/, "parasol"], [/barbecue|plancha/, "barbecue"], [/brasero/, "brasero"], [/piscine/, "piscine"], [/spa|jacuzzi/, "spa"], [/potager/, "potager"], [/hamac/, "hamac"]];
const BY_STYLE = { bed: "lit", sofa: "canape", dining: "tablerepas", ceramic: "lavabo", bath: "baignoirex", shower: "douchex", counter: "plantravail", metal: "radiateurx", stove: "poele", stool: "tabouret", garden: "tablejardin", plant: "plante", rug: "tapis", wood: "commode", app: "lavelinge", lamp: "lampadaire", tv: "tvx", parasol: "parasol", piano: "piano" };
const bbx = (parts) => { let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9; const e = (a, b, c, d) => { x1 = Math.min(x1, a); y1 = Math.min(y1, b); x2 = Math.max(x2, c); y2 = Math.max(y2, d); };
  parts.forEach((p) => p[0] === "r" ? e(p[1], p[2], p[1] + p[3], p[2] + p[4]) : p[0] === "c" ? e(p[1] - p[3], p[2] - p[3], p[1] + p[3], p[2] + p[3]) : p[0] === "e" ? e(p[1] - p[3], p[2] - p[4], p[1] + p[3], p[2] + p[4]) : e(Math.min(p[1], p[3]), Math.min(p[2], p[4]), Math.max(p[1], p[3]), Math.max(p[2], p[4])));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }; };
/** Type du catalogue le plus proche d'un meuble dessiné à la main (d'après son nom, puis son style). */
export function guessFurnType(name, style, parts) {
  const t = NORM(name); let k = (BY_NAME.find(([re]) => re.test(t)) || [])[1] || BY_STYLE[style] || "commode";
  if (k === "lit") { const b = bbx(parts || []); k = Math.min(b.w, b.h) >= 13 ? "lit2" : "lit1"; }
  return k;
}
/** Convertit un meuble { x, y, rot, parts, name, style } (dm) en un ou plusieurs meubles du catalogue, même emprise. */
export function modernizeFurn(f) {
  const parts = f.parts || []; if (!parts.length) return [f];
  const type = guessFurnType(f.name, f.style, parts), m = META[type], rot = f.rot || 0;
  const circles = parts.every((p) => p[0] === "c") && parts.length > 1 && ["tabouret", "chaise", "pouf", "plante"].includes(type);
  // côté « dos » (oreillers d'un lit, dossier d'un canapé) d'après les formes secondaires
  const side = (b) => {
    if (!["lit2", "lit1", "litbebe", "canape", "fauteuil", "canapeangle"].includes(type) || parts.length < 2) return null;
    const c = parts.slice(1).map((p) => p[0] === "r" ? [p[1] + p[3] / 2, p[2] + p[4] / 2] : [p[1], p[2]]);
    const dx = (c.reduce((a, q) => a + q[0], 0) / c.length - (b.x + b.w / 2)) / b.w, dy = (c.reduce((a, q) => a + q[1], 0) / c.length - (b.y + b.h / 2)) / b.h;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 0.12) return null;
    return Math.abs(dy) >= Math.abs(dx) ? (dy < 0 ? 0 : 180) : dx > 0 ? 90 : 270;
  };
  const one = (b, name) => {
    const nat = m[2] >= m[3], here = b.w >= b.h, sq = Math.abs(b.w - b.h) < 0.15 * Math.max(b.w, b.h), sd = side(b);
    const turn = sd != null ? sd % 180 !== 0 : !sq && nat !== here, w = turn ? b.h : b.w, h = turn ? b.w : b.h, cx = f.x + b.x + b.w / 2, cy = f.y + b.y + b.h / 2;
    const extra = sd != null ? sd : turn ? 90 : 0;
    const r2 = (v) => Math.round(v * 100) / 100;
    const o = { type, name: name || null, x: r2(cx - w / 2), y: r2(cy - h / 2), rot: (rot + extra) % 360 };
    if (Math.abs(w - m[2]) > 0.05 || Math.abs(h - m[3]) > 0.05) { o.w = r2(w); o.h = r2(h); }
    return o;
  };
  if (circles) return parts.map((p, i) => one({ x: p[1] - p[3], y: p[2] - p[3], w: 2 * p[3], h: 2 * p[3] }, i ? null : f.name));
  const main = one(bbx(parts), f.name), out = [main];
  if (type === "plantravail") { // « plan de travail et évier / plaques » : on pose l'évier et la plaque dessus
    const t = NORM(f.name), adds = [/evier/.test(t) && "evier", /plaque|cuisson/.test(t) && "plaque"].filter(Boolean);
    const W = main.w || m[2], H = main.h || m[3], cx = main.x + W / 2, cy = main.y + H / 2, a = (main.rot * Math.PI) / 180;
    adds.forEach((k, i) => {
      const am = META[k], off = adds.length > 1 ? (i ? 0.22 : -0.22) * W : 0.15 * W, ih = Math.min(am[3], H * 0.92), iw = am[2] * (ih / am[3]);
      const px = cx + Math.cos(a) * off, py = cy + Math.sin(a) * off, r2 = (v) => Math.round(v * 100) / 100;
      const o = { type: k, name: null, x: r2(px - iw / 2), y: r2(py - ih / 2), rot: main.rot }; if (ih !== am[3]) { o.w = r2(iw); o.h = r2(ih); }
      out.push(o);
    });
  }
  return out;
}
