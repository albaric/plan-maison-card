import { createRequire } from "module"; const require = createRequire(import.meta.url);
const pw = require("/opt/node22/lib/node_modules/playwright");
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 1.5 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
for (const pg of ["gallery", "furniture"]) for (const h of ["", "?dark"]) {
  await p.goto("http://127.0.0.1:8790/test/" + pg + ".html" + h); await p.waitForTimeout(900);
  await p.screenshot({ path: `test/shots/${pg}${h ? "_dark" : ""}.png`, fullPage: true });
}
console.log(errs.filter((e) => !/fonts/.test(e)));
await b.close();
