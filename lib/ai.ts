import type { ApiKeys, ProviderId } from "./types";

export interface BrainMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface BrainConfig {
  keys: ApiKeys;
  fallback: boolean;
  /** Provedor escolhido no compositor; os demais entram como fallback. */
  preferred?: ProviderId;
  /** Modelo fixado da OpenRouter ou `auto` para a ordem por capacidade. */
  openrouterModel?: string;
}

export interface BrainResult {
  text: string;
  provider: ProviderId | "local";
  /** Modelo que realmente respondeu (id da OpenRouter, por exemplo). */
  model?: string;
  /** Rótulo curto para o selo do chat ("DeepSeek R1", "Llama 3.3 70B"). */
  modelLabel?: string;
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

export const PROVIDER_ORDER: ProviderId[] = ["openrouter", "groq", "mistral"];

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  openrouter: "OpenRouter",
  groq: "Groq",
  mistral: "Mistral",
};

export const PROVIDER_MODEL: Record<ProviderId, string> = {
  openrouter: "openrouter/free",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
};

export interface OpenRouterModel {
  id: string;
  label: string;
  tier: 1 | 2;
}

export const AUTO_MODEL = "auto";

/**
 * Ranking de modelos free por capacidade real. Tier 1 = raciocínio e código
 * fortes; Tier 2 = generalistas rápidos. A cascata desce essa lista.
 */
export const OPENROUTER_RANKING: OpenRouterModel[] = [
  { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1", tier: 1 },
  { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3", tier: 1 },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B", tier: 1 },
  { id: "qwen/qwen3-235b-a22b:free", label: "Qwen3 235B", tier: 1 },
  { id: "qwen/qwen-2.5-coder-32b-instruct:free", label: "Qwen2.5 Coder 32B", tier: 1 },
  { id: "google/gemma-3-27b-it:free", label: "Gemma 3 27B", tier: 1 },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", label: "Mistral Small 3.1", tier: 1 },
  { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen2.5 72B", tier: 2 },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Hermes 3 405B", tier: 2 },
  { id: "openrouter/free", label: "OpenRouter Free", tier: 2 },
];

/** Modelo fixado primeiro, depois o ranking completo sem repetir. */
export function openrouterCandidates(pinned?: string | null) {
  const ranked = OPENROUTER_RANKING.map((item) => item.id);
  const chosen = pinned && pinned !== AUTO_MODEL ? pinned.trim() : "";
  if (!chosen) return ranked;
  return [chosen, ...ranked.filter((id) => id !== chosen)];
}

/** Rótulo legível de um id de modelo, com queda para o trecho final do id. */
export function modelLabelOf(id: string) {
  const known = OPENROUTER_RANKING.find((item) => item.id === id);
  if (known) return known.label;
  const base = id.split("/").pop() ?? id;
  return base.replace(/:free$/, "").replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const KEY_HELP: Record<ProviderId, string> = {
  openrouter: "openrouter.ai/keys",
  groq: "console.groq.com/keys",
  mistral: "console.mistral.ai/api-keys",
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

async function callMistral(messages: BrainMessage[], key: string) {
  const result = await postJson(
    "https://api.mistral.ai/v1/chat/completions",
    { model: PROVIDER_MODEL.mistral, messages: toPlain(messages), temperature: 0.7, max_tokens: 2048 },
    { Authorization: `Bearer ${key}` },
  );
  if (!result.ok) throw new ProviderError("mistral", classify(result.status), result.text.slice(0, 240), result.status);
  const text = readChoice(result.text);
  if (!text) throw new ProviderError("mistral", "other", "Resposta vazia do provedor.");
  return text;
}

/** 429, 402 e 5xx pedem próxima tentativa; 404/400 indicam modelo fora do catálogo. */
function shouldCascade(error: unknown) {
  if (!(error instanceof ProviderError)) return false;
  if (error.status === undefined) return false;
  return [400, 402, 404, 408, 429, 502, 503, 504].includes(error.status);
}

async function callOpenRouter(
  messages: BrainMessage[],
  key: string,
  pinned?: string | null,
): Promise<{ text: string; model: string }> {
  let lastError: unknown;
  for (const model of openrouterCandidates(pinned)) {
    try {
      return { text: await callOpenRouterOnce(messages, key, model), model };
    } catch (error) {
      lastError = error;
      if (!shouldCascade(error)) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("OpenRouter indisponível.");
}

async function callProvider(
  provider: ProviderId,
  messages: BrainMessage[],
  key: string,
  pinned?: string | null,
): Promise<{ text: string; model: string }> {
  if (provider === "groq") return { text: await callGroq(messages, key), model: PROVIDER_MODEL.groq };
  if (provider === "mistral") return { text: await callMistral(messages, key), model: PROVIDER_MODEL.mistral };
  return callOpenRouter(messages, key, pinned);
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

/** OpenRouter, depois Groq, depois Mistral. Sem chave, cérebro local. */
export async function runBrain(messages: BrainMessage[], config: BrainConfig): Promise<BrainResult> {
  const attempts: Array<{ provider: ProviderId; ok: boolean; detail?: string }> = [];
  const withSystem: BrainMessage[] = messages.some((message) => message.role === "system")
    ? messages
    : [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

  const order = config.preferred
    ? [config.preferred, ...PROVIDER_ORDER.filter((item) => item !== config.preferred)]
    : PROVIDER_ORDER;

  for (const provider of order) {
    const key = config.keys[provider]?.trim();
    if (!key) continue;
    try {
      const answered = await callProvider(provider, withSystem, key, config.openrouterModel);
      attempts.push({ provider, ok: true });
      return {
        text: answered.text,
        provider,
        model: answered.model,
        modelLabel: modelLabelOf(answered.model),
        attempts,
      };
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

/** Persona e regras de estilo enviadas em toda conversa. */
/** Data corrente em pt-BR, injetada no prompt para o modelo não responder com corte de treino. */
export function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());
}

/** Persona e regras de estilo enviadas em toda conversa. */
export const SYSTEM_PROMPT = [
  "Você é o OmniStudio, assistente brasileiro com opinião própria, feito para resolver, não para enrolar.",
  `Hoje é ${todayLabel()}. Trate este ano como o presente: se o assunto mudou depois do seu corte de treino, diga que não sabe em vez de inventar.`,
  "Escreva como uma pessoa conversando: frases curtas, calorosas, com humor quando couber. Nunca soe como manual corporativo.",
  "Responda exatamente o que foi pedido, no tamanho necessário. Cumprimento recebe cumprimento curto, não um plano de ação.",
  "Nunca use o molde \"Diga o objetivo / o que já existe / o que impede de terminar\".",
  "Seja proativo: quando a pergunta for vaga, escolha a interpretação mais útil, entregue o resultado e ofereça o próximo passo em uma linha.",
  "Se a mensagem trouxer \"Contexto de pesquisa\" com páginas ao vivo, priorize esse conteúdo, cite a fonte pelo nome e diga a data quando importar. Se nada servir, ignore o bloco e responda pelo seu conhecimento, sem listar fontes.",
  "Interprete a intenção: gíria, abreviação, erro de digitação e frase cortada não devem ser lidos ao pé da letra. Se a pergunta real for outra, responda a real.",
  "Ao usar pesquisa, diga em uma linha o que encontrou e quantas fontes leu; nunca invente link nem data.",
  "Tabelas só quando houver dados para comparar; evite enfeite e excesso de emoji.",
  "Código sempre em bloco com a linguagem marcada, completo e executável.",
].join("\n");

/** Atalhos que não valem uma pesquisa na web (cumprimentos, agradecimentos, ok). */
export function looksLikeSearchQuery(prompt: string) {
  const text = prompt.trim().toLowerCase();
  if (text.length < 12) return false;
  if (/^(oi|ola|olá|opa|eae|e aí|bom dia|boa tarde|boa noite|tudo bem|tudo bom|blz|valeu|obrigad|ok|okay|sim|nao|não|haha|kkk)/.test(text)) return false;
  return /\?|(quem|qual|quais|quando|onde|como|quanto|quantos|quantas|por que|porque|o que|pesquis|noticia|notícia|preço|preco|versão|versao|documenta|lanç|lançamento|hoje|agora)/.test(text);
}

export async function testProvider(provider: ProviderId, key: string): Promise<ProviderTestResult> {
  if (!key.trim()) return { ok: false, status: "idle", message: "Nenhuma chave informada." };
  try {
    const answered = await callProvider(
      provider,
      [
        { role: "system", content: "Responda apenas com a palavra OK." },
        { role: "user", content: "ping" },
      ],
      key.trim(),
    );
    return {
      ok: true,
      status: "connected",
      message: `Conectado com ${modelLabelOf(answered.model)}. Resposta: ${answered.text.slice(0, 20)}`,
    };
  } catch (error) {
    if (error instanceof ProviderError) {
      if (error.kind === "limit") return { ok: false, status: "limit", message: "Limite atingido, tente mais tarde." };
      if (error.kind === "auth") return { ok: false, status: "auth", message: `Chave recusada (${error.status ?? "401"}): ${providerDetail(error.message)}` };
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
  origin: "Wikipédia" | "DuckDuckGo" | "Tavily" | "Jina";
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
  // A busca da Wikipédia é difusa e o snippet sempre cita palavras genéricas
  // ("versão", "atual"), então o título precisa citar o termo específico.
  const GENERIC = new Set([
    "versao",
    "versão",
    "atual",
    "atualmente",
    "hoje",
    "agora",
    "melhor",
    "preco",
    "preço",
    "exemplo",
    "tutorial",
    "como",
    "quando",
    "onde",
    "qual",
    "quais",
    "que",
    "fazer",
    "usar",
  ]);
  const specific = query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}.+#]/gu, ""))
    .filter((word) => word.length > 3 && !GENERIC.has(word))
    .sort((a, b) => b.length - a.length)
    .slice(0, 2);

  return (data.query?.search ?? [])
    .map((item) => ({
      title: item.title,
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s/g, "_"))}`,
      snippet: item.snippet.replace(/<[^>]+>/g, "").slice(0, 220),
      origin: "Wikipédia" as const,
    }))
    .filter((hit) => {
      if (!specific.length) return true;
      const title = hit.title.toLowerCase();
      return specific.some((term) => title.includes(term));
    });
}

/** DuckDuckGo devolve links embrulhados em `duckduckgo.com/l/?uddg=`. */
function unwrapDuckDuckGo(raw: string) {
  try {
    const parsed = new URL(raw);
    const target = parsed.searchParams.get("uddg");
    if (target) return decodeURIComponent(target);
    return raw;
  } catch {
    return raw;
  }
}

function cleanTitle(raw: string) {
  return raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchDuckDuckGo(query: string): Promise<SearchHit[]> {
  const response = await fetch(`https://r.jina.ai/https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { Accept: "text/plain" },
  });
  if (!response.ok) return [];
  const text = await response.text();
  const hits: SearchHit[] = [];
  const seen = new Set<string>();
  const lines = text.split("\n");

  for (let index = 0; index < lines.length && hits.length < 5; index += 1) {
    const line = lines[index].trim();
    // aceita `## [Título](url)`, `[Título](url)` e `1. [Título](url)`
    const match = /\[([^\]]{3,120})\]\((https?:\/\/[^\s)]+)\)/.exec(line);
    if (!match) continue;
    const title = cleanTitle(match[1]);
    if (!title || /^image/i.test(title)) continue;

    const url = unwrapDuckDuckGo(match[2]);
    if (!/^https?:\/\//.test(url) || /duckduckgo\.com|r\.jina\.ai|external-content/.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    const next = cleanTitle(lines[index + 1] ?? "");
    const snippet = next && !/\]\(http/.test(next) ? next.slice(0, 220) : "";
    hits.push({ title: title.slice(0, 90), url, snippet, origin: "DuckDuckGo" });
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

export interface ResearchPage {
  url: string;
  title?: string;
  text: string;
}

/**
 * Bloco de pesquisa entregue ao modelo: consultas realmente usadas, trechos de
 * cada fonte e o corpo lido das páginas mais relevantes, com corte por página.
 */
export function researchBlock(
  query: string,
  hits: SearchHit[],
  pages: ResearchPage[] = [],
  queries: string[] = [],
) {
  const lines = [
    `Contexto de pesquisa para "${query}".`,
    queries.length ? `Consultas usadas: ${queries.join(" | ")}` : "",
    "Leia com atenção: entenda a intenção por trás da pergunta, não só as palavras. Cruze datas com o ano atual (" +
      new Date().getFullYear() +
      ") e avise quando a informação for antiga.",
    "",
  ].filter(Boolean);

  hits.forEach((hit, index) => {
    lines.push(`${index + 1}. ${hit.title} (${hit.origin}) ${hit.url}`);
    if (hit.snippet) lines.push(`   ${hit.snippet}`);
  });

  pages.slice(0, 3).forEach((page, index) => {
    lines.push("", `Página ${index + 1}: ${page.title ? `${page.title} — ` : ""}${page.url}`, page.text.slice(0, 2600));
  });

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

const GREETING = /^(oi+|ol[áa]|opa|eae|e a[íi]|bom dia|boa tarde|boa noite|tudo bem|tudo bom|beleza|blz)(?![a-z0-9à-ú])/i;

const GREETING_REPLIES = [
  "Oi! Tudo certo por aqui. No que você quer mexer hoje?",
  "Olá! Estou pronto. Me diz o que você quer fazer que eu já começo.",
  "Oi, tudo bem? Manda a tarefa — código, texto, pesquisa ou uma ideia para destravar.",
];

/**
 * Resposta sem modelo. Curta e honesta: cumprimento recebe cumprimento,
 * pedido recebe uma pergunta objetiva em vez de um formulário de três etapas.
 */
export function localAnswer(prompt: string): string {
  const text = prompt.trim();
  if (GREETING.test(text) && text.length <= 24) {
    return GREETING_REPLIES[text.length % GREETING_REPLIES.length];
  }
  if (/^(valeu|obrigad[oa]?|brigad[oa]?|thanks)/i.test(text)) {
    return "De nada! Se precisar de mais alguma coisa, é só chamar.";
  }
  return [
    "Ainda estou sem chave de modelo, então não consigo gerar texto de verdade — o que eu faço aqui é organizar o pedido.",
    "",
    "Para eu ser útil agora: qual é o resultado final que você quer e onde ele vai rodar?",
    "",
    "Assim que você colar uma chave em Configurações (Groq ou OpenRouter), eu respondo normalmente.",
  ].join("\n");
}
