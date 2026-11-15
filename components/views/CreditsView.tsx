"use client";

import { Monitor, Smartphone, Terminal, UserRound } from "lucide-react";
import type { PlatformInfo } from "@/lib/platform";
import { APP_NAME, APP_VERSION, DOWNLOADS, ECOSYSTEM, OWNER, PROFILE_URL, REPO_URL, TECH_STACK, downloadUrl } from "@/lib/releases";
import { Badge } from "../ui";

export default function CreditsView({ platform }: { platform: PlatformInfo }) {
  return (
    <div className="h-full min-h-0 overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-[680px] space-y-5">
        <section className="panel p-4">
          <div className="flex items-start gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[15px] font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              O
            </div>
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{APP_NAME}</h2>
              <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
                Chat com provedores gratuitos, estúdio de vídeo 2D e modo agente no mesmo lugar. Versão {APP_VERSION}, criada por{" "}
                {OWNER}.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="neutral">
                  <Terminal className="h-3 w-3" />
                  {platform.label}
                </Badge>
                {TECH_STACK.slice(0, 4).map((item) => (
                  <Badge key={item} tone="neutral">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[12px] font-medium">Downloads</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {DOWNLOADS.map((item) => (
              <a
                key={item.key}
                href={downloadUrl(item.key)}
                target="_blank"
                rel="noreferrer"
                className="panel p-3 transition-colors hover:border-[var(--border-strong)]"
              >
                <span className="flex items-center gap-2 text-[12px] font-medium">
                  {item.key === "apk" ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                  {item.label}
                </span>
                <span className="mt-1 block text-[10.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {item.platform} · {item.detail}
                </span>
                {item.command ? (
                  <code className="mono mt-1.5 block truncate text-[10px]" style={{ color: "var(--muted-2)" }}>
                    {item.command}
                  </code>
                ) : null}
              </a>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[12px] font-medium">Ecossistema</h3>
          <div className="space-y-2">
            {ECOSYSTEM.map((item) => (
              <a
                key={item.name}
                href={`https://github.com/${OWNER}/${item.repo}`}
                target="_blank"
                rel="noreferrer"
                className="panel block p-3 transition-colors hover:border-[var(--border-strong)]"
              >
                <span className="text-[12px] font-medium">{item.name}</span>
                <span className="mt-1 block text-[10.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {item.description}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="panel flex items-center justify-between gap-3 p-3.5">
          <div>
            <p className="text-[12px] font-medium">Criador</p>
            <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
              Código, builds e manutenção por {OWNER}.
            </p>
          </div>
          <a href={PROFILE_URL} target="_blank" rel="noreferrer" className="btn btn-ghost !text-[11px]">
            <UserRound className="h-3.5 w-3.5" />
            {OWNER}
          </a>
        </section>

        <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
          Repositório: <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline decoration-dotted">{REPO_URL.replace("https://", "")}</a>
        </p>
      </div>
    </div>
  );
}
