// Petit sérialiseur YAML pour l'export de la configuration (lisible, listes compactes).

const SAFE = /^[A-Za-zÀ-ÿ_][\wÀ-ÿ .:'#+\-/]*$/;
const RESERVED = /^(true|false|yes|no|on|off|null|~)$/i;

export function scalar(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(Math.round(v * 1000) / 1000);
  const s = String(v);
  if (SAFE.test(s) && !RESERVED.test(s) && !/[:#]\s|\s$|^\s/.test(s) && !/: /.test(s) && !s.includes(" #")) return s;
  return JSON.stringify(s);
}

export function flow(v) {
  if (Array.isArray(v)) return "[" + v.map(flow).join(", ") + "]";
  if (v && typeof v === "object") return "{" + Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => `${k}: ${flow(x)}`).join(", ") + "}";
  return scalar(v);
}

const isScalar = (v) => v === null || typeof v !== "object";
const flat = (v) => isScalar(v) || (Array.isArray(v) && v.every((x) => isScalar(x) || (Array.isArray(x) && x.every(isScalar))));

export function toYaml(o, ind = "") {
  const out = [];
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    if (isScalar(v) || (Array.isArray(v) && flat(v))) out.push(`${ind}${k}: ${Array.isArray(v) ? flow(v) : scalar(v)}`);
    else if (Array.isArray(v)) {
      out.push(`${ind}${k}:`);
      v.forEach((x) => out.push(`${ind}  - ${isScalar(x) ? scalar(x) : flow(x)}`));
    } else if (Object.values(v).every((x) => isScalar(x) || flat(x) || (x && typeof x === "object" && !Array.isArray(x) && Object.values(x).every(isScalar)))) {
      out.push(`${ind}${k}:`);
      for (const [kk, x] of Object.entries(v)) out.push(`${ind}  ${kk}: ${isScalar(x) ? scalar(x) : flow(x)}`);
    } else { out.push(`${ind}${k}:`); out.push(toYaml(v, ind + "  ")); }
  }
  return out.join("\n");
}
