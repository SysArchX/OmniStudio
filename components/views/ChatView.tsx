"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Globe, Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-store";
import { useWorkspace } from "@/lib/workspace-store";
import { PROVIDER_LABEL, PROVIDER_ORDER, PROVIDER_MODEL, looksLikeSearchQuery, researchBlock, runBrain } from "@/lib/ai";
import type { SearchHit } from "@/lib/ai";
import { findLinks, gatherContext } from "@/lib/web-search";
import { cn } from "../ui";
import Markdown from "../Markdown";
import { isNativeShell } from "@/lib/auth";
import type { ChatMessage, ProviderId } from "@/lib/types";

const SUGGESTIONS = [
  { title: "Roteiro de vídeo", text: "Monte um roteiro de 20 segundos sobre como sobreviver a uma avalanche." },
  { title: "Explicar conceito", text: "Explique WebRTC para quem só sabe JavaScript básico." },
  { title: "Depurar erro", text: "Meu fetch em Node retorna 401 mesmo com o token certo. Como investigar?" },
  { title: "Pesquisar tendência", text: "Como está o mercado de ferramentas de vídeo vertical em 2026?" },
];

function messageId() {
  return crypto.randomUUID();
}

/** só http(s) viram link; qualquer outra coisa é descartada na renderização. */
function safeHost(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "fonte";
    return parsed.hostname;
  } catch {
    return "fonte";
  }
}

export default function ChatView() {
  const { settings } = useSettings();
  const { session } = useAuth();
  const { active, createConversation, patchConversation, setSources } = useWorkspace();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [webEnabled, setWebEnabled] = useState(true);
  const [preferred, setPreferred] = useState<ProviderId>("openrouter");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const messages = active?.messages ?? [];
  const links = useMemo(() => findLinks(input), [input]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(200, node.scrollHeight)}px`;
  }, [input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setInput("");
    setStatus(null);

    const conversationId = active?.id ?? createConversation();
    const userMessage: ChatMessage = { id: messageId(), role: "user", content: prompt, at: Date.now() };
    const base = active?.id === conversationId ? active : null;
    const history = [...(base?.messages ?? []), userMessage];
    patchConversation(conversationId, {
      messages: history,
      title: base?.title && base.title !== "Nova conversa" ? base.title : prompt.slice(0, 48),
    });

    try {
      let context = "";
      let found: SearchHit[] = [];
      const shouldSearch = links.length > 0 || (webEnabled && looksLikeSearchQuery(prompt));
      if (shouldSearch) {
        setStatus(links.length ? "Lendo o link..." : "Pesquisando na web...");
        const bundle = await gatherContext(prompt);
        if (bundle.hits.length || bundle.page) {
          found = bundle.hits;
          setSources(bundle.hits);
          context = researchBlock(prompt, bundle.hits, bundle.page);
        }
      }

      setStatus("Consultando provedores...");
      const result = await runBrain(
        [...history.map((message) => ({ role: message.role, content: message.content })), ...(context ? [{ role: "user" as const, content: context }] : [])],
        { keys: settings.keys, fallback: settings.fallback, preferred },
      );

      const assistant: ChatMessage = {
        id: messageId(),
        role: "assistant",
        content: result.text,
        provider: result.provider,
        sources: found.length ? found : undefined,
        at: Date.now(),
      };
      patchConversation(conversationId, { messages: [...history, assistant] });
    } catch (error) {
      const assistant: ChatMessage = {
        id: messageId(),
        role: "assistant",
        content: error instanceof Error ? error.message : "Falha ao responder.",
        at: Date.now(),
      };
      patchConversation(conversationId, { messages: [...history, assistant] });
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  const empty = messages.length === 0;
  const available = PROVIDER_ORDER.filter((provider) => settings.keys[provider]?.trim());

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {empty ? (
            <div className="pb-2">
              {session ? (
                <div className="flex items-center gap-2.5">
                  {session.user.avatar ? (
                    <img
                      src={session.user.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 rounded-full border"
                      style={{ borderColor: "var(--border)" }}
                    />
                  ) : (
                    <span
                      className="grid h-9 w-9 place-items-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--surface-3)" }}
                    >
                      {(session.user.name || session.user.email || "OS").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <h2 className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">
                    Olá, {(session.user.name || session.user.email || "você").split(/[\s@]/)[0]}
                  </h2>
                </div>
              ) : (
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">
                  {isNativeShell() ? "O que vamos criar hoje?" : "Como posso ajudar hoje?"}
                </h2>
              )}
              <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                OpenRouter responde primeiro e Groq ou Mistral assumem se ele falhar. A pesquisa web já vem ligada.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setInput(item.text);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-xl border p-3 text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  >
                    <span className="flex items-center gap-1.5 text-[12px] font-medium">
                      <Sparkles className="h-3.5 w-3.5" />
                      {item.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={cn(
                    "rounded-xl border px-3.5 py-2.5",
                    message.role === "user" ? "" : "",
                  )}
                  style={{
                    borderColor: "var(--border)",
                    background: message.role === "user" ? "var(--surface-2)" : "var(--surface)",
                  }}
                >
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                    {message.role === "user" ? "Você" : message.provider ?? "Assistente"}
                  </p>
                  {message.role === "assistant" ? (
                    <div className="break-words">
                      <Markdown text={message.content} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{message.content}</p>
                  )}
                  {message.role === "assistant" && message.sources?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.sources.slice(0, 6).map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex max-w-[220px] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors hover:bg-[var(--surface-2)]"
                          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                          title={source.url}
                        >
                          <span className="truncate">{source.title || safeHost(source.url)}</span>
                        </a>
                      ))}
                    </div>
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
      </div>

      <div className="shrink-0 px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-4">
        <div className="mx-auto max-w-3xl">
          <div
            className="rounded-2xl border px-3 py-2"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Pergunte algo, cole um link ou peça uma pesquisa."
              aria-label="Mensagem"
              className="w-full resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-[var(--muted-2)] sm:text-[13px]"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWebEnabled((prev) => !prev)}
                aria-pressed={webEnabled}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors"
                style={{
                  borderColor: webEnabled ? "var(--accent)" : "var(--border)",
                  color: webEnabled ? "var(--text)" : "var(--muted)",
                  background: webEnabled ? "var(--accent-soft)" : "transparent",
                }}
              >
                <Globe className="h-3 w-3" />
                Pesquisa Web
              </button>

              <select
                value={preferred}
                onChange={(event) => setPreferred(event.target.value as ProviderId)}
                aria-label="Provedor ativo"
                className="rounded-full border bg-transparent px-2 py-1 text-[10.5px] outline-none"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
              >
                {PROVIDER_ORDER.map((provider) => (
                  <option key={provider} value={provider}>
                    {PROVIDER_LABEL[provider]} · {PROVIDER_MODEL[provider]}
                  </option>
                ))}
              </select>

              {links.length ? (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--muted-2)" }}>
                  link será lido
                </span>
              ) : null}

              <div className="ml-auto flex items-center gap-1.5">
                {available.length === 0 ? (
                  <span className="hidden text-[10px] sm:inline" style={{ color: "var(--muted-2)" }}>
                    sem chave: cérebro local
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!input.trim() || busy}
                  className="btn !rounded-full !px-2.5 !py-1.5"
                  aria-label="Enviar"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-1.5 flex items-center gap-1.5 text-[10px]" style={{ color: "var(--muted-2)" }}>
            <MessageSquarePlus className="h-3 w-3" />
            {available.length ? available.map((provider) => PROVIDER_LABEL[provider]).join(" · ") : "Nenhuma chave configurada"}
          </p>
        </div>
      </div>
    </div>
  );
}