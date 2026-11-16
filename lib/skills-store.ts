import { SKILL_CATALOG, SKILL_CATEGORIES, type CatalogSkill } from "./skills-catalog";
import type { SkillDefinition } from "./types";

export { SKILL_CATEGORIES, SKILL_CATALOG };
export type { CatalogSkill };

const STORAGE_KEY = "omnistudio.skills.v1";

export interface InstalledSkill {
  name: string;
  title: string;
  category: string;
  installedAt: number;
}

function readInstalled(): InstalledSkill[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InstalledSkill[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInstalled(skills: InstalledSkill[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  } catch {
    /* quota cheia */
  }
}

export function installedSkills(): InstalledSkill[] {
  return readInstalled();
}

export function isInstalled(name: string) {
  return readInstalled().some((skill) => skill.name === name);
}

/** Instala (ou remove) uma skill da loja. A lista também vai para a conta via Configurações. */
export function toggleSkill(skill: CatalogSkill): InstalledSkill[] {
  const current = readInstalled();
  const exists = current.some((item) => item.name === skill.name);
  const next = exists
    ? current.filter((item) => item.name !== skill.name)
    : [...current, { name: skill.name, title: skill.title, category: skill.category, installedAt: Date.now() }];
  writeInstalled(next);
  return next;
}

export function filterCatalog(options: { query?: string; category?: string | null } = {}): CatalogSkill[] {
  const query = (options.query ?? "").trim().toLowerCase();
  return SKILL_CATALOG.filter((skill) => {
    if (options.category && skill.category !== options.category) return false;
    if (!query) return true;
    return `${skill.name} ${skill.title} ${skill.description} ${skill.category}`.toLowerCase().includes(query);
  });
}

/** Converte as skills instaladas em definições que o modo agente entende. */
export function installedDefinitions(): SkillDefinition[] {
  const installed = new Set(readInstalled().map((skill) => skill.name));
  return SKILL_CATALOG.filter((skill) => installed.has(skill.name)).map((skill) => ({
    name: skill.name,
    description: skill.description,
    instructions: skill.markdown,
    source: "loja OmniStudio",
  }));
}

export function downloadSkillMarkdown(skill: CatalogSkill) {
  const blob = new Blob([skill.markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${skill.name}.SKILL.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
