"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clapperboard,
  Download,
  FolderOpen,
  LogIn,
  LogOut,
  Menu,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  TerminalSquare,
  Trash2,
} from "lucide-react";
import { SettingsProvider, useSettings } from "@/lib/settings-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace-store";
import { pickWorkspace } from "@/lib/agent";
import { pullKeys, pushConversations, pushSettings } from "@/lib/cloud";
import { startHeartbeat, startRemoteRunner } from "@/lib/remote";
import { APP_VERSION, OWNER } from "@/lib/releases";
import type { Conversation, ViewId } from "@/lib/types";
import { cn } from "./ui";
import AuthModal from "./AuthModal";
import Inspector from "./Inspector";
import DownloadsModal from "./DownloadsModal";
import PairAuthorize from "./PairAuthorize";
import ChatView from "./views/ChatView";
import StudioView from "./views/StudioView";
import AgentView from "./views/AgentView";
import SettingsView from "./views/SettingsView";
import CreditsView from "./views/CreditsView";
import { detectPlatform, type PlatformInfo } from "@/lib/platform";

const NAV: Array<{ id: ViewId; label: string; short: string; icon: typeof MessagesSquare }> = [
  { id: "chat", label: "Chat", short: "Chat", icon: MessagesSquare },
  { id: "studio", label: "Estúdio 2D", short: "Estúdio", icon: Clapperboard },
  { id: "agent", label: "Modo Agente", short: "Agente", icon: TerminalSquare },
  { id: "settings", label: "Configurações", short: "Ajustes", icon: Settings2 },
];

const VIEW_TITLE: Record<ViewId, string> = {
  chat: "Chat",
  studio: "Estúdio 2D",
  agent: "Modo Agente",
  settings: "Configurações",
  credits: "Créditos",
};

/** No navegador o app mostra só o chat; a suíte completa vive nos apps instalados. */
function navFor(native: boolean) {
  return native ? NAV : NAV.filter((item) => item.id === "chat");
}

function firstName(value: string) {
  return value.split(/[\s@]/)[0] || "você";
}

function groupConversations(items: Conversation[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const cutoff = startOfToday.getTime();
  return {
    today: items.filter((item) => item.updatedAt >= cutoff),
    earlier: items.filter((item) => item.updatedAt < cutoff),
  };
}

function ConversationRow({
  conversation,
  active,
  onOpen,
  onRename,
  onDelete,
  compact,
}: {
  conversation: Conversation;
  active: boolean;
  onOpen: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);

  const commit = () => {
    const title = draft.trim();
    if (title && title !== conversation.title) onRename(title);
    setEditing(false);
  };

  if (editing && !compact) {
    return (
      <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: "var(--surface-2)" }}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              setDraft(conversation.title);
              setEditing(false);
            }
          }}
          autoFocus
          aria-label="Renomear conversa"
          className="min-w-0 flex-1 bg-transparent text-[11.5px] outline-none"
        />
        <button type="button" onClick={commit} aria-label="Confirmar nome" style={{ color: "var(--muted)" }}>
          <Check className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("group flex items-center gap-1 rounded-lg px-2 py-1.5", active ? "" : "hover:bg-[var(--surface-2)]")}
      style={active ? { background: "var(--surface-2)" } : undefined}
    >
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 truncate text-left text-[11.5px]"
        style={{ color: active ? "var(--text)" : "var(--muted)" }}
        title={conversation.title}
      >
        {conversation.title || "Nova conversa"}
      </button>
      {compact ? null : (
        <>
          <button
            type="button"
            onClick={() => {
              setDraft(conversation.title);
              setEditing(true);
            }}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            aria-label={`Renomear ${conversation.title}`}
            style={{ color: "var(--muted-2)" }}
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            aria-label={`Excluir ${conversation.title}`}
            style={{ color: "var(--muted-2)" }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}

function AccountCard({ compact }: { compact?: boolean }) {
  const { session, openAuth, signIn, signOut } = useAuth();
  const { updateKeys } = useSettings();
  const { setView } = useWorkspace();
  const [waiting, setWaiting] = useState(false);

  if (session) {
    return (
      <div className="rounded-xl border p-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className={cn("flex items-center gap-2", compact && "justify-center")}>
          {session.user.avatar ? (
            <img src={session.user.avatar} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-medium" style={{ background: "var(--surface-3)" }}>
              {(session.user.name || session.user.email || "OS").slice(0, 2).toUpperCase()}
            </span>
          )}
          {compact ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-medium">{session.user.name || "Conta"}</p>
              <p className="truncate text-[10px]" style={{ color: "var(--muted-2)" }}>
                {session.user.email}
              </p>
            </div>
          )}
        </div>
        {compact ? null : (
          <div className="mt-1.5 flex gap-1">
            <button
              type="button"
              onClick={() => setView("settings")}
              className="btn btn-ghost flex-1 justify-center !text-[10.5px]"
            >
              <Settings2 className="h-3 w-3" />
              Configurações
            </button>
            <button
              type="button"
              onClick={() => {
                updateKeys({ openrouter: "", groq: "", mistral: "", composio: "" });
                void signOut();
              }}
              className="btn btn-ghost !p-1.5"
              aria-label="Sair da conta"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <button type="button" onClick={openAuth} className="btn w-full justify-center !p-2" aria-label="Entrar">
        <LogIn className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="space-y-1.5 rounded-xl border p-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
      <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
        Sem conta conectada
      </p>
      <button
        type="button"
        onClick={() => {
          setWaiting(true);
          void signIn().finally(() => setWaiting(false));
        }}
        disabled={waiting}
        className="btn w-full justify-center !text-[11px] disabled:opacity-60"
      >
        <LogIn className="h-3 w-3" />
        {waiting ? "Abrindo o Google..." : "Entrar com Google"}
      </button>
      <button type="button" onClick={openAuth} className="btn btn-ghost w-full justify-center !text-[11px]">
        Entrar com e-mail ou código
      </button>
    </div>
  );
}

function Sidebar({ onNavigate, native }: { onNavigate?: () => void; native: boolean }) {
  const { view, setView, conversations, activeId, setActiveId, createConversation, removeConversation, patchConversation } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const items = navFor(native);
  const groups = useMemo(() => groupConversations(conversations), [conversations]);

  const openFolder = async () => {
    await pickWorkspace();
    setView("agent");
    onNavigate?.();
  };

  return (
    <>
      <div className={cn("flex items-center gap-2 px-1 pb-3", collapsed && "justify-center px-0")}>
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[12px] font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          O
        </div>
        {collapsed ? null : (
          <>
            <span className="flex-1 truncate text-[13px] font-semibold tracking-[-0.01em]">OmniStudio</span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="btn btn-ghost !p-1.5"
              aria-label="Recolher barra lateral"
              title="Recolher"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {collapsed ? (
          <button type="button" onClick={() => setCollapsed(false)} className="btn btn-ghost !p-1" aria-label="Expandir barra lateral">
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          createConversation();
          onNavigate?.();
        }}
        className={cn("btn btn-primary mb-1.5 w-full", collapsed ? "justify-center !px-0" : "justify-start")}
      >
        <Plus className="h-3.5 w-3.5" />
        {collapsed ? null : "Novo Chat"}
      </button>

      <nav className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setView(item.id);
                onNavigate?.();
              }}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors",
                collapsed && "justify-center px-0",
                active ? "font-medium" : "hover:bg-[var(--surface-2)]",
              )}
              style={active ? { background: "var(--surface-2)", color: "var(--text)" } : { color: "var(--muted)" }}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              {collapsed ? null : <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
        {native ? (
          <button
            type="button"
            onClick={() => void openFolder()}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[var(--surface-2)]",
              collapsed && "justify-center px-0",
            )}
            style={{ color: "var(--muted)" }}
            title="Abrir Pasta"
          >
            <FolderOpen className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            {collapsed ? null : <span className="truncate">Abrir Pasta</span>}
          </button>
        ) : null}
      </nav>

      {collapsed ? null : (
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5">
          {groups.today.length ? (
            <>
              <p className="label mb-1.5">Hoje</p>
              <div className="space-y-0.5">
                {groups.today.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={conversation.id === activeId && view === "chat"}
                    onOpen={() => {
                      setActiveId(conversation.id);
                      setView("chat");
                      onNavigate?.();
                    }}
                    onRename={(title) => patchConversation(conversation.id, { title })}
                    onDelete={() => removeConversation(conversation.id)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {groups.earlier.length ? (
            <>
              <p className="label mb-1.5 mt-3">Anteriores</p>
              <div className="space-y-0.5">
                {groups.earlier.slice(0, 40).map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={conversation.id === activeId && view === "chat"}
                    onOpen={() => {
                      setActiveId(conversation.id);
                      setView("chat");
                      onNavigate?.();
                    }}
                    onRename={(title) => patchConversation(conversation.id, { title })}
                    onDelete={() => removeConversation(conversation.id)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {!conversations.length ? (
            <p className="px-1 text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
              Suas conversas aparecem aqui e ficam salvas na conta.
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-2 space-y-1.5 border-t pt-2.5" style={{ borderColor: "var(--border)" }}>
        {collapsed ? null : (
          <>
            <button
              type="button"
              onClick={() => {
                setView("settings");
                onNavigate?.();
              }}
              className="btn w-full justify-start !text-[11.5px]"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Configurações &amp; Chaves na Nuvem
            </button>
            <button
              type="button"
              onClick={() => setDownloadsOpen(true)}
              className="btn btn-ghost w-full justify-start !text-[11.5px]"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar o app completo
            </button>
          </>
        )}
        <AccountCard compact={collapsed} />
        {collapsed ? null : (
          <div className="flex items-center justify-between px-1 text-[10px]" style={{ color: "var(--muted-2)" }}>
            <button type="button" onClick={() => setView("credits")} className="truncate underline decoration-dotted">
              Créditos
            </button>
            <span className="truncate">
              v{APP_VERSION} · {OWNER}
            </span>
          </div>
        )}
      </div>

      <DownloadsModal open={downloadsOpen} onClose={() => setDownloadsOpen(false)} />
    </>
  );
}

function Shell() {
  const { view, setView, inspectorOpen, toggleInspector, mobileSidebarOpen, setMobileSidebarOpen, studio } = useWorkspace();
  const { session } = useAuth();
  const { settings, updateKeys } = useSettings();
  const keysRestored = useRef<string | null>(null);
  const lastPush = useRef<string>("");
  const [platform, setPlatform] = useState<PlatformInfo>({ kind: "web", label: "Navegador", native: false, bridge: null });
  const [pairCode, setPairCode] = useState<string | null>(null);

  const native = platform.native;

  useEffect(() => {
    setPlatform(detectPlatform());
    const params = new URLSearchParams(window.location.search);
    const code = params.get("pair");
    if (code) setPairCode(code.toUpperCase());
  }, []);

  // No navegador, nada de Estúdio/Agente: o chat é o foco.
  useEffect(() => {
    if (!native && (view === "studio" || view === "agent")) setView("chat");
  }, [native, view, setView]);

  useEffect(() => {
    if (!session || keysRestored.current === session.user.id) return;
    keysRestored.current = session.user.id;
    if (settings.keys.groq || settings.keys.openrouter) return;
    void pullKeys(settings.supabase, session).then((result) => {
      if (result.ok && result.data) updateKeys(result.data);
    });
  }, [session, settings.keys, settings.supabase, updateKeys]);

  useEffect(() => {
    if (platform.kind === "web" || !session || !platform.bridge) return;
    const stopHeartbeat = startHeartbeat(settings.supabase, session);
    const stopRunner = startRemoteRunner(settings.supabase, session, {
      execute: (command) => platform.bridge!.runCommand(command),
    });
    return () => {
      stopHeartbeat();
      stopRunner();
    };
  }, [platform.kind, platform.bridge, session, settings.supabase]);

  useEffect(() => {
    if (!session) return;
    const push = async () => {
      const snapshot = JSON.stringify({ settings, keys: null });
      if (snapshot === lastPush.current) return;
      const result = await pushSettings(settings, settings.supabase, session);
      if (!result.ok) return;
      try {
        const chats = JSON.parse(window.localStorage.getItem("omnistudio.chats.v1") ?? "[]");
        await pushConversations(chats, settings.supabase, session);
      } catch {
        /* sem conversas locais */
      }
      lastPush.current = snapshot;
    };
    const timer = window.setInterval(() => void push(), 10000);
    return () => window.clearInterval(timer);
  }, [session, settings]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      <aside
        className="hidden w-[260px] shrink-0 flex-col border-r px-2.5 py-3 md:flex"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <Sidebar native={native} />
      </aside>

      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r px-2.5 py-3 transition-transform duration-200 md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        aria-hidden={!mobileSidebarOpen}
      >
        <Sidebar onNavigate={() => setMobileSidebarOpen(false)} native={native} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-[54px] shrink-0 items-center gap-2 border-b px-3 sm:px-4"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="btn btn-ghost !p-1.5 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[-0.01em]">{VIEW_TITLE[view]}</h1>
          {!native ? (
            <span className="hidden text-[10px] sm:inline" style={{ color: "var(--muted-2)" }}>
              web
            </span>
          ) : null}
          {view !== "chat" ? (
            <button type="button" onClick={() => setView("chat")} className="btn btn-ghost !p-1.5" aria-label="Voltar ao chat">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          {native ? (
            <button
              type="button"
              onClick={toggleInspector}
              className="btn btn-ghost !p-1.5"
              aria-label={inspectorOpen ? "Ocultar inspetor" : "Mostrar inspetor"}
              aria-pressed={inspectorOpen}
            >
              <PanelRight className="h-4 w-4" />
            </button>
          ) : null}
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
          {native && !session ? (
            <div className="absolute inset-0 z-30 grid place-items-center p-6" style={{ background: "var(--bg)" }}>
              <div
                className="w-full max-w-[360px] rounded-2xl border p-4"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <h2 className="text-[15px] font-semibold">Entre para usar o OmniStudio</h2>
                <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  No app instalado a conta é obrigatória: é ela que restaura suas chaves e libera o controle remoto do PC.
                </p>
                <AccountCard />
              </div>
            </div>
          ) : null}
          {view === "chat" ? <ChatView /> : null}
          {view === "studio" && native ? <StudioView showCanvas={!inspectorOpen} /> : null}
          {view === "agent" && native ? <AgentView platform={platform} /> : null}
          {view === "settings" ? <SettingsView /> : null}
          {view === "credits" ? <CreditsView platform={platform} /> : null}
        </main>
      </div>

      {native ? <Inspector /> : null}

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch gap-1 border-t px-1 pt-1 md:hidden"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface)",
          paddingBottom: "calc(4px + env(safe-area-inset-bottom))",
        }}
        aria-label="Navegação principal"
      >
        {navFor(native).map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] transition-colors"
              style={active ? { background: "var(--accent-soft)", color: "var(--text)" } : { color: "var(--muted)" }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.7} />
              <span className="max-w-full truncate">{item.short}</span>
            </button>
          );
        })}
      </nav>

      <AuthModal />
      {pairCode ? <PairAuthorize code={pairCode} onClose={() => setPairCode(null)} /> : null}
      {studio ? <span className="sr-only">Estúdio pronto</span> : null}
    </div>
  );
}

export default function OmniApp() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <Shell />
        </WorkspaceProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
