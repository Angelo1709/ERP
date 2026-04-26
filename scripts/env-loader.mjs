import fs from "node:fs";
import path from "node:path";

export function parseEnvFile(content) {
  const out = {};
  for (const rawLine of String(content || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadEnvFiles(rootDir, fileNames = [".env", ".env.local", ".env.mysql.local"]) {
  const shellKeys = new Set(Object.keys(process.env));
  for (const name of fileNames) {
    const file = path.join(rootDir, name);
    if (!fs.existsSync(file)) continue;
    const vars = parseEnvFile(fs.readFileSync(file, "utf8"));
    for (const [key, value] of Object.entries(vars)) {
      if (shellKeys.has(key)) continue;
      process.env[key] = value;
    }
  }
}
