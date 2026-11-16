"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Globe2,
  LogIn,
  LogOut,
  Mail,
  MessagesSquare,
  Monitor,
  Settings2,
  Smartphone,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { SettingsProvider, useSettings } from "@/lib/settings-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/auth";
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

const GoogleIcon = (
  <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

function Welcome() {
  const { signIn, continueAsGuest, adoptSession } = useAuth();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"start" | "email" | "verify">("start");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const message =
      hashParams.get("error_description") ||
      hashParams.get("error") ||
      queryParams.get("error_description") ||
      queryParams.get("error");
    if (message) {
      setError(decodeURIComponent(message.replace(/\+/g, " ")));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleGoogle = () => {
    setError("");
    setBusy(true);
    try {
      signIn();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Não foi possível abrir o Google.");
    }
  };

  const requestCode = async () => {
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await sendEmailOtp(email.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.message || "Falha ao enviar o código.");
      return;
    }
    setStep("verify");
  };

  const sendOtp = (event: React.FormEvent) => {
    event.preventDefault();
    void requestCode();
  };

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await verifyEmailOtp(email.trim(), code.trim());
    setBusy(false);
    if (!result.ok || !result.session) {
      setError(result.message || "Código inválido.");
      return;
    }
    adoptSession(result.session);
    window.history.replaceState(null, "", window.location.pathname);
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
          {error ? (
            <div
              className="rounded-lg border px-3 py-2 text-[11px] leading-relaxed"
              style={{ borderColor: "#7f1d1d", background: "#2a1213", color: "#fca5a5" }}
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {step === "start" ? (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border px-3 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-60"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
              >
                {GoogleIcon}
                {busy ? "Abrindo o Google..." : "Entrar com Google"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("email");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12.5px] font-medium transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                <Mail className="h-3.5 w-3.5" />
                Entrar com e-mail
              </button>
            </>
          ) : null}

          {step === "email" ? (
            <form onSubmit={sendOtp} className="space-y-3">
              <label className="block text-[11.5px]" style={{ color: "var(--muted)" }}>
                E-mail
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  className="input mt-1.5 w-full !text-base"
                  autoFocus
                  autoComplete="email"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg px-3 py-2.5 text-[12.5px] font-semibold transition-colors disabled:opacity-60"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
              >
                {busy ? "Enviando..." : "Enviar código de 6 dígitos"}
              </button>
              <button
                type="button"
                onClick={() => setStep("start")}
                className="w-full text-center text-[10.5px] underline decoration-dotted"
                style={{ color: "var(--muted-2)" }}
              >
                Voltar
              </button>
            </form>
          ) : null}

          {step === "verify" ? (
            <form onSubmit={verifyOtp} className="space-y-3">
              <label className="block text-[11.5px]" style={{ color: "var(--muted)" }}>
                Código enviado para {email}
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="input mono mt-1.5 w-full !text-base tracking-[0.35em]"
                  autoFocus
                  autoComplete="one-time-code"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg px-3 py-2.5 text-[12.5px] font-semibold transition-colors disabled:opacity-60"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
              >
                {busy ? "Verificando..." : "Confirmar código e entrar"}
              </button>
              <div className="flex items-center justify-between text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                <button type="button" onClick={() => void requestCode()} className="underline decoration-dotted">
                  Reenviar código
                </button>
                <button type="button" onClick={() => setStep("email")} className="underline decoration-dotted">
                  Trocar e-mail
                </button>
              </div>
            </form>
          ) : null}

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={continueAsGuest}
              className="text-[10.5px] underline decoration-dotted"
              style={{ color: "var(--muted-2)" }}
            >
              Continuar sem conta (não sincroniza)
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