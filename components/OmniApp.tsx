"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Globe2,
  LogIn,
  MessagesSquare,
  Monitor,
  Settings2,
  Smartphone,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { SettingsProvider, useSettings } from "@/lib/settings-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { signInWithGoogle } from "@/lib/auth";
import { detectPlatform, type PlatformInfo } from "@/lib/platform";
import { PROVIDER_LABEL, PROVIDER_ORDER } from "@/lib/ai";
import { APP_VERSION, OWNER } from "@/lib/releases";
import type { ViewId } from "@/lib/types";
import { cn } from "./ui";
import ChatView from "./views/ChatView";
import StudioView from "./views/StudioView";
import AgentView from "./views/AgentView";
import SettingsView from "./views/SettingsView";
import CreditsView from "./views/CreditsView";

const NAV: Array<{ id: ViewId; label: string; icon: typeof MessagesSquare; hint: string }> = [
  { id: "chat", label: "Chat", icon: MessagesSquare, hint: "Conversa com provedores gratuitos" },
  { id: "studio", label: "Estúdio", icon: Clapperboard, hint: "Vídeos verticais com narração" },
  { id: "agent", label: "Modo Agente", icon: TerminalSquare, hint: "Arquivos, terminal e skills" },
  { id: "settings", label: "Configurações", icon: Settings2, hint: "Chaves, conta e aparência" },
  { id: "credits", label: "Créditos", icon: Sparkles, hint: "Sobre o projeto" },
];

const VIEW_META: Record<ViewId, { title: string; subtitle: string }> = {
  chat: { title: "Chat", subtitle: "Groq, OpenRouter e GitHub Models em rodízio" },
  studio: { title: "Estúdio", subtitle: "Animação 2D em 720 × 1280 a 30 FPS" },
  agent: { title: "Modo Agente", subtitle: "Planeja, lê e edita arquivos, roda comandos" },
  settings: { title: "Configurações", subtitle: "Chaves, conta, aparência e áudio" },
  credits: { title: "Créditos", subtitle: "Quem construiu e o que está por trás" },
};

function Welcome() {
  const { configured, signIn, continueAsGuest } = useAuth();
  const { settings, updateSupabase } = useSettings();
  const [url, setUrl] = useState(settings.supabase.url);
  const [anonKey, setAnonKey] = useState(settings.supabase.anonKey);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSetup, setShowSetup] = useState(!configured);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const message = params.get("error_description") || params.get("error");
    if (message) {
      setError(decodeURIComponent(message.replace(/\+/g, " ")));
      setShowSetup(true);
      setBusy(false);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const start = () => {
    setError("");
    if (configured) {
      setBusy(true);
      signIn();
      return;
    }
    if (!url.trim() || !anonKey.trim()) {
      setShowSetup(true);
      setError("Informe a URL do projeto e a anon key do Supabase.");
      return;
    }
    const next = { url: url.trim().replace(/\/$/, ""), anonKey: anonKey.trim(), enabled: true };
    updateSupabase(next);
    try {
      setBusy(true);
      signInWithGoogle(next);
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Não foi possível abrir o login do Google.");
    }
  };

  return (
    <div className="min-h-[100dvh] px-6 py-10" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-[400px]">
        <div className="mb-7">
          <div
            className="mb-5 grid h-11 w-11 place-items-center rounded-xl text-[14px] font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            O
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">OmniStudio</h1>
          <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Chat, estúdio de vídeo e modo agente em um só lugar.
          </p>
        </div>

        <div className="space-y-3">
          <button type="button" onClick={start} disabled={busy} className="btn w-full justify-center">
            <LogIn className="h-4 w-4" />
            {busy ? "Abrindo o Google..." : "Entrar com Google"}
          </button>

          {error ? (
            <div className="panel px-3 py-2 text-[11px] leading-relaxed" style={{ color: "#fca5a5" }}>
              {error}
            </div>
          ) : null}

          {!configured || showSetup ? (
            <div className="panel space-y-2.5 p-3.5">
              <div>
                <p className="text-[11.5px] font-medium">Conectar o Supabase</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                  O Google entra por um projeto Supabase seu. Cole os dois valores do painel em Project Settings, API.
                </p>
              </div>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://xxxxxxxx.supabase.co"
                spellCheck={false}
                aria-label="URL do projeto Supabase"
                className="input w-full text-[11.5px]"
              />
              <input
                value={anonKey}
                onChange={(event) => setAnonKey(event.target.value)}
                placeholder="anon key (public)"
                spellCheck={false}
                aria-label="Anon key do Supabase"
                className="input w-full text-[11.5px]"
              />
              <button type="button" onClick={start} disabled={busy} className="btn w-full justify-center !text-[11.5px]">
                Salvar e entrar com Google
              </button>
              <details className="text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                <summary className="cursor-pointer select-none">O que precisa estar ligado no Supabase</summary>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>Authentication, Providers, Google: client id e secret do Google Cloud.</li>
                  <li>Authentication, URL Configuration: site URL e a origem deste app em Redirect URLs.</li>
                  <li>Redirect do Google Cloud: https://SEU-PROJETO.supabase.co/auth/v1/callback</li>
                  <li>Rodar o supabase-schema.sql no SQL Editor.</li>
                </ul>
              </details>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              className="text-[10.5px] underline decoration-dotted"
              style={{ color: "var(--muted-2)" }}
            >
              Trocar projeto Supabase
            </button>
          )}

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={continueAsGuest}
              className="text-[10.5px] underline decoration-dotted"
              style={{ color: "var(--muted-2)" }}
            >
              Entrar sem conta (não sincroniza)
            </button>
          </div>
        </div>

        <p className="mt-7 text-[10.5px]" style={{ color: "var(--muted-2)" }}>
          Criado por {OWNER} · v{APP_VERSION}
        </p>
      </div>
    </div>
  );
}

function Shell() {
  const { settings } = useSettings();
  const { session, guest, ready } = useAuth();
  const [view, setView] = useState<ViewId>("chat");
  const [platform, setPlatform] = useState<PlatformInfo>({
    kind: "web",
    label: "Navegador",
    native: false,
    bridge: null,
  });

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  if (!ready) {
    return <div className="h-[100dvh]" style={{ background: "var(--bg)" }} />;
  }

  if (!session && !guest) return <Welcome />;

  const configured = PROVIDER_ORDER.filter((provider) => settings.keys[provider]?.trim()).length;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      <aside
        className="flex w-[196px] shrink-0 flex-col border-r px-2.5 py-3"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="mb-4 flex items-center gap-2.5 px-1.5">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[12px] font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            O
          </div>
          <span className="truncate text-[13px] font-semibold tracking-[-0.01em]">OmniStudio</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors",
                  active ? "font-medium" : "hover:bg-[var(--surface-2)]",
                )}
                style={
                  active
                    ? { background: "var(--surface-2)", color: "var(--text)" }
                    : { color: "var(--muted)" }
                }
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-3 border-t px-1.5 pt-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            {session?.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.avatar}
                alt=""
                className="h-6 w-6 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold"
                style={{ background: "var(--surface-3)", color: "var(--muted)" }}
              >
                {session ? session.user.name.slice(0, 1).toUpperCase() : "OS"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium">{session ? session.user.name : "Modo Local"}</p>
              <p className="truncate text-[10px]" style={{ color: "var(--muted-2)" }}>
                {session ? session.user.email : "sem conta conectada"}
              </p>
            </div>
          </div>
          <p className="mt-2.5 text-[10px]" style={{ color: "var(--muted-2)" }}>
            OmniStudio v{APP_VERSION} · {OWNER}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="glass z-30 flex h-[54px] shrink-0 items-center justify-between gap-4 border-b px-5"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0">
            <h1 className="truncate text-[13px] font-semibold tracking-[-0.01em]">{VIEW_META[view].title}</h1>
            <p className="truncate text-[11px]" style={{ color: "var(--muted)" }}>
              {VIEW_META[view].subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="hidden items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] sm:flex"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
              title={configured ? `${configured} provedor(es) com chave` : "Nenhuma chave: cérebro local"}
            >
              {PROVIDER_ORDER.map((provider) => (
                <span key={provider} className="flex items-center gap-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: settings.keys[provider]?.trim() ? "#4ade80" : "#3f3f46" }}
                  />
                  {PROVIDER_LABEL[provider]}
                </span>
              ))}
            </div>

            <div
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px]"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
            >
              {platform.kind === "desktop" ? (
                <Monitor className="h-3 w-3" />
              ) : platform.kind === "android" ? (
                <Smartphone className="h-3 w-3" />
              ) : (
                <Globe2 className="h-3 w-3" />
              )}
              {platform.label}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="h-full min-h-0"
          >
            {view === "chat" ? <ChatView /> : null}
            {view === "studio" ? <StudioView /> : null}
            {view === "agent" ? <AgentView platform={platform} /> : null}
            {view === "settings" ? <SettingsView /> : null}
            {view === "credits" ? <CreditsView platform={platform} /> : null}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function OmniApp() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </SettingsProvider>
  );
}
