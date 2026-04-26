import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { loadEnvFiles } from "./env-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
loadEnvFiles(ROOT_DIR, [".env", ".env.local", ".env.mysql.local", ".env.server.local"]);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable ${name}`);
  return value;
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const conn = await mysql.createConnection({
  host: required("MYSQL_HOST"),
  port: Number(process.env.MYSQL_PORT || 3306),
  user: required("MYSQL_USER"),
  password: process.env.MYSQL_PASSWORD || "",
  database: required("MYSQL_DATABASE"),
});

await conn.query(`
  CREATE TABLE IF NOT EXISTS app_state (
    id TINYINT UNSIGNED PRIMARY KEY,
    payload LONGTEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

const [rows] = await conn.query("SELECT payload, updated_at FROM app_state WHERE id = 1 LIMIT 1");
await conn.end();

const row = Array.isArray(rows) ? rows[0] : null;
if (!row?.payload) {
  throw new Error("No hay estado guardado en app_state (id=1).");
}

let data;
try {
  data = JSON.parse(row.payload);
} catch {
  throw new Error("El payload de app_state no es JSON valido.");
}

const backupsDir = path.join(ROOT_DIR, "backups");
fs.mkdirSync(backupsDir, { recursive: true });

const outPath = path.join(backupsDir, `state-backup-${stamp()}.json`);
const body = {
  schema: "lds-agro-erp-state-backup-v1",
  capturedAt: new Date().toISOString(),
  mysql: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE,
  },
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  data,
};

fs.writeFileSync(outPath, JSON.stringify(body, null, 2), "utf8");
console.log(`[backup] OK -> ${outPath}`);
