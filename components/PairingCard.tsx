"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, MonitorSmartphone, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useSettings } from "@/lib/settings-store";
import { createPairingCode, pairingUrl, waitForPairingApproval } from "@/lib/pairing";
import { detectPlatform } from "@/lib/platform";

type Phase = "idle" | "creating" | "waiting" | "done" | "error";

/**
 * Cartão "Entrar com Código no Navegador": gera OMNI-XXXX, abre o navegador
 * para autorizar e troca a aprovação pela sessão.
 */
export default function PairingCard({ onPaired, compact }: { onPaired?: () => void; compact?: boolean }) {
  const { adoptSession, closeAuth } = useAuth();
  const { settings } = useSettings();
  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (phase !== "waiting" || !code) return undefined;
    const controller = new AbortController();
    void waitForPairingApproval(code, { config: settings.supabase, signal: controller.signal })
      .then((session) => {
        adoptSession(session);
        setPhase("done");
        setMessage(`Conectado como ${session.user.email}.`);
        onPaired?.();
        closeAuth();
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPhase("error");
        setMessage(error instanceof Error ? error.message : "Não foi possível concluir o pareamento.");
      });
    return () => controller.abort();
  }, [phase, code, settings.supabase, adoptSession, closeAuth, onPaired]);

  const start = async () => {
    setPhase("creating");
    setMessage("");
    const result = await createPairingCode(detectPlatform().label, settings.supabase);
    if (!result.ok || !result.code) {
      setPhase("error");
      setMessage(result.message);
      return;
    }
    setCode(result.code);
    setPhase("waiting");
    const url = pairingUrl(result.code, typeof window === "undefined" ? undefined : window.location.origin);
    window.open(url, "_blank", "noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard bloqueado */
    }
  };

  return (
    <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
      <div className="flex items-center gap-1.5">
        <MonitorSmartphone className="h-3.5 w-3.5" strokeWidth={1.7} />
        <p className="text-[12px] font-medium">Entrar com código no navegador</p>
        {compact ? null : (
          <span className="ml-auto rounded-full px-1.5 py-0.5 text-[9.5px]" style={{ background: "var(--accent-soft)", color: "var(--text)" }}>
            recomendado
          </span>
        )}
      </div>

      {phase === "waiting" && code ? (
        <>
          <div className="flex items-center gap-2">
            <p className="mono flex-1 text-center text-[20px] font-semibold tracking-[0.12em]">{code}</p>
            <button type="button" onClick={() => void copy()} className="btn btn-ghost !p-1.5" aria-label="Copiar código" title="Copiar">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-[10.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            <Loader2 className="h-3 w-3 animate-spin" />
            Autorize em {pairingUrl(code).replace(/^https?:\/\//, "").split("?")[0]} e volte aqui. O app entra sozinho.
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => window.open(pairingUrl(code, window.location.origin), "_blank", "noreferrer")}
              className="btn flex-1 justify-center !text-[11px]"
            >
              Abrir navegador
            </button>
            <button type="button" onClick={() => void start()} className="btn btn-ghost !p-2" aria-label="Gerar outro código" title="Gerar outro">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
            Gera um código curto, você aprova no navegador já logado e este aparelho entra sem digitar senha.
          </p>
          <button
            type="button"
            onClick={() => void start()}
            disabled={phase === "creating"}
            className="btn w-full justify-center !text-[11.5px] disabled:opacity-60"
          >
            {phase === "creating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {phase === "creating" ? "Gerando código..." : "Gerar código de pareamento"}
          </button>
        </>
      )}

      {message ? (
        <p
          className="text-[10.5px] leading-relaxed"
          style={{ color: phase === "error" ? "#fca5a5" : "var(--muted)" }}
          role={phase === "error" ? "alert" : undefined}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
