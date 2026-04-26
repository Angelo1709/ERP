import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "./env-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

loadEnvFiles(ROOT_DIR, [".env", ".env.local", ".env.mysql.local", ".env.server.local"]);

if (!process.env.HOST && !process.env.ERP_HOST) {
  process.env.HOST = "0.0.0.0";
}

if (!process.env.PORT) {
  process.env.PORT = "4000";
}

await import(new URL("./start-api.mjs", import.meta.url));
