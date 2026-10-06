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
