const KEY_STORAGE = "omnistudio.composio.key";
const API_BASE = "https://backend.composio.dev/api/v3";

/** Toolkits expostos no Modo Agente. */
export const COMPOSIO_TOOLKITS = [
  { slug: "github", label: "GitHub", description: "Repositórios, issues e pull requests" },
  { slug: "gmail", label: "Gmail", description: "Ler, buscar e enviar e-mails" },
  { slug: "googlecalendar", label: "Google Calendar", description: "Eventos e disponibilidade" },
  { slug: "tavily", label: "Tavily", description: "Pesquisa web para o agente" },
] as const;

export type ToolkitSlug = (typeof COMPOSIO_TOOLKITS)[number]["slug"];

export interface ComposioToolkitStatus {
  slug: ToolkitSlug;
  label: string;
  description: string;
  connected: boolean;
}

export interface ComposioToolPreview {
  slug: string;
  name: string;
  description: string;
}

export function getComposioKey(): string {
  if (typeof window === "undefined") return "";
  const fromEnv = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    return window.localStorage.getItem(KEY_STORAGE)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setComposioKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    if (!key.trim()) window.localStorage.removeItem(KEY_STORAGE);
    else window.localStorage.setItem(KEY_STORAGE, key.trim());
  } catch {
    /* armazenamento indisponível */
  }
}

export function maskedKey(key: string) {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

async function api<T>(path: string, key: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "x-api-key": key, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Composio ${response.status}`);
  return (await response.json()) as T;
}

interface ConnectedAccountRow {
  toolkit?: { slug?: string };
  status?: string;
}

/** Lista quais toolkits já têm conta conectada para este usuário Composio. */
export async function listConnectedToolkits(): Promise<ComposioToolkitStatus[]> {
  const key = getComposioKey();
  if (!key) {
    return COMPOSIO_TOOLKITS.map((toolkit) => ({ ...toolkit, connected: false }));
  }
  try {
    const data = await api<{ items?: ConnectedAccountRow[] }>("/connected_accounts?limit=100", key);
    const connected = new Set(
      (data.items ?? [])
        .filter((row) => (row.status ?? "").toUpperCase() === "ACTIVE")
        .map((row) => row.toolkit?.slug ?? "")
        .filter(Boolean),
    );
    return COMPOSIO_TOOLKITS.map((toolkit) => ({
      ...toolkit,
      connected: connected.has(toolkit.slug),
    }));
  } catch {
    return COMPOSIO_TOOLKITS.map((toolkit) => ({ ...toolkit, connected: false }));
  }
}

/**
 * Ferramentas de um toolkit. O app é exportado como site estático, então as
 * chamadas vão direto para a API REST v3 (o SDK @composio/core é Node-only).
 */
export async function listToolkitTools(slug: ToolkitSlug): Promise<ComposioToolPreview[]> {
  const key = getComposioKey();
  if (!key) return [];
  try {
    const data = await api<{ items?: Array<{ slug?: string; name?: string; description?: string }> }>(
      `/tools?toolkit_slug=${encodeURIComponent(slug)}&limit=40`,
      key,
    );
    return (data.items ?? []).map((tool) => ({
      slug: tool.slug ?? "",
      name: tool.name ?? tool.slug ?? "",
      description: tool.description ?? "",
    }));
  } catch {
    return [];
  }
}

export async function executeTool(slug: string, args: Record<string, unknown>, userId: string) {
  const key = getComposioKey();
  if (!key) throw new Error("Informe a chave da Composio em Configurações.");
  const response = await fetch(`${API_BASE}/tools/execute/${encodeURIComponent(slug)}`, {
    method: "POST",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, arguments: args }),
  });
  if (!response.ok) throw new Error(`Composio ${response.status}`);
  return response.json();
}

export const COMPOSIO_DASHBOARD = "https://dashboard.composio.dev/apps";