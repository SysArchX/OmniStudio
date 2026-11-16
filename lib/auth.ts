import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession, AuthUser, SupabaseConfig } from "./types";

export const NATIVE_CALLBACK = "omnistudio://auth/callback";

const LEGACY_SESSION_KEY = "omnistudio.session.v1";

/** Credenciais públicas do projeto Supabase - padrão permanente do app. */
export const SUPABASE_URL = "https://" + "xwbpajtyqhzkxvoxnsyp" + ".supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YnBhanR5cWh6a3h2b3huc3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3Njk1MjYsImV4cCI6MjExMDM0NTUyNn0.PQmxqo34NAox3lEI4KRoAvP5MZ_UCzOxae4S6uRQ_Q4";

/** Mantidos por compatibilidade com imports antigos. */
export const DEFAULT_SUPABASE_URL = SUPABASE_URL;
export const DEFAULT_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

/**
 * Normaliza a URL do projeto: descarta caminho colado junto
 * (ex.: "https://xxx.supabase.co/rest/v1") e barras sobrando.
 */
function normalizeUrl(raw?: string | null) {
  const value = raw?.trim();
  if (!value) return SUPABASE_URL;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return SUPABASE_URL;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return SUPABASE_URL;
  }
}

function tablePath(path: string) {
  return path.replace(/^\/+|\/+$/g, "");
}

/** Resolve credenciais ignorando strings vazias ou inválidas de sessões anteriores. */
function resolve(config?: SupabaseConfig | null) {
  return {
    url: normalizeUrl(config?.url),
    anonKey: config?.anonKey?.trim() ? config.anonKey.trim() : SUPABASE_ANON_KEY,
  };
}

export function supabaseReady(_config?: SupabaseConfig | null) {
  const { url, anonKey } = resolve(_config);
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

/** Cliente oficial do Supabase, criado uma única vez por aba. */
export function getSupabase(config?: SupabaseConfig | null): SupabaseClient {
  if (!client) {
    const { url, anonKey } = resolve(config);
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "omnistudio.supabase.auth",
      },
    });
  }
  return client;
}

function userFromSupabase(user: Session["user"] | null | undefined): AuthUser {
  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  return {
    id: user?.id ?? "",
    email: user?.email ?? "",
    name: meta.full_name || meta.name || user?.email || "Conta",
    avatar: meta.avatar_url || "",
  };
}

export function toAuthSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: (session.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000,
    user: userFromSupabase(session.user),
  };
}

function capacitor(): {
  isNativePlatform?: () => boolean;
  Plugins?: { App?: { addListener: (event: string, handler: (data: { url: string }) => void) => { remove?: () => void } | void } };
} | undefined {
  return (window as unknown as { Capacitor?: never }).Capacitor as never;
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

/** OAuth do Google pelo SDK oficial. Nunca usa localhost fixo. */
export async function signInWithGoogle(config?: SupabaseConfig | null) {
  const supabase = getSupabase(config);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUri(),
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw new Error(error.message);
}

/** Traduz os erros de e-mail do Supabase para algo acionável. */
function otpError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("rate limit") || text.includes("over_email_send")) {
    return "Limite de envios atingido: o SMTP padrão do Supabase libera pouquíssimos e-mails por hora. Configure um SMTP próprio (Project Settings → Authentication → SMTP Settings) para enviar de verdade.";
  }
  if (text.includes("not authorized") || text.includes("email address not authorized")) {
    return "O remetente padrão do Supabase só entrega para e-mails da equipe do projeto. Configure um SMTP próprio para enviar a qualquer endereço.";
  }
  return message;
}

export async function sendEmailOtp(
  email: string,
  config?: SupabaseConfig | null,
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabase(config);
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true, emailRedirectTo: redirectUri() },
  });
  if (error) return { ok: false, message: otpError(error.message) };
  return { ok: true, message: "Código de 6 dígitos enviado para o e-mail." };
}

function passwordError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (text.includes("email not confirmed")) return "Conta ainda não confirmada. No Supabase, desative \"Confirm email\" ou use o login com Google.";
  if (text.includes("already registered")) return "Essa conta já existe. Use \"Entrar\".";
  if (text.includes("password should be")) return "A senha precisa de pelo menos 6 caracteres.";
  return message;
}

/** Login por e-mail e senha: não envia nenhum e-mail, então funciona sem SMTP. */
export async function signInWithPassword(
  email: string,
  password: string,
  config?: SupabaseConfig | null,
): Promise<{ ok: boolean; session?: AuthSession; message: string }> {
  const supabase = getSupabase(config);
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, message: passwordError(error.message) };
  const session = toAuthSession(data.session);
  if (!session) return { ok: false, message: "Não foi possível abrir a sessão." };
  saveSession(session);
  return { ok: true, session, message: "Login realizado." };
}

/**
 * Cria a conta com senha. Se \"Confirm email\" estiver desligado no Supabase,
 * a sessão volta na hora e nenhum e-mail é enviado.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  config?: SupabaseConfig | null,
): Promise<{ ok: boolean; session?: AuthSession; message: string }> {
  const supabase = getSupabase(config);
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: redirectUri() },
  });
  if (error) return { ok: false, message: passwordError(error.message) };
  const session = toAuthSession(data.session);
  if (!session) return { ok: false, message: "Conta criada. Desative \"Confirm email\" no Supabase para entrar direto, ou confirme pelo e-mail." };
  saveSession(session);
  return { ok: true, session, message: "Conta criada e sessão iniciada." };
}

export async function verifyEmailOtp(
  email: string,
  token: string,
  config?: SupabaseConfig | null,
): Promise<{ ok: boolean; session?: AuthSession; message: string }> {
  const supabase = getSupabase(config);
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "email",
  });
  if (error) return { ok: false, message: otpError(error.message) };
  const session = toAuthSession(data.session);
  if (!session) return { ok: false, message: "Não foi possível abrir a sessão." };
  saveSession(session);
  return { ok: true, session, message: "Login bem-sucedido!" };
}

export async function signOut(config?: SupabaseConfig | null, _session?: AuthSession | null) {
  const supabase = getSupabase(config);
  await supabase.auth.signOut();
  saveSession(null);
}

/** Compatibilidade: sessões antigas em localStorage continuam legíveis. */
export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_SESSION_KEY);
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
    if (!session) window.localStorage.removeItem(LEGACY_SESSION_KEY);
    else window.localStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* armazenamento indisponível */
  }
}

export async function completeSession(
  config: SupabaseConfig | null | undefined,
  partial: AuthSession,
): Promise<AuthSession> {
  const supabase = getSupabase(config);
  const { data, error } = await supabase.auth.getUser(partial.accessToken);
  if (error || !data.user) throw new Error("Token recusado pelo Supabase.");
  return { ...partial, user: userFromSupabase(data.user) };
}

export async function refreshSession(
  config: SupabaseConfig | null | undefined,
  session: AuthSession,
): Promise<AuthSession> {
  const supabase = getSupabase(config);
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: session.refreshToken,
  });
  if (error) throw new Error("Não foi possível renovar a sessão.");
  const next = toAuthSession(data.session);
  if (!next) throw new Error("Sessão inválida.");
  saveSession(next);
  return next;
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

/**
 * Escuta mudanças de sessão. O Supabase já trata o retorno do OAuth
 * (detectSessionInUrl), então basta repassar o evento para a UI.
 */
export function attachAuthListener(
  config: SupabaseConfig | null | undefined,
  onSession: (session: AuthSession | null) => void,
) {
  const supabase = getSupabase(config);
  void supabase.auth.getSession().then(({ data }) => onSession(toAuthSession(data.session)));
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onSession(toAuthSession(session));
  });
  return () => data.subscription.unsubscribe();
}

/** Headers obrigatórios de toda requisição REST/Auth do Supabase. */
export function authHeaders(
  config: SupabaseConfig | null | undefined,
  session: AuthSession | null,
): Record<string, string> {
  const key = resolve(config).anonKey;
  return {
    apikey: key,
    Authorization: `Bearer ${session?.accessToken || key}`,
    "Content-Type": "application/json",
  };
}

export function baseUrl(config?: SupabaseConfig | null) {
  return resolve(config).url;
}

export async function restSelect(
  config: SupabaseConfig | null | undefined,
  session: AuthSession | null,
  path: string,
  query = "select=*",
): Promise<unknown> {
  const response = await fetch(`${baseUrl(config)}/rest/v1/${tablePath(path)}?${query}`, {
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
  const response = await fetch(`${baseUrl(config)}/rest/v1/${tablePath(path)}`, {
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
  const response = await fetch(`${baseUrl(config)}/rest/v1/${tablePath(path)}?${query}`, {
    method: "DELETE",
    headers: authHeaders(config, session),
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
}