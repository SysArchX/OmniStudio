"use client";

import { useEffect, useState } from "react";
import { Loader2, Monitor, Send, Wifi } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useSettings } from "@/lib/settings-store";
import {
  deviceLabel,
  listCommands,
  listDevices,
  queueCommand,
  type RemoteCommand,
  type RemoteDevice,
} from "@/lib/remote";
import { Badge } from "./ui";

/**
 * Celular → PC: a conta publica o comando e o app instalado no computador
 * executa no terminal dele e devolve a saída. Nada roda no telefone.
 */
export default function RemoteControl() {
  const { settings } = useSettings();
  const { session, openAuth } = useAuth();
  const [devices, setDevices] = useState<RemoteDevice[]>([]);
  const [commands, setCommands] = useState<RemoteCommand[]>([]);
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setDevices([]);
      setCommands([]);
      return;
    }
    let alive = true;
    const load = async () => {
      const [nextDevices, nextCommands] = await Promise.all([
        listDevices(settings.supabase, session),
        listCommands(settings.supabase, session),
      ]);
      if (!alive) return;
      setDevices(nextDevices);
      setCommands(nextCommands);
    };
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [session, settings.supabase]);

  const send = async () => {
    const text = command.trim();
    if (!text || !session) return;
    setBusy(true);
    const id = await queueCommand(settings.supabase, session, text);
    setNote(id ? "Comando enviado. O PC executa em segundos." : "Não consegui enfileirar. Confira a tabela remote_commands.");
    if (id) setCommand("");
    setCommands(await listCommands(settings.supabase, session));
    setBusy(false);
  };

  const online = devices.filter((device) => device.status !== "offline");

  return (
    <div className="panel space-y-2 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[12px] font-medium">
          <Monitor className="h-3.5 w-3.5" />
          Controle remoto do PC
        </p>
        <Badge tone={online.length ? "ok" : "neutral"}>
          {online.length ? `${online.length} online` : "nenhum PC"}
        </Badge>
      </div>
      <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
        Este aparelho é {deviceLabel()}. Comandos enviados aqui rodam no terminal do app instalado no computador, com a
        mesma conta logada — é assim que você começa um trabalho no PC e continua pelo celular.
      </p>

      {!session ? (
        <button type="button" onClick={openAuth} className="btn w-full justify-center !text-[11px]">
          Entrar para usar o controle remoto
        </button>
      ) : (
        <>
          <div className="space-y-1">
            {devices.length ? (
              devices.map((device) => (
                <div
                  key={device.deviceId}
                  className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: device.status === "offline" ? "var(--border-strong)" : "#4ade80" }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[11px]">{device.name}</span>
                  <span className="shrink-0 text-[10px]" style={{ color: "var(--muted-2)" }}>
                    {device.os}
                  </span>
                </div>
              ))
            ) : (
              <p className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                <Wifi className="h-3 w-3" />
                Abra o app no computador com esta conta para o PC aparecer aqui.
              </p>
            )}
          </div>

          <div className="flex gap-1.5">
            <input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void send();
              }}
              placeholder="ex.: npm run build"
              aria-label="Comando remoto"
              className="input mono !h-8 min-w-0 flex-1 !text-[10.5px]"
            />
            <button type="button" onClick={() => void send()} disabled={busy || !command.trim()} className="btn shrink-0 !text-[10.5px]">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </button>
          </div>
          {note ? (
            <p className="text-[10px]" style={{ color: "var(--muted-2)" }}>
              {note}
            </p>
          ) : null}

          {commands.length ? (
            <div className="max-h-[180px] space-y-1 overflow-y-auto">
              {commands.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border px-2 py-1" style={{ borderColor: "var(--border)" }}>
                  <p className="mono truncate text-[9.5px]" style={{ color: "var(--muted-2)" }}>
                    {item.status} · {item.command}
                  </p>
                  {item.output ? (
                    <pre
                      className="mono mt-0.5 max-h-[70px] overflow-auto whitespace-pre-wrap text-[9px]"
                      style={{ color: "var(--muted)" }}
                    >
                      {item.output.slice(0, 500)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
