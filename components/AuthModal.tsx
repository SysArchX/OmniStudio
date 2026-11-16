"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useSettings } from "@/lib/settings-store";
import {
  sendEmailOtp,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailOtp,
} from "@/lib/auth";
import { Modal } from "./ui";

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

type Step = "start" | "otp-email" | "otp-verify" | "password";

export default function AuthModal() {
  const { authOpen, closeAuth, signIn, adoptSession } = useAuth();
  const { settings } = useSettings();
  const [step, setStep] = useState<Step>("start");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authOpen) {
      setStep("start");
      setError("");
      setBusy(false);
      setPassword("");
      setCode("");
    }
  }, [authOpen]);

  const google = async () => {
    setError("");
    setBusy(true);
    try {
      await signIn();
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
    const result = await sendEmailOtp(email.trim(), settings.supabase);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setStep("otp-verify");
  };

  const confirmCode = async () => {
    if (!code.trim()) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await verifyEmailOtp(email.trim(), code.trim(), settings.supabase);
    setBusy(false);
    if (!result.ok || !result.session) {
      setError(result.message);
      return;
    }
    adoptSession(result.session);
    closeAuth();
  };

  const submitPassword = async () => {
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    setError("");
    setBusy(true);
    const result =
      mode === "signin"
        ? await signInWithPassword(email.trim(), password, settings.supabase)
        : await signUpWithPassword(email.trim(), password, settings.supabase);
    setBusy(false);
    if (!result.ok || !result.session) {
      setError(result.message);
      return;
    }
    adoptSession(result.session);
    closeAuth();
  };

  return (
    <Modal
      open={authOpen}
      onClose={closeAuth}
      title="Entrar na sua conta"
      description="A conta sincroniza configurações e conversas. O app funciona sem ela."
      width={400}
    >
      <div className="space-y-2.5">
        {error ? (
          <p
            className="rounded-lg border px-3 py-2 text-[11px] leading-relaxed"
            style={{ borderColor: "#7f1d1d", background: "#2a1213", color: "#fca5a5" }}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {step === "start" ? (
          <>
            <button
              type="button"
              onClick={() => void google()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border px-3 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-60"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
            >
              {GoogleIcon}
              {busy ? "Abrindo o Google..." : "Continuar com Google"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("signin");
                setStep("password");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12.5px] font-medium transition-colors"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Entrar com e-mail e senha
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setStep("otp-email");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12.5px] font-medium transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <Mail className="h-3.5 w-3.5" />
              Receber código por e-mail
            </button>
            <p className="text-center text-[10px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
              O código depende de SMTP configurado no Supabase. E-mail e senha e Google não.
            </p>
          </>
        ) : null}

        {step === "otp-email" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void requestCode();
            }}
            className="space-y-2.5"
          >
            <label className="block text-[11.5px]" style={{ color: "var(--muted)" }}>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                className="input mt-1.5 !text-base sm:!text-[13px]"
                autoFocus
                autoComplete="email"
                required
              />
            </label>
            <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Enviar código de 6 dígitos
            </button>
            <button type="button" onClick={() => setStep("start")} className="btn btn-ghost w-full !text-[11px]">
              Voltar
            </button>
          </form>
        ) : null}

        {step === "otp-verify" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void confirmCode();
            }}
            className="space-y-2.5"
          >
            <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
              Enviamos um código para <span style={{ color: "var(--text)" }}>{email}</span>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              maxLength={6}
              className="input mono !text-base tracking-[0.35em] sm:!text-[15px]"
              autoFocus
              autoComplete="one-time-code"
              required
            />
            <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Confirmar e entrar
            </button>
            <div className="flex items-center justify-between text-[10.5px]" style={{ color: "var(--muted-2)" }}>
              <button type="button" onClick={() => void requestCode()} className="underline decoration-dotted">
                Reenviar código
              </button>
              <button type="button" onClick={() => setStep("otp-email")} className="underline decoration-dotted">
                Trocar e-mail
              </button>
            </div>
          </form>
        ) : null}

        {step === "password" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitPassword();
            }}
            className="space-y-2.5"
          >
            <label className="block text-[11.5px]" style={{ color: "var(--muted)" }}>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                className="input mt-1.5 !text-base sm:!text-[13px]"
                autoFocus
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-[11.5px]" style={{ color: "var(--muted)" }}>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="mínimo 6 caracteres"
                className="input mt-1.5 !text-base sm:!text-[13px]"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </label>
            <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
            <div className="flex items-center justify-between text-[10.5px]" style={{ color: "var(--muted-2)" }}>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMode((prev) => (prev === "signin" ? "signup" : "signin"));
                }}
                className="underline decoration-dotted"
              >
                {mode === "signin" ? "Criar uma conta" : "Já tenho conta"}
              </button>
              <button type="button" onClick={() => setStep("start")} className="underline decoration-dotted">
                Outras opções
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </Modal>
  );
}