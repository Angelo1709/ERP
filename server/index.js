import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 4000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(process.env.ERP_DATA_DIR || path.resolve(__dirname, "..", "data"));
const LIVE_DIR = path.join(DATA_DIR, "live");
const DB_PATH = path.join(DATA_DIR, "erp.sqlite");
const STATE_JSON_PATH = path.join(DATA_DIR, "app-state.json");
const STORAGE_PREF = String(process.env.ERP_STORAGE || "auto").trim().toLowerCase();
const TABLES = ["operaciones", "facturas", "remitos", "recibos", "compras", "clientes", "proveedores", "productos", "vendedores", "costos"];

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(LIVE_DIR, { recursive: true });

let sqliteDb = null;
let mysqlPool = null;
let storageMode = "json";

function nowIso() {
  return new Date().toISOString();
}

function mysqlSslConfig() {
  const raw = String(process.env.MYSQL_SSL || "").trim().toLowerCase();
  if (!raw) return undefined;
  if (["1", "true", "yes", "required", "require"].includes(raw)) return {};
  return undefined;
}

function hasMySqlEnv() {
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);
}

async function initMySql() {
  const wantsMySql = STORAGE_PREF === "mysql" || STORAGE_PREF === "auto";
  if (!wantsMySql) return false;

  if (!hasMySqlEnv()) {
    if (STORAGE_PREF === "mysql") {
      throw new Error("ERP_STORAGE=mysql requiere MYSQL_HOST, MYSQL_USER y MYSQL_DATABASE.");
    }
    return false;
  }

  try {
    const mysql = await import("mysql2/promise");
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_POOL_SIZE || 10),
      queueLimit: 0,
      connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT_MS || 10000),
      dateStrings: true,
      timezone: "Z",
      ssl: mysqlSslConfig(),
    });

    await mysqlPool.query("SELECT 1");
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id TINYINT UNSIGNED PRIMARY KEY,
        payload LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    storageMode = "mysql";
    return true;
  } catch (err) {
    mysqlPool = null;
    if (STORAGE_PREF === "mysql") {
      throw new Error(`No se pudo iniciar MySQL: ${err?.message || "sin detalle"}`);
    }
    console.warn(`[erp-api] MySQL no disponible. Se usa almacenamiento local. detalle: ${err?.message || "sin detalle"}`);
    return false;
  }
}

async function initSqlite() {
  if (STORAGE_PREF === "mysql") return false;
  if (STORAGE_PREF === "json") return false;

  try {
    const { DatabaseSync } = await import("node:sqlite");
    sqliteDb = new DatabaseSync(DB_PATH);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    storageMode = "sqlite";
    return true;
  } catch (err) {
    sqliteDb = null;
    if (STORAGE_PREF === "sqlite") {
      throw new Error(`No se pudo iniciar SQLite: ${err?.message || "sin detalle"}`);
    }
    storageMode = "json";
    console.warn(`[erp-api] node:sqlite no disponible. Se usa almacenamiento JSON en ${STATE_JSON_PATH}`);
    console.warn(`[erp-api] detalle: ${err?.message || "sin detalle"}`);
    return false;
  }
}

async function initStorage() {
  const mysqlReady = await initMySql();
  if (mysqlReady) return;

  const sqliteReady = await initSqlite();
  if (sqliteReady) return;

  storageMode = "json";
}

async function readStateRow() {
  if (storageMode === "mysql" && mysqlPool) {
    const [rows] = await mysqlPool.query("SELECT payload, updated_at FROM app_state WHERE id = 1 LIMIT 1");
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    try {
      return {
        data: JSON.parse(row.payload),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : nowIso(),
      };
    } catch {
      return null;
    }
  }

  if (sqliteDb) {
    const row = sqliteDb.prepare("SELECT payload, updated_at FROM app_state WHERE id = 1").get();
    if (!row) return null;
    try {
      return { data: JSON.parse(row.payload), updatedAt: row.updated_at };
    } catch {
      return null;
    }
  }

  if (!fs.existsSync(STATE_JSON_PATH)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_JSON_PATH, "utf8"));
    if (!raw || typeof raw !== "object") return null;
    const data = raw.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return { data, updatedAt: raw.updatedAt || nowIso() };
  } catch {
    return null;
  }
}

async function saveState(data) {
  let updatedAt = nowIso();
  if (storageMode === "mysql" && mysqlPool) {
    const payload = JSON.stringify(data);
    await mysqlPool.query(`
      INSERT INTO app_state (id, payload, updated_at)
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP
    `, [payload]);
    const [rows] = await mysqlPool.query("SELECT updated_at FROM app_state WHERE id = 1 LIMIT 1");
    const row = Array.isArray(rows) ? rows[0] : null;
    updatedAt = row?.updated_at ? new Date(row.updated_at).toISOString() : updatedAt;
  } else if (sqliteDb) {
    const payload = JSON.stringify(data);
    sqliteDb.prepare(`
      INSERT INTO app_state (id, payload, updated_at)
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP
    `).run(payload);
    const row = sqliteDb.prepare("SELECT updated_at FROM app_state WHERE id = 1").get();
    updatedAt = row?.updated_at || updatedAt;
  } else {
    fs.writeFileSync(
      STATE_JSON_PATH,
      JSON.stringify({ data, updatedAt }, null, 2),
      "utf8",
    );
  }
  writeLiveFiles(data, updatedAt);
  return updatedAt;
}

function flattenValue(v) {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function csvEscape(v) {
  const s = flattenValue(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
  return s;
}

function rowsToCsv(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return "\uFEFFid\n";

  const headers = Array.from(
    list.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set()),
  );

  const lines = [headers.map(csvEscape).join(",")];
  for (const row of list) {
    const line = headers.map((h) => csvEscape(row?.[h])).join(",");
    lines.push(line);
  }

  return `\uFEFF${lines.join("\n")}\n`;
}

function pickRows(data, table) {
  if (!data || typeof data !== "object") return [];
  const rows = data[table];
  return Array.isArray(rows) ? rows : [];
}

function writeLiveFiles(data, updatedAt) {
  for (const table of TABLES) {
    const csv = rowsToCsv(pickRows(data, table));
    fs.writeFileSync(path.join(LIVE_DIR, `${table}.csv`), csv, "utf8");
  }
  const meta = rowsToCsv([{ updated_at: updatedAt, source: storageMode, generated_at: nowIso() }]);
  fs.writeFileSync(path.join(LIVE_DIR, "metadata.csv"), meta, "utf8");
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sendText(res, status, contentType, body) {
  setCors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.end(body);
}

function sendIqy(res, status, filename, csvUrl) {
  setCors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.end(`WEB\r\n1\r\n${csvUrl}\r\n`);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10 * 1024 * 1024) {
        reject(new Error("Payload demasiado grande"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("JSON invalido"));
      }
    });
    req.on("error", reject);
  });
}

await initStorage();
const existingState = await readStateRow();
if (existingState?.data) writeLiveFiles(existingState.data, existingState.updatedAt);

const server = createServer(async (req, res) => {
  try {
    if (!req.url) return sendJson(res, 400, { error: "URL invalida" });
    if (req.method === "OPTIONS") {
      setCors(res);
      res.statusCode = 204;
      return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (req.method === "GET" && pathname === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        storage: storageMode,
        db: DB_PATH,
        jsonState: STATE_JSON_PATH,
        liveDir: LIVE_DIR,
        mysql: storageMode === "mysql" ? {
          host: process.env.MYSQL_HOST || null,
          port: Number(process.env.MYSQL_PORT || 3306),
          database: process.env.MYSQL_DATABASE || null,
          user: process.env.MYSQL_USER || null,
        } : null,
      });
    }

    if (req.method === "GET" && pathname === "/api/state") {
      const row = await readStateRow();
      return sendJson(res, 200, {
        data: row?.data || null,
        updatedAt: row?.updatedAt || null,
        source: storageMode,
      });
    }

    if (req.method === "PUT" && pathname === "/api/state") {
      try {
        const body = await readJson(req);
        if (!body || typeof body.data !== "object" || body.data == null || Array.isArray(body.data)) {
          return sendJson(res, 400, { error: "Formato invalido. Se espera { data: {...} }" });
        }
        const updatedAt = await saveState(body.data);
        return sendJson(res, 200, { ok: true, updatedAt });
      } catch (err) {
        return sendJson(res, 400, { error: err.message || "No se pudo guardar" });
      }
    }

    if (req.method === "GET" && pathname === "/api/powerbi/tables") {
      const base = `${url.protocol}//${url.host}`;
      const rows = TABLES.map((table) => ({
        table,
        live_csv: `${base}/live/${table}.csv`,
        export_csv: `${base}/api/export/${table}.csv`,
      }));
      return sendJson(res, 200, { tables: rows });
    }

    if (req.method === "GET" && pathname === "/api/excel/tables") {
      const base = `${url.protocol}//${url.host}`;
      const rows = TABLES.map((table) => ({
        table,
        iqy: `${base}/api/excel/query/${table}.iqy`,
        live_csv: `${base}/live/${table}.csv`,
      }));
      return sendJson(res, 200, { tables: rows });
    }

    if (req.method === "GET" && pathname.startsWith("/api/excel/query/") && pathname.endsWith(".iqy")) {
      const table = pathname.replace("/api/excel/query/", "").replace(".iqy", "");
      if (!TABLES.includes(table)) return sendJson(res, 404, { error: "Tabla no soportada" });
      const csvUrl = `${url.protocol}//${url.host}/live/${table}.csv`;
      return sendIqy(res, 200, `${table}.iqy`, csvUrl);
    }

    if (req.method === "POST" && pathname === "/api/ocr/analyze") {
      try {
        const body = await readJson(req);
        const prompt = String(body?.prompt || "").trim();
        const base64 = String(body?.base64 || "").trim();
        const mimeType = String(body?.mimeType || "").trim();
        const model = String(body?.model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514");
        const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

        if (!apiKey) return sendJson(res, 400, { error: "Falta ANTHROPIC_API_KEY en el servidor." });
        if (!prompt) return sendJson(res, 400, { error: "Falta prompt OCR." });
        if (!base64) return sendJson(res, 400, { error: "Falta archivo en base64." });
        if (!mimeType) return sendJson(res, 400, { error: "Falta mimeType." });

        const content = [];
        if (mimeType === "application/pdf") {
          content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
        } else if (mimeType.startsWith("image/")) {
          content.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64 } });
        } else {
          return sendJson(res, 400, { error: `Tipo de archivo no soportado para OCR: ${mimeType}` });
        }
        content.push({ type: "text", text: prompt });

        const upstream = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1000,
            messages: [{ role: "user", content }],
          }),
        });

        const raw = await upstream.json();
        if (!upstream.ok) {
          return sendJson(res, 502, { error: raw?.error?.message || "OCR externo no disponible", detail: raw });
        }

        const text = (raw?.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
        let data = null;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          return sendJson(res, 502, { error: "OCR devolvio JSON invalido", rawText: text });
        }

        return sendJson(res, 200, { ok: true, data, provider: "anthropic" });
      } catch (err) {
        return sendJson(res, 500, { error: err?.message || "Fallo OCR interno" });
      }
    }

    if (req.method === "GET" && pathname.startsWith("/api/export/") && pathname.endsWith(".csv")) {
      const table = pathname.replace("/api/export/", "").replace(".csv", "");
      if (!TABLES.includes(table)) return sendJson(res, 404, { error: "Tabla no soportada" });
      const row = await readStateRow();
      if (!row?.data) return sendJson(res, 404, { error: "Todavia no hay datos guardados en DB" });
      const csv = rowsToCsv(pickRows(row.data, table));
      return sendText(res, 200, "text/csv; charset=utf-8", csv);
    }

    if (req.method === "GET" && pathname.startsWith("/live/")) {
      const name = pathname.replace("/live/", "");
      const full = path.resolve(LIVE_DIR, name);
      if (!full.startsWith(LIVE_DIR)) return sendJson(res, 403, { error: "Ruta no permitida" });
      if (!fs.existsSync(full)) return sendJson(res, 404, { error: "Archivo no encontrado" });
      const csv = fs.readFileSync(full, "utf8");
      return sendText(res, 200, "text/csv; charset=utf-8", csv);
    }

    return sendJson(res, 404, { error: "Ruta no encontrada" });
  } catch (err) {
    return sendJson(res, 500, { error: err?.message || "Fallo interno del servidor" });
  }
});

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE" && process.env.ERP_ALLOW_EXTERNAL_PORT === "1") {
    console.warn(`[erp-api] puerto ${PORT} en uso. Se reutiliza el servicio existente.`);
    return;
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`[erp-api] escuchando en http://localhost:${PORT}`);
  console.log(`[erp-api] storage: ${storageMode}`);
  if (storageMode === "mysql") {
    console.log(`[erp-api] mysql: ${process.env.MYSQL_HOST || "localhost"}:${process.env.MYSQL_PORT || "3306"} / ${process.env.MYSQL_DATABASE || "-"}`);
  } else {
    console.log(`[erp-api] db: ${DB_PATH}`);
    console.log(`[erp-api] json: ${STATE_JSON_PATH}`);
  }
  console.log(`[erp-api] live csv: ${LIVE_DIR}`);
});
