import { findLinks, readLink, webSearch, type ResearchPage, type SearchHit } from "./ai";
import { openrouterCandidates } from "./ai";
import { executeTool, getComposioKey } from "./composio";

export type { SearchHit, ResearchPage };

const JINA_READER = "https://r.jina.ai/";
const YEAR = new Date().getFullYear();

/** Palavras de conversa que não ajudam nenhuma busca. */
const FILLER =
  /^(ei+|oi+|ol[áa]|opa|eae|e a[íi]|bom dia|boa tarde|boa noite|me (fala|diz|ajuda|explica)|por favor|pfv|pf|tipo assim|ent[ãa]o|agora|na moral|s[ée]rio|na boa|mano|cara|bro|amigo|amiga|entendeu|saca)\b[\s,.:!?–-]*/gi;

/** Abreviações comuns na fala brasileira. */
const ABBREVIATIONS: Record<string, string> = {
  js: "JavaScript",
  ts: "TypeScript",
  py: "Python",
  k8s: "Kubernetes",
  ia: "inteligência artificial",
  ai: "artificial intelligence",
  db: "banco de dados",
  bd: "banco de dados",
  api: "API",
  llm: "large language model",
  spa: "single page application",
  ssr: "server side rendering",
  cdn: "content delivery network",
  vps: "servidor virtual",
  "e-mail": "email",
  tbm: "também",
  q: "que",
};

/** Tradução técnica para a variante em inglês da consulta. */
const TO_ENGLISH: Record<string, string> = {
  como: "how to",
  fazer: "do",
  instalar: "install",
  instalação: "installation",
  configurar: "configure",
  configuração: "configuration",
  erro: "error",
  documentação: "documentation",
  exemplo: "example",
  tutorial: "tutorial",
  preço: "price",
  notícias: "news",
  lançamento: "release",
  versão: "version",
  melhor: "best",
  diferença: "difference",
  entre: "between",
  usar: "use",
  criar: "create",
  corrigir: "fix",
  problema: "problem",
  função: "function",
  arquivo: "file",
  chave: "key",
  banco: "database",
  dados: "data",
  servidor: "server",
  app: "app",
  aplicativo: "application",
  site: "website",
  busca: "search",
  pesquisa: "research",
  hoje: "today",
  grátis: "free",
  gratuito: "free",
};

const GENERIC_WORDS = new Set([
  "qual",
  "quais",
  "quando",
  "onde",
  "como",
  "quanto",
  "quantos",
  "quantas",
  "porque",
  "por",
  "que",
  "o",
  "a",
  "os",
  "as",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "um",
  "uma",
  "e",
  "é",
  "meu",
  "minha",
  "seu",
  "sua",
  "isso",
  "esse",
  "essa",
  "este",
  "esta",
  "aquilo",
  "sobre",
  "para",
  "pra",
  "com",
  "sem",
  "mais",
  "menos",
  "melhor",
  "pior",
  "tem",
  "ter",
  "faz",
  "fazer",
]);

export interface ResearchBundle {
  hits: SearchHit[];
  /** Primeira página lida, mantida por compatibilidade com o inspetor. */
  page?: ResearchPage;
  pages: ResearchPage[];
  /** Consultas realmente enviadas à web. */
  queries: string[];
}

/** Limpa saudação, abreviação e pontuação sem destruir o sentido. */
export function normalizeQuery(raw: string) {
  let text = raw.trim().replace(/\s+/g, " ");
  // tira cumprimento repetido no começo, no máximo duas vezes
  for (let pass = 0; pass < 2; pass += 1) {
    const next = text.replace(FILLER, "").trim();
    if (next === text) break;
    text = next;
  }
  text = text.replace(/^[,\s.:;!?-]+/, "").replace(/\s+/g, " ");
  text = text.replace(/[?!]+$/g, "").trim();
  return text.replace(/\b([a-z]{1,5})\b/gi, (word) => ABBREVIATIONS[word.toLowerCase()] ?? word);
}

function keywords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+#.]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !GENERIC_WORDS.has(word));
}

function toEnglish(text: string) {
  const words = text.split(/\s+/).map((word) => {
    const key = word.toLowerCase();
    return TO_ENGLISH[key] ?? word;
  });
  const joined = words.join(" ");
  const changed = words.some((word, index) => word !== text.split(/\s+/)[index]);
  return changed ? joined : "";
}

/** Detecta pergunta curta que depende do turno anterior ("e o preço?"). */
function withContext(prompt: string, history?: string[]) {
  if (!history?.length) return prompt;
  const short = keywords(prompt).length <= 2;
  const pronoun = /\b(disso|dele|dela|nisso|nesse|nessa|aquele|aquela|ele|ela|isso|também|tambem)\b/i.test(prompt);
  if (!short && !pronoun) return prompt;
  const previous = normalizeQuery(history[history.length - 1] ?? "");
  return `${previous} ${prompt}`.trim();
}

/**
 * Expansão de consultas: heurística sempre pronta, refinada por modelo quando
 * existe chave da OpenRouter. Nunca devolve a mensagem crua do usuário sozinha.
 */
export async function planQueries(
  prompt: string,
  options: { history?: string[]; openrouterKey?: string } = {},
): Promise<string[]> {
  const contextual = withContext(prompt, options.history);
  const base = normalizeQuery(contextual);
  if (!base) return [];

  const terms = keywords(base);
  const topic = terms.slice(0, 6).join(" ");
  const englishTerms = keywords(toEnglish(topic) || "");
  const english = englishTerms.length ? englishTerms.slice(0, 6).join(" ") : toEnglish(base);

  // Consultas curtas por palavra-chave rendem mais que a frase inteira.
  const heuristic = [
    topic ? `${topic} ${YEAR}` : "",
    english ? `${english} ${YEAR}` : "",
    topic && english ? `${topic} ${english}` : base,
    base,
  ].filter((query) => query && query.length > 2);

  if (options.openrouterKey?.trim()) {
    const expanded = await expandWithModel(base, options.openrouterKey.trim());
    if (expanded.length) {
      return Array.from(new Set([...expanded, base])).slice(0, 3);
    }
  }

  return Array.from(new Set(heuristic)).slice(0, 3);
}

/** Pede 3 consultas curtas ao modelo mais barato disponível; falha em silêncio. */
async function expandWithModel(prompt: string, key: string): Promise<string[]> {
  const system = [
    "Você transforma a mensagem de um usuário em consultas de busca.",
    "Devolva exatamente 3 linhas, cada uma uma consulta curta (máx. 8 palavras).",
    "Regras: entenda a intenção real; ignore gíria e conversa fiada; expanda abreviações;",
    "escreva 1 consulta em português e 1 em inglês técnico quando fizer sentido;",
    `uma delas deve buscar informação atual de ${YEAR}. Sem numeração, sem explicação.`,
  ].join(" ");

  for (const model of openrouterCandidates(null).slice(0, 3)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://github.com/SysArchX",
          "X-Title": "OmniStudio",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt.slice(0, 600) },
          ],
          temperature: 0.2,
          max_tokens: 120,
        }),
        signal: controller.signal,
      });
      if (!response.ok) continue;
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content ?? "";
      const queries = text
        .split("\n")
        .map((line) => line.replace(/^[\d.\-*\s]+/, "").trim())
        .filter((line) => line.length > 3 && line.length < 120)
        .slice(0, 3);
      if (queries.length) return queries;
    } catch {
      /* modelo indisponível: cai na heurística */
    } finally {
      clearTimeout(timer);
    }
  }
  return [];
}

/** Busca ao vivo: Wikipédia (pt/en) + DuckDuckGo via Jina Reader. */
export async function searchWeb(query: string): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  try {
    return await webSearch(trimmed);
  } catch {
    return [];
  }
}

/** Jina Search: devolve markdown com links; sem chave pode responder 401. */
async function searchJina(query: string): Promise<SearchHit[]> {
  const endpoints = [
    `https://s.jina.ai/${encodeURIComponent(query)}`,
    `https://r.jina.ai/https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  ];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { headers: { Accept: "text/plain" } });
      if (!response.ok) continue;
      const text = await response.text();
      const hits: SearchHit[] = [];
      for (const line of text.split("\n")) {
        const match = /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/.exec(line.trim());
        if (!match) continue;
        const url = match[2];
        if (/jina\.ai|bing\.com|duckduckgo\.com/.test(url)) continue;
        hits.push({ title: match[1].slice(0, 90), url, snippet: "", origin: "Jina" });
        if (hits.length >= 4) break;
      }
      if (hits.length) return hits;
    } catch {
      /* tenta o próximo endpoint */
    }
  }
  return [];
}

interface TavilyItem {
  title?: string;
  url?: string;
  content?: string;
}

/**
 * Camada extra de busca: quando a chave pessoal da Composio existe, o Tavily
 * entra em paralelo com as fontes gratuitas e devolve trechos já extraídos.
 */
export async function searchWithComposio(query: string): Promise<SearchHit[]> {
  if (!getComposioKey()) return [];
  const slugs = ["TAVILY_TAVILY_SEARCH", "TAVILY_SEARCH"];
  for (const slug of slugs) {
    try {
      const response = (await executeTool(slug, { query, max_results: 4 }, "omnistudio")) as {
        data?: { results?: TavilyItem[] };
        results?: TavilyItem[];
      };
      const items = response?.data?.results ?? response?.results ?? [];
      const hits = items
        .filter((item) => item.url)
        .map((item) => ({
          title: (item.title ?? item.url ?? "").slice(0, 90),
          url: item.url as string,
          snippet: (item.content ?? "").replace(/\s+/g, " ").slice(0, 240),
          origin: "Tavily" as const,
        }));
      if (hits.length) return hits;
    } catch {
      /* toolkit não conectado ou slug diferente */
    }
  }
  return [];
}

/** Lê uma página diretamente pelo Jina Reader. */
export async function readPage(url: string, limit = 3200): Promise<ResearchPage | null> {
  try {
    const text = await readLink(url);
    return { url, text: text.slice(0, limit) };
  } catch {
    return null;
  }
}

/** Descarta resultado que não tem nenhuma palavra-chave da consulta. */
function relevant(hits: SearchHit[], queries: string[]) {
  const terms = new Set(
    queries
      .flatMap((query) => keywords(query))
      .filter((word) => word.length > 2 && word !== String(YEAR)),
  );
  if (!terms.size) return hits;
  const matched = hits.filter((hit) => {
    const haystack = `${hit.title} ${hit.snippet} ${hit.url}`.toLowerCase();
    for (const term of terms) {
      if (haystack.includes(term)) return true;
    }
    return false;
  });
  // se o filtro for agressivo demais, mantém o que veio das fontes com snippet
  return matched.length >= 3 ? matched : hits.filter((hit) => hit.snippet.trim().length > 0);
}

function dedupe(hits: SearchHit[]) {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const hit of hits) {
    if (!hit.url) continue;
    const key = hit.url.replace(/[#?].*$/, "").replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

/** Páginas com melhor chance de conter resposta real: documentação e artigos. */
function pickPages(hits: SearchHit[], links: string[]) {
  if (links.length) return links.slice(0, 3);
  const good = hits.filter(
    (hit) => !/wikipedia\.org/.test(hit.url) && /^https?:/.test(hit.url) && hit.snippet.trim().length > 0,
  );
  const byDomain = new Map<string, string>();
  for (const hit of good) {
    try {
      const host = new URL(hit.url).hostname.replace(/^www\./, "");
      if (!byDomain.has(host)) byDomain.set(host, hit.url);
    } catch {
      /* url inválida */
    }
    if (byDomain.size >= 3) break;
  }
  return Array.from(byDomain.values());
}

/**
 * Junta todas as camadas: expande a intenção em 3 consultas, dispara tudo em
 * paralelo (Wikipédia pt/en, DuckDuckGo, Jina, Tavily) e lê de verdade as 2–3
 * páginas mais promissoras, com corte de contexto.
 */
export async function gatherContext(
  message: string,
  options: { history?: string[]; openrouterKey?: string; maxPages?: number } = {},
): Promise<ResearchBundle> {
  const links = findLinks(message);
  const queries = await planQueries(message, options);
  if (!queries.length) return { hits: [], pages: [], queries: [] };

  const [freeResults, composioResults, jinaResults] = await Promise.all([
    Promise.all(queries.map((query) => searchWeb(query))),
    Promise.all(queries.slice(0, 2).map((query) => searchWithComposio(query))),
    Promise.all(queries.slice(0, 2).map((query) => searchJina(query))),
  ]);

  const ordered = dedupe([
    ...composioResults.flat(),
    ...freeResults.flat(),
    ...jinaResults.flat(),
  ]);
  const merged = relevant(ordered, queries).slice(0, 10);

  const targets = pickPages(merged, links).slice(0, options.maxPages ?? 3);
  const pages = (await Promise.all(targets.map((url) => readPage(url)))).filter(
    (page): page is ResearchPage => Boolean(page && page.text.trim().length > 200),
  );

  return { hits: merged.slice(0, 8), pages, page: pages[0], queries };
}

export function readerUrl(url: string) {
  return `${JINA_READER}${url}`;
}

export { findLinks, readLink };
