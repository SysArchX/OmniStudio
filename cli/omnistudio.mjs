#!/usr/bin/env node
/**
 * OmniStudio CLI — sessão de agente local + controle remoto.
 *
 *   omnistudio --help
 *   omnistudio --login --email voce@exemplo.com --password '...'
 *   omnistudio --watch            # fica online e executa tarefas remotas
 *   omnistudio --run "git status"
 *
 * Sem dependências: só Node 18+ (fetch nativo).
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const VERSION = "1.5.0";
const SUPABASE_URL = process.env.OMNISTUDIO_SUPABASE_URL || "https://xwbpajtyqhzkxvoxnsyp.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.OMNISTUDIO_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YnBhanR5cWh6a3h2b3huc3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3Njk1MjYsImV4cCI6MjExMDM0NTUyNn0.PQmxqo34NAox3lEI4KRoAvP5MZ_UCzOxae4S6uRQ_Q4";
const ALLOWED = new Set(["python", "python3", "node", "npm", "npx", "git", "ls", "cat", "pacman", "apt", "arduino-cli"]);

const CONFIG_DIR = join(homedir(), ".config", "omnistudio");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function help() {
  console.log(`OmniStudio CLI ${VERSION}

Uso:
  omnistudio --help
  omnistudio --login --email <email> --password <senha>
  omnistudio --watch [--name "PC da sala"]
  omnistudio --run "npm run build"
  omnistudio --status

O comando remoto só executa binários da allowlist (${[...ALLOWED].join(", ")}),
sem encadeamento de shell e com timeout de 120 s.
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function readConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

async function login(email, password) {
  if (!email || !password) {
    console.error("Informe --email e --password.");
    process.exit(2);
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    console.error(`Login falhou (${response.status}). Confira e-mail e senha.`);
    process.exit(1);
  }
  const data = await response.json();
  writeConfig({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId: data.user?.id,
    email: data.user?.email,
    deviceId: readConfig()?.deviceId || crypto.randomUUID(),
    deviceName: readConfig()?.deviceName || `${platform()} · CLI`,
  });
  console.log(`Conectado como ${data.user?.email ?? email}.`);
}

function authHeaders(config) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${config.accessToken}`,
    "Content-Type": "application/json",
  };
}

async function heartbeat(config) {
  const body = {
    user_id: config.userId,
    device_id: config.deviceId,
    device_name: config.deviceName,
    os: platform(),
    status: "online",
    last_seen: new Date().toISOString(),
  };
  await fetch(`${SUPABASE_URL}/rest/v1/remote_sessions?on_conflict=user_id,device_id`, {
    method: "POST",
    headers: { ...authHeaders(config), Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function run(command) {
  const parts = command.trim().split(/\s+/);
  if (!parts[0] || !ALLOWED.has(parts[0])) {
    return Promise.resolve({ code: 126, stdout: "", stderr: `Comando não permitido: ${parts[0] ?? ""}` });
  }
  return new Promise((resolve) => {
    const child = spawn(parts[0], parts.slice(1), { timeout: 120_000 });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", (error) => resolve({ code: 1, stdout, stderr: error.message }));
    child.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

async function watch(config) {
  console.log(`OmniStudio online como ${config.deviceName} (${config.deviceId.slice(0, 8)}). Ctrl+C para sair.`);
  await heartbeat(config);
  setInterval(() => void heartbeat(config), 10_000);

  const poll = async () => {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/remote_commands?status=eq.queued&order=created_at.asc&limit=3`,
      { headers: authHeaders(config) },
    ).catch(() => null);
    if (!response || !response.ok) return;
    const rows = await response.json().catch(() => []);
    for (const row of rows) {
      await fetch(`${SUPABASE_URL}/rest/v1/remote_commands?id=eq.${row.id}`, {
        method: "PATCH",
        headers: authHeaders(config),
        body: JSON.stringify({ status: "running" }),
      }).catch(() => undefined);
      const result = await run(row.command);
      const output = [`exit=${result.code}`, result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n").slice(0, 8000);
      console.log(`> ${row.command}\n${output}\n`);
      await fetch(`${SUPABASE_URL}/rest/v1/remote_commands?id=eq.${row.id}`, {
        method: "PATCH",
        headers: authHeaders(config),
        body: JSON.stringify({ status: result.code === 0 ? "done" : "failed", output }),
      }).catch(() => undefined);
    }
  };

  setInterval(() => void poll(), 5_000);
}

async function status(config) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/remote_sessions?select=device_name,os,status,last_seen`, {
    headers: authHeaders(config),
  }).catch(() => null);
  if (!response || !response.ok) {
    console.error("Não foi possível consultar as sessões.");
    process.exit(1);
  }
  const rows = await response.json();
  if (!rows.length) {
    console.log("Nenhum dispositivo conectado.");
    return;
  }
  for (const row of rows) console.log(`${row.device_name} · ${row.os} · ${row.status} · ${row.last_seen}`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) {
  help();
  process.exit(0);
}
if (args.version || args.v) {
  console.log(VERSION);
  process.exit(0);
}
if (args.login) {
  await login(args.email, args.password);
  process.exit(0);
}

const config = readConfig();
if (!config?.accessToken) {
  console.error("Faça login primeiro: omnistudio --login --email <email> --password <senha>");
  process.exit(2);
}
if (args.name) {
  config.deviceName = String(args.name);
  writeConfig(config);
}
if (args.run) {
  const result = await run(String(args.run));
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.code);
}
if (args.status) {
  await status(config);
  process.exit(0);
}
if (args.watch) {
  await watch(config);
} else {
  help();
}
