"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Circle,
  FilePlus2,
  FolderOpen,
  Loader2,
  Play,
  Square,
  Terminal,
  Upload,
  XCircle,
} from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { useWorkspace } from "@/lib/workspace-store";
import { COMPOSIO_TOOLKITS, getComposioKey, listConnectedToolkits, type ComposioToolkitStatus } from "@/lib/composio";
import type { PlatformInfo } from "@/lib/platform";
import { commandAllowed } from "@/lib/platform";
import {
  currentWorkspaceName,
  fsAccessSupported,
  listTree,
  loadProjectSkills,
  parseSkillFile,
  pickWorkspace,
  resolveNativeRoot,
  runAgentTask,
  type TreeEntry,
} from "@/lib/agent";
import type { AgentLogEntry, AgentStep, SkillDefinition } from "@/lib/types";
import { Badge, cn } from "../ui";
import { useAuth } from "@/lib/auth-store";
import {
  installedDefinitions,
  installedSkills,
  filterCatalog,
  toggleSkill,
  SKILL_CATEGORIES,
  type InstalledSkill,
} from "@/lib/skills-store";
import { listCommands, listDevices, queueCommand, type RemoteCommand, type RemoteDevice } from "@/lib/remote";
import { DOWNLOADS, downloadUrl } from "@/lib/releases";

export default function AgentView({ platform }: { platform: PlatformInfo }) {
  const { settings } = useSettings();
  const [task, setTask] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [root, setRoot] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [toolkits, setToolkits] = useState<ComposioToolkitStatus[]>(
    COMPOSIO_TOOLKITS.map((toolkit) => ({ ...toolkit, connected: false })),
  );
  const { registerAgent } = useWorkspace();
  const cancelRef = useRef(false);
  const logEnd = useRef<HTMLDivElement | null>(null);

  const { session } = useAuth();
  const [skillQuery, setSkillQuery] = useState("");
  const [skillCategory, setSkillCategory] = useState<string | null>(null);
  const [installed, setInstalled] = useState<InstalledSkill[]>([]);
  const [devices, setDevices] = useState<RemoteDevice[]>([]);
  const [remoteCommand, setRemoteCommand] = useState("");
  const [remoteCommands, setRemoteCommands] = useState<RemoteCommand[]>([]);
  const [showMarket, setShowMarket] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    setInstalled(installedSkills());
  }, []);

  const catalog = useMemo(
    () => filterCatalog({ query: skillQuery, category: skillCategory }).slice(0, 24),
    [skillQuery, skillCategory],
  );

  useEffect(() => {
    if (!session) {
      setDevices([]);
      setRemoteCommands([]);
      return;
    }
    let alive = true;
    const load = async () => {
      const [nextDevices, nextCommands] = await Promise.all([
        listDevices(settings.supabase, session),
        listCommands(settings.supabase, session),
      ]);
      if (!alive) return;
      setDevices(nextDevices);
      setRemoteCommands(nextCommands);
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [session, settings.supabase]);

  const sendRemote = async () => {
    const command = remoteCommand.trim();
    if (!command || !session) return;
    setRemoteCommand("");
    await queueCommand(settings.supabase, session, command);
    setRemoteCommands(await listCommands(settings.supabase, session));
  };

  const bridge = platform.bridge;
  const native = Boolean(bridge);
  const webFs = !native && fsAccessSupported();

  const refreshTree = useCallback(async () => {
    if (!webFs) return;
    try {
      setTree(await listTree("", 2));
    } catch {
      setTree([]);
    }
  }, [webFs]);

  useEffect(() => {
    if (!native) {
      setRoot(currentWorkspaceName() ?? "");
      return;
    }
    void resolveNativeRoot(bridge).then((value) => {
      if (value) setRoot(value);
    });
  }, [native, bridge]);

  // Skills globais: .agents, .claude, .codex, .opencode e AGENTS.md/CLAUDE.md.
  useEffect(() => {
    void loadProjectSkills(bridge).then((found) => {
      if (found.length) setSkills(found);
    });
  }, [bridge]);

  useEffect(() => {
    if (!getComposioKey()) return;
    void listConnectedToolkits().then(setToolkits);
  }, []);

  useEffect(() => {
    registerAgent({ steps, logs, tree, root, running });
    return () => registerAgent(null);
  }, [steps, logs, tree, root, running, registerAgent]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [logs.length]);

  const chooseFolder = async () => {
    const name = await pickWorkspace(bridge);
    if (!name) return;
    setRoot(name);
    await refreshTree();
    setSkills(await loadProjectSkills(bridge));
  };

  const importSkill = async (file: File) => {
    const raw = await file.text();
    const parsed = parseSkillFile(file.name, raw, file.name);
    if (parsed) setSkills((prev) => [...prev.filter((item) => item.name !== parsed.name), parsed]);
  };

  const clearWorkspace = () => {
    setSkills((prev) => prev.filter((skill) => !skill.source.startsWith(".agents")));
  };

  const run = async () => {
    const prompt = task.trim();
    if (!prompt || running) return;
    setRunning(true);
    cancelRef.current = false;
    setSteps([]);
    setLogs([]);
    setAnswer(null);

    try {
      const result = await runAgentTask(
        {
          task: prompt,
          bridge,
          rootLabel: root || "raiz do projeto",
          skills: [...skills, ...installedDefinitions()],
          brain: { keys: settings.keys, fallback: settings.fallback, endpoints: settings.endpoints },
          isCancelled: () => cancelRef.current,
        },
        {
          onSteps: (next) => setSteps(next),
          onLog: (entry) => setLogs((prev) => [...prev, entry]),
        },
      );
      setAnswer(result.answer);
      await refreshTree();
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          kind: "error",
          text: error instanceof Error ? error.message : "Falha ao executar o agente.",
          at: Date.now(),
        },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const commandHint = native ? "terminal do sistema" : "terminal apenas no app desktop";

  return (
    <div className="flex h-full min-h-0">
      <aside
        className="hidden w-[248px] shrink-0 flex-col border-r px-3 py-3 lg:flex"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
            Área de trabalho
          </p>
          {native ? (
            <div className="rounded-lg border px-2.5 py-2 text-[11.5px]" style={{ borderColor: "var(--border)" }}>
              <p className="mono truncate text-[10.5px] font-medium" title={root}>
                {root || "Pasta padrão do usuário"}
              </p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                {commandHint}
              </p>
              <button
                type="button"
                onClick={() => void chooseFolder()}
                className="btn btn-ghost mt-1.5 w-full justify-center !text-[10.5px]"
              >
                <FolderOpen className="h-3 w-3" />
                Trocar pasta
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void chooseFolder()}
              disabled={!webFs}
              className="btn w-full justify-center"
              title={webFs ? "Escolher pasta" : "Seu navegador não expõe a File System Access API"}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              {root || "Escolher pasta"}
            </button>
          )}
        </div>

        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              Skills
            </p>
            {skills.length ? (
              <button type="button" onClick={clearWorkspace} className="text-[10px]" style={{ color: "var(--muted-2)" }}>
                limpar
              </button>
            ) : null}
          </div>
          <div className="space-y-1">
            {skills.length ? (
              skills.map((skill) => (
                <div
                  key={`${skill.name}-${skill.source}`}
                  className="rounded-lg border px-2 py-1.5"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="truncate text-[11.5px] font-medium">{skill.name}</p>
                  <p className="line-clamp-2 text-[10px]" style={{ color: "var(--muted-2)" }}>
                    {skill.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                Nenhuma skill carregada. Use a pasta .agents/skills do projeto ou importe um SKILL.md.
              </p>
            )}
          </div>
          <label className="btn btn-ghost mt-2 w-full cursor-pointer justify-center !text-[11px]">
            <Upload className="h-3 w-3" />
            Importar SKILL.md
            <input
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importSkill(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              Loja de skills
            </p>
            <button
              type="button"
              onClick={() => setShowMarket((prev) => !prev)}
              className="text-[10px]"
              style={{ color: "var(--muted-2)" }}
            >
              {showMarket ? "fechar" : `${installed.length} instalada(s)`}
            </button>
          </div>
          {showMarket ? (
            <div className="space-y-1.5">
              <input
                value={skillQuery}
                onChange={(event) => setSkillQuery(event.target.value)}
                placeholder="Buscar skill"
                aria-label="Buscar skill"
                className="input !h-8 !text-[11px]"
              />
              <select
                value={skillCategory ?? ""}
                onChange={(event) => setSkillCategory(event.target.value || null)}
                aria-label="Categoria da skill"
                className="input !h-8 !text-[11px]"
              >
                <option value="">Todas as categorias</option>
                {SKILL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="max-h-[240px] space-y-1 overflow-y-auto pr-0.5">
                {catalog.map((skill) => {
                  const active = installed.some((item) => item.name === skill.name);
                  return (
                    <div
                      key={skill.name}
                      className="rounded-lg border px-2 py-1.5"
                      style={{ borderColor: active ? "var(--accent)" : "var(--border)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium">{skill.title}</p>
                          <p className="truncate text-[9.5px]" style={{ color: "var(--muted-2)" }}>
                            {skill.category} · {skill.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInstalled(toggleSkill(skill))}
                          className="shrink-0 text-[10px] underline decoration-dotted"
                          style={{ color: active ? "var(--text)" : "var(--muted-2)" }}
                        >
                          {active ? "remover" : "instalar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {catalog.length === 0 ? (
                  <p className="text-[10px]" style={{ color: "var(--muted-2)" }}>
                    Nada encontrado para essa busca.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
              {installed.length} de 100 skills instaladas. Abra a loja para buscar por categoria.
            </p>
          )}
        </div>

        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
            Controle remoto
          </p>
          {devices.some((device) => device.status !== "offline") ? (
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-medium" style={{ color: "#4ade80" }}>
                Sessão Remota Conectada (PC Online)
              </p>
              {devices
                .filter((device) => device.status !== "offline")
                .map((device) => (
                  <p key={device.deviceId} className="truncate text-[10px]" style={{ color: "var(--muted-2)" }}>
                    {device.name} · {device.os}
                  </p>
                ))}
              <div className="flex gap-1.5">
                <input
                  value={remoteCommand}
                  onChange={(event) => setRemoteCommand(event.target.value)}
                  placeholder="ex.: git status"
                  aria-label="Comando remoto"
                  className="input !h-8 mono !text-[10.5px]"
                />
                <button type="button" onClick={() => void sendRemote()} className="btn shrink-0 !text-[10.5px]">
                  Enviar
                </button>
              </div>
              <div className="max-h-[140px] space-y-1 overflow-y-auto">
                {remoteCommands.slice(0, 6).map((command) => (
                  <div key={command.id} className="rounded border px-1.5 py-1" style={{ borderColor: "var(--border)" }}>
                    <p className="mono truncate text-[9.5px]" style={{ color: "var(--muted-2)" }}>
                      {command.status} · {command.command}
                    </p>
                    {command.output ? (
                      <pre className="mono mt-0.5 max-h-[60px] overflow-auto whitespace-pre-wrap text-[9px]" style={{ color: "var(--muted)" }}>
                        {command.output.slice(0, 400)}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 rounded-lg border p-2" style={{ borderColor: "var(--border)" }}>
              <p className="text-[10.5px] font-medium">Modo Agente disponível apenas no App ou CLI</p>
              <p className="text-[10px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                Terminal e arquivos locais rodam no app instalado. No navegador você fala com o PC pela sessão remota.
              </p>
              <div className="grid gap-1">
                {DOWNLOADS.map((item) => (
                  <a
                    key={item.key}
                    href={downloadUrl(item.key)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost !justify-start !text-[10px]"
                  >
                    {item.label} · {item.platform}
                  </a>
                ))}
              </div>
              {!session ? (
                <p className="text-[10px]" style={{ color: "var(--muted-2)" }}>
                  Entre na conta para liberar a sessão remota.
                </p>
              ) : null}
            </div>
          )}
        </div>

        {getComposioKey() ? (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              Apps conectados
            </p>
            <span className="text-[10px]" style={{ color: "var(--muted-2)" }}>
              dentro do app
            </span>
          </div>
          <div className="space-y-1">
            {toolkits.map((toolkit) => (
              <div key={toolkit.slug} className="flex items-center gap-2 rounded-lg border px-2 py-1.5" style={{ borderColor: "var(--border)" }}>
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: toolkit.connected ? "#4ade80" : "var(--border-strong)" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-medium">{toolkit.label}</span>
                  <span className="block truncate text-[10px]" style={{ color: "var(--muted-2)" }}>
                    {toolkit.connected ? "conectado" : toolkit.description}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
        ) : null}

        <div className="min-h-0 flex-1">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
            Arquivos
          </p>
          <div className="h-full space-y-0.5 overflow-y-auto pb-6">
            {tree.length ? (
              tree.slice(0, 120).map((entry) => (
                <p
                  key={entry.path}
                  className="truncate text-[10.5px]"
                  style={{ paddingLeft: entry.path.split("/").length * 8, color: entry.isDir ? "var(--text)" : "var(--muted)" }}
                >
                  {entry.isDir ? "▸ " : "· "}
                  {entry.name}
                </p>
              ))
            ) : (
              <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                {webFs ? "Escolha uma pasta para listar." : "Disponível no navegador com File System Access ou no app."}
              </p>
            )}
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mx-auto max-w-[720px] space-y-4">
            {steps.length ? (
              <div className="panel p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12px] font-medium">Plano</p>
                  <span className="text-[10px]" style={{ color: "var(--muted-2)" }}>
                    {steps.filter((step) => step.status === "done").length}/{steps.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {steps.map((step) => (
                    <li key={step.id} className="flex items-start gap-2 text-[11.5px]">
                      {step.status === "done" ? (
                        <CheckCircle2 className="mt-[2px] h-3.5 w-3.5 shrink-0" style={{ color: "#4ade80" }} />
                      ) : step.status === "failed" ? (
                        <XCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" style={{ color: "#fb7185" }} />
                      ) : step.status === "running" ? (
                        <Loader2 className="mt-[2px] h-3.5 w-3.5 shrink-0 animate-spin" />
                      ) : (
                        <Circle className="mt-[2px] h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-2)" }} />
                      )}
                      <span style={{ color: step.status === "done" ? "var(--muted)" : "var(--text)" }}>{step.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {logs.length ? (
              <div className="panel overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowLogs((prev) => !prev)}
                  className="flex w-full items-center gap-2 border-b px-3.5 py-2 text-left text-[11px] font-medium"
                  style={{ borderColor: "var(--border)" }}
                  aria-expanded={showLogs}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  {showLogs ? "Detalhes técnicos" : "Ver detalhes técnicos"}
                  <span className="ml-auto text-[10px]" style={{ color: "var(--muted-2)" }}>
                    {logs.filter((entry) => entry.kind === "tool").length} ações
                  </span>
                </button>
                {!showLogs && logs.length ? (
                  <p className="truncate px-3.5 py-2 text-[10.5px]" style={{ color: "var(--muted)" }}>
                    {logs[logs.length - 1].kind} · {logs[logs.length - 1].text.slice(0, 120)}
                  </p>
                ) : null}
                {showLogs ? (
                <div className="max-h-[340px] overflow-y-auto px-3.5 py-2.5 font-mono text-[10.5px] leading-relaxed">
                  {logs.map((entry) => (
                    <p
                      key={entry.id}
                      className="whitespace-pre-wrap break-words"
                      style={{
                        color:
                          entry.kind === "error"
                            ? "#fb7185"
                            : entry.kind === "tool"
                              ? "var(--accent)"
                              : entry.kind === "answer"
                                ? "var(--text)"
                                : "var(--muted)",
                      }}
                    >
                      <span style={{ color: "var(--muted-2)" }}>{entry.kind.padEnd(6, " ")}</span> {entry.text}
                    </p>
                  ))}
                  <div ref={logEnd} />
                </div>
              ) : null}
            </div>
          ) : null}

            {answer ? (
              <div className="panel p-3.5">
                <p className="mb-1.5 text-[11px] font-medium" style={{ color: "var(--muted-2)" }}>
                  Resposta final
                </p>
                <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{answer}</p>
              </div>
            ) : null}

            {!steps.length && !logs.length && !answer ? (
              <div className="panel p-4">
                <h2 className="text-[13.5px] font-semibold">Descreva a tarefa</h2>
                <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  O agente monta um plano, lê e edita arquivos e, no app desktop, roda comandos e corrige o que falhar.
                </p>
                <ul className="mt-3 space-y-1.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
                  <li className="flex items-center gap-2">
                    <FilePlus2 className="h-3.5 w-3.5" /> Ler, criar e editar arquivos com diff no log
                  </li>
                  <li className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" /> {native ? commandHint : "Terminal disponível no app Windows/Linux"}
                  </li>
                  <li className="flex items-center gap-2">
                    <FolderOpen className="h-3.5 w-3.5" />
                    {webFs ? "Pasta do computador via File System Access" : "Pasta do computador no navegador compatível"}
                  </li>
                </ul>
                {bridge ? (
                  <p className="mt-3 text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                    Comandos permitidos: {["python", "node", "npm", "git", "ls", "cat", "pacman", "apt"].filter(commandAllowed).join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-[720px]">
            <div className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <textarea
                value={task}
                onChange={(event) => setTask(event.target.value)}
                rows={2}
                placeholder="Ex.: organize os componentes, rode o build e corrija os erros."
                aria-label="Tarefa do agente"
                className="w-full resize-none bg-transparent text-[12.5px] leading-relaxed outline-none placeholder:text-[var(--muted-2)]"
              />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge tone={skills.length ? "ok" : "neutral"}>{skills.length} skill(s)</Badge>
                  <Badge tone={native ? "accent" : "neutral"}>{native ? "terminal ativo" : "só arquivos"}</Badge>
                </div>
                {running ? (
                  <button
                    type="button"
                    onClick={() => {
                      cancelRef.current = true;
                      setRunning(false);
                    }}
                    className="btn btn-ghost !px-2.5 !py-1.5"
                  >
                    <Square className="h-3 w-3" />
                    Parar
                  </button>
                ) : (
                  <button type="button" onClick={() => void run()} disabled={!task.trim()} className={cn("btn !px-3 !py-1.5")}>
                    <Play className="h-3 w-3" />
                    Executar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
