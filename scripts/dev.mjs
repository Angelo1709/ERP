import { spawn } from "node:child_process";

const run = (name, command) => {
  const child = spawn(command, { stdio: "inherit", shell: true });
  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[${name}] finalizo con codigo ${code}`);
      process.exitCode = code || 1;
    }
  });
  return child;
};

const web = run("web", "npm run dev:web");
const api = run("api", "npm run dev:api");

const shutdown = () => {
  for (const proc of [web, api]) {
    if (!proc.killed) proc.kill("SIGTERM");
  }
  process.exit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
