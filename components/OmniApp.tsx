"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Globe2,
  LogIn,
  LogOut,
  MessagesSquare,
  Monitor,
  Settings2,
  Smartphone,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { SettingsProvider, useSettings } from "@/lib/settings-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
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

// Google SVG icon (official colors)
const GoogleIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ width: "1em", height: "1em" }}
  >
    <path d="M22.54 5.45a.75.75 0 0 0-1.06-.02L12 14.24l-5.62-3.08a.75.75 0 0 0-1.08.02L3 14.25l7.75 4.25a.75.75 0 0 0 1.08.02l7.74-4.25 5.22 2.86a.75.75 0 0 0 .88-.02l6.42-3.57a.75.75 0 0 0-.1-1.04zM12 3.73a8.27 8.27 0 1 0 0 16.54 8.27 8.27 0 0 0 0-16.54z" />
  </svg>
);

function Welcome() {
  const { configured, signIn, continueAsGuest, session } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"google" | "email-otp" | "verify">("google");
  const [otpError, setOtpError] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const message = params.get("error_description") || params.get("error");
    if (message) {
      setError(decodeURIComponent(message.replace(/\\+/g, " ")));
      setBusy(false);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOtpError("");
    if (!email.trim()) {
      setOtpError("Informe seu e-mail.");
      return;
    }
    setOtpBusy(true);
    if (!email.trim()) {
      setOtpError("Informe seu e-mail.");
      return;
    }
    setOtpBusy(true);
    const result = await fetch(`${window.location.origin}/auth/v1/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), create_user: true }),
    });
    const data = await result.json().catch(() => ({}));
    setOtpBusy(false);
    if (!result.ok) {
      setOtpError(data.message || "Falha ao enviar código.");
    } else {
      setStep("verify");
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setOtpError("Digite o código de 6 dígitos.");
      return;
    }
    setOtpBusy(true);
    const result = await fetch(`${window.location.origin}/auth/v1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), token: code.trim(), type: "email" }),
    });
    const data = await result.json().catch(() => ({}));
    setOtpBusy(false);
    if (!result.ok) {
      setOtpError(data.message || "Código inválido.");
    } else {
      setStep("google");
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = "/#/";
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
          {step === "google" && (
            <>,
              <button
                type="button"
                onClick={() => setStep("google")}
                disabled={busy}
                className="btn w-full justify-center flex items-center gap-2"
              >
                {GoogleIcon}
                {busy ? "Abrindo o Google..." : "Entrar com Google"}
              </button>

              {error ? (
                <div className="panel px-3 py-2 text-[11px] leading-relaxed" style={{ color: "#fca5a5" }}>
                  {error}
                </div>
              ) : null}

              {!configured && !error ? (
                <p className="text-center text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                  O Google entra por um projeto Supabase seu. Configuração em Configurações, aba Conta e nuvem.
                </p>
              ) : null}

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setStep("email-otp")}
                  className="text-[10.5px] underline decoration-dotted"
                  style={{ color: "var(--muted-2)" }}
                >
                  Entrar com e-mail
                </button>
              </div>
            </>
          )}

          {step === "email-otp" && (
            <form id="email-form" onSubmit={sendOtp} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="digite seu e-mail"
                  className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-base placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={otpBusy}
                className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors text-sm w-full"
              >
                {otpBusy ? "Enviando..." : "Enviar Código de 6 Dígitos"}
              </button>
              {otpError ? (
                <p className="text-xs text-red-400">{otpError}</p>
              ) : null}
            </form>
          )}

          {step === "verify" && (
            <form id="verify-form" onSubmit={verifyOtp} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Código de 6 dígitos</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Digite o código de 6 dígitos recebido no email"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-base placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={otpBusy}
                className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors text-sm w-full"
              >
                {otpBusy ? "Verificando..." : "Confirmar Código e Entrar"}
              </button>
              {otpError ? (
                <p className="text-xs text-red-400">{otpError}</p>
              ) : null}
            </form>
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
  const { session, guest, ready, signOut } = useAuth();
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
    return <div className="h-[100dvh] w-full overflow-hidden" style={{ background: "var(--bg)" }} />;
  }

  if (!session && !guest) return <Welcome />;

  const configured = PROVIDER_ORDER.filter((provider) => settings.keys[provider]?.trim()).length;

  return (
    <div className="h-[100dvh] w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="flex h-full min-h-0">
        <aside
          className="hidden w-[196px] shrink-0 flex-col border-r px-2.5 py-3 md:flex"
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
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: "var(--text)" }}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Sair da Conta</span>
            </button>
            <p className="mt-2.5 text-[10px]" style={{ color: "var(--muted-2)" }}>
              OmniStudio v{APP_VERSION} · {OWNER}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="glass z-30 flex h-[54px] shrink-0 items-center justify-between gap-4 border-b px-4 md:px-5"
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

          <main className="min-h-0 flex-1 overflow-hidden pb-[calc(58px+env(safe-area-inset-bottom))] md:pb-0">
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

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 gap-1 border-t px-1 pt-1 md:hidden"
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
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] transition-colors",
                active ? "font-medium" : "",
              )}
              style={
                active
                  ? { background: "var(--accent-soft)", color: "var(--text)" }
                  : { color: "var(--muted)" }
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.7} />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
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