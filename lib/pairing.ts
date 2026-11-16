import type { AuthSession, SupabaseConfig } from "./types";
import { SUPABASE_URL, baseUrl, getSupabase, resolveAnonKey, saveSession, toAuthSession } from "./auth";

/**
 * Pareamento por código entre o navegador (já logado) e um app nativo/CLI.
 * O app cria `OMNI-XXXX`, grava em `device_auth_codes` e fica consultando.
 * O navegador autoriza a partir de `?pair=OMNI-XXXX` e grava os tokens.
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_PREFIX = "OMNI-";
const POLL_MS = 2000;
const CODE_TTL_MS = 5 * 60 * 1000;

export function generatePairingCode(): string {
  let tail = "";
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  for (let index = 0; index < 4; index += 1) {
    const byte = bytes[index] || Math.floor(Math.random() * 256);
    tail += ALPHABET[byte % ALPHABET.length];
  }
  return `${CODE_PREFIX}${tail}`;
}

export function normalizePairingCode(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!clean) return "";
  const body = clean.startsWith(CODE_PREFIX) ? clean.slice(CODE_PREFIX.length) : clean.replace(/^OMNI/, "");
  return `${CODE_PREFIX}${body.slice(0, 4)}`;
}

export function pairingUrl(code: string, origin?: string) {
  const base = origin && origin !== "null" ? origin : "https://site-18ac632e87d148d6ac36f5819bc6945b.freebuff.page";
  return `${base.replace(/\/$/, "")}/?pair=${encodeURIComponent(code)}`;
}

function headers(config?: SupabaseConfig | null) {
  return {
    apikey: resolveAnonKey(config),
    "Content-Type": "application/json",
  };
}

export async function createPairingCode(
  deviceName: string,
  config?: SupabaseConfig | null,
): Promise<{ ok: boolean; code?: string; message: string }> {
  const code = generatePairingCode();
  const response = await fetch(`${baseUrl(config)}/rest/v1/device_auth_codes`, {
    method: "POST",
    headers: { ...headers(config), Prefer: "return=minimal" },
    body: JSON.stringify({ code, device_name: deviceName, status: "pending" }),
  }).catch(() => null);
  if (!response || !response.ok) {
    return {
      ok: false,
      message:
        response?.status === 404
          ? "A tabela device_auth_codes ainda não existe. Rode o supabase-schema.sql no SQL Editor."
          : `Não foi possível criar o código (${response?.status ?? "sem rede"}).`,
    };
  }
  return { ok: true, code, message: "Código criado." };
}

interface PairingRow {
  code: string;
  status: string;
  access_token: string | null;
  refresh_token: string | null;
  user_email: string | null;
  created_at: string | null;
}

async function readPairingRow(code: string, config?: SupabaseConfig | null): Promise<PairingRow | null> {
  const response = await fetch(
    `${baseUrl(config)}/rest/v1/device_auth_codes?code=eq.${encodeURIComponent(code)}&select=code,status,access_token,refresh_token,user_email,created_at&limit=1`,
    { headers: headers(config) },
  ).catch(() => null);
  if (!response || !response.ok) return null;
  const rows = (await response.json()) as PairingRow[];
  return rows[0] ?? null;
}

/** Navegador: autoriza o código com a sessão de quem está logado. */
export async function approvePairingCode(
  code: string,
  session: AuthSession,
  config?: SupabaseConfig | null,
): Promise<{ ok: boolean; message: string }> {
  const target = normalizePairingCode(code);
  if (!target.startsWith(CODE_PREFIX) || target.length !== CODE_PREFIX.length + 4) {
    return { ok: false, message: "Código inválido. Ele tem o formato OMNI-XXXX." };
  }
  const row = await readPairingRow(target, config);
  if (!row) return { ok: false, message: "Código não encontrado. Gere outro no aplicativo." };
  if (row.status === "approved") return { ok: false, message: "Esse código já foi usado. Gere outro no aplicativo." };

  const response = await fetch(
    `${baseUrl(config)}/rest/v1/device_auth_codes?code=eq.${encodeURIComponent(target)}`,
    {
      method: "PATCH",
      headers: {
        apikey: resolveAnonKey(config),
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: "approved",
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        user_email: session.user.email,
      }),
    },
  ).catch(() => null);

  if (!response || !response.ok) {
    return {
      ok: false,
      message:
        response?.status === 401 || response?.status === 403
          ? "O Supabase recusou a autorização. Confira as políticas de device_auth_codes no schema."
          : `Falha ao autorizar (${response?.status ?? "sem rede"}).`,
    };
  }
  return { ok: true, message: "Aparelho autorizado. Pode voltar para o aplicativo." };
}

/** App/CLI: consulta até o navegador autorizar e devolve a sessão. */
export async function waitForPairingApproval(
  code: string,
  options: {
    config?: SupabaseConfig | null;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<AuthSession> {
  const deadline = Date.now() + (options.timeoutMs ?? CODE_TTL_MS);
  while (Date.now() < deadline) {
    if (options.signal?.aborted) throw new Error("Pareamento cancelado.");
    const row = await readPairingRow(code, options.config);
    if (row?.status === "approved" && row.access_token) {
      const supabase = getSupabase(options.config);
      const { data, error } = await supabase.auth.setSession({
        access_token: row.access_token,
        refresh_token: row.refresh_token ?? "",
      });
      if (error) throw new Error(error.message);
      const session = toAuthSession(data.session);
      if (!session) throw new Error("O pareamento não devolveu uma sessão válida.");
      saveSession(session);
      return session;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error("O código expirou. Gere um novo para continuar.");
}

export { SUPABASE_URL };
