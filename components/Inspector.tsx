"use client";

import { Download, Globe, Loader2, Terminal, Volume2, X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { VIDEO_H, VIDEO_W } from "@/lib/scene2d";
import { cn } from "./ui";

function codeFromLastMessage(text: string) {
  const match = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/);
  return match?.[1]?.trim() ?? "";
}

export default function Inspector() {
  const { view, inspectorOpen, toggleInspector, sources, active, studio, studioCanvas, agent } = useWorkspace();

  if (!inspectorOpen) return null;

  const lastAssistant = [...(active?.messages ?? [])].reverse().find((message) => message.role === "assistant");
  const code = lastAssistant ? codeFromLastMessage(lastAssistant.content) : "";

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 flex w-[86vw] max-w-[340px] flex-col border-l lg:static lg:z-auto lg:w-[320px] lg:max-w-none"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      aria-label="Inspetor de contexto"
    >
      <div
        className="flex h-[54px] shrink-0 items-center justify-between gap-2 border-b px-3"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="text-[12px] font-medium">Contexto</p>
        <button type="button" onClick={toggleInspector} className="btn btn-ghost !p-1.5" aria-label="Fechar inspetor">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        {view === "chat" ? (
          <div className="space-y-3">
            <section>
              <p className="label mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                Fontes da pesquisa
              </p>
              {sources.length ? (
                <ul className="space-y-1.5">
                  {sources.slice(0, 8).map((hit) => (
                    <li key={hit.url}>
                      <a
                        href={hit.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border px-2 py-1.5 transition-colors hover:bg-[var(--surface-2)]"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <p className="truncate text-[11.5px] font-medium">{hit.title}</p>
                        <p className="truncate text-[10px]" style={{ color: "var(--muted-2)" }}>
                          {hit.origin ? `${hit.origin} · ` : ""}
                          {hit.url}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                  Ative Pesquisa Web no compositor ou cole um link para ver as fontes aqui.
                </p>
              )}
            </section>

            <section>
              <p className="label mb-1.5">Prévia de código</p>
              {code ? (
                <pre
                  className="mono max-h-[280px] overflow-auto rounded-lg border p-2 text-[10.5px] leading-relaxed"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                >
                  {code}
                </pre>
              ) : (
                <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                  Blocos de código da última resposta aparecem aqui.
                </p>
              )}
            </section>
          </div>
        ) : null}

        {view === "studio" ? (
          <div className="space-y-3">
            <div
              className="relative mx-auto overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--border)", width: "100%", maxWidth: 236, aspectRatio: `${VIDEO_W} / ${VIDEO_H}` }}
            >
              <canvas ref={studioCanvas} width={VIDEO_W} height={VIDEO_H} className="h-full w-full" />
            </div>
            <p className="text-center text-[10.5px]" style={{ color: "var(--muted-2)" }}>
              {studio?.hasScenes ? `${studio.title} · ${studio.duration.toFixed(1)}s` : "Sem roteiro carregado"}
            </p>
            <div className="grid gap-1.5">
              <button
                type="button"
                onClick={() => studio?.testVoice()}
                disabled={!studio?.hasScenes}
                className="btn w-full justify-center !text-[11px] disabled:opacity-50"
              >
                <Volume2 className="h-3 w-3" />
                Ouvir Teste de Voz
              </button>
              <button
                type="button"
                onClick={() => studio?.exportVideo()}
                disabled={!studio?.hasScenes}
                className="btn btn-primary w-full justify-center !text-[11px] disabled:opacity-50"
              >
                <Download className="h-3 w-3" />
                Exportar Vídeo (30 FPS)
              </button>
            </div>
          </div>
        ) : null}

        {view === "agent" ? (
          <div className="space-y-3">
            <section>
              <p className="label mb-1.5">Checklist</p>
              {agent?.steps.length ? (
                <ul className="space-y-1">
                  {agent.steps.map((step) => (
                    <li key={step.id} className="flex items-start gap-1.5 text-[11px]">
                      <span
                        className={cn("mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full")}
                        style={{
                          background:
                            step.status === "done"
                              ? "#4ade80"
                              : step.status === "failed"
                                ? "#fb7185"
                                : step.status === "running"
                                  ? "var(--accent)"
                                  : "var(--border-strong)",
                        }}
                      />
                      <span style={{ color: step.status === "done" ? "var(--muted)" : "var(--text)" }}>{step.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                  Nenhuma tarefa em execução.
                </p>
              )}
            </section>

            <section>
              <p className="label mb-1.5">Arquivos</p>
              {agent?.tree.length ? (
                <div className="max-h-[160px] overflow-y-auto">
                  {agent.tree.slice(0, 80).map((entry) => (
                    <p
                      key={entry.path}
                      className="truncate text-[10.5px]"
                      style={{ paddingLeft: entry.path.split("/").length * 6, color: entry.isDir ? "var(--text)" : "var(--muted)" }}
                    >
                      {entry.isDir ? "▸ " : "· "}
                      {entry.name}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                  Abra uma pasta no Modo Agente para listar arquivos.
                </p>
              )}
            </section>

            <section>
              <p className="label mb-1.5 flex items-center gap-1.5">
                <Terminal className="h-3 w-3" />
                Terminal
              </p>
              {agent?.logs.length ? (
                <div className="mono max-h-[220px] overflow-auto rounded-lg border p-2 text-[10px] leading-relaxed" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                  {agent.logs.slice(-40).map((entry) => (
                    <p key={entry.id} className="whitespace-pre-wrap break-words" style={{ color: entry.kind === "error" ? "#fb7185" : "var(--muted)" }}>
                      {entry.text}
                    </p>
                  ))}
                  {agent.running ? <Loader2 className="mt-1 h-3 w-3 animate-spin" /> : null}
                </div>
              ) : (
                <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                  A saída da execução aparece aqui.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </aside>
  );
}