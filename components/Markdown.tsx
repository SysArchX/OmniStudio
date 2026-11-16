"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

/** Renderiza markdown básico sem HTML injetado: blocos de código, listas, títulos e ênfase. */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="mono rounded px-1 py-[1px] text-[0.92em]" style={{ background: "var(--surface-3)" }}>
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const label = /\[([^\]]+)\]/.exec(token)?.[1] ?? match[2];
      nodes.push(
        <a
          key={key}
          href={match[2]}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-dotted underline-offset-2"
        >
          {label}
        </a>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
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
    <div className="my-2.5 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)", background: "#0c0c0e" }}>
      <div className="flex items-center justify-between border-b px-3 py-1.5" style={{ borderColor: "var(--border)" }}>
        <span className="mono text-[10px]" style={{ color: "var(--muted-2)" }}>
          {language || "código"}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-80"
          style={{ color: "var(--muted)" }}
          aria-label="Copiar código"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="mono overflow-x-auto px-3 py-2.5 text-[11.5px] leading-relaxed" style={{ color: "#e4e4e7" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Markdown({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const fence = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  const renderText = (chunk: string, prefix: string) => {
    const lines = chunk.split("\n");
    const output: ReactNode[] = [];
    let list: string[] = [];

    const flushList = () => {
      if (!list.length) return;
      output.push(
        <ul key={`${prefix}-ul-${output.length}`} className="my-1.5 list-disc space-y-1 pl-4">
          {list.map((item, index) => (
            <li key={`${prefix}-li-${index}`}>{inline(item, `${prefix}-li-${index}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    };

    lines.forEach((raw, index) => {
      const line = raw.trimEnd();
      const key = `${prefix}-l-${index}`;
      if (/^\s*[-*]\s+/.test(line)) {
        list.push(line.replace(/^\s*[-*]\s+/, ""));
        return;
      }
      flushList();
      if (!line.trim()) return;
      if (/^#{1,3}\s+/.test(line)) {
        const level = line.match(/^#+/)?.[0].length ?? 2;
        output.push(
          <p key={key} className={level === 1 ? "mt-2 text-[15px] font-semibold" : "mt-2 text-[13.5px] font-semibold"}>
            {inline(line.replace(/^#{1,3}\s+/, ""), key)}
          </p>,
        );
        return;
      }
      if (/^>\s?/.test(line)) {
        output.push(
          <blockquote key={key} className="my-1.5 border-l-2 pl-3 text-[12.5px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {inline(line.replace(/^>\s?/, ""), key)}
          </blockquote>,
        );
        return;
      }
      output.push(
        <p key={key} className="my-1 leading-relaxed">
          {inline(line, key)}
        </p>,
      );
    });
    flushList();
    return output;
  };

  while ((match = fence.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<div key={`t-${blockIndex++}`}>{renderText(text.slice(last, match.index), `t-${blockIndex}`)}</div>);
    }
    parts.push(<CodeBlock key={`c-${blockIndex++}`} code={match[2].replace(/\n$/, "")} language={match[1]} />);
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(<div key={`t-${blockIndex++}`}>{renderText(text.slice(last), `t-${blockIndex}`)}</div>);
  }

  return <div className="text-[13px] leading-relaxed">{parts}</div>;
}
