import type { AppSettings, AuthSession, Conversation, SupabaseConfig } from "./types";
import { restSelect, restUpsert, supabaseReady } from "./auth";

export interface SyncResult {
  ok: boolean;
  message: string;
}

export interface PullResult<T> extends SyncResult {
  data?: T;
}

export async function testSupabase(config: SupabaseConfig, session: AuthSession | null): Promise<SyncResult> {
  if (!supabaseReady(config)) return { ok: false, message: "Informe a URL e a anon key do projeto." };
  if (!session) return { ok: false, message: "Entre com o Google para sincronizar." };
  try {
    await restSelect(config, session, "profiles", "select=id&limit=1");
    return { ok: true, message: "Conectado como " + session.user.email };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao conectar." };
  }
}

export async function pushSettings(settings: AppSettings, config: SupabaseConfig, session: AuthSession | null): Promise<SyncResult> {
  if (!session) return { ok: false, message: "Entre com o Google para enviar." };
  try {
    const payload = { ...settings, keys: settings.keys };
    await restUpsert(config, session, "app_settings", {
      user_id: session.user.id,
      payload,
      updated_at: new Date().toISOString(),
    });
    await restUpsert(config, session, "profiles", {
      id: session.user.id,
      email: session.user.email,
      name: settings.profile.name || session.user.name,
      avatar_url: session.user.avatar,
      updated_at: new Date().toISOString(),
    });
    return { ok: true, message: "Configurações salvas na nuvem." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao enviar." };
  }
}

export async function pullSettings(config: SupabaseConfig, session: AuthSession | null): Promise<PullResult<Partial<AppSettings>>> {
  if (!session) return { ok: false, message: "Entre com o Google para baixar." };
  try {
    const rows = (await restSelect(config, session, "app_settings", "select=payload&limit=1")) as Array<{
      payload?: Partial<AppSettings>;
    }>;
    const data: Partial<AppSettings> = { ...(rows[0]?.payload ?? {}) };
    return { ok: true, message: "Configurações restauradas da nuvem.", data };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao baixar." };
  }
}

export async function pushConversations(
  conversations: Conversation[],
  config: SupabaseConfig,
  session: AuthSession | null,
): Promise<SyncResult> {
  if (!session) return { ok: false, message: "Entre com o Google para enviar conversas." };
  try {
    const rows = conversations.map((item) => ({
      user_id: session.user.id,
      id: item.id,
      title: item.title,
      messages: item.messages,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));
    if (rows.length) await restUpsert(config, session, "conversations", rows as unknown as Record<string, unknown>);
    return { ok: true, message: `${rows.length} conversa(s) enviada(s).` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao enviar conversas." };
  }
}

export async function pullConversations(
  config: SupabaseConfig,
  session: AuthSession | null,
): Promise<PullResult<Conversation[]>> {
  if (!session) return { ok: false, message: "Entre com o Google para baixar conversas." };
  try {
    const rows = (await restSelect(
      config,
      session,
      "conversations",
      "select=id,title,messages,created_at,updated_at&order=updated_at.desc&limit=50",
    )) as Array<{ id: string; title: string; messages: unknown; created_at: number; updated_at: number }>;
    const data = rows.map((row) => ({
      id: row.id,
      title: row.title,
      messages: Array.isArray(row.messages) ? (row.messages as Conversation["messages"]) : [],
      createdAt: Number(row.created_at) || 0,
      updatedAt: Number(row.updated_at) || 0,
    }));
    return { ok: true, message: `${data.length} conversa(s) restaurada(s).`, data };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao baixar conversas." };
  }
}

/* --------------------------- chaves de API na nuvem --------------------------- */

/** Envia só as chaves, por ação explícita do usuário. */
export async function pushKeys(
  keys: AppSettings["keys"],
  config: SupabaseConfig,
  session: AuthSession | null,
): Promise<SyncResult> {
  if (!session) return { ok: false, message: "Entre na conta para salvar as chaves." };
  try {
    await restUpsert(config, session, "api_keys", {
      user_id: session.user.id,
      groq: keys.groq ?? "",
      openrouter: keys.openrouter ?? "",
      updated_at: new Date().toISOString(),
    });
    return { ok: true, message: "Chaves salvas na sua conta." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao salvar as chaves." };
  }
}

/** Baixa as chaves salvas; devolve null quando não há nada guardado. */
export async function pullKeys(
  config: SupabaseConfig,
  session: AuthSession | null,
): Promise<PullResult<AppSettings["keys"]>> {
  if (!session) return { ok: false, message: "Entre na conta para baixar as chaves." };
  try {
    const rows = (await restSelect(config, session, "api_keys", "select=groq,openrouter&limit=1")) as Array<{
      groq?: string;
      openrouter?: string;
    }>;
    if (!rows[0]) return { ok: false, message: "Nenhuma chave salva nesta conta." };
    const keys = { groq: rows[0].groq ?? "", openrouter: rows[0].openrouter ?? "" };
    if (!keys.groq && !keys.openrouter) return { ok: false, message: "Nenhuma chave salva nesta conta." };
    return { ok: true, message: "Chaves restauradas da conta.", data: keys };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao baixar as chaves." };
  }
}
