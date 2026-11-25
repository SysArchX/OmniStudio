const { app, BrowserWindow, ipcMain, protocol, shell, dialog } = require("electron");

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

/** Raiz onde o agente trabalha: a pasta que o usuário escolheu. */
let workspaceRoot = process.env.OMNISTUDIO_WORKSPACE || null;
const MAX_OUTPUT = 400_000;
const COMMAND_TIMEOUT = 180_000;

/**
 * Comandos destrutivos continuam bloqueados; o resto roda de verdade no shell,
 * porque o agente precisa de pipes, `&&` e ferramentas fora de uma lista curta.
 */
const DESTRUCTIVE = [
  /\brm\s+(-[a-z]*\s+)*-[a-z]*[rf]/i,
  /\brmdir\s+\/s\b/i,
  /\bdel\s+\/[fsq]/i,
  /\bformat\s+[a-z]:/i,
  /\bmkfs(\.|\s)/i,
  /\bdiskpart\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\breg\s+delete\b/i,
  /\bcipher\s+\/w\b/i,
  /:\(\)\s*\{/,
];

function commandBlocked(command) {
  return DESTRUCTIVE.some((pattern) => pattern.test(command));
}

function workspace() {
  if (!workspaceRoot) workspaceRoot = app.getPath("home");
  return workspaceRoot;
}

/** Caminhos do agente são relativos à pasta escolhida e não podem sair dela. */
function resolveInWorkspace(target) {
  const raw = String(target ?? "").trim() || ".";
  const root = workspace();
  const resolved = path.isAbsolute(raw) ? path.normalize(raw) : path.resolve(root, raw);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Caminho fora da pasta de trabalho.");
  }
  return resolved;
}

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
    icon: path.join(__dirname, "..", "build", "icon.png"),
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

/* ------------------------------ pasta de trabalho ------------------------------ */

ipcMain.handle("omni:getWorkspace", () => ({ root: workspace(), name: path.basename(workspace()) }));

ipcMain.handle("omni:chooseWorkspace", async () => {
  const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
    title: "Escolher pasta de trabalho do agente",
    defaultPath: workspace(),
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || !result.filePaths[0]) {
    return { root: workspace(), name: path.basename(workspace()), canceled: true };
  }
  workspaceRoot = result.filePaths[0];
  return { root: workspaceRoot, name: path.basename(workspaceRoot), canceled: false };
});

/* --------------------------------- terminal --------------------------------- */

ipcMain.handle("omni:run", async (_event, command) => {
  if (typeof command !== "string" || !command.trim()) {
    return { code: 1, stdout: "", stderr: "Comando vazio." };
  }
  if (commandBlocked(command)) {
    return { code: 1, stdout: "", stderr: "Comando destrutivo bloqueado pelo OmniStudio." };
  }
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: workspace(),
      shell: true,
      timeout: COMMAND_TIMEOUT,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: "utf-8", FORCE_COLOR: "0" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > MAX_OUTPUT) child.kill();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > MAX_OUTPUT) child.kill();
    });
    child.on("error", (error) => resolve({ code: 1, stdout, stderr: String(error.message) }));
    child.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
});

/* --------------------------------- arquivos --------------------------------- */

ipcMain.handle("omni:listDir", async (_event, target) => {
  try {
    const dir = resolveInWorkspace(target);
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.name !== "node_modules" && entry.name !== ".git")
      .map((entry) => ({ name: entry.name, isDir: entry.isDirectory() }))
      .sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name))
      .slice(0, 400);
  } catch {
    return [];
  }
});

ipcMain.handle("omni:readFile", async (_event, target) => {
  try {
    const file = resolveInWorkspace(target);
    const stat = await fs.promises.stat(file);
    if (stat.size > 2 * 1024 * 1024) return "Arquivo maior que 2 MB.";
    return await fs.promises.readFile(file, "utf8");
  } catch (error) {
    return `Falha ao ler: ${error.message}`;
  }
});

ipcMain.handle("omni:writeFile", async (_event, target, content) => {
  try {
    const file = resolveInWorkspace(target);
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, String(content ?? ""), "utf8");
    return true;
  } catch (error) {
    console.warn("Falha ao gravar", target, error.message);
    return false;
  }
});

ipcMain.handle("omni:deletePath", async (_event, target) => {
  try {
    const file = resolveInWorkspace(target);
    if (file === workspace()) return false;
    await fs.promises.rm(file, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
});

/* ------------------------------------ skills -------------------------------- */

function parseSkillFile(fileName, raw, source) {
  const text = String(raw ?? "").replace(/\r\n/g, "\n");
  if (!text.trim()) return null;
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  const meta = match ? match[1] : "";
  const body = (match ? match[2] : text).trim();
  if (!body) return null;
  const name =
    /^name:\s*(.+)$/m.exec(meta)?.[1]?.trim() ||
    /^#\s+(.+)$/m.exec(body)?.[1]?.trim() ||
    String(fileName).replace(/\.md$/i, "");
  const description =
    /^description:\s*(.+)$/m.exec(meta)?.[1]?.trim() ||
    body
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith("#")) ||
    "";
  return {
    name: name.replace(/^["']|["']$/g, "").slice(0, 120),
    description: description.replace(/^["']|["']$/g, "").slice(0, 400),
    instructions: body.slice(0, 12000),
    source,
  };
}

/** Skills globais entendidas por Claude Code, Codex, Freebuff e OpenCode. */
async function collectSkills() {
  const root = workspace();
  const found = [];
  const seen = new Set();
  const push = (skill) => {
    if (!skill || seen.has(`${skill.name}|${skill.source}`)) return;
    seen.add(`${skill.name}|${skill.source}`);
    found.push(skill);
  };

  const skillDirs = [
    ".agents/skills",
    ".claude/skills",
    ".codex/skills",
    ".opencode/skills",
    ".freebuff/skills",
  ];

  for (const relative of skillDirs) {
    const dir = path.join(root, relative);
    let entries = [];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      for (const candidate of ["SKILL.md", "skill.md", "index.md"]) {
        try {
          const raw = await fs.promises.readFile(path.join(dir, entry.name, candidate), "utf8");
          push(parseSkillFile(entry.name, raw, `${relative}/${entry.name}`));
          break;
        } catch {
          /* tenta o próximo nome de arquivo */
        }
      }
    }
  }

  const flatDirs = [".claude/commands", ".agents/commands", ".codex/prompts"];
  for (const relative of flatDirs) {
    const dir = path.join(root, relative);
    try {
      for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
        const raw = await fs.promises.readFile(path.join(dir, entry.name), "utf8");
        push(parseSkillFile(entry.name, raw, `${relative}/${entry.name}`));
      }
    } catch {
      /* pasta opcional */
    }
  }

  for (const file of ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md"]) {
    try {
      const raw = await fs.promises.readFile(path.join(root, file), "utf8");
      push(parseSkillFile(file, raw, file));
    } catch {
      /* arquivo opcional */
    }
  }

  return found;
}

ipcMain.handle("omni:readSkills", () => collectSkills());

/* --------------------------------- sistema --------------------------------- */

ipcMain.handle("omni:openExternal", async (_event, url) => {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return false;
  await shell.openExternal(url);
  return true;
});

ipcMain.handle("omni:info", () => ({
  platform: process.platform,
  host: require("node:os").hostname(),
  home: app.getPath("home"),
}));

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
