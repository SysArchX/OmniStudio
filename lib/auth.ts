import type { AuthSession, AuthUser, SupabaseConfig } from "./types";

export const NATIVE_CALLBACK = "omnistudio://auth/callback";

const SESSION_KEY = "omnistudio.session.v1";

/** Credenciais públicas do projeto Supabase - padrão permanente do app. */
export const SUPABASE_URL = "https://" + "xwbpajtyqhzkxvoxnsyp" + ".supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YnBhanR5cWh6a3h2b3huc3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3Njk1MjYsImV4cCI6MjExMDM0NTUyNn0.PQmxqo34NAox3lEI4KRoAvP5MZ_UCzOxae4S6uRQ_Q4";

/** Mantidos por compatibilidade com imports antigos. */
export const DEFAULT_SUPABASE_URL = SUPABASE_URL;
export const DEFAULT_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

/** Resolve credenciais ignorando strings vazias salvas em sessões anteriores. */
function resolve(config?: SupabaseConfig | null) {
  const url = config?.url?.trim() ? config.url.trim().replace(/\/$/, "") : SUPABASE_URL;
  const anonKey = config?.anonKey?.trim() ? config.anonKey.trim() : SUPABASE_ANON_KEY;
  return { url, anonKey };
}

export function supabaseReady(_config?: SupabaseConfig | null) {
  const { url, anonKey } = resolve(_config);
  return Boolean(url && anonKey);
}

function baseUrl(config?: SupabaseConfig | null) {
  return resolve(config).url;
}

function apiKey(config?: SupabaseConfig | null) {
  return resolve(config).anonKey;
}

/** Headers obrigatórios de toda requisição REST/Auth do Supabase. */
export function authHeaders(
  config: SupabaseConfig | null | undefined,
  session: AuthSession | null,
): Record<string, string> {
  const key = apiKey(config);
  return {
    apikey: key,
    Authorization: `Bearer ${session?.accessToken || key}`,
    "Content-Type": "application/json",
  };
}

interface CapacitorLike {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    App?: {
      addListener: (
        event: "appUrlOpen",
        handler: (data: { url: string }) => void,
      ) => { remove?: () => void } | void;
    };
  };
}

function capacitor(): CapacitorLike | undefined {
  return (window as unknown as { Capacitor?: CapacitorLike }).Capacitor;
}

export function isNativeShell() {
  if (typeof window === "undefined") return false;
  if ((window as unknown as { omniNative?: unknown }).omniNative) return true;
  return Boolean(capacitor()?.isNativePlatform?.());
}

/** URI de retorno registrada no Supabase: esquema do app no nativo, origem no navegador. */
export function redirectUri() {
  if (typeof window === "undefined") return "";
  if (isNativeShell()) return NATIVE_CALLBACK;
  return `${window.location.origin}/`;
}

/**
 * OAuth do Google pelo endpoint REST do Supabase, sem SDK.
 * O `apikey` vai como header de sessão e também como parâmetro da URL,
 * porque o servidor de autorização responde "No API key found in request"
 * quando nenhum dos dois está presente.
 */
export function signInWithGoogle(config?: SupabaseConfig | null) {
  const { url, anonKey } = resolve(config);
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectUri(),
    flow_type: "implicit",
    apikey: anonKey,
  });
  window.location.assign(`${url}/auth/v1/authorize?${params.toString()}`);
}

function userFromPayload(raw: Record<string, unknown>): AuthUser {
  const meta = (raw.user_metadata ?? {}) as Record<string, string>;
  return {
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    name: meta.full_name || meta.name || String(raw.email ?? "Conta"),
    avatar: meta.avatar_url || "",
  };
}

/** Lê access_token/refresh_token do fragmento devolvido pelo Supabase. */
export function parseAuthFragment(fragment: string): AuthSession | null {
  const clean = fragment.startsWith("#") ? fragment.slice(1) : fragment.split("#")[1] ?? "";
  if (!clean) return null;
  const params = new URLSearchParams(clean);
  const accessToken = params.get("access_token");
  if (!accessToken) return null;
  const expiresIn = Number(params.get("expires_in") ?? 3600);
  return {
    accessToken,
    refreshToken: params.get("refresh_token") ?? "",
    expiresAt: Date.now() + expiresIn * 1000,
    user: { id: "", email: "", name: "", avatar: "" },
  };
}

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed?.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) window.localStorage.removeItem(SESSION_KEY);
    else window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* armazenamento indisponível */
  }
}

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text.slice(0, 160) };
  }
}

export async function completeSession(
  config: SupabaseConfig | null | undefined,
  partial: AuthSession,
): Promise<AuthSession> {
  const response = await fetch(`${baseUrl(config)}/auth/v1/user`, {
    headers: authHeaders(config, partial),
  });
  if (!response.ok) throw new Error("Token recusado pelo Supabase.");
  const data = await readJson(response);
  return { ...partial, user: userFromPayload(data) };
}

export async function refreshSession(
  config: SupabaseConfig | null | undefined,
  session: AuthSession,
): Promise<AuthSession> {
  const response = await fetch(`${baseUrl(config)}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(config, null),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  if (!response.ok) throw new Error("Não foi possível renovar a sessão.");
  const data = await readJson(response);
  const next: AuthSession = {
    accessToken: String(data.access_token ?? ""),
    refreshToken: String(data.refresh_token ?? session.refreshToken),
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
    user: data.user ? userFromPayload(data.user as Record<string, unknown>) : session.user,
  };
  saveSession(next);
  return next;
}

export async function signOut(
  config: SupabaseConfig | null | undefined,
  session: AuthSession | null,
) {
  if (session) {
    try {
      await fetch(`${baseUrl(config)}/auth/v1/logout`, {
        method: "POST",
        headers: authHeaders(config, session),
      });
    } catch {
      /* sai localmente mesmo sem rede */
    }
  }
  saveSession(null);
}

/** Escuta o retorno do OAuth no Electron (IPC) e no Android (appUrlOpen). */
export function attachAuthListener(
  config: SupabaseConfig | null | undefined,
  onSession: (session: AuthSession) => void,
) {
  const cleanups: Array<() => void> = [];
  const handle = async (url: string) => {
    const partial = parseAuthFragment(url);
    if (!partial) return;
    try {
      const full = await completeSession(config, partial);
      saveSession(full);
      onSession(full);
    } catch {
      /* callback inválido */
    }
  };

  const native = (window as unknown as { omniNative?: { onAuthCallback?: (cb: (url: string) => void) => () => void } })
    .omniNative;
  if (native?.onAuthCallback) {
    const off = native.onAuthCallback((url) => void handle(url));
    if (typeof off === "function") cleanups.push(off);
  }

  const plugin = capacitor()?.Plugins?.App;
  if (plugin?.addListener) {
    const sub = plugin.addListener("appUrlOpen", ({ url }) => void handle(url));
    if (sub && typeof sub.remove === "function") cleanups.push(() => sub.remove?.());
  }

  if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
    void handle(window.location.href).then(() => {
      window.history.replaceState(null, "", window.location.pathname);
    });
  }

  return () => cleanups.forEach((off) => off());
}

export async function restSelect(
  config: SupabaseConfig | null | undefined,
  session: AuthSession | null,
  path: string,
  query = "select=*",
): Promise<unknown> {
  const response = await fetch(`${baseUrl(config)}/rest/v1/${path}?${query}`, {
    method: "GET",
    headers: authHeaders(config, session),
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function restUpsert(
  config: SupabaseConfig | null | undefined,
  session: AuthSession | null,
  path: string,
  body: Record<string, unknown> | Array<Record<string, unknown>>,
) {
  const response = await fetch(`${baseUrl(config)}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      ...authHeaders(config, session),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function restDelete(
  config: SupabaseConfig | null | undefined,
  session: AuthSession | null,
  path: string,
  query: string,
) {
  const response = await fetch(`${baseUrl(config)}/rest/v1/${path}?${query}`, {
    method: "DELETE",
    headers: authHeaders(config, session),
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
}

export async function sendEmailOtp(
  email: string,
  config?: SupabaseConfig | null,
): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${baseUrl(config)}/auth/v1/otp`, {
    method: "POST",
    headers: authHeaders(config, null),
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!response.ok) {
    const err = await response.text();
    return { ok: false, message: err.slice(0, 160) };
  }
  return { ok: true, message: "Código de 6 dígitos enviado para o e-mail." };
}

export async function verifyEmailOtp(
  email: string,
  token: string,
  config?: SupabaseConfig | null,
): Promise<{ ok: boolean; session?: AuthSession; message: string }> {
  const response = await fetch(`${baseUrl(config)}/auth/v1/verify`, {
    method: "POST",
    headers: authHeaders(config, null),
    body: JSON.stringify({ email, token, type: "email" }),
  });
  if (!response.ok) {
    const err = await response.text();
    return { ok: false, message: err.slice(0, 160) };
  }
  const data = (await response.json()) as AuthSession;
  saveSession(data);
  return { ok: true, session: data, message: "Login bem-sucedido!" };
}