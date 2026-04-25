import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(process.env.ERP_DATA_DIR || path.resolve(__dirname, "..", "data"));
const SQLITE_PATH = path.join(DATA_DIR, "erp.sqlite");
const JSON_PATH = path.join(DATA_DIR, "app-state.json");

function fail(message) {
  console.error(`[migrate:mysql] ${message}`);
  process.exit(1);
}

function readJsonState() {
  if (!fs.existsSync(JSON_PATH)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
    const data = raw?.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

async function readSqliteState() {
  if (!fs.existsSync(SQLITE_PATH)) return null;
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(SQLITE_PATH);
    const row = db.prepare("SELECT payload FROM app_state WHERE id = 1").get();
    if (!row?.payload) return null;
    const data = JSON.parse(row.payload);
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

async function readLocalState() {
  const fromJson = readJsonState();
  if (fromJson) return { source: "json", data: fromJson };

  const fromSqlite = await readSqliteState();
  if (fromSqlite) return { source: "sqlite", data: fromSqlite };

  return null;
}

function mysqlEnvOrFail() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !database) {
    fail("Faltan variables MYSQL_HOST, MYSQL_USER o MYSQL_DATABASE.");
  }
  return {
    host,
    port: Number(process.env.MYSQL_PORT || 3306),
    user,
    password: process.env.MYSQL_PASSWORD || "",
    database,
    timezone: "Z",
    dateStrings: true,
  };
}

async function migrate() {
  const local = await readLocalState();
  if (!local?.data) {
    fail(`No se encontro estado local en ${JSON_PATH} ni en ${SQLITE_PATH}.`);
  }

  const mysqlConfig = mysqlEnvOrFail();
  const mysql = await import("mysql2/promise");
  const pool = mysql.createPool(mysqlConfig);

  try {
    await pool.query("SELECT 1");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id TINYINT UNSIGNED PRIMARY KEY,
        payload LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const payload = JSON.stringify(local.data);
    await pool.query(`
      INSERT INTO app_state (id, payload, updated_at)
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP
    `, [payload]);

    console.log(`[migrate:mysql] OK - migrado desde ${local.source} a ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => fail(err?.message || "Fallo inesperado"));
