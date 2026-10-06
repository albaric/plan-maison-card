// Tests de l'éditeur visuel (Playwright) : dessin de pièces, ouvertures, zones, équipements, meubles, annulation.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
import fs from "fs";
const BASE = process.env.BASE || "http://127.0.0.1:8790/test/editor.html";
const OUT = process.env.OUT || "test/shots"; fs.mkdirSync(OUT, { recursive: true });
const b = await pw.chromium.launch();
const results = [];
const check = (name, ok, info = "") => results.push([ok ? "OK " : "KO ", name, typeof info === "string" ? info : JSON.stringify(info)]);

async function open(q, hash = "") {
  const p = await b.newPage({ viewport: { width: 1500, height: 1100 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/fonts.googleapis|ERR_TUNNEL|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto(`${BASE}?${q}${hash}`); await p.waitForTimeout(700);
  return { p, errs };
}
// coordonnées du plan (dm) → écran
const scr = (p, x, y) => p.evaluate(([x, y]) => { const s = ed.shadowRoot.getElementById("svg"), m = s.getScreenCTM(), pt = s.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(m); return [r.x, r.y]; }, [x, y]);
const drag = async (p, a, z, steps = 8) => { const A = await scr(p, ...a), Z = await scr(p, ...z); await p.mouse.move(...A); await p.mouse.down(); await p.mouse.move(...Z, { steps }); await p.mouse.up(); await p.waitForTimeout(120); };
const click = async (p, a) => { const A = await scr(p, ...a); await p.mouse.click(...A); await p.waitForTimeout(120); };
const tool = (p, t) => p.evaluate((t) => ed.shadowRoot.querySelector(`[data-tool=${t}]`).click(), t);
const cfg = (p) => p.evaluate(() => JSON.parse(JSON.stringify(window.cfg)));
const setInput = (p, sel, v) => p.evaluate(([sel, v]) => { const i = ed.shadowRoot.querySelector(sel); i.value = v; i.dispatchEvent(new Event("change")); }, [sel, v]);

{ // plan vide → dessin complet
  const { p, errs } = await open("cfg=empty");
  await p.screenshot({ path: `${OUT}/ed_empty.png` });
  await tool(p, "room"); await drag(p, [0, 0], [50, 40]);
  let c = await cfg(p);
  check("pièce dessinée", c.rooms.length === 1 && JSON.stringify(c.rooms[0].rect) === "[0,0,5,4]", c.rooms);
  await setInput(p, "#props #nm", "Séjour");
  await tool(p, "room"); await drag(p, [50.6, 0.4], [85, 40]); // aimantée sur le mur existant
  c = await cfg(p);
  check("deuxième pièce aimantée", c.rooms.length === 2 && c.rooms[1].rect[0] === 5 && c.rooms[1].rect[1] === 0, c.rooms[1]);
  check("nom de pièce modifié", c.rooms[0].name === "Séjour", c.rooms[0].name);
  await setInput(p, "#props #kd", "nuit");
  c = await cfg(p); check("type de pièce modifié", c.rooms[1].kind === "nuit", c.rooms[1].kind);
  const walls = await p.evaluate(() => ({ int: card.shadowRoot.querySelectorAll("line.wall").length, ext: card.shadowRoot.querySelectorAll("line.wext").length }));
  check("aperçu : cloison et façades", walls.int >= 1 && walls.ext >= 4, walls);
  await tool(p, "door"); await click(p, [50, 20]);
  await tool(p, "window"); await click(p, [25, 0.5]);
  await tool(p, "door"); await click(p, [20, 40]);
  await setInput(p, "#props #sw", "up"); await setInput(p, "#props #lb", "Entrée");
  c = await cfg(p);
  check("ouvertures posées sur les murs", c.openings.length === 3 && c.openings[0].from[0] === 5 && c.openings[1].from[1] === 0 && c.openings[2].swing === "up" && c.openings[2].label === "Entrée", c.openings);
  await tool(p, "zone"); await drag(p, [0, 40], [60, 62]);
  c = await cfg(p); check("zone extérieure", c.zones && c.zones.length === 1 && c.zones[0].rect.join() === "0,4,6,6.2", c.zones);
  await setInput(p, "#props #nm", "Terrasse sud");
  // déplacer le mur commun : les deux pièces suivent
  await tool(p, "select"); await click(p, [25, 20]);
  const before = await cfg(p);
  await drag(p, [50, 30], [56, 30]);
  c = await cfg(p);
  check("mur commun déplacé, pièces collées", c.rooms[0].rect[2] === 5.6 && c.rooms[1].rect[0] === 5.6 && c.openings[0].from[0] === 5.6, { r: c.rooms.map((r) => r.rect), o: c.openings[0] });
  // annuler
  await p.evaluate(() => ed.shadowRoot.getElementById("undo").click()); await p.waitForTimeout(100);
  c = await cfg(p); check("annuler", JSON.stringify(c.rooms) === JSON.stringify(before.rooms), c.rooms.map((r) => r.rect));
  // cotes saisies
  await click(p, [25, 20]); await setInput(p, "#props #rw", "4.5");
  c = await cfg(p); check("largeur saisie", c.rooms[0].rect[2] === 4.5, c.rooms[0].rect);
  // « + » au milieu du mur du haut : ajoute un coin et le tire vers le haut
  await drag(p, [22.5, 0], [22.5, -15]);
  c = await cfg(p); check("coin ajouté avec « + » et tiré", c.rooms[0].points && c.rooms[0].points.length === 5 && c.rooms[0].points.some((q) => Math.abs(q[0] - 2.25) < 0.06 && q[1] === -1.5), c.rooms[0].points);
  // touche un coin : réglage au centimètre puis suppression
  await click(p, [22.5, -15]);
  await setInput(p, "#props #vy", "-1");
  c = await cfg(p); check("coin réglé au centimètre", c.rooms[0].points.some((q) => Math.abs(q[0] - 2.25) < 0.06 && q[1] === -1), c.rooms[0].points);
  await click(p, [22.5, -10]);
  await p.evaluate(() => ed.shadowRoot.querySelector("#props #vdel").click()); await p.waitForTimeout(100);
  c = await cfg(p); check("coin supprimé", JSON.stringify(c.rooms[0].rect) === "[0,0,4.5,4]", c.rooms[0]);
  // outil Forme libre : une pièce en L posée coin par coin
  await tool(p, "poly");
  for (const q of [[90, 0], [130, 0], [130.8, 30], [110, 30.5], [110, 50], [90, 50]]) await click(p, q);
  await click(p, [90.5, 0.5]);
  c = await cfg(p); const L = c.rooms[c.rooms.length - 1];
  check("pièce en L dessinée coin par coin", L.points && L.points.length === 6 && JSON.stringify(L.points) === "[[9,0],[13,0],[13,3],[11,3],[11,5],[9,5]]", L);
  // garder la suite du test sur la première pièce
  await tool(p, "select");
  // équipements
  await p.evaluate(() => ed.shadowRoot.querySelector('[data-t=dev]').click());
  await p.evaluate(() => { const i = ed.shadowRoot.querySelector("#p-dev #new"); i.value = "light.salon"; ed.shadowRoot.querySelector("#addd").click(); });
  await p.waitForTimeout(100);
  c = await cfg(p); check("équipement ajouté avec position", c.devices && c.devices[0].entity === "light.salon" && c.devices[0].x != null, c.devices);
  await p.evaluate(() => ed.shadowRoot.querySelector("#p-dev .pl").click()); await p.waitForTimeout(150);
  await p.evaluate(() => ed.shadowRoot.querySelector('#props .ipk button[data-k="lamp"]').click()); await p.waitForTimeout(100);
  c = await cfg(p); check("icône choisie", c.devices[0].icon === "lamp", c.devices[0]);
  // meuble
  await p.evaluate(() => ed.shadowRoot.getElementById("add-furn").click());
  await p.evaluate(() => ed.shadowRoot.querySelector('#props .ipk button[data-k="canape"]').click()); await p.waitForTimeout(100);
  c = await cfg(p); check("meuble ajouté", c.furniture && c.furniture[0].type === "canape", c.furniture);
  await p.keyboard.press("r"); await p.waitForTimeout(100);
  c = await cfg(p); check("meuble pivoté (R)", c.furniture[0].rot === 90, c.furniture[0]);
  // bandeau
  await p.evaluate(() => ed.shadowRoot.querySelector('[data-t=ban]').click());
  await p.evaluate(() => { ed.shadowRoot.querySelector("#p-ban #new").value = "sensor.exterieur_temperature"; ed.shadowRoot.querySelector("#addb").click(); });
  await p.waitForTimeout(100);
  c = await cfg(p); check("tuile de bandeau", c.banner && c.banner[0].entity === "sensor.exterieur_temperature", c.banner);
  // réglages
  await p.evaluate(() => ed.shadowRoot.querySelector('[data-t=set]').click());
  await setInput(p, "#p-set #ti", "Maison test");
  c = await cfg(p); check("titre", c.title === "Maison test", c.title);
  await p.evaluate(() => ed.shadowRoot.querySelector('[data-t=plan]').click()); await p.waitForTimeout(150);
  await p.screenshot({ path: `${OUT}/ed_drawn.png` });
  const err = await p.evaluate(() => window.cardErr); check("aperçu sans erreur de config", !err, err || "");
  fs.writeFileSync(`${OUT}/ed_drawn.json`, JSON.stringify(c, null, 1));
  check("dessin : aucune erreur JS", errs.length === 0, errs.join(" | "));
  await p.close();
}
{ // plan complet à cloisons nommées : renommer sans convertir, puis déplacer un mur
  const { p, errs } = await open("cfg=complete");
  const note = await p.evaluate(() => ed.shadowRoot.getElementById("note").textContent);
  check("avertissement cloisons nommées", /cloisons nommées/.test(note), note);
  await click(p, [20, 20]);
  await setInput(p, "#props #nm", "Salon");
  let c = await cfg(p);
  check("renommage sans conversion", c.axes && c.rooms[0].name === "Salon" && Array.isArray(c.rooms[0].points) && c.rooms[0].points[1][0] === "xS", c.rooms[0]);
  await p.screenshot({ path: `${OUT}/ed_complete.png` });
  await drag(p, [41, 15], [45, 15]);
  c = await cfg(p);
  check("mur déplacé : conversion en cotes", !c.axes && c.rooms.length === 11 && c.openings.length === 20, { axes: !!c.axes, rooms: c.rooms.length, op: (c.openings || []).length });
  const err = await p.evaluate(() => window.cardErr); check("aperçu complet sans erreur", !err, err || "");
  check("complet : aucune erreur JS", errs.length === 0, errs.join(" | "));
  await p.close();
}
{ // disposition enregistrée sur le plan → intégrée à la config
  const { p, errs } = await open("cfg=complete&layout=plan_maison_maison_de_demonstration", "#dark");
  await p.waitForTimeout(300);
  const has = await p.evaluate(() => !!ed.shadowRoot.getElementById("absorb"));
  check("bandeau d'intégration affiché", has);
  await p.screenshot({ path: `${OUT}/ed_absorb.png` });
  if (has) {
    await p.evaluate(() => ed.shadowRoot.getElementById("absorb").click()); await p.waitForTimeout(300);
    const c = await cfg(p), st = await p.evaluate(() => store["plan_maison_maison_de_demonstration"]);
    const l = c.devices.find((d) => d.id === "lampe");
    check("disposition intégrée", l && l.x === 2 && l.icon === "bulbrgb" && c.rooms[0].name === "Grand séjour" && c.furniture.some((f) => f.type === "piano"), { l, n: c.rooms[0].name });
    check("disposition personnelle vidée", st && !Object.keys(st).length, st);
  }
  check("sombre : aucune erreur JS", errs.length === 0, errs.join(" | "));
  await p.close();
}
await b.close();
results.forEach((r) => console.log(r.join(" ")));
process.exit(results.some((r) => r[0] === "KO ") ? 1 : 0);
