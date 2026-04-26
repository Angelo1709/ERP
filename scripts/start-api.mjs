import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadEnvFiles } from "./env-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

loadEnvFiles(ROOT_DIR);
await import(pathToFileURL(path.join(ROOT_DIR, "server", "index.js")).href);
