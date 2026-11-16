"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useSettings } from "@/lib/settings-store";
import { approvePairingCode, normalizePairingCode } from "@/lib/pairing";

type Phase = "idle" | "working" | "done" | "error" | "login";

/**
 * Tela de autorização do pareamento: o navegador logado aprova `?pair=OMNI-XXXX`
 * e devolve os tokens para o app que está esperando.
 */
export default function PairAuthorize({ code, onClose }: { code: string; onClose: () => void }) {
  const { session, openAuth, ready } = useAuth();
  const { settings } = useSettings();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const handledFor = useRef<string | null>(null);

  const target = normalizePairingCode(code);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      setPhase("login");
      return;
    }
    if (handledFor.current === `${target}:${session.user.id}`) return;
    handledFor.current = `${target}:${session.user.id}`;
    setPhase("working");
    void approvePairingCode(target, session, settings.supabase).then((result) => {
      setPhase(result.ok ? "done" : "error");
      setMessage(result.message);
    });
  }, [ready, session, target, settings.supabase]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" style={{ background: "color-mix(in srgb, #09090b 82%, transparent)" }}>
      <div
        className="w-full max-w-[420px] rounded-2xl border p-5"
        style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.7} />
          <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Autorizar aparelho</h2>
        </div>

        <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Um aplicativo OmniStudio pediu acesso com o código abaixo. Autorizar conecta esse aparelho à sua conta
          {session ? ` (${session.user.email})` : ""}.
        </p>

        <p className="mono mt-3 rounded-xl border px-3 py-2.5 text-center text-[18px] font-semibold tracking-[0.14em]" style={{ borderColor: "var(--border)" }}>
          {target}
        </p>

        {phase === "login" ? (
          <button type="button" onClick={openAuth} className="btn btn-primary mt-3 w-full justify-center !text-[12px]">
            Entrar para autorizar
          </button>
        ) : null}

        {phase === "working" ? (
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Autorizando...
          </p>
        ) : null}

        {phase === "done" ? (
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px]" style={{ color: "#86efac" }}>
            <Check className="h-3.5 w-3.5" />
            {message}
          </p>
        ) : null}

        {phase === "error" ? (
          <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: "#fca5a5" }} role="alert">
            {message}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="btn flex-1 justify-center !text-[11.5px]">
            Fechar
          </button>
          {phase === "done" ? (
            <button
              type="button"
              onClick={() => {
                window.location.assign(window.location.pathname);
              }}
              className="btn btn-primary flex-1 justify-center !text-[11.5px]"
            >
              Ir para o chat
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
