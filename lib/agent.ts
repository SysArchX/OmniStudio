import type { AgentLogEntry, AgentStep, NativeBridge, SkillDefinition } from "./types";
import { runBrain, type BrainConfig, type BrainMessage } from "./ai";
import { gatherContext } from "./web-search";

interface FsFileHandle {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
}

interface FsDirHandle {
  kind: "directory";
  name: string;
  entries: () => AsyncIterableIterator<[string, FsFileHandle | FsDirHandle]>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FsFileHandle>;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FsDirHandle>;
}

interface PickerWindow extends Window {
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FsDirHandle>;
  omniNative?: NativeBridge;
}

let workspace: FsDirHandle | null = null;
let nativeRoot: string | null = null;

export function fsAccessSupported() {
  return typeof window !== "undefined" && typeof (window as PickerWindow).showDirectoryPicker === "function";
}

export function currentWorkspaceName() {
  if (nativeRoot) return nativeRoot;
  return workspace?.name ?? null;
}

/**
 * Escolhe a pasta de trabalho. No app desktop usa o seletor nativo do
 * Electron (qualquer caminho, com escrita real); no navegador usa a
 * File System Access API.
 */
export async function pickWorkspace(bridge?: NativeBridge | null): Promise<string | null> {
  if (bridge?.chooseWorkspace) {
    const info = await bridge.chooseWorkspace();
    nativeRoot = info.root;
    return info.root;
  }
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) return null;
  const handle = await picker({ mode: "readwrite" });
  workspace = handle;
  return handle.name;
}

/** Raiz real usada pelo agente no app instalado. */
export async function resolveNativeRoot(bridge?: NativeBridge | null): Promise<string | null> {
  if (!bridge?.getWorkspace) return null;
  if (nativeRoot) return nativeRoot;
  const info = await bridge.getWorkspace();
  nativeRoot = info.root;
  return info.root;
}

function safeSegments(path: string) {
  const parts = path.split("/").filter((part) => part && part !== ".");
  if (parts.some((part) => part === "..")) throw new Error("Caminho fora da pasta escolhida.");
  return parts;
}

async function resolveDir(parts: string[], create = false) {
  if (!workspace) throw new Error("Escolha uma pasta de trabalho primeiro.");
  let dir = workspace;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create });
  }
  return dir;
}

async function readWorkspaceFile(path: string) {
  const parts = safeSegments(path);
  const name = parts.pop();
  if (!name) throw new Error("Informe o caminho do arquivo.");
  const dir = await resolveDir(parts);
  const handle = await dir.getFileHandle(name);
  const file = await handle.getFile();
  return file.text();
}

async function writeWorkspaceFile(path: string, content: string) {
  const parts = safeSegments(path);
  const name = parts.pop();
  if (!name) throw new Error("Informe o caminho do arquivo.");
  const dir = await resolveDir(parts, true);
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export interface TreeEntry {
  name: string;
  path: string;
  isDir: boolean;
}

export async function listTree(path = "", depth = 2): Promise<TreeEntry[]> {
  if (!workspace) return [];
  const root = await resolveDir(path ? safeSegments(path) : []);
  const result: TreeEntry[] = [];
  for await (const [name, handle] of root.entries()) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const childPath = path ? `${path}/${name}` : name;
    result.push({ name, path: childPath, isDir: handle.kind === "directory" });
    if (handle.kind === "directory" && depth > 1) {
      try {
        result.push(...(await listTree(childPath, depth - 1)));
      } catch {
        /* pasta sem permissão */
      }
    }
  }
  return result.slice(0, 400);
}

export function parseSkillFile(fileName: string, raw: string, source: string): SkillDefinition | null {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw.replace(/\r\n/g, "\n"));
  const body = match ? match[2] : raw;
  const meta = match ? match[1] : "";
  const name = /name:\s*(.+)/.exec(meta)?.[1]?.trim() || fileName.replace(/\.md$/i, "");
  const description = /description:\s*(.+)/.exec(meta)?.[1]?.trim() || body.split("\n").find(Boolean) || "";
  if (!body.trim()) return null;
  return { name, description: description.slice(0, 400), instructions: body.trim().slice(0, 12000), source };
}

export async function readSkillsFromWorkspace(): Promise<SkillDefinition[]> {
  if (!workspace) return [];
  try {
    const skillsDir = await workspace.getDirectoryHandle(".agents").then((dir) => dir.getDirectoryHandle("skills"));
    const skills: SkillDefinition[] = [];
    for await (const [name, handle] of skillsDir.entries()) {
      if (handle.kind !== "directory") continue;
      const file = await handle.getFileHandle("SKILL.md");
      const parsed = parseSkillFile(name, await (await file.getFile()).text(), `pasta .agents/skills/${name}`);
      if (parsed) skills.push(parsed);
    }
    return skills;
  } catch {
    return [];
  }
}

/**
 * Skills globais do projeto: `.agents/skills`, `.claude/skills`, `.codex/skills`,
 * `.opencode/skills`, `.claude/commands`, além de AGENTS.md e CLAUDE.md.
 * É o mesmo layout que Claude Code, Codex, Freebuff e OpenCode entendem.
 */
export async function loadProjectSkills(bridge?: NativeBridge | null): Promise<SkillDefinition[]> {
  if (bridge?.readSkills) {
    try {
      return await bridge.readSkills();
    } catch {
      return [];
    }
  }
  return readSkillsFromWorkspace();
}

const TOOL_HELP = [
  '{"tool":"plan","steps":[{"title":"..."}]}',
  '{"tool":"list_dir","path":"."}',
  '{"tool":"read_file","path":"src/app.ts"}',
  '{"tool":"write_file","path":"src/app.ts","content":"..."}',
  '{"tool":"edit_file","path":"src/app.ts","find":"trecho exato","replace":"novo trecho"}',
  '{"tool":"run_command","command":"npm run build"}',
  '{"tool":"web_search","query":"preço do dólar hoje"}',
  '{"tool":"finish","answer":"resumo do que foi feito"}',
];

function systemPrompt(skills: SkillDefinition[], root: string, native: boolean) {
  const skillBlock = skills.length
    ? skills
        .map((skill) => `### Skill: ${skill.name} (${skill.source})\n${skill.description}\n${skill.instructions}`)
        .join("\n\n")
    : "Nenhuma skill carregada.";

  return [
    "Você é o agente do OmniStudio. Trabalha em português do Brasil, executa o pedido de verdade e não para no meio.",
    `Raiz de trabalho: ${root}. Todos os caminhos são relativos a ela.`,
    native
      ? "Você tem acesso real ao sistema de arquivos e ao terminal desta máquina, com escrita e execução de comandos."
      : "Você tem acesso à pasta escolhida pelo usuário no navegador (sem terminal).",
    "",
    "Responda SEMPRE com um único objeto JSON em uma linha, sem markdown, em uma destas formas:",
    ...TOOL_HELP,
    "",
    "Regras:",
    "- Trabalhe até concluir a tarefa. Não existe limite de passos: encadeie quantas ações forem necessárias.",
    "- Leia antes de escrever. Se um comando falhar, leia o erro, corrija a causa e rode de novo.",
    "- Use caminhos relativos e nunca `..`.",
    "- Quando precisar de informação atual, use web_search antes de inventar.",
    "- Só chame finish quando a tarefa estiver realmente concluída, com um resumo curto e honesto do que mudou.",
    "- Se algo continuar impossível, diga exatamente o que bloqueou e o que você tentou.",
    "",
    "Skills disponíveis:",
    skillBlock,
  ].join("\n");
}

function extractAction(text: string) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface AgentRunOptions {
  task: string;
  bridge: NativeBridge | null;
  rootLabel: string;
  skills: SkillDefinition[];
  brain: BrainConfig;
  isCancelled?: () => boolean;
}

export interface AgentRunResult {
  ok: boolean;
  answer: string;
}

/** Sem teto de 14 ações: 600 passos e 45 minutos é só uma trava de segurança. */
const MAX_ACTIONS = 600;
const MAX_RUNTIME_MS = 45 * 60 * 1000;

export async function runAgentTask(
  options: AgentRunOptions,
  events: {
    onSteps: (steps: AgentStep[]) => void;
    onLog: (entry: AgentLogEntry) => void;
  },
): Promise<AgentRunResult> {
  const { task, bridge, rootLabel, skills, brain } = options;
  const cancelled = options.isCancelled ?? (() => false);
  const steps: AgentStep[] = [];
  const log = (kind: AgentLogEntry["kind"], text: string) =>
    events.onLog({ id: crypto.randomUUID(), kind, text, at: Date.now() });

  const history: BrainMessage[] = [
    { role: "system", content: systemPrompt(skills, rootLabel, Boolean(bridge)) },
    { role: "user", content: task },
  ];

  let answer = "";
  const startedAt = Date.now();

  for (let round = 0; round < MAX_ACTIONS; round += 1) {
    if (cancelled()) {
      const message = "Execução interrompida por você.";
      log("error", message);
      return { ok: false, answer: message };
    }
    if (Date.now() - startedAt > MAX_RUNTIME_MS) {
      answer = "Parei por tempo (45 min de execução). O que já foi feito está na pasta; peça para continuar de onde parou.";
      log("answer", answer);
      return { ok: false, answer };
    }

    const result = await runBrain(history, brain);
    if (result.thinking) log("think", result.thinking.slice(0, 4000));
    if (result.provider === "local") {
      const message =
        "Nenhum provedor configurado. Configure OpenRouter, Claude, OpenAI ou um endpoint compatível em Configurações para o agente executar.";
      log("error", message);
      return { ok: false, answer: message };
    }

    const action = extractAction(result.text);
    if (!action || typeof action.tool !== "string") {
      answer = result.text.trim();
      log("answer", answer);
      events.onSteps(steps.map((step) => ({ ...step, status: "done" as const })));
      return { ok: true, answer };
    }

    const tool = action.tool;
    log("tool", `${tool} ${action.path ?? action.command ?? action.query ?? ""}`.trim());
    let observation = "";

    try {
      if (tool === "plan") {
        const rawSteps = Array.isArray(action.steps) ? action.steps : [];
        steps.length = 0;
        rawSteps.slice(0, 20).forEach((item, index) => {
          const title =
            typeof item === "string"
              ? item
              : typeof item === "object" && item && "title" in item
                ? String((item as { title?: unknown }).title ?? `Etapa ${index + 1}`)
                : `Etapa ${index + 1}`;
          steps.push({ id: `step-${index}`, title, status: "pending" });
        });
        events.onSteps([...steps]);
        log("plan", `Plano com ${steps.length} etapas.`);
        observation = "Plano registrado.";
      } else if (tool === "list_dir") {
        const path = String(action.path ?? "");
        if (path.includes("..")) throw new Error("Caminho fora da raiz de trabalho.");
        if (bridge) {
          const result = await bridge.listDir(path || ".");
          observation = result.map((entry) => `${entry.isDir ? "[dir]" : "[file]"} ${entry.name}`).join("\n") || "Pasta vazia.";
        } else {
          const tree = await listTree(path, 2);
          observation = tree.map((entry) => `${entry.isDir ? "[dir]" : "[file]"} ${entry.path}`).join("\n") || "Pasta vazia.";
        }
      } else if (tool === "read_file") {
        const path = String(action.path ?? "");
        if (path.includes("..")) throw new Error("Caminho fora da raiz de trabalho.");
        const content = bridge ? await bridge.readFile(path) : await readWorkspaceFile(path);
        observation = content.slice(0, 12000);
      } else if (tool === "write_file") {
        const path = String(action.path ?? "");
        if (path.includes("..")) throw new Error("Caminho fora da raiz de trabalho.");
        const content = String(action.content ?? "");
        if (bridge) {
          const ok = await bridge.writeFile(path, content);
          if (!ok) throw new Error("O sistema recusou a gravação nesse caminho.");
        } else await writeWorkspaceFile(path, content);
        observation = `Arquivo ${path} gravado (${content.length} caracteres).`;
      } else if (tool === "edit_file") {
        const path = String(action.path ?? "");
        if (path.includes("..")) throw new Error("Caminho fora da raiz de trabalho.");
        const find = String(action.find ?? "");
        const replace = String(action.replace ?? "");
        if (!find) throw new Error("Informe o trecho exato em `find`.");
        const current = bridge ? await bridge.readFile(path) : await readWorkspaceFile(path);
        if (!current.includes(find)) throw new Error(`Trecho não encontrado em ${path}. Leia o arquivo de novo.`);
        const next = current.replace(find, replace);
        if (bridge) {
          const ok = await bridge.writeFile(path, next);
          if (!ok) throw new Error("O sistema recusou a gravação nesse caminho.");
        } else await writeWorkspaceFile(path, next);
        observation = `${path} atualizado.`;
      } else if (tool === "run_command") {
        if (!bridge) throw new Error("Terminal disponível só no app desktop.");
        const command = String(action.command ?? "");
        const result = await bridge.runCommand(command);
        observation = [`exit=${result.code}`, result.stdout.slice(0, 8000), result.stderr.slice(0, 4000)]
          .filter(Boolean)
          .join("\n");
      } else if (tool === "web_search") {
        const query = String(action.query ?? action.q ?? "");
        if (!query.trim()) throw new Error("Informe a busca em `query`.");
        const bundle = await gatherContext(query, { openrouterKey: brain.keys.openrouter });
        observation = bundle.hits
          .slice(0, 6)
          .map((hit, index) => `${index + 1}. ${hit.title} — ${hit.url}\n${hit.snippet}`)
          .join("\n\n");
        if (bundle.pages.length) {
          observation +=
            "\n\n--- páginas ---\n" +
            bundle.pages
              .slice(0, 3)
              .map((page) => `# ${page.title} (${page.url})\n${page.text.slice(0, 3000)}`)
              .join("\n\n");
        }
        if (!observation.trim()) observation = "A busca não devolveu resultados.";
      } else if (tool === "finish") {
        answer = String(action.answer ?? "Tarefa concluída.");
        log("answer", answer);
        events.onSteps(steps.map((step) => ({ ...step, status: "done" as const })));
        return { ok: true, answer };
      } else {
        observation = `Ferramenta desconhecida: ${tool}`;
      }
    } catch (error) {
      observation = `Erro: ${error instanceof Error ? error.message : "falha desconhecida"}`;
      log("error", observation);
    }

    if (steps.length) {
      const next = steps.find((step) => step.status === "pending");
      if (next) {
        next.status = "done";
        events.onSteps([...steps]);
      }
    }

    log("result", observation.slice(0, 1200));
    history.push({ role: "assistant", content: result.text });
    history.push({ role: "user", content: `Resultado da ferramenta ${tool}:\n${observation.slice(0, 8000)}` });
  }

  answer = answer || "A tarefa ficou longa demais para uma única execução. Peça para continuar: eu retomo de onde parei.";
  log("answer", answer);
  return { ok: false, answer };
}
