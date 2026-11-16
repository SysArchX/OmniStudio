"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Globe, Link2, Loader2, MessageSquarePlus, SquarePen, Trash2 } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import {
  findLinks,
  PROVIDER_LABEL,
  readLink,
  researchBlock,
  runBrain,
  webSearch,
  type BrainMessage,
  type SearchHit,
} from "@/lib/ai";
import { cn } from "../ui";
import type { ChatMessage, Conversation } from "@/lib/types";

const CHATS_KEY = "omnistudio.chats.v1";

const SUGGESTIONS = [
  { title: "Roteiro de vídeo", text: "Monte um roteiro de 20 segundos sobre como sobreviver a uma avalanche." },
  { title: "Explicar conceito", text: "Explique WebRTC para quem só sabe JavaScript básico." },
  { title: "Depurar erro", text: "Meu fetch em Node retorna 401 mesmo com o token certo. Como investigar?" },
];

function loadConversations(): Conversation[] {
  try {
    const raw = window.localStorage.getItem(CHATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(conversations: Conversation[]) {
  try {
    window.localStorage.setItem(CHATS_KEY, JSON.stringify(conversations.slice(0, 40)));
  } catch {
    /* quota cheia */
  }
}

function newConversation(): Conversation {
  const now = Date.now();
  return { id: crypto.randomUUID(), title: "Nova conversa", messages: [], createdAt: now, updatedAt: now };
}

export default function ChatView() {

  const handleEmailAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = (event.target as HTMLFormElement).code?.value.trim();
    if (!code) return;
    try {
      const response = await fetch("/api/email-auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Código inválido.");
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = "/#/";
    } catch (error) {
      alert("Falha ao verificar código: " + (error instanceof Error ? error.message : "erro desconhecido"));
    }
  };

  const createConversation = () => {
    const fresh = newConversation();
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
  };

  const { settings } = useSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [webEnabled, setWebEnabled] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = loadConversations();
    if (stored.length) {
      setConversations(stored);
      setActiveId(stored[0].id);
    } else {
      const fresh = newConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
    }
  }, []);

  useEffect(() => {
    if (conversations.length) persist(conversations);
  }, [conversations]);

  const active = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? conversations[0],
    [conversations, activeId],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [active?.messages.length, busy]);

  const patchConversation = useCallback((id: string, patch: Partial<Conversation>) => {
    setConversations((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item)));
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || !active || busy) return;
    setInput("");
    setBusy(true);
    setStatus(null);

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text, at: Date.now() };
    const history = [...active.messages, userMessage];
    patchConversation(active.id, {
      title: active.messages.length ? active.title : text.slice(0, 48),
      messages: history,
    });

    try {
      const notes: string[] = [];
      let hits: SearchHit[] = [];

      if (webEnabled) {
        setStatus("Pesquisando na web...");
        hits = await webSearch(text);
        if (hits.length) notes.push(researchBlock(text, hits));
      }

      const link = findLinks(text)[0];
      if (link) {
        setStatus("Lendo o link...");
        try {
          const page = await readLink(link);
          notes.push(researchBlock(text, [], { url: link, text: page }));
        } catch (error) {
          notes.push(`Não foi possível ler ${link}: ${error instanceof Error ? error.message : "erro"}.`);
        }
      }

      setStatus("Consultando provedores...");
      const messages: BrainMessage[] = [
        {
          role: "system",
          content:
            "Você é o assistente do OmniStudio. Responda em português do Brasil, direto ao ponto, sem inventar fatos. " +
            "Quando receber pesquisa web, cite as fontes no fim.",
        },
        ...(notes.length ? [{ role: "system" as const, content: notes.join("\n\n") }] : []),
        ...history.slice(-14).map((message) => ({ role: message.role, content: message.content })),
      ];

      const result = await runBrain(messages, { keys: settings.keys, fallback: settings.fallback });
      const label =
        result.provider === "local"
          ? `local${result.attempts.length ? ` · ${result.attempts.map((item) => `${PROVIDER_LABEL[item.provider]} ${item.detail ?? "falhou"}`).join(" · ")}` : ""}`
          : PROVIDER_LABEL[result.provider];

      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.text,
        provider: label,
        sources: hits.slice(0, 6).map((hit) => ({ title: hit.title, url: hit.url })),
        at: Date.now(),
      };
            patchConversation(active.id, { messages: [...history, assistant] });
    } catch (error) {
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error instanceof Error ? error.message : "Falha ao responder.",
        provider: "erro",
        at: Date.now(),
      };
      patchConversation(active.id, { messages: [...history, assistant] });
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  const handleAuthWithGoogle = async () => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search.slice(1));
    const error = params.get("error");
    const code = params.get("code");
    const session = await handleGoogleCallback(code, error);
    if (session) {
      await restoreSession(session);
    } else if (error) {
      setStatus(error);
    }
  };

  const restoreSession = async (session: any) => {
    if (session?.access_token) {
      localStorage.setItem("omnistudio.auth.token", session.access_token);
      localStorage.setItem("omnistudio.auth.refresh_token", session.refresh_token || "");
      localStorage.setItem("omnistudio.auth.expires_at", String((Date.now() + (session.expires_in || 3600) * 1000)));
      localStorage.setItem("omnistudio.auth.user", JSON.stringify(session.user || {}));
      setStatus("Entrando...")
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = "/#/";
    }
  };

  const handleGoogleCallback = async (code: string | null, error: string | null) => {
    if (error) return null;
    if (!code) return null;
    if (!window.location.hostname.includes("freebuff.page")) return null;
    const response = await fetch("/api/auth/callback", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ code }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.session ?? null;
  };

  const empty = !active?.messages.length;

  return (
  };

  const empty = !active?.messages.length;

  return (
    <div className="flex h-full min-h-0">
      <aside
        className="hidden w-[218px] shrink-0 flex-col border-r px-2 py-3 md:flex"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <button type="button" onClick={createConversation} className="btn mb-2 w-full justify-center">
          <SquarePen className="h-3.5 w-3.5" />
          Nova conversa
        </button>
        <p className="mb-1.5 px-1.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
          Conversas
        </p>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors",
                conversation.id === activeId ? "" : "hover:bg-[var(--surface-2)]",
              )}
              style={conversation.id === activeId ? { background: "var(--surface-2)" } : undefined}
            >
              <button
                type="button"
                onClick={() => setActiveId(conversation.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-[12px]">{conversation.title}</span>
                <span className="block text-[10px]" style={{ color: "var(--muted-2)" }}>
                  {conversation.messages.length} mensagens
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeConversation(conversation.id)}
                aria-label={`Excluir ${conversation.title}`}
                className="opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
                style={{ color: "var(--muted-2)" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 px-1.5 text-[10px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
          {settings.fallback
            ? "Rodízio ligado: 429 pula para o próximo provedor. Sem chave, responde local."
            : "Rodízio desligado: erro de um provedor encerra a resposta."}
        </p>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {empty ? (
            <div className="mx-auto max-w-[560px] pt-10">
              <h2 className="text-[17px] font-semibold tracking-[-0.02em]">O que você quer resolver?</h2>
              <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
                Groq responde primeiro, OpenRouter assume depois e o GitHub Models fecha a fila. A pesquisa web funciona sem chave.
              </p>
              <div className="mt-5 grid gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setInput(item.text)}
                    className="panel px-3.5 py-3 text-left transition-colors hover:border-[var(--border-strong)]"
                  >
                    <span className="block text-[12px] font-medium">{item.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-[720px] flex-col gap-3">
              {active?.messages.map((message) => (
                <article
                  key={message.id}
                  className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className="max-w-[92%] rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed"
                    style={
                      message.role === "user"
                        ? { background: "var(--surface-3)", color: "var(--text)" }
                        : { background: "var(--surface-2)", border: "1px solid var(--border)" }
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    {message.sources?.length ? (
                      <div className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: "var(--border)" }}>
                        {message.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start gap-1.5 text-[10.5px] underline decoration-dotted"
                            style={{ color: "var(--muted)" }}
                          >
                            <Link2 className="mt-[2px] h-3 w-3 shrink-0" />
                            <span className="truncate">{source.title}</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {message.provider ? (
                    <span className="mt-1 text-[10px]" style={{ color: "var(--muted-2)" }}>
                      {message.provider}
                    </span>
                  ) : null}
                </article>
              ))}
              {busy ? (
                <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--muted)" }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {status ?? "Respondendo..."}
                </div>
              ) : null}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-[720px]">
            <div
              className="rounded-xl border px-3 py-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder="Pergunte algo, cole um link ou peça uma pesquisa. Enter envia."
                aria-label="Mensagem"
                className="w-full resize-none bg-transparent text-[12.5px] leading-relaxed outline-none placeholder:text-[var(--muted-2)]"
              />
              <div className="mt-1.5 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWebEnabled((prev) => !prev)}
                      aria-pressed={webEnabled}
                      className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10.5px] transition-colors"
                      style={{
                        borderColor: webEnabled ? "var(--accent)" : "var(--border)",
                        color: webEnabled ? "var(--text)" : "var(--muted)",
                        background: webEnabled ? "var(--accent-soft)" : "transparent",
                      }}
                    >
                      <Globe className="h-3 w-3" />
                      Pesquisa Web
                    </button>
                    {findLinks(input).length ? (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--muted-2)" }}>
                        <Link2 className="h-3 w-3" />
                        link será lido
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!input.trim() || busy}
                    className="btn !px-2.5 !py-1.5"
                    aria-label="Enviar"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="w-full sm:w-auto">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <button
                      type="button"
                      onClick={handleAuthWithGoogle}
                                                                  className="btn google-btn w-full justify-center">
                      <Globe className="h-4 w-4" />
                      Entrar com Google
                    </button>
                    <div className="mt-2">
                      <label className="text-xs text-gray-400 mb-1.5 block">Entrar com e-mail</label>
                      <form id="email-form" onSubmit={(event) => handleEmailAuthSubmit(event)} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            type="email"
                            id="email-input"
                            placeholder="digite seu e-mail"
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                          />
                          <button type="submit" className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors text-sm">
                            Enviar código
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Você receberá um código de 6 dígitos na sua caixa de entrada. Digite abaixo para entrar.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="code-input"
                            placeholder="Digite o código de 6 dígitos"
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                          />
                          <button type="submit" form="email-form" className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors text-sm">
                            Entrar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px]" style={{ color: "var(--muted-2)" }}>
              <MessageSquarePlus className="h-3 w-3" />
              {PROVIDER_LABEL.groq} · {PROVIDER_LABEL.openrouter} · {PROVIDER_LABEL.github}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
