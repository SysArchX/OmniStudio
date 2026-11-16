import { runBrain } from "./ai";
import type { AnimId, ApiKeys, EnvId, VideoScene } from "./types";

export const ENVIRONMENTS: Array<{ id: EnvId; label: string; description: string }> = [
  { id: "jungle_quicksand", label: "Selva e areia movediça", description: "Vegetação densa, neblina verde e chão instável" },
  { id: "deep_ocean", label: "Oceano profundo", description: "Água escura, feixes de luz e bolhas" },
  { id: "urban_storm", label: "Cidade na tempestade", description: "Prédios, chuva forte e relâmpagos" },
  { id: "arctic_snow", label: "Ártico", description: "Neve, gelo e vento cortante" },
  { id: "minimal_studio", label: "Estúdio minimalista", description: "Fundo neutro com luz de estúdio" },
  { id: "escritorio_tech", label: "Escritório tech", description: "Notebook, gráficos, moedas - temas de dinheiro, internet e trabalho" },
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
  if (/(escritorio|tech|notebook|computador|moeda|dinheiro|internet|trabalho)/.test(text)) return "escritorio_tech";
  return "minimal_studio";
}