const { app, BrowserWindow, dialog } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

let apiStarted = false;

async function apiHealthOk(port) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: controller.signal });
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    return Boolean(json?.ok);
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function startApiServer() {
  if (apiStarted) return;
  const port = process.env.PORT || "4000";
  process.env.PORT = port;
  process.env.ERP_DATA_DIR = process.env.ERP_DATA_DIR || path.join(app.getPath("userData"), "data");

  if (await apiHealthOk(port)) {
    apiStarted = true;
    return;
  }

  process.env.ERP_ALLOW_EXTERNAL_PORT = "1";
  const serverPath = path.join(app.getAppPath(), "server", "index.js");
  await import(pathToFileURL(serverPath).href);
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!(await apiHealthOk(port))) {
    throw new Error(`No se pudo iniciar la API local en el puerto ${port}.`);
  }

  apiStarted = true;
}

async function createMainWindow() {
  await startApiServer();

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    autoHideMenuBar: true,
    backgroundColor: "#f8fafc",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const indexPath = path.join(app.getAppPath(), "dist", "index.html");
  await win.loadFile(indexPath);
}

app.whenReady().then(async () => {
  try {
    await createMainWindow();
  } catch (err) {
    dialog.showErrorBox("No se pudo iniciar LDS AGRO ERP", String(err?.message || err));
    app.quit();
    return;
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      try {
        await createMainWindow();
      } catch {
        app.quit();
      }
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
