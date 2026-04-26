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

const fileArg = process.argv[2];
if (!fileArg) {
  throw new Error("Uso: npm run restore:state -- <ruta_backup.json>");
}

const filePath = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(filePath)) {
  throw new Error(`No existe el archivo: ${filePath}`);
}

const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
const data = raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : raw;
if (!data || typeof data !== "object" || Array.isArray(data)) {
  throw new Error("El archivo no contiene un estado valido.");
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

await conn.query(
  `
  INSERT INTO app_state (id, payload, updated_at)
  VALUES (1, ?, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP
`,
  [JSON.stringify(data)],
);

await conn.end();
console.log(`[restore] OK -> ${filePath}`);
