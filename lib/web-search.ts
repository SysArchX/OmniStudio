import { findLinks, readLink, webSearch, type SearchHit } from "./ai";
import { executeTool, getComposioKey } from "./composio";

export type { SearchHit };

const JINA_READER = "https://r.jina.ai/";

export interface ResearchBundle {
  hits: SearchHit[];
  page?: { url: string; text: string };
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
export async function readPage(url: string): Promise<{ url: string; text: string } | null> {
  try {
    const text = await readLink(url);
    return { url, text };
  } catch {
    return null;
  }
}

/**
 * Junta todas as camadas em paralelo: Wikipédia + DuckDuckGo + Tavily (se houver
 * chave) e a leitura profunda do link colado ou do primeiro resultado.
 * É o que alimenta o inspetor de fontes ao lado do chat.
 */
export async function gatherContext(message: string): Promise<ResearchBundle> {
  const links = findLinks(message);
  const [freeHits, boosted] = await Promise.all([searchWeb(message), searchWithComposio(message)]);

  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const hit of [...boosted, ...freeHits]) {
    if (!hit.url || seen.has(hit.url)) continue;
    seen.add(hit.url);
    hits.push(hit);
  }

  const target = links[0] ?? hits.find((hit) => !/wikipedia\.org/.test(hit.url))?.url;
  const page = target ? await readPage(target) : null;
  return { hits: hits.slice(0, 6), page: page ?? undefined };
}

export function readerUrl(url: string) {
  return `${JINA_READER}${url}`;
}

export { findLinks, readLink };
