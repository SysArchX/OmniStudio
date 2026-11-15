import { runBrain } from "./ai";
import type { AnimId, ApiKeys, EnvId, VideoScene } from "./types";

export const ENVIRONMENTS: Array<{ id: EnvId; label: string; description: string }> = [
  { id: "jungle_quicksand", label: "Selva e areia movediça", description: "Vegetação densa, neblina verde e chão instável" },
  { id: "deep_ocean", label: "Oceano profundo", description: "Água escura, feixes de luz e bolhas" },
  { id: "urban_storm", label: "Cidade na tempestade", description: "Prédios, chuva forte e relâmpagos" },
  { id: "arctic_snow", label: "Ártico", description: "Neve, gelo e vento cortante" },
  { id: "minimal_studio", label: "Estúdio minimalista", description: "Fundo neutro com luz de estúdio" },
];

export const ANIMATIONS: Array<{ id: AnimId; label: string }> = [
  { id: "running_panic", label: "Corrida em pânico" },
  { id: "sinking_struggle", label: "Afundando e lutando" },
  { id: "floating_calm", label: "Flutuando com calma" },
  { id: "curled_protect", label: "Protegido, encolhido" },
  { id: "impact_xray", label: "Impacto (raio-x)" },
  { id: "victory_safe", label: "Vitória, a salvo" },
];

export function durationFor(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(5.2, Math.max(2.3, words / 3.1 + 0.6));
}

export function mapEnvironment(topic: string): EnvId {
  const text = topic.toLowerCase();
  if (/(tubar|mar|oceano|agua|água|afog|praia|mergulh|barco|peixe)/.test(text)) return "deep_ocean";
  if (/(selva|floresta|areia|deserto|pantano|pântano|jiboia|cobra|onca|onça|quicksand)/.test(text)) return "jungle_quicksand";
  if (/(cidade|tempestade|chuva|raio|tornado|predio|prédio|rua|carro|metro|metrô)/.test(text)) return "urban_storm";
  if (/(neve|gelo|frio|artico|ártico|montanha|avalanche|urso)/.test(text)) return "arctic_snow";
  return "minimal_studio";
}

function pickAnimation(index: number, total: number): AnimId {
  if (index === 0) return "running_panic";
  if (index === total - 1) return "victory_safe";
  const middle: AnimId[] = ["sinking_struggle", "floating_calm", "curled_protect", "impact_xray"];
  return middle[(index - 1) % middle.length];
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const SHARK_LINES = [
  "Se um tubarão te atacar, não nade como um peixe.",
  "Ele sente o pânico na água antes de te ver.",
  "Vire de frente e mantenha o olho no animal.",
  "Empurre as guelras e recue devagar.",
  "Volte para o barco. Nunca para a praia.",
];

export function inferScenes(topic: string): Array<{ text: string; env: EnvId; anim: AnimId }> {
  const clean = topic.trim() || "sobreviver a uma emergência";
  const env = mapEnvironment(clean);
  const short = clean.replace(/^(como|o que fazer para|o que fazer quando)\s+/i, "");
  let lines: string[];

  if (/(tubar)/i.test(clean)) {
    lines = SHARK_LINES;
  } else if (/(afog|mar|agua|água|correnteza)/i.test(clean)) {
    lines = [
      `Se você cair na água, ${short} muda em segundos.`,
      "A correnteza puxa para o lado, não para baixo.",
      "Nade paralelo à praia até sair do fluxo.",
      "Levante o braço e economize energia.",
      "Saia pela diagonal. Nunca contra a correnteza.",
    ];
  } else if (/(deserto|areia|calor|sede)/i.test(clean)) {
    lines = [
      `No calor extremo, ${short} é uma corrida contra o tempo.`,
      "O corpo perde água mais rápido do que você sente.",
      "Ande à noite e cavando sombra durante o dia.",
      "Cubra a cabeça. O sol direto acelera tudo.",
      "Água primeiro. Comida depois do terceiro dia.",
    ];
  } else if (/(neve|gelo|frio|avalanche)/i.test(clean)) {
    lines = [
      `Com frio extremo, ${short} depende de uma decisão.`,
      "Vento e umidade roubam calor mais que a neve.",
      "Camadas secas valem mais que uma jaqueta grossa.",
      "Mantenha o núcleo aquecido, mãos e pés depois.",
      "Saia do vento antes de tentar aquecer.",
    ];
  } else {
    lines = [
      `${capitalize(short)}: o erro que quase todo mundo comete.`,
      "O cenário muda tudo. Leia antes de agir.",
      "Mantenha a calma. O pânico decide errado por você.",
      "Um passo por vez, sem improvisar.",
      "Agora você sabe o que fazer. Salva pra não esquecer.",
    ];
  }

  const total = lines.length;
  return lines.map((text, index) => ({ text, env, anim: pickAnimation(index, total) }));
}

function parseScenes(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const data = JSON.parse(raw.slice(start, end + 1)) as {
      title?: string;
      scenes?: Array<{ text?: string; env?: string; anim?: string }>;
    };
    if (!data.scenes?.length) return null;
    return data;
  } catch {
    return null;
  }
}

const ENV_IDS = new Set(ENVIRONMENTS.map((env) => env.id));
const ANIM_IDS = new Set(ANIMATIONS.map((anim) => anim.id));

export interface GeneratedScript {
  title: string;
  scenes: VideoScene[];
  provider: string;
}

export async function generateVideoScript(
  topic: string,
  keys: ApiKeys,
  fallback: boolean,
): Promise<GeneratedScript> {
  const inferred = inferScenes(topic);

  try {
    const result = await runBrain(
      [
        {
          role: "system",
          content: [
            "Você escreve roteiros de vídeos verticais de sobrevivência e curiosidades para TikTok, em português do Brasil.",
            "Responda SOMENTE com JSON válido, sem markdown, no formato:",
            '{"title":"titulo curto","scenes":[{"text":"frase curta","env":"deep_ocean","anim":"sinking_struggle"}]}',
            "Regras: 4 ou 5 cenas; cada frase com no máximo 12 palavras; a primeira cena é um gancho de impacto; a última é uma chamada para ação curta.",
            "env deve ser um destes: jungle_quicksand, deep_ocean, urban_storm, arctic_snow, minimal_studio.",
            "anim deve ser um destes: running_panic, sinking_struggle, floating_calm, curled_protect, impact_xray, victory_safe.",
            "Tom direto, sem clichês de marketing e sem emojis.",
          ].join(" "),
        },
        { role: "user", content: `Tema do vídeo: ${topic}` },
      ],
      { keys, fallback },
    );

    const parsed = parseScenes(result.text);
    if (parsed?.scenes?.length) {
      const scenes: VideoScene[] = parsed.scenes.slice(0, 6).map((scene, index) => {
        const text = (scene.text ?? "").trim() || inferred[index % inferred.length].text;
        const env = ENV_IDS.has(scene.env as EnvId) ? (scene.env as EnvId) : inferred[index % inferred.length].env;
        const anim = ANIM_IDS.has(scene.anim as AnimId)
          ? (scene.anim as AnimId)
          : pickAnimation(index, parsed.scenes!.length);
        return {
          id: Math.random().toString(36).slice(2, 10),
          text,
          env,
          anim,
          duration: durationFor(text),
        };
      });
      return {
        title: (parsed.title ?? topic).slice(0, 70),
        scenes,
        provider: result.provider,
      };
    }
  } catch {
    /* cai para o roteiro local */
  }

  return {
    title: topic.slice(0, 70),
    scenes: inferred.map((scene) => ({
      id: Math.random().toString(36).slice(2, 10),
      text: scene.text,
      env: scene.env,
      anim: scene.anim,
      duration: durationFor(scene.text),
    })),
    provider: "local",
  };
}
