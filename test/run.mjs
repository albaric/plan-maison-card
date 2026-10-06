// Tests visuels et fonctionnels avec Playwright (Chromium).
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
const BASE = process.env.BASE || "http://127.0.0.1:8790/test/index.html";
const OUT = process.env.OUT || "test/shots";
import fs from "fs"; fs.mkdirSync(OUT, { recursive: true });
const b = await pw.chromium.launch();
const results = [];
async function open(cfg, hash = "") {
  const p = await b.newPage({ viewport: { width: 1340, height: 1150 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/fonts.googleapis|ERR_TUNNEL|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto(`${BASE}?cfg=${cfg}${hash}`); await p.waitForTimeout(900);
  return { p, errs, c: p.locator("plan-maison-card") };
}
const check = (name, ok, info = "") => { results.push([ok ? "OK " : "KO ", name, info]); };

{ // capteur avec unité : icône choisie → icône + pastille de valeur ; sans icône → valeur seule
  const { p, errs, c } = await open("complete");
  const r = await p.evaluate(async () => {
    const cfg = { title: "T", rooms: [{ name: "A", rect: [0, 0, 4, 4] }], devices: [
      { id: "a", entity: "sensor.serveur_memoire", icon: "solar", x: 1, y: 1 },
      { id: "b", entity: "sensor.serveur_memoire", x: 3, y: 1 },
      { id: "c", entity: "sensor.serveur_memoire", icon: "server", kind: "value", x: 2, y: 3 },
      { id: "d", entity: "sensor.station_meteo_temperature", icon: "thermostat", x: 1, y: 3 },
      { id: "e", entity: "sensor.anemometre_vitesse_moyenne", x: 3, y: 3 }] };
    card.setConfig(cfg); await new Promise((r) => setTimeout(r, 400));
    const m = (id) => { const e = card._mk[id].el; return { ico: !!e.querySelector("svg.ico"), lab: e.classList.contains("lab"), vb: (e.querySelector(".vb") || {}).textContent || "", txt: e.textContent }; };
    card._L.icons.e = "fan"; card._build(); await new Promise((r) => setTimeout(r, 300));
    const w = (id) => card._mk[id].el.classList.contains("wg");
    return { a: m("a"), b: m("b"), c: m("c"), d: w("d"), e: w("e") };
  });
  check("icône choisie sur un capteur : icône + valeur", r.a.ico && !r.a.lab && /93/.test(r.a.vb), r.a);
  check("capteur sans icône choisie : valeur seule", !r.b.ico && r.b.lab && /93/.test(r.b.txt), r.b);
  check("kind: value explicite respecté", r.c.lab && !r.c.ico, r.c);
  check("widgets météo conservés malgré une icône enregistrée", r.d && r.e, { d: r.d, e: r.e });
  await p.screenshot({ path: `${OUT}/valeur_icone.png` });
  check("valeur/icône : aucune erreur JS", errs.length === 0, errs.join(" | "));
  await p.close();
}
{ // carte étroite (colonne de tableau de bord) : la pièce touchée s'ouvre en fiche sur le plan ; humidité en goutte
  const p = await b.newPage({ viewport: { width: 520, height: 1000 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`${BASE}?cfg=complete`); await p.waitForTimeout(900);
  const c = p.locator("plan-maison-card");
  const hum = await c.evaluate((el) => !!el.shadowRoot.querySelector(".mk.wg-hum"));
  check("humidité affichée en goutte animée", hum);
  const pt = await c.evaluate((el) => { for (const pg of el.shadowRoot.querySelectorAll("polygon.room")) { const b = pg.getBoundingClientRect(); for (let i = 1; i < 8; i++) for (let j = 1; j < 8; j++) { const x = b.x + b.width * i / 8, y = b.y + b.height * j / 8; if (el.shadowRoot.elementFromPoint(x, y) === pg) return [x, y]; } } return null; });
  await p.mouse.click(pt[0], pt[1]); await p.waitForTimeout(300);
  const r = await c.evaluate((el) => ({ open: !el._pop.hidden && !!el._pop.querySelector(".sheet h2"), focus: el._focus }));
  check("étroit : fiche de la pièce ouverte sur le plan", r.open && !!r.focus, r);
  await p.screenshot({ path: `${OUT}/etroit_piece.png` });
  await c.evaluate((el) => el._pop.querySelector("#pm-x").click()); await p.waitForTimeout(150);
  const r2 = await c.evaluate((el) => ({ hidden: el._pop.hidden, focus: el._focus }));
  check("étroit : fiche fermée, retour à la vue d'ensemble", r2.hidden && !r2.focus, r2);
  check("étroit : aucune erreur JS", errs.length === 0, errs.join(" | "));
  await p.close();
}
for (const cfg of ["complete", "simple", "stub"]) {
  const { p, errs, c } = await open(cfg);
  await p.screenshot({ path: `${OUT}/${cfg}.png` });
  const n = await c.evaluate((el) => ({ rooms: el.shadowRoot.querySelectorAll("polygon.room").length, walls: el.shadowRoot.querySelectorAll("line.wall,line.wext").length, mk: el.shadowRoot.querySelectorAll(".mk").length, furn: el.shadowRoot.querySelectorAll(".piece").length }));
  check(`${cfg}: rendu`, n.rooms > 0 && n.walls > 0, JSON.stringify(n));
  // mode murs : déplacer la première poignée
  await c.locator("#seg button[data-m=walls]").click(); await p.waitForTimeout(150);
  const h = c.locator(".hdl .knob").first(); const bb = await h.boundingBox();
  const before = await c.evaluate((el) => JSON.stringify(el._AX));
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 + 40, bb.y + bb.height / 2 + 40, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(500);
  const after = await c.evaluate((el) => JSON.stringify(el._AX));
  check(`${cfg}: poignée déplacée`, before !== after);
  await p.screenshot({ path: `${OUT}/${cfg}_walls.png` });
  // export
  await c.locator("#export").click(); await p.waitForTimeout(150);
  const y = await c.evaluate((el) => el.shadowRoot.querySelector(".exp textarea").value);
  const re = await p.evaluate(async (y) => { const m = await import("../node_modules/js-yaml/dist/js-yaml.mjs"); const o = m.load(y); const C = customElements.get("plan-maison-card"); const e = document.createElement("plan-maison-card"); e.setConfig(o); return { rooms: o.rooms.length, dev: (o.devices || []).length }; }, y);
  check(`${cfg}: export relu`, re.rooms > 0, JSON.stringify(re));
  fs.writeFileSync(`${OUT}/${cfg}_export.yaml`, y);
  await p.screenshot({ path: `${OUT}/${cfg}_export.png` });
  check(`${cfg}: aucune erreur JS`, errs.length === 0, errs.join(" | "));
  await p.close();
}
{ // sombre + bibliothèque d'icônes
  const { p, errs, c } = await open("complete", "#dark");
  await c.locator("#seg button[data-m=dev]").click(); await p.waitForTimeout(150);
  const mk = c.locator(".mk:has(.ic-lamp)").first(); await mk.click(); await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/complete_dark_pick.png` });
  await c.locator(".ipk button[data-k=bulbrgb]").click(); await p.waitForTimeout(600);
  const st = await p.evaluate(() => JSON.stringify(Object.values(window.store)[0]?.icons));
  check("icône choisie enregistrée", /bulbrgb/.test(st || ""), st);
  await c.locator("#seg button[data-m=furn]").click(); await c.locator("#furn-lib").click(); await p.waitForTimeout(150);
  await p.screenshot({ path: `${OUT}/complete_dark_flib.png` });
  check("sombre : aucune erreur JS", errs.length === 0, errs.join(" | "));
  await p.close();
}
await b.close();
results.forEach((r) => console.log(r.join(" ")));
process.exit(results.some((r) => r[0] === "KO ") ? 1 : 0);
