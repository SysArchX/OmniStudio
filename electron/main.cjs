const { app, BrowserWindow, ipcMain, protocol, shell } = require("electron");

const AUTH_SCHEME = "omnistudio";
const LOOPBACK_PORT = Number(process.env.OMNISTUDIO_AUTH_PORT || 48123);
let loopbackUrl = `http://127.0.0.1:${LOOPBACK_PORT}/callback`;
let mainWindow = null;
let pendingAuthUrl = null;
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { spawn } = require("node:child_process");

const OUT_DIR = path.join(__dirname, "..", "out");
const DEV_URL = process.env.ELECTRON_START_URL;
const ALLOWED = new Set([
  "python",
  "python3",
  "node",
  "npm",
  "npx",
  "git",
  "ls",
  "dir",
  "cat",
  "pacman",
  "apt",
  "arduino-cli",
]);

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webmanifest": "application/manifest+json",
};

function registerProtocol() {
  protocol.handle("app", async (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (!pathname || pathname === "/") pathname = "/index.html";
    const filePath = path.normalize(path.join(OUT_DIR, pathname));
    if (!filePath.startsWith(path.normalize(OUT_DIR))) {
      return new Response("Acesso negado", { status: 403 });
    }
    try {
      const data = await fs.promises.readFile(filePath);
      const type = MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
      return new Response(data, { headers: { "content-type": type } });
    } catch {
      return new Response("Não encontrado", { status: 404 });
    }
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: "#09090b",
    autoHideMenuBar: true,
    title: "OmniStudio",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  if (DEV_URL) {
    window.loadURL(DEV_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    window.loadURL("app://bundle/index.html");
  }

  mainWindow = window;
  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("did-finish-load", () => {
    if (pendingAuthUrl) {
      window.webContents.send("omni:auth-callback", pendingAuthUrl);
      pendingAuthUrl = null;
    }
  });
}

/** Retorno do OAuth do Google: omnistudio://auth/callback#access_token=... */
function handleAuthUrl(url) {
  if (!url || !url.startsWith(`${AUTH_SCHEME}://`)) return;
  if (mainWindow) {
    mainWindow.webContents.send("omni:auth-callback", url);
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    pendingAuthUrl = url;
  }
}

/**
 * Servidor loopback temporário: o Supabase também pode devolver o login em
 * http://127.0.0.1:48123/callback. Nada de file:/// em nenhum caminho.
 */
function startAuthLoopback() {
  const server = http.createServer((request, response) => {
    if (!request.url || !request.url.startsWith("/callback")) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    const received = `omnistudio://auth/callback${request.url.slice("/callback".length)}`;
    handleAuthUrl(received);
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      "<!doctype html><meta charset=\"utf-8\"><title>OmniStudio</title>" +
        "<body style=\"background:#09090b;color:#fafafa;font:15px system-ui;display:grid;place-items:center;height:100vh;margin:0\">" +
        "<p>Login concluído. Volte para o OmniStudio.</p></body>",
    );
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      loopbackUrl = `http://127.0.0.1:${LOOPBACK_PORT + 1}/callback`;
      server.listen(LOOPBACK_PORT + 1, "127.0.0.1");
      return;
    }
    console.warn("Loopback de autenticação indisponível:", error.message);
  });

  server.listen(LOOPBACK_PORT, "127.0.0.1");
  app.on("before-quit", () => server.close());
}

ipcMain.on("omni:authLoopbackSync", (event) => {
  event.returnValue = loopbackUrl;
});

app.setAsDefaultProtocolClient(AUTH_SCHEME);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const url = argv.find((arg) => arg.startsWith(`${AUTH_SCHEME}://`));
    if (url) handleAuthUrl(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleAuthUrl(url);
});

ipcMain.handle("omni:run", async (_event, command) => {
  if (typeof command !== "string" || !command.trim()) {
    return { code: 1, stdout: "", stderr: "Comando vazio." };
  }
  if (/[;&|><`$]/.test(command)) {
    return { code: 1, stdout: "", stderr: "Caracteres de encadeamento não são permitidos." };
  }
  const parts = command.trim().split(/\s+/);
  const binary = parts[0];
  if (!ALLOWED.has(binary)) {
    return { code: 1, stdout: "", stderr: `Comando não permitido: ${binary}` };
  }
  return new Promise((resolve) => {
    const child = spawn(binary, parts.slice(1), {
      cwd: app.getPath("home"),
      timeout: 30000,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 200000) child.kill();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => resolve({ code: 1, stdout, stderr: String(error.message) }));
    child.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
});

ipcMain.handle("omni:listDir", async (_event, target) => {
  try {
    const dir = path.resolve(String(target || "."));
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => ({ name: entry.name, isDir: entry.isDirectory() }))
      .sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name))
      .slice(0, 400);
  } catch {
    return [];
  }
});

function unsafePath(target) {
  const value = String(target ?? "");
  return !value || value.includes("..") || value.includes("\0");
}

ipcMain.handle("omni:readFile", async (_event, target) => {
  if (unsafePath(target)) return "Caminho não permitido.";
  try {
    const file = path.resolve(String(target));
    const stat = await fs.promises.stat(file);
    if (stat.size > 2 * 1024 * 1024) return "Arquivo maior que 2 MB.";
    return await fs.promises.readFile(file, "utf8");
  } catch (error) {
    return `Falha ao ler: ${error.message}`;
  }
});

ipcMain.handle("omni:writeFile", async (_event, target, content) => {
  if (unsafePath(target)) return false;
  try {
    const file = path.resolve(String(target));
    await fs.promises.writeFile(file, String(content), "utf8");
    return true;
  } catch {
    return false;
  }
});

app.whenReady().then(() => {
  registerProtocol();
  startAuthLoopback();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
