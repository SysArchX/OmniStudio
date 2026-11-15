import type { AgentLogEntry, AgentStep, NativeBridge, SkillDefinition } from "./types";
import { runBrain, type BrainConfig, type BrainMessage } from "./ai";

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
}

let workspace: FsDirHandle | null = null;

export function fsAccessSupported() {
  return typeof window !== "undefined" && typeof (window as PickerWindow).showDirectoryPicker === "function";
}

export function currentWorkspaceName() {
  return workspace?.name ?? null;
}

export async function pickWorkspace(): Promise<string | null> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) return null;
  const handle = await picker({ mode: "readwrite" });
  workspace = handle;
  return handle.name;
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
  return { name, description: description.slice(0, 400), instructions: body.trim().slice(0, 6000), source };
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

function systemPrompt(skills: SkillDefinition[], root: string, native: boolean) {
  const skillBlock = skills.length
    ? skills
        .map((skill) => `### Skill: ${skill.name}\n${skill.description}\n${skill.instructions}`)
        .join("\n\n")
    : "Nenhuma skill carregada.";

  return [
    "Você é o modo agente do OmniStudio. Trabalha em português do Brasil e executa o pedido passo a passo.",
    `Raiz de trabalho: ${root}.`,
    native
      ? "Você tem acesso a arquivos e terminal da máquina."
      : "Você tem acesso somente à pasta escolhida pelo usuário no navegador.",
    "",
    "Responda SEMPRE com um único objeto JSON em uma linha, sem markdown, em uma destas formas:",
    '{"tool":"plan","steps":[{"title":"..."},{"title":"..."}]}',
    '{"tool":"list_dir","path":"."}',
    '{"tool":"read_file","path":"src/app.ts"}',
    '{"tool":"write_file","path":"src/app.ts","content":"..."}',
    '{"tool":"run_command","command":"npm run build"}',
    '{"tool":"finish","answer":"resumo do que foi feito"}',
    "",
    "Regras: comece com plan. Caminhos são relativos à raiz. Nunca use `..`. Um passo por resposta.",
    "Ao terminar, chame finish com um resumo curto e honesto. Se algo falhar, corrija a causa antes de desistir.",
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
  for (let round = 0; round < 14; round += 1) {
    if (cancelled()) {
      const message = "Execução interrompida por você.";
      log("error", message);
      return { ok: false, answer: message };
    }
    const result = await runBrain(history, brain);
    if (result.provider === "local") {
      const message = "Nenhum provedor configurado. Configure Groq, OpenRouter ou GitHub Models em Configurações para o agente executar.";
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
    log("tool", `${tool} ${action.path ?? action.command ?? ""}`.trim());
    let observation = "";

    try {
      if (tool === "plan") {
        const rawSteps = Array.isArray(action.steps) ? action.steps : [];
        steps.length = 0;
        rawSteps.slice(0, 12).forEach((item, index) => {
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
        if (bridge) {
          const result = await bridge.listDir(path || ".");
          observation = result.map((entry) => `${entry.isDir ? "[dir]" : "[file]"} ${entry.name}`).join("\n") || "Pasta vazia.";
        } else {
          const tree = await listTree(path, 2);
          observation = tree.map((entry) => `${entry.isDir ? "[dir]" : "[file]"} ${entry.path}`).join("\n") || "Pasta vazia.";
        }
      } else if (tool === "read_file") {
        const path = String(action.path ?? "");
        const content = bridge ? await bridge.readFile(path) : await readWorkspaceFile(path);
        observation = content.slice(0, 8000);
      } else if (tool === "write_file") {
        const path = String(action.path ?? "");
        const content = String(action.content ?? "");
        if (bridge) await bridge.writeFile(path, content);
        else await writeWorkspaceFile(path, content);
        observation = `Arquivo ${path} gravado (${content.length} caracteres).`;
      } else if (tool === "run_command") {
        if (!bridge) throw new Error("Terminal disponível só no app desktop.");
        const command = String(action.command ?? "");
        const result = await bridge.runCommand(command);
        observation = [`exit=${result.code}`, result.stdout.slice(0, 3000), result.stderr.slice(0, 2000)]
          .filter(Boolean)
          .join("\n");
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

    log("result", observation.slice(0, 800));
    history.push({ role: "assistant", content: result.text });
    history.push({ role: "user", content: `Resultado da ferramenta ${tool}:\n${observation.slice(0, 4000)}` });
  }

  answer = answer || "O agente parou no limite de 14 ações. Veja o log e continue a partir daí.";
  log("answer", answer);
  return { ok: false, answer };
}
