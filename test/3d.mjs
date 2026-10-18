// Carte 3D : construction de la maquette à partir des exemples (three.js servi localement à la place du CDN).
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
const BASE = process.env.BASE || "http://127.0.0.1:8790/test/index.html";
const OUT = process.env.OUT || "test/shots"; fs.mkdirSync(OUT, { recursive: true });
const b = await pw.chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const results = [], check = (n, ok, info = "") => results.push([ok ? "OK " : "KO ", n, typeof info === "string" ? info : JSON.stringify(info)]);
for (const cfg of ["complete", "stub"]) {
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/fonts.googleapis|ERR_TUNNEL|net::/.test(m.text())) errs.push(m.text()); });
  await p.route("https://cdn.jsdelivr.net/npm/three@0.128.0/**", (r) => r.fulfill({ path: "node_modules/three/" + r.request().url().split("three@0.128.0/")[1], contentType: "application/javascript" }));
  await p.goto(`${BASE}?cfg=${cfg}&card=3d`); await p.waitForTimeout(3500);
  const r = await p.evaluate(() => { const c = card; return { ready: !!c._ready, msg: (c.shadowRoot.getElementById("msg") || {}).textContent || "", walls: c._g ? c._g.walls.children.length : 0, roofs: c._grid ? c._grid.rects.length : 0, furn: c._g ? c._g.furn.children.length + c._g.out.children.length : 0, dev: (c._dv || []).length, gl: (c._gl || []).length }; });
  check(`${cfg}: maquette construite`, r.ready && r.walls > 4 && r.roofs >= 1, r);
  await p.screenshot({ path: `${OUT}/3d_${cfg}.png` });
  if (cfg === "complete") {
    check("complete: mobilier, équipements et guirlandes en 3D", r.furn > 10 && r.dev > 5 && r.gl >= 1, r);
    await p.evaluate(() => card.shadowRoot.getElementById("bLab").click()); await p.waitForTimeout(500);
    const roofOff = await p.evaluate(() => !card._g.roof.visible && !card.shadowRoot.getElementById("labs").hidden);
    check("complete: toit masqué et pièces nommées", roofOff);
    await p.screenshot({ path: `${OUT}/3d_${cfg}_inside.png` });
    await p.evaluate(() => card.shadowRoot.getElementById("bNight").click()); await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/3d_${cfg}_night.png` });
  }
  check(`${cfg}: aucune erreur JS`, errs.length === 0, errs.join(" | "));
  await p.close();
}
await b.close();
results.forEach((r) => console.log(r.join(" ")));
process.exit(results.some((r) => r[0] === "KO ") ? 1 : 0);
