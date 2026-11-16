import { getSupabase } from "./auth";
import type { AuthSession, SupabaseConfig } from "./types";

/**
 * Ponte de controle remoto entre o app desktop/CLI e o navegador.
 * O app instalado publica um heartbeat de 10 s e executa comandos enfileirados
 * pelo celular; o navegador só enxerga as próprias linhas (RLS por user_id).
 */

export interface RemoteDevice {
  deviceId: string;
  name: string;
  os: string;
  status: "online" | "busy" | "offline";
  lastSeen: number;
}

export interface RemoteCommand {
  id: string;
  command: string;
  status: "queued" | "running" | "done" | "failed";
  output: string;
  createdAt: number;
}

const HEARTBEAT_MS = 10_000;
const ONLINE_WINDOW_MS = 35_000;

function client(config: SupabaseConfig) {
  return getSupabase(config);
}

function deviceKey() {
  const storageKey = "omnistudio.device.id";
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) return saved;
    const generated = crypto.randomUUID();
    window.localStorage.setItem(storageKey, generated);
    return generated;
  } catch {
    return crypto.randomUUID();
  }
}

export function deviceLabel() {
  if (typeof navigator === "undefined") return "Dispositivo";
  const platform = navigator.platform || "desktop";
  return `${platform} · OmniStudio`;
}

function osLabel() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
  if (ua.includes("mac os")) return "macOS";
  if (ua.includes("linux")) return "Linux";
  return navigator.platform || "desktop";
}

/** Publica o estado do app instalado. Devolve a função de parada. */
export function startHeartbeat(
  config: SupabaseConfig,
  session: AuthSession | null,
  handlers: { onError?: (message: string) => void } = {},
) {
  if (!session) return () => undefined;
  const id = deviceKey();
  const supabase = client(config);

  const beat = async () => {
    const { error } = await supabase.from("remote_sessions").upsert(
      {
        user_id: session.user.id,
        device_id: id,
        device_name: deviceLabel(),
        os: osLabel(),
        status: "online",
        last_seen: new Date().toISOString(),
      },
      { onConflict: "user_id,device_id" },
    );
    if (error) handlers.onError?.(error.message);
  };

  void beat();
  const timer = window.setInterval(() => void beat(), HEARTBEAT_MS);
  return () => {
    window.clearInterval(timer);
    void supabase
      .from("remote_sessions")
      .update({ status: "offline", last_seen: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .eq("device_id", id);
  };
}

export async function listDevices(config: SupabaseConfig, session: AuthSession | null): Promise<RemoteDevice[]> {
  if (!session) return [];
  const { data, error } = await client(config)
    .from("remote_sessions")
    .select("device_id,device_name,os,status,last_seen")
    .order("last_seen", { ascending: false })
    .limit(10);
  if (error || !data) return [];
  const now = Date.now();
  return (data as Array<Record<string, string>>).map((row) => {
    const lastSeen = Date.parse(row.last_seen ?? "") || 0;
    const fresh = now - lastSeen < ONLINE_WINDOW_MS;
    return {
      deviceId: row.device_id,
      name: row.device_name || "Dispositivo",
      os: row.os || "desktop",
      status: fresh ? ((row.status as RemoteDevice["status"]) ?? "online") : "offline",
      lastSeen,
    };
  });
}

export async function queueCommand(
  config: SupabaseConfig,
  session: AuthSession | null,
  command: string,
): Promise<string | null> {
  if (!session || !command.trim()) return null;
  const { data, error } = await client(config)
    .from("remote_commands")
    .insert({ user_id: session.user.id, command: command.trim(), status: "queued" })
    .select("id")
    .single();
  if (error) return null;
  return (data as { id: string } | null)?.id ?? null;
}

export async function listCommands(config: SupabaseConfig, session: AuthSession | null): Promise<RemoteCommand[]> {
  if (!session) return [];
  const { data, error } = await client(config)
    .from("remote_commands")
    .select("id,command,status,output,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return (data as Array<Record<string, string>>).map((row) => ({
    id: row.id,
    command: row.command ?? "",
    status: (row.status as RemoteCommand["status"]) ?? "queued",
    output: row.output ?? "",
    createdAt: Date.parse(row.created_at ?? "") || 0,
  }));
}

export interface RemoteRunner {
  execute: (command: string) => Promise<{ code: number; stdout: string; stderr: string }>;
  onLog?: (line: string) => void;
}

/**
 * Loop do app instalado: busca comandos pendentes e devolve a saída.
 * O comando passa pelo mesmo allowlist do terminal local antes de rodar.
 */
export function startRemoteRunner(config: SupabaseConfig, session: AuthSession | null, runner: RemoteRunner) {
  if (!session) return () => undefined;
  const supabase = client(config);
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    const { data } = await supabase
      .from("remote_commands")
      .select("id,command")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(3);
    for (const row of (data ?? []) as Array<{ id: string; command: string }>) {
      await supabase.from("remote_commands").update({ status: "running" }).eq("id", row.id);
      let output = "";
      let status: RemoteCommand["status"] = "done";
      try {
        const result = await runner.execute(row.command);
        output = [`exit=${result.code}`, result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n").slice(0, 8000);
        if (result.code !== 0) status = "failed";
      } catch (error) {
        status = "failed";
        output = error instanceof Error ? error.message : "Falha ao executar.";
      }
      runner.onLog?.(`${row.command} → ${status}`);
      await supabase.from("remote_commands").update({ status, output }).eq("id", row.id);
    }
  };

  const timer = window.setInterval(() => void tick(), 5000);
  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}
