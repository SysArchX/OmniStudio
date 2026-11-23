/**
 * Catálogo de modelos free da OpenRouter montado em tempo real.
 *
 * O catálogo antigo era uma lista fixa no código e envelheceu por completo: em
 * novembro de 2026 nenhum daqueles ids existia mais, então toda chamada caía em
 * 404 e o app respondia com o cérebro local. Aqui a lista vem de
 * `GET /api/v1/models` (público, CORS liberado) e só entram modelos com mais de
 * `MIN_PARAMS_B` bilhões de parâmetros totais.
 */

export const AUTO_MODEL = "auto";

/** Piso de capacidade: modelos menores que isso não respondem nada no app. */
export const MIN_PARAMS_B = 20;

/** Gigantes: prioridade máxima absoluta na cascata. */
export const GIANT_PARAMS_B = 100;

/** Muito grandes: entram logo depois dos gigantes, antes de qualquer menor. */
export const HIGH_PARAMS_B = 70;

export interface CatalogModel {
  id: string;
  label: string;
  paramsB: number;
  /** 1 = gigante (100B+), 2 = muito grande (70B+), 3 = o resto a partir de 20B. */
  tier: 1 | 2 | 3;
  reasoning: boolean;
  context: number;
}

/** Faixa de prioridade de um modelo pelo total de parâmetros. */
export function tierOf(paramsB: number): 1 | 2 | 3 {
  if (paramsB >= GIANT_PARAMS_B) return 1;
  if (paramsB >= HIGH_PARAMS_B) return 2;
  return 3;
}

interface RawModel {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  reasoning?: unknown;
}

/** Lista de emergência: catálogo free real de nov/2026 com 20B+ parâmetros. */
export const FALLBACK_CATALOG: CatalogModel[] = [
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Nemotron 3 Ultra",
    paramsB: 550,
    tier: 1,
    reasoning: true,
    context: 1000000,
  },
  {
    id: "baidu/ernie-5.5-flash-preview:free",
    label: "ERNIE 5.5 Flash",
    paramsB: 280,
    tier: 1,
    reasoning: true,
    context: 1024000,
  },
  {
    id: "dots-studio/dots-3-note-preview:free",
    label: "Dots3 Note",
    paramsB: 280,
    tier: 1,
    reasoning: true,
    context: 512000,
  },
  {
    id: "nvidia/nemotron-3.5-super-vl:free",
    label: "Nemotron 3.5 Super VL",
    paramsB: 120,
    tier: 1,
    reasoning: true,
    context: 1000000,
  },
  {
    id: "recursive/flint-v1.0:free",
    label: "Flint",
    paramsB: 40,
    tier: 3,
    reasoning: true,
    context: 262144,
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    paramsB: 31,
    tier: 3,
    reasoning: true,
    context: 262144,
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    label: "Nemotron 3.5 Lightning",
    paramsB: 30,
    tier: 3,
    reasoning: true,
    context: 1000000,
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    label: "Nemotron 3 Nano Omni",
    paramsB: 30,
    tier: 3,
    reasoning: true,
    context: 256000,
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    label: "Gemma 4 26B A4B",
    paramsB: 26,
    tier: 3,
    reasoning: true,
    context: 262144,
  },
];

/** Roteador da própria OpenRouter, usado só como última tentativa. */
const ROUTER_FALLBACK = "openrouter/free";

const CACHE_KEY = "omnistudio.catalog.v3";
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * Total de parâmetros em bilhões, lido do nome ou da descrição do catálogo.
 * Prefere sempre o total (MoE informa ativos e totais); "M" é contexto e nunca
 * conta como parâmetro.
 */
export function parseParamsB(raw: RawModel): number {
  const text = `${raw.name ?? ""} ${raw.description ?? ""}`.replace(/\s+/g, " ");
  const patterns: RegExp[] = [
    /([\d.]+)\s*(?:billion|B)\s+(?:total\s+)?(?:parameters|params)/i,
    /([\d.]+)\s*billion\s+total/i,
    /out of\s+([\d.]+)\s*B\s+total/i,
    /([\d.]+)\s*B\s*[-–]?\s*A[\d.]+\s*B/i,
    /([\d.]+)\s*B\s+(?:total|dense)\b/i,
    /([\d.]+)\s*B\s+(?:open|parameter|multimodal)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Math.round(parseFloat(match[1]) * 10) / 10;
  }
  const fromName = `${raw.name ?? ""} ${raw.id}`.match(/(\d+(?:\.\d+)?)\s*[bB](?=[\s\-_]|$)/);
  if (fromName) return Math.round(parseFloat(fromName[1]) * 10) / 10;
  return 0;
}

export function labelOf(raw: RawModel): string {
  const clean = (raw.name ?? raw.id)
    .replace(/\s*\(free\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const tail = clean.split(/:\s*/).pop() ?? clean;
  return tail.replace(/:free$/i, "").trim() || raw.id.split("/").pop()!.replace(/:free$/, "");
}

/**
 * Ordem de prioridade: gigantes (100B+) primeiro, depois os muito grandes
 * (70B+), e só então o melhor do resto (20B+) — dentro de cada faixa, do maior
 * para o menor, com raciocínio e contexto como desempate.
 */
export function rankCatalog(raw: RawModel[]): CatalogModel[] {
  const models = raw
    .filter((item) => item.id.endsWith(":free") && item.id !== ROUTER_FALLBACK)
    .map<CatalogModel>((item) => {
      const paramsB = parseParamsB(item);
      return {
        id: item.id,
        label: labelOf(item),
        paramsB,
        tier: tierOf(paramsB),
        reasoning: Boolean(item.reasoning),
        context: item.context_length ?? 0,
      };
    })
    .filter((item) => item.paramsB >= MIN_PARAMS_B)
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        b.paramsB - a.paramsB ||
        Number(b.reasoning) - Number(a.reasoning) ||
        b.context - a.context,
    );
  return models;
}

let memory: { at: number; models: CatalogModel[] } | null = null;

function readCache(): { at: number; models: CatalogModel[] } | null {
  if (memory) return memory;
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "null") as
      | { at: number; models: CatalogModel[] }
      | null;
    if (!parsed?.models?.length) return null;
    memory = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(models: CatalogModel[]) {
  memory = { at: Date.now(), models };
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(memory));
  } catch {
    /* cota cheia: segue só em memória */
  }
}

/** Snapshot síncrono para a primeira renderização da UI. */
export function catalogSnapshot(): CatalogModel[] {
  return readCache()?.models ?? FALLBACK_CATALOG;
}

/** Catálogo ao vivo, com cache de 6h e queda para o snapshot em caso de falha. */
export async function loadCatalog(force = false): Promise<CatalogModel[]> {
  const cached = readCache();
  if (!force && cached && Date.now() - cached.at < CACHE_TTL) return cached.models;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`catálogo respondeu ${response.status}`);
    const payload = (await response.json()) as { data?: RawModel[] };
    const models = rankCatalog(payload.data ?? []);
    if (!models.length) throw new Error("nenhum modelo free com 20B+ parâmetros");
    writeCache(models);
    return models;
  } catch {
    return cached?.models ?? FALLBACK_CATALOG;
  } finally {
    clearTimeout(timer);
  }
}

/** Modelo fixado primeiro, depois a cascata completa sem repetir. */
export async function openrouterCandidates(pinned?: string | null): Promise<string[]> {
  const catalog = await loadCatalog();
  const ranked = catalog.map((item) => item.id);
  const chosen = pinned && pinned !== AUTO_MODEL ? pinned.trim() : "";
  const ordered = chosen ? [chosen, ...ranked.filter((id) => id !== chosen)] : ranked;
  return [...ordered, ROUTER_FALLBACK];
}

/** Rótulo legível de um id, funcionando também para modelos fora do catálogo. */
export function modelLabelOf(id: string) {
  const known = catalogSnapshot().find((item) => item.id === id);
  if (known) return known.label;
  if (id === ROUTER_FALLBACK) return "OpenRouter Free";
  const base = id.split("/").pop() ?? id;
  return base
    .replace(/:free$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Parâmetros conhecidos de um id (0 quando o modelo não está no catálogo). */
export function modelParamsOf(id: string) {
  return catalogSnapshot().find((item) => item.id === id)?.paramsB ?? 0;
}
