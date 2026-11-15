"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={cn("panel", interactive && "card-hover", className)}>{children}</div>
  );
}

export function SectionHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-2.5">
        {icon ? <span className="mt-0.5 muted">{icon}</span> : null}
        <div>
          <h2 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description ? <p className="mt-0.5 max-w-xl text-[11.5px] leading-relaxed muted">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-relaxed muted">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border px-3.5 py-2.5 text-left transition"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <span>
        <span className="block text-[12.5px] font-medium">{label}</span>
        {description ? <span className="mt-0.5 block text-[11px] leading-relaxed muted">{description}</span> : null}
      </span>
      <span
        className="relative h-[20px] w-[34px] shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--border-strong)" }}
      >
        <span
          className="absolute top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-all"
          style={{ left: checked ? 16 : 2 }}
        />
      </span>
    </button>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="mono text-[11px]" style={{ color: "var(--muted)" }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex gap-1 rounded-xl border p-1", className)}
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className="flex-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition"
          style={
            value === option.value
              ? { background: "var(--accent)", color: "var(--accent-ink)" }
              : { color: "var(--muted)" }
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warn" | "danger" | "ok";
}) {
  const styles: Record<string, React.CSSProperties> = {
    neutral: { color: "var(--muted)", borderColor: "var(--border)", background: "var(--surface-2)" },
    accent: {
      color: "var(--accent)",
      borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
      background: "color-mix(in srgb, var(--accent) 10%, transparent)",
    },
    warn: { color: "#fbbf24", borderColor: "rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.08)" },
    danger: { color: "#fb7185", borderColor: "rgba(251,113,133,0.35)", background: "rgba(251,113,133,0.08)" },
    ok: { color: "#4ade80", borderColor: "rgba(74,222,128,0.35)", background: "rgba(74,222,128,0.08)" },
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
      style={styles[tone]}
    >
      {children}
    </span>
  );
}

export function StatusDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 720,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70"
            style={{ backdropFilter: "blur(6px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="panel relative z-10 max-h-[88vh] w-full overflow-hidden"
            style={{ maxWidth: width }}
          >
            <div
              className="flex items-start justify-between gap-4 border-b px-5 py-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <h2 className="text-[14px] font-semibold">{title}</h2>
                {description ? <p className="mt-1 text-[11.5px] leading-relaxed muted">{description}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost !p-1.5" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(88vh-76px)] overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div
        className="mb-3 grid h-11 w-11 place-items-center rounded-xl border"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
      >
        {icon}
      </div>
      <h3 className="text-[13.5px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed muted">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
