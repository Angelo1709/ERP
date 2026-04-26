import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const PORT = Number(process.env.PORT || 4000);
const HOST = String(
  process.env.HOST ||
  process.env.ERP_HOST ||
  (process.env.RAILWAY_ENVIRONMENT ? "0.0.0.0" : "127.0.0.1"),
);
const CORS_ORIGIN = String(process.env.CORS_ORIGIN || process.env.ERP_CORS_ORIGIN || "*").trim() || "*";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(process.env.ERP_DATA_DIR || path.resolve(__dirname, "..", "data"));
const LIVE_DIR = path.join(DATA_DIR, "live");
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const DIST_INDEX = path.join(DIST_DIR, "index.html");
const DB_PATH = path.join(DATA_DIR, "erp.sqlite");
const STATE_JSON_PATH = path.join(DATA_DIR, "app-state.json");
const STORAGE_PREF = String(process.env.ERP_STORAGE || "auto").trim().toLowerCase();
const TABLES = ["operaciones", "facturas", "remitos", "recibos", "compras", "clientes", "proveedores", "productos", "vendedores", "costos"];
const USERS_JSON_PATH = path.join(DATA_DIR, "users.json");
const AUDIT_JSON_PATH = path.join(DATA_DIR, "audit.json");
const JWT_SECRET = (() => {
  const s = (process.env.JWT_SECRET || "").trim();
  if (!s) console.warn("[erp-api] ADVERTENCIA: JWT_SECRET no configurado. Usá una clave segura en producción.");
  return s || "dev-insecure-cambiar-en-produccion";
})();
const JWT_EXPIRY = process.env.JWT_EXPIRY || "8h";
const VALID_ROLES = ["ADMIN", "VENDEDOR"];

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
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS erp_users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(200) NOT NULL DEFAULT '',
        role ENUM('ADMIN','VENDEDOR') NOT NULL DEFAULT 'VENDEDOR',
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS erp_audit (
        id VARCHAR(60) PRIMARY KEY,
        timestamp VARCHAR(30) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        user_name VARCHAR(200) NOT NULL DEFAULT '',
        user_role VARCHAR(20) NOT NULL DEFAULT '',
        action VARCHAR(20) NOT NULL,
        entity VARCHAR(60) NOT NULL,
        entity_id VARCHAR(100) NOT NULL DEFAULT '',
        detail TEXT
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

// ─── USUARIOS ────────────────────────────────────────────────────────────────

function newUserId() {
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readUsers() {
  if (storageMode === "mysql" && mysqlPool) {
    const [rows] = await mysqlPool.query("SELECT * FROM erp_users ORDER BY created_at ASC");
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      id: r.id, username: r.username, passwordHash: r.password_hash,
      nombre: r.nombre, role: r.role, active: Boolean(r.active), createdAt: r.created_at,
    }));
  }
  if (!fs.existsSync(USERS_JSON_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(USERS_JSON_PATH, "utf8")) || []; } catch { return []; }
}

async function saveUser(u) {
  if (storageMode === "mysql" && mysqlPool) {
    await mysqlPool.query(`
      INSERT INTO erp_users (id, username, password_hash, nombre, role, active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username=VALUES(username), password_hash=VALUES(password_hash),
        nombre=VALUES(nombre), role=VALUES(role), active=VALUES(active), updated_at=CURRENT_TIMESTAMP
    `, [u.id, u.username, u.passwordHash, u.nombre || "", u.role, u.active ? 1 : 0]);
    return;
  }
  const all = await readUsers();
  const idx = all.findIndex((x) => x.id === u.id);
  if (idx >= 0) all[idx] = u; else all.push(u);
  fs.writeFileSync(USERS_JSON_PATH, JSON.stringify(all, null, 2), "utf8");
}

async function findUserByUsername(username) {
  const all = await readUsers();
  return all.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

async function findUserById(id) {
  const all = await readUsers();
  return all.find((u) => u.id === id) || null;
}

async function hasAnyUser() {
  const all = await readUsers();
  return all.length > 0;
}

// ─── TOKEN ───────────────────────────────────────────────────────────────────

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, nombre: user.nombre, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY },
  );
}

async function requireAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;
  let payload;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return null; }
  if (!payload?.sub) return null;
  const user = await findUserById(payload.sub);
  if (!user || !user.active) return null;
  return { id: user.id, username: user.username, nombre: user.nombre, role: user.role };
}

// ─── AUDITORÍA ───────────────────────────────────────────────────────────────

async function appendAudit(user, action, entity, entityId, detail) {
  const entry = {
    id: `al_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowIso(),
    userId: user.id,
    userName: user.nombre || user.username,
    userRole: user.role,
    action,
    entity,
    entityId: String(entityId || ""),
    detail: String(detail || ""),
  };
  if (storageMode === "mysql" && mysqlPool) {
    await mysqlPool.query(
      "INSERT INTO erp_audit (id,timestamp,user_id,user_name,user_role,action,entity,entity_id,detail) VALUES (?,?,?,?,?,?,?,?,?)",
      [entry.id, entry.timestamp, entry.userId, entry.userName, entry.userRole, entry.action, entry.entity, entry.entityId, entry.detail],
    );
    return;
  }
  let logs = [];
  if (fs.existsSync(AUDIT_JSON_PATH)) {
    try { logs = JSON.parse(fs.readFileSync(AUDIT_JSON_PATH, "utf8")) || []; } catch { logs = []; }
  }
  logs.push(entry);
  if (logs.length > 10000) logs = logs.slice(-10000);
  fs.writeFileSync(AUDIT_JSON_PATH, JSON.stringify(logs, null, 2), "utf8");
}

async function readAuditLogs(limit = 500) {
  if (storageMode === "mysql" && mysqlPool) {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM erp_audit ORDER BY timestamp DESC LIMIT ?", [limit],
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      id: r.id, timestamp: r.timestamp, userId: r.user_id, userName: r.user_name,
      userRole: r.user_role, action: r.action, entity: r.entity, entityId: r.entity_id, detail: r.detail,
    }));
  }
  if (!fs.existsSync(AUDIT_JSON_PATH)) return [];
  try {
    const all = JSON.parse(fs.readFileSync(AUDIT_JSON_PATH, "utf8")) || [];
    return all.slice(-limit).reverse();
  } catch { return []; }
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

function isWildcardHost(host) {
  return host === "0.0.0.0" || host === "::";
}

function localIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const list of Object.values(nets)) {
    for (const addr of list || []) {
      if (!addr || addr.internal) continue;
      if (addr.family === "IPv4") ips.push(addr.address);
    }
  }
  return Array.from(new Set(ips));
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
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

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function staticContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function safeStaticPath(urlPath) {
  const rel = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const clean = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.resolve(DIST_DIR, `.${clean.startsWith("/") || clean.startsWith("\\") ? clean : `/${clean}`}`);
  if (!full.startsWith(DIST_DIR)) return null;
  return full;
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
      const lan = localIps().map((ip) => `http://${ip}:${PORT}`);
      return sendJson(res, 200, { ok: true, storage: storageMode, version: "2.0", lan });
    }

    // ── POST /auth/setup  (solo si no hay usuarios — primer arranque) ────────
    if (req.method === "POST" && pathname === "/auth/setup") {
      if (await hasAnyUser()) return sendJson(res, 409, { error: "Ya existe al menos un usuario. Usá la app para crear más." });
      const body = await readJson(req);
      const username = String(body?.username || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const nombre = String(body?.nombre || "").trim();
      if (!username || !password || !nombre) return sendJson(res, 400, { error: "Falta usuario, contraseña o nombre." });
      if (password.length < 6) return sendJson(res, 400, { error: "La contraseña debe tener al menos 6 caracteres." });
      const passwordHash = await bcrypt.hash(password, 12);
      const admin = { id: newUserId(), username, passwordHash, nombre, role: "ADMIN", active: true, createdAt: nowIso() };
      await saveUser(admin);
      console.log(`[erp-api] Primer usuario ADMIN creado: ${username}`);
      return sendJson(res, 201, { ok: true, user: { id: admin.id, username, nombre, role: "ADMIN" } });
    }

    // ── POST /auth/login ─────────────────────────────────────────────────────
    if (req.method === "POST" && pathname === "/auth/login") {
      const body = await readJson(req);
      const username = String(body?.username || "").trim();
      const password = String(body?.password || "");
      if (!username || !password) return sendJson(res, 400, { error: "Falta usuario o contraseña." });
      const user = await findUserByUsername(username);
      if (!user || !user.active) return sendJson(res, 401, { error: "Usuario o contraseña incorrectos." });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return sendJson(res, 401, { error: "Usuario o contraseña incorrectos." });
      const token = signToken(user);
      await appendAudit(user, "LOGIN", "sesion", user.id, `Ingreso desde ${req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?"}`);
      return sendJson(res, 200, { token, user: { id: user.id, username: user.username, nombre: user.nombre, role: user.role } });
    }

    // ── GET /auth/me ─────────────────────────────────────────────────────────
    if (req.method === "GET" && pathname === "/auth/me") {
      const user = await requireAuth(req);
      if (!user) return sendJson(res, 401, { error: "No autenticado." });
      return sendJson(res, 200, { user });
    }

    // ── GET /auth/users  (solo ADMIN) ────────────────────────────────────────
    if (req.method === "GET" && pathname === "/auth/users") {
      const user = await requireAuth(req);
      if (!user) return sendJson(res, 401, { error: "No autenticado." });
      if (user.role !== "ADMIN") return sendJson(res, 403, { error: "Solo el administrador puede ver usuarios." });
      const all = await readUsers();
      return sendJson(res, 200, {
        users: all.map((u) => ({ id: u.id, username: u.username, nombre: u.nombre, role: u.role, active: u.active, createdAt: u.createdAt })),
      });
    }

    // ── POST /auth/users  (solo ADMIN) ───────────────────────────────────────
    if (req.method === "POST" && pathname === "/auth/users") {
      const actor = await requireAuth(req);
      if (!actor) return sendJson(res, 401, { error: "No autenticado." });
      if (actor.role !== "ADMIN") return sendJson(res, 403, { error: "Solo el administrador puede crear usuarios." });
      const body = await readJson(req);
      const username = String(body?.username || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const nombre = String(body?.nombre || "").trim();
      const role = String(body?.role || "VENDEDOR").toUpperCase();
      if (!username || !password || !nombre) return sendJson(res, 400, { error: "Falta usuario, contraseña o nombre." });
      if (!VALID_ROLES.includes(role)) return sendJson(res, 400, { error: `Rol inválido. Opciones: ${VALID_ROLES.join(", ")}` });
      if (password.length < 6) return sendJson(res, 400, { error: "La contraseña debe tener al menos 6 caracteres." });
      const existing = await findUserByUsername(username);
      if (existing) return sendJson(res, 409, { error: "Ya existe un usuario con ese nombre." });
      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = { id: newUserId(), username, passwordHash, nombre, role, active: true, createdAt: nowIso() };
      await saveUser(newUser);
      await appendAudit(actor, "CREATE", "usuario", newUser.id, `Creó usuario ${username} (${role})`);
      return sendJson(res, 201, { ok: true, user: { id: newUser.id, username, nombre, role } });
    }

    // ── PUT /auth/users/:id  (solo ADMIN) ────────────────────────────────────
    if (req.method === "PUT" && pathname.startsWith("/auth/users/")) {
      const actor = await requireAuth(req);
      if (!actor) return sendJson(res, 401, { error: "No autenticado." });
      if (actor.role !== "ADMIN") return sendJson(res, 403, { error: "Solo el administrador puede modificar usuarios." });
      const uid = pathname.replace("/auth/users/", "");
      const existing = await findUserById(uid);
      if (!existing) return sendJson(res, 404, { error: "Usuario no encontrado." });
      const body = await readJson(req);
      const updated = { ...existing };
      if (body?.nombre !== undefined) updated.nombre = String(body.nombre).trim();
      if (body?.role !== undefined) {
        const r = String(body.role).toUpperCase();
        if (!VALID_ROLES.includes(r)) return sendJson(res, 400, { error: "Rol inválido." });
        if (uid === actor.id && r !== "ADMIN") return sendJson(res, 400, { error: "No podés quitarte el rol ADMIN." });
        updated.role = r;
      }
      if (body?.active !== undefined) {
        if (uid === actor.id) return sendJson(res, 400, { error: "No podés desactivarte a vos mismo." });
        updated.active = Boolean(body.active);
      }
      if (body?.password) {
        if (String(body.password).length < 6) return sendJson(res, 400, { error: "La contraseña debe tener al menos 6 caracteres." });
        updated.passwordHash = await bcrypt.hash(String(body.password), 12);
      }
      await saveUser(updated);
      await appendAudit(actor, "UPDATE", "usuario", uid, `Modificó usuario ${existing.username}`);
      return sendJson(res, 200, { ok: true, user: { id: updated.id, username: updated.username, nombre: updated.nombre, role: updated.role, active: updated.active } });
    }

    // ── GET /api/audit  (solo ADMIN) ─────────────────────────────────────────
    if (req.method === "GET" && pathname === "/api/audit") {
      const user = await requireAuth(req);
      if (!user) return sendJson(res, 401, { error: "No autenticado." });
      if (user.role !== "ADMIN") return sendJson(res, 403, { error: "Solo el administrador puede ver el historial." });
      const limit = Math.min(Number(url.searchParams.get("limit") || 200), 1000);
      return sendJson(res, 200, { logs: await readAuditLogs(limit) });
    }

    // ── POST /api/audit  (cualquier usuario autenticado) ─────────────────────
    if (req.method === "POST" && pathname === "/api/audit") {
      const user = await requireAuth(req);
      if (!user) return sendJson(res, 401, { error: "No autenticado." });
      const body = await readJson(req);
      const action = String(body?.action || "").trim().toUpperCase();
      const entity = String(body?.entity || "").trim();
      const entityId = String(body?.entityId || "");
      const detail = String(body?.detail || "").slice(0, 500);
      if (!action || !entity) return sendJson(res, 400, { error: "Falta action o entity." });
      await appendAudit(user, action, entity, entityId, detail);
      return sendJson(res, 200, { ok: true });
    }

    // ── GET /api/state  (requiere login) ─────────────────────────────────────
    if (req.method === "GET" && pathname === "/api/state") {
      const user = await requireAuth(req);
      if (!user) return sendJson(res, 401, { error: "No autenticado." });
      const row = await readStateRow();
      return sendJson(res, 200, { data: row?.data || null, updatedAt: row?.updatedAt || null, source: storageMode });
    }

    // ── PUT /api/state  (requiere login) ─────────────────────────────────────
    if (req.method === "PUT" && pathname === "/api/state") {
      const user = await requireAuth(req);
      if (!user) return sendJson(res, 401, { error: "No autenticado." });
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
      const user = await requireAuth(req);
      if (!user) return sendJson(res, 401, { error: "No autenticado." });
      try {
        const body = await readJson(req);
        const prompt = String(body?.prompt || "").trim();
        const base64 = String(body?.base64 || "").trim();
        const mimeType = String(body?.mimeType || "").trim();
        const model = String(process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514");
        const apiKey = process.env.ANTHROPIC_API_KEY;

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

    if (req.method === "GET" && fs.existsSync(DIST_INDEX) && !pathname.startsWith("/api/") && !pathname.startsWith("/live/")) {
      const full = safeStaticPath(pathname);
      if (full && fs.existsSync(full) && fs.statSync(full).isFile()) {
        const body = fs.readFileSync(full);
        return sendText(res, 200, staticContentType(full), body);
      }

      if (!path.extname(pathname)) {
        const body = fs.readFileSync(DIST_INDEX);
        return sendText(res, 200, "text/html; charset=utf-8", body);
      }
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

server.listen(PORT, HOST, () => {
  const mainUrl = isWildcardHost(HOST) ? `http://127.0.0.1:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`[erp-api] escuchando en ${mainUrl}`);
  if (isWildcardHost(HOST)) {
    const ips = localIps();
    if (ips.length) {
      console.log(`[erp-api] LAN: ${ips.map((ip) => `http://${ip}:${PORT}`).join(" | ")}`);
    }
  }
  if (fs.existsSync(DIST_INDEX)) {
    console.log("[erp-api] web: dist detectado (UI servida por la API).");
  } else {
    console.log("[erp-api] web: dist no encontrado (ejecuta `npm run build`).");
  }
  if (CORS_ORIGIN !== "*") {
    console.log(`[erp-api] cors origin: ${CORS_ORIGIN}`);
  }
  console.log(`[erp-api] storage: ${storageMode}`);
  if (storageMode === "mysql") {
    console.log(`[erp-api] mysql: ${process.env.MYSQL_HOST || "localhost"}:${process.env.MYSQL_PORT || "3306"} / ${process.env.MYSQL_DATABASE || "-"}`);
  } else {
    console.log(`[erp-api] db: ${DB_PATH}`);
    console.log(`[erp-api] json: ${STATE_JSON_PATH}`);
  }
  console.log(`[erp-api] live csv: ${LIVE_DIR}`);
});
