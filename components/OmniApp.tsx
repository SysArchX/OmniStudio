"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  FolderOpen,
  LogIn,
  LogOut,
  Menu,
  MessagesSquare,
  PanelRight,
  Plus,
  Settings2,
  TerminalSquare,
  Trash2,
} from "lucide-react";
import { SettingsProvider, useSettings } from "@/lib/settings-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace-store";
import { pickWorkspace } from "@/lib/agent";
import { pullKeys, pushConversations, pushSettings } from "@/lib/cloud";
import { APP_VERSION, OWNER } from "@/lib/releases";
import type { ViewId } from "@/lib/types";
import { cn } from "./ui";
import AuthModal from "./AuthModal";
import Inspector from "./Inspector";
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

function AccountBar({ compact }: { compact?: boolean }) {
  const { session, openAuth, signIn, signOut } = useAuth();

  if (session) {
    return (
      <div className="rounded-xl border p-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className={cn("flex items-center gap-2", compact && "justify-center")}>
          {session.user.avatar ? (
            <img src={session.user.avatar} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span
              className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-medium"
              style={{ background: "var(--surface-3)" }}
            >
              {(session.user.name || "OS").slice(0, 2).toUpperCase()}
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
          <button
            type="button"
            onClick={() => void signOut()}
            className="btn btn-ghost !p-1.5"
            aria-label="Sair da conta"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
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
      <button type="button" onClick={() => void signIn()} className="btn w-full justify-center !text-[11px]">
        <LogIn className="h-3 w-3" />
        Entrar com Google
      </button>
      <button type="button" onClick={openAuth} className="btn btn-ghost w-full justify-center !text-[11px]">
        Entrar com e-mail
      </button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView, conversations, activeId, setActiveId, createConversation, removeConversation } = useWorkspace();
  const { session, openAuth } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const openFolder = async () => {
    await pickWorkspace();
    setView("agent");
    onNavigate?.();
  };

  return (
    <>
      <div className={cn("flex items-center gap-2 px-2 pb-3", collapsed && "justify-center px-0")}>
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
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="btn btn-ghost !p-1"
            aria-label="Expandir barra lateral"
            title="Expandir"
          >
            <Menu className="h-3 w-3" />
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
      <button
        type="button"
        onClick={() => void openFolder()}
        className={cn("btn mb-3 w-full", collapsed ? "justify-center !px-0" : "justify-start")}
      >
        <FolderOpen className="h-3.5 w-3.5" />
        {collapsed ? null : "Abrir Pasta"}
      </button>

      <nav className="space-y-0.5">
        {NAV.map((item) => {
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
      </nav>

      {collapsed ? null : (
        <div className="mt-4 min-h-0 flex-1">
          <p className="label mb-1.5">Conversas</p>
          <div className="min-h-0 space-y-0.5 overflow-y-auto pb-3">
            {conversations.length ? (
              conversations.slice(0, 30).map((conversation) => {
                const active = conversation.id === activeId && view === "chat";
                return (
                  <div
                    key={conversation.id}
                    className={cn("group flex items-center gap-1 rounded-lg px-2 py-1.5", active ? "" : "hover:bg-[var(--surface-2)]")}
                    style={active ? { background: "var(--surface-2)" } : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(conversation.id);
                        setView("chat");
                        onNavigate?.();
                      }}
                      className="min-w-0 flex-1 truncate text-left text-[11.5px]"
                      style={{ color: active ? "var(--text)" : "var(--muted)" }}
                    >
                      {conversation.title || "Nova conversa"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeConversation(conversation.id)}
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      aria-label={`Excluir ${conversation.title}`}
                      style={{ color: "var(--muted-2)" }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="px-1 text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                Nenhuma conversa ainda.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 space-y-1.5 border-t pt-2.5" style={{ borderColor: "var(--border)" }}>
        <AccountBar compact={collapsed} />
        {collapsed ? null : (
          <div className="flex items-center justify-between px-1 text-[10px]" style={{ color: "var(--muted-2)" }}>
            <button
              type="button"
              onClick={() => {
                setView("credits");
                onNavigate?.();
              }}
              className="truncate underline decoration-dotted"
            >
              Créditos
            </button>
            <span className="truncate">
              v{APP_VERSION} · {OWNER}
            </span>
          </div>
        )}
        {collapsed && !session ? null : null}
      </div>
    </>
  );
}

function Shell() {
  const { view, setView, inspectorOpen, toggleInspector, mobileSidebarOpen, setMobileSidebarOpen, studio } = useWorkspace();
  const { session, openAuth } = useAuth();
  const { settings, updateKeys } = useSettings();
  const keysRestored = useRef<string | null>(null);
  const lastPush = useRef<string>("");
  const [platform, setPlatform] = useState<PlatformInfo>({ kind: "web", label: "Navegador", native: false, bridge: null });

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  // Restaura as chaves salvas quando a conta é aberta em outro dispositivo.
  useEffect(() => {
    if (!session || keysRestored.current === session.user.id) return;
    keysRestored.current = session.user.id;
    if (settings.keys.groq || settings.keys.openrouter) return;
    void pullKeys(settings.supabase, session).then((result) => {
      if (result.ok && result.data) updateKeys(result.data);
    });
  }, [session, settings.keys, settings.supabase, updateKeys]);

  // Sincroniza configurações e conversas a cada 10 segundos (só quando mudam).
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
        className="hidden w-[250px] shrink-0 flex-col border-r px-2.5 py-3 md:flex"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <SidebarContent />
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
          "fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r px-2.5 py-3 transition-transform duration-200 md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        aria-hidden={!mobileSidebarOpen}
      >
        <SidebarContent onNavigate={() => setMobileSidebarOpen(false)} />
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
          {platform.kind === "desktop" ? (
            <span className="hidden text-[10px] sm:inline" style={{ color: "var(--muted-2)" }}>
              desktop
            </span>
          ) : null}
          <button
            type="button"
            onClick={toggleInspector}
            className="btn btn-ghost !p-1.5"
            aria-label={inspectorOpen ? "Ocultar inspetor" : "Mostrar inspetor"}
            aria-pressed={inspectorOpen}
          >
            <PanelRight className="h-4 w-4" />
          </button>
          {!settings.keys.groq && !settings.keys.openrouter ? (
            <button type="button" onClick={openAuth} className="btn !hidden !text-[11px] sm:!inline-flex">
              Entrar
            </button>
          ) : null}
        </header>

        <main className="min-h-0 flex-1 overflow-hidden pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
          {view === "chat" ? <ChatView /> : null}
          {view === "studio" ? <StudioView showCanvas={!inspectorOpen} /> : null}
          {view === "agent" ? <AgentView platform={platform} /> : null}
          {view === "settings" ? <SettingsView /> : null}
          {view === "credits" ? <CreditsView platform={platform} /> : null}
        </main>
      </div>

      <Inspector />

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 gap-1 border-t px-1 pt-1 md:hidden"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface)",
          paddingBottom: "calc(4px + env(safe-area-inset-bottom))",
        }}
        aria-label="Navegação principal"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] transition-colors"
              style={
                active
                  ? { background: "var(--accent-soft)", color: "var(--text)" }
                  : { color: "var(--muted)" }
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.7} />
              <span className="max-w-full truncate">{item.short}</span>
            </button>
          );
        })}
      </nav>

      <AuthModal />
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