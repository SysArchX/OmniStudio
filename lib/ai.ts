import type { ApiKeys, ProviderId } from "./types";

export interface BrainMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface BrainConfig {
  keys: ApiKeys;
  fallback: boolean;
}

export interface BrainResult {
  text: string;
  provider: ProviderId | "local";
  attempts: Array<{ provider: ProviderId; ok: boolean; detail?: string }>;
}

export type ErrorKind = "limit" | "auth" | "network" | "other";

export class ProviderError extends Error {
  provider: ProviderId;
  kind: ErrorKind;
  status?: number;

  constructor(provider: ProviderId, kind: ErrorKind, message: string, status?: number) {
    super(message);
    this.provider = provider;
    this.kind = kind;
    this.status = status;
  }
}

export const PROVIDER_ORDER: ProviderId[] = ["groq", "openrouter", "github"];

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  groq: "Groq",
  openrouter: "OpenRouter",
  github: "GitHub Models",
};

export const PROVIDER_MODEL: Record<ProviderId, string> = {
  groq: "llama-3.3-70b-versatile",
  openrouter: "openrouter/free",
  github: "openai/gpt-4o-mini",
};

/** Fallbacks usados só quando a OpenRouter recusa o roteador free. */
const OPENROUTER_FALLBACKS = ["nvidia/nemotron-3-ultra-550b-a55b:free", "google/gemma-4-31b-it:free"];

const KEY_HELP: Record<ProviderId, string> = {
  groq: "console.groq.com/keys",
  openrouter: "openrouter.ai/keys",
  github: "github.com/settings/tokens",
};

export function providerKeyHelp(provider: ProviderId) {
  return KEY_HELP[provider];
}

function classify(status: number): ErrorKind {
  if (status === 429) return "limit";
  if (status === 401 || status === 403) return "auth";
  if (status >= 500) return "network";
  return "other";
}

function providerDetail(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } | string; message?: string };
    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.error?.message) return parsed.error.message;
    if (parsed.message) return parsed.message;
  } catch {
    /* corpo não é JSON */
  }
  return raw.replace(/\s+/g, " ").trim().slice(0, 140);
}

async function postJson(url: string, body: unknown, headers: Record<string, string>, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
  } finally {
    clearTimeout(timer);
  }
}

function toPlain(messages: BrainMessage[]) {
  return messages.map((message) => ({ role: message.role, content: message.content }));
}

function readChoice(text: string) {
  const parsed = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
  return parsed.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGroq(messages: BrainMessage[], key: string) {
  const result = await postJson(
    "https://api.groq.com/openai/v1/chat/completions",
    { model: PROVIDER_MODEL.groq, messages: toPlain(messages), temperature: 0.7, max_tokens: 2048 },
    { Authorization: `Bearer ${key}` },
  );
  if (!result.ok) throw new ProviderError("groq", classify(result.status), result.text.slice(0, 240), result.status);
  const text = readChoice(result.text);
  if (!text) throw new ProviderError("groq", "other", "Resposta vazia do provedor.");
  return text;
}

async function callOpenRouterOnce(messages: BrainMessage[], key: string, model: string) {
  const result = await postJson(
    "https://openrouter.ai/api/v1/chat/completions",
    { model, messages: toPlain(messages), temperature: 0.7, max_tokens: 2048 },
    {
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://github.com/SysArchX",
      "X-Title": "OmniStudio",
    },
  );
  if (!result.ok) throw new ProviderError("openrouter", classify(result.status), result.text.slice(0, 240), result.status);
  const text = readChoice(result.text);
  if (!text) throw new ProviderError("openrouter", "other", "Resposta vazia do provedor.");
  return text;
}

async function callOpenRouter(messages: BrainMessage[], key: string) {
  let lastError: unknown;
  for (const model of [PROVIDER_MODEL.openrouter, ...OPENROUTER_FALLBACKS]) {
    try {
      return await callOpenRouterOnce(messages, key, model);
    } catch (error) {
      lastError = error;
      const retriable =
        error instanceof ProviderError && error.kind === "other" && error.status !== undefined && error.status < 500;
      if (!retriable) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("OpenRouter indisponível.");
}

async function callGithubModels(messages: BrainMessage[], key: string) {
  const result = await postJson(
    "https://models.github.ai/inference/chat/completions",
    { model: PROVIDER_MODEL.github, messages: toPlain(messages), temperature: 0.7, max_tokens: 2048 },
    { Authorization: `Bearer ${key}`, Accept: "application/vnd.github+json" },
  );
  if (!result.ok) throw new ProviderError("github", classify(result.status), result.text.slice(0, 240), result.status);
  const text = readChoice(result.text);
  if (!text) throw new ProviderError("github", "other", "Resposta vazia do provedor.");
  return text;
}

async function callProvider(provider: ProviderId, messages: BrainMessage[], key: string) {
  if (provider === "groq") return callGroq(messages, key);
  if (provider === "github") return callGithubModels(messages, key);
  return callOpenRouter(messages, key);
}

function friendly(error: unknown) {
  if (error instanceof ProviderError) {
    if (error.kind === "limit") return "limite atingido";
    if (error.kind === "auth") return "chave inválida";
    if (error.kind === "network") return "provedor fora do ar";
    return providerDetail(error.message);
  }
  if (error instanceof DOMException && error.name === "AbortError") return "tempo esgotado";
  return "falha de rede";
}

/** Groq, depois OpenRouter, depois GitHub Models. Sem chave, cérebro local. */
export async function runBrain(messages: BrainMessage[], config: BrainConfig): Promise<BrainResult> {
  const attempts: Array<{ provider: ProviderId; ok: boolean; detail?: string }> = [];
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

  for (const provider of PROVIDER_ORDER) {
    const key = config.keys[provider]?.trim();
    if (!key) continue;
    try {
      const text = await callProvider(provider, messages, key);
      attempts.push({ provider, ok: true });
      return { text, provider, attempts };
    } catch (error) {
      attempts.push({ provider, ok: false, detail: friendly(error) });
      if (!config.fallback) throw new Error(`${PROVIDER_LABEL[provider]}: ${friendly(error)}.`);
    }
  }

  if (config.fallback) return { text: localAnswer(lastUser), provider: "local", attempts };
  throw new Error("Nenhuma chave configurada. Adicione uma chave em Configurações ou ligue o modo local.");
}

export interface ProviderTestResult {
  ok: boolean;
  status: "connected" | "limit" | "auth" | "network" | "error" | "idle";
  message: string;
}

export async function testProvider(provider: ProviderId, key: string): Promise<ProviderTestResult> {
  if (!key.trim()) return { ok: false, status: "idle", message: "Nenhuma chave informada." };
  try {
    const text = await callProvider(
      provider,
      [
        { role: "system", content: "Responda apenas com a palavra OK." },
        { role: "user", content: "ping" },
      ],
      key.trim(),
    );
    return { ok: true, status: "connected", message: `Conectado. Resposta: ${text.slice(0, 24)}` };
  } catch (error) {
    if (error instanceof ProviderError) {
      if (error.kind === "limit") return { ok: false, status: "limit", message: "Limite atingido, tente mais tarde." };
      if (error.kind === "auth") return { ok: false, status: "auth", message: "Chave recusada pelo provedor." };
      if (error.kind === "network") return { ok: false, status: "network", message: `Provedor instável: ${providerDetail(error.message)}` };
      return {
        ok: false,
        status: "error",
        message: `Provedor recusou o pedido${error.status ? ` (${error.status})` : ""}: ${providerDetail(error.message)}`,
      };
    }
    return { ok: false, status: "network", message: "Sem conexão: o navegador não conseguiu falar com o provedor." };
  }
}

/* ------------------------------- pesquisa web ------------------------------- */

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  origin: "Wikipédia" | "DuckDuckGo";
}

async function searchWikipedia(query: string, lang: "pt" | "en"): Promise<SearchHit[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: "3",
    format: "json",
    origin: "*",
  });
  const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params.toString()}`);
  if (!response.ok) return [];
  const data = (await response.json()) as {
    query?: { search?: Array<{ title: string; snippet: string }> };
  };
  return (data.query?.search ?? []).map((item) => ({
    title: item.title,
    url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s/g, "_"))}`,
    snippet: item.snippet.replace(/<[^>]+>/g, "").slice(0, 220),
    origin: "Wikipédia" as const,
  }));
}

async function searchDuckDuckGo(query: string): Promise<SearchHit[]> {
  const response = await fetch(`https://r.jina.ai/https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { Accept: "text/plain" },
  });
  if (!response.ok) return [];
  const text = await response.text();
  const hits: SearchHit[] = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length && hits.length < 4; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith("[") || !line.includes("](http")) continue;
    const match = /^\[(.+?)\]\((https?:\/\/[^\s)]+)\)(.*)$/.exec(line);
    if (!match) continue;
    const url = match[2];
    if (/duckduckgo\.com|r\.jina\.ai/.test(url)) continue;
    hits.push({ title: match[1].slice(0, 90), url, snippet: (match[3] ?? "").trim().slice(0, 200), origin: "DuckDuckGo" });
  }
  return hits;
}

/** Pesquisa gratuita: Wikipédia pt/en + DuckDuckGo, sem chave de API. */
export async function webSearch(query: string): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const settled = await Promise.allSettled([
    searchWikipedia(trimmed, "pt"),
    searchWikipedia(trimmed, "en"),
    searchDuckDuckGo(trimmed),
  ]);
  const hits: SearchHit[] = [];
  const seen = new Set<string>();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const hit of result.value) {
      const key = hit.url.replace(/\/$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(hit);
    }
  }
  return hits.slice(0, 8);
}

/** Leitura de página por texto puro através do Jina Reader, sem chave. */
export async function readLink(url: string): Promise<string> {
  const response = await fetch(`https://r.jina.ai/${url}`, { headers: { Accept: "text/plain" } });
  if (!response.ok) throw new Error(`Não foi possível ler ${url} (${response.status}).`);
  const text = await response.text();
  return text.replace(/\n{3,}/g, "\n\n").slice(0, 8000);
}

export function findLinks(text: string) {
  return Array.from(text.matchAll(/https?:\/\/[^\s)]+/g)).map((match) => match[0]);
}

export function researchBlock(query: string, hits: SearchHit[], page?: { url: string; text: string }) {
  const lines = [`Pesquisa web para "${query}":`];
  hits.forEach((hit, index) => {
    lines.push(`${index + 1}. ${hit.title} (${hit.origin}) ${hit.url}`);
    if (hit.snippet) lines.push(`   ${hit.snippet}`);
  });
  if (page) {
    lines.push("", `Conteúdo de ${page.url}:`, page.text.slice(0, 4000));
  }
  return lines.join("\n");
}

/* ------------------------------- cérebro local ------------------------------- */

const STOP_WORDS = new Set(["o", "a", "os", "as", "de", "do", "da", "dos", "das", "um", "uma", "como", "que", "para", "pra", "com", "sem", "sobre", "qual", "me", "eu", "voce", "você", "e"]);

function topicOf(prompt: string) {
  const words = prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  return words.slice(0, 6).join(" ") || "seu projeto";
}

/** Resposta estruturada em pt-BR, sem rede. Não é um modelo: deixa o modo local explícito. */
export function localAnswer(prompt: string): string {
  const topic = topicOf(prompt);
  return [
    `Sobre ${topic}`,
    "",
    "Estou no modo local, então organizo o raciocínio em vez de inventar detalhes. Ative uma chave em Configurações para respostas geradas por modelo.",
    "",
    "Próximo passo",
    "1. Diga o objetivo em uma frase.",
    "2. Diga o que já existe hoje (arquivo, ferramenta, prazo).",
    "3. Diga o que impede de terminar.",
    "",
    "Com essas três respostas eu monto o plano certo.",
  ].join("\n");
}
