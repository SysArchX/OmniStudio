"use client";

import { useEffect, useState } from "react";
import { Check, Download, Share2, X } from "lucide-react";
import { DOWNLOADS, SHORT_URL, downloadUrl } from "@/lib/releases";

export default function DownloadsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(SHORT_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(SHORT_URL, "_blank", "noreferrer");
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Baixar aplicativos"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl border p-4"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold">Baixar aplicativos</h2>
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
              Instaladores gratuitos publicados na release mais recente do GitHub.
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost !p-1.5" aria-label="Fechar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => void share()}
          className="btn btn-ghost mb-2 w-full justify-center !text-[11px]"
        >
          {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
          {copied ? "Link copiado: " : "Compartilhar: "}
          {SHORT_URL.replace("https://", "")}
        </button>

        <div className="space-y-1.5">
          {DOWNLOADS.map((item) => (
            <a
              key={item.key}
              href={downloadUrl(item.key)}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 rounded-lg border p-2.5 transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)" }}
            >
              <Download className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-[12px] font-medium">
                  {item.label} · {item.platform}
                </span>
                <span className="block text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                  {item.detail}
                </span>
                {item.command ? (
                  <span className="mono mt-0.5 block truncate text-[9.5px]" style={{ color: "var(--muted-2)" }}>
                    {item.command}
                  </span>
                ) : null}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
