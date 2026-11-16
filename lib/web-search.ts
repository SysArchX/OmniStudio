import { findLinks, readLink, webSearch, type SearchHit } from "./ai";

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
 * Junta busca + leitura da primeira URL citada na mensagem.
 * É o que alimenta o inspetor de contexto ao lado do chat.
 */
export async function gatherContext(message: string): Promise<ResearchBundle> {
  const links = findLinks(message);
  const [hits, page] = await Promise.all([
    searchWeb(message),
    links[0] ? readPage(links[0]) : Promise.resolve(null),
  ]);
  return { hits, page: page ?? undefined };
}

export function readerUrl(url: string) {
  return `${JINA_READER}${url}`;
}

export { findLinks, readLink };