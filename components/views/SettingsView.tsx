"use client";

import { useEffect, useState } from "react";
import { Check, CloudDownload, CloudUpload, Eye, EyeOff, KeyRound, Loader2, LogOut, Palette, UserRound } from "lucide-react";
import { ACCENTS, useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-store";
import { providerKeyHelp, PROVIDER_LABEL, PROVIDER_MODEL, PROVIDER_ORDER, testProvider, type ProviderTestResult } from "@/lib/ai";
import { pullConversations, pullSettings, pushConversations, pushSettings, testSupabase } from "@/lib/cloud";
import { ptBrVoices, speak } from "@/lib/tts";
import type { Conversation, ProviderId, ThemeId } from "@/lib/types";
import { Badge, Range, Toggle, cn } from "../ui";

type TabId = "keys" | "appearance" | "account";

const TABS: Array<{ id: TabId; label: string; icon: typeof KeyRound }> = [
  { id: "keys", label: "Chaves de API", icon: KeyRound },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "account", label: "Conta e nuvem", icon: UserRound },
];

const THEMES: Array<{ id: ThemeId; label: string; swatch: [string, string, string] }> = [
  { id: "obsidian", label: "Obsidiana", swatch: ["#09090b", "#111114", "#e4e4e7"] },
  { id: "midnight", label: "Meia-noite", swatch: ["#0a0d14", "#101623", "#93c5fd"] },
  { id: "light", label: "Claro", swatch: ["#f7f7f8", "#ffffff", "#18181b"] },
];

const STATUS_LABEL: Record<string, string> = {
  connected: "Conectado",
  limit: "Limite atingido",
  auth: "Chave recusada",
  network: "Sem conexão",
  error: "Erro no provedor",
  idle: "Standby",
};

const STATUS_TONE: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  connected: "ok",
  limit: "warn",
  auth: "danger",
  network: "danger",
  error: "warn",
  idle: "neutral",
};

export default function SettingsView() {
  const { settings, update, updateKeys, updateSupabase, reset } = useSettings();
  const { session, signIn, signOut, configured } = useAuth();
  const [tab, setTab] = useState<TabId>("keys");
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<ProviderId, ProviderTestResult & { testing?: boolean }>>({
    groq: { ok: false, status: "idle", message: "Standby" },
    openrouter: { ok: false, status: "idle", message: "Standby" },
    github: { ok: false, status: "idle", message: "Standby" },
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [sync, setSync] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setVoices(ptBrVoices()), []);

  const test = async (provider: ProviderId) => {
    setStatus((prev) => ({ ...prev, [provider]: { ...prev[provider], testing: true } }));
    const result = await testProvider(provider, settings.keys[provider]);
    setStatus((prev) => ({ ...prev, [provider]: { ...result, testing: false } }));
  };

  const readConversations = (): Conversation[] => {
    try {
      return JSON.parse(window.localStorage.getItem("omnistudio.chats.v1") ?? "[]") as Conversation[];
    } catch {
      return [];
    }
  };

  const cloudTest = async () => {
    setBusy(true);
    setSync((await testSupabase(settings.supabase, session)).message);
    setBusy(false);
  };

  const cloudPush = async () => {
    setBusy(true);
    const settingsResult = await pushSettings(settings, settings.supabase, session);
    const chats = await pushConversations(readConversations(), settings.supabase, session);
    setSync(`${settingsResult.message} ${chats.message}`);
    setBusy(false);
  };

  const cloudPull = async () => {
    setBusy(true);
    const settingsResult = await pullSettings(settings.supabase, session);
    if (settingsResult.ok && settingsResult.data) {
      update({
        ...settingsResult.data,
        supabase: settings.supabase,
        keys: { ...settings.keys, ...(settingsResult.data.keys ?? {}) },
      });
    }
    const chatsResult = await pullConversations(settings.supabase, session);
    if (chatsResult.ok && chatsResult.data) {
      try {
        window.localStorage.setItem("omnistudio.chats.v1", JSON.stringify(chatsResult.data));
      } catch {
        /* quota */
      }
    }
    setSync(`${settingsResult.message} ${chatsResult.message}`);
    setBusy(false);
  };

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-[190px] shrink-0 border-r px-2 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
              className={cn("mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors")}
              style={
                tab === item.id
                  ? { background: "var(--surface-2)", color: "var(--text)" }
                  : { color: "var(--muted)" }
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
        <div className="mt-4 border-t px-2 pt-3" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={reset} className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
            Restaurar padrões
          </button>
        </div>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[680px] px-6 py-5">
          {tab === "keys" ? (
            <div className="space-y-3">
              <div>
                <h2 className="text-[14px] font-semibold">Provedores gratuitos</h2>
                <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  Groq responde primeiro, OpenRouter assume no limite e o GitHub Models fecha a fila. As chaves ficam só neste dispositivo.
                </p>
              </div>

              {PROVIDER_ORDER.map((provider) => {
                const current = status[provider];
                return (
                  <div key={provider} className="panel p-3.5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium">{PROVIDER_LABEL[provider]}</p>
                        <p className="mono truncate text-[9.5px]" style={{ color: "var(--muted-2)" }}>
                          {PROVIDER_MODEL[provider]}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[current.status] ?? "neutral"}>
                        {current.testing ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
                        {STATUS_LABEL[current.status] ?? "Standby"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={reveal[provider] ? "text" : "password"}
                          value={settings.keys[provider]}
                          onChange={(event) => updateKeys({ [provider]: event.target.value })}
                          placeholder={`Cole a chave ${PROVIDER_LABEL[provider]}`}
                          className="input mono pr-9 !text-[11px]"
                          spellCheck={false}
                          aria-label={`Chave ${PROVIDER_LABEL[provider]}`}
                        />
                        <button
                          type="button"
                          onClick={() => setReveal((prev) => ({ ...prev, [provider]: !prev[provider] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          style={{ color: "var(--muted-2)" }}
                          aria-label={reveal[provider] ? "Ocultar chave" : "Mostrar chave"}
                        >
                          {reveal[provider] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <button type="button" onClick={() => void test(provider)} className="btn shrink-0">
                        Testar
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px]" style={{ color: "var(--muted-2)" }}>
                      <span className="truncate">{current.status === "idle" ? "Nenhum teste executado." : current.message}</span>
                      <a href={`https://${providerKeyHelp(provider)}`} target="_blank" rel="noreferrer" className="shrink-0 underline decoration-dotted">
                        obter chave
                      </a>
                    </div>
                  </div>
                );
              })}

              <Toggle
                label="Troca automática de provedor"
                description="Em 429 ou cota esgotada, pula para o próximo sem interromper a conversa."
                checked={settings.fallback}
                onChange={(fallback) => update({ fallback })}
              />

              <div className="panel p-3.5">
                <p className="text-[12px] font-medium">Voz da narração</p>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  Só vozes brasileiras são aceitas. {voices.length} encontrada(s) neste navegador.
                </p>
                <select
                  value={settings.voiceURI ?? ""}
                  onChange={(event) => update({ voiceURI: event.target.value })}
                  className="input mt-2 !text-[11.5px]"
                  aria-label="Voz pt-BR"
                >
                  {voices.length ? (
                    voices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))
                  ) : (
                    <option value="">Nenhuma voz pt-BR instalada</option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => speak("Teste de voz em português do Brasil.", { voiceURI: settings.voiceURI, rate: settings.rate })}
                  className="btn btn-ghost mt-2 w-full justify-center !text-[11px]"
                >
                  Ouvir Teste de Voz
                </button>
                <div className="mt-3">
                  <Range
                    label="Velocidade"
                    min={0.8}
                    max={1.4}
                    step={0.02}
                    value={settings.rate}
                    onChange={(rate) => update({ rate })}
                    format={(value) => `${value.toFixed(2)}x`}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {tab === "appearance" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-[14px] font-semibold">Aparência</h2>
                <p className="mt-1 text-[11.5px]" style={{ color: "var(--muted)" }}>
                  Tudo aplica na hora, sem recarregar.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => update({ theme: theme.id })}
                    className="panel p-2.5 text-left"
                    style={{ borderColor: settings.theme === theme.id ? "var(--accent)" : "var(--border)" }}
                  >
                    <span className="mb-2 flex h-10 overflow-hidden rounded-md border" style={{ borderColor: "var(--border)" }}>
                      {theme.swatch.map((color) => (
                        <span key={color} className="flex-1" style={{ background: color }} />
                      ))}
                    </span>
                    <span className="flex items-center justify-between text-[11.5px]">
                      {theme.label}
                      {settings.theme === theme.id ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                  </button>
                ))}
              </div>

              <div className="panel p-3.5">
                <p className="label mb-2">Cor de destaque</p>
                <div className="flex gap-2">
                  {ACCENTS.map((accent) => (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => update({ accent: accent.value })}
                      aria-label={accent.label}
                      className="h-7 w-7 rounded-full border-2"
                      style={{
                        background: accent.value,
                        borderColor: settings.accent === accent.value ? "var(--text)" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              <Toggle
                label="Modo econômico"
                description="Reduz blur e animações para gastar menos RAM e GPU."
                checked={settings.performance}
                onChange={(performance) => update({ performance })}
              />
              <Toggle
                label="Densidade compacta"
                description="Mais informação por tela, útil em notebooks."
                checked={settings.density === "compact"}
                onChange={(compact) => update({ density: compact ? "compact" : "comfortable" })}
              />
              <Range
                label="Volume dos efeitos"
                min={0}
                max={1}
                step={0.05}
                value={settings.sfxVolume}
                onChange={(sfxVolume) => update({ sfxVolume })}
                format={(value) => `${Math.round(value * 100)}%`}
              />
            </div>
          ) : null}

          {tab === "account" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-[14px] font-semibold">Conta e nuvem</h2>
                <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  O login usa o Supabase do seu projeto. Sem ele, o app funciona no modo local.
                </p>
              </div>

              <div className="panel space-y-2.5 p-3.5">
                <div>
                  <label className="label" htmlFor="supabase-url">
                    URL do projeto
                  </label>
                  <input
                    id="supabase-url"
                    value={settings.supabase.url}
                    onChange={(event) => updateSupabase({ url: event.target.value })}
                    placeholder="https://xxxx.supabase.co"
                    className="input mono mt-1 !text-[11px]"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="supabase-key">
                    Anon key
                  </label>
                  <input
                    id="supabase-key"
                    type="password"
                    value={settings.supabase.anonKey}
                    onChange={(event) => updateSupabase({ anonKey: event.target.value })}
                    placeholder="eyJhbGciOi..."
                    className="input mono mt-1 !text-[11px]"
                    spellCheck={false}
                  />
                </div>
                <Toggle
                  label="Ativar sincronização"
                  description="Conversas, configurações e chaves vão para o seu projeto Supabase."
                  checked={settings.supabase.enabled}
                  onChange={(enabled) => updateSupabase({ enabled })}
                />
                <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                  Rode o arquivo supabase-schema.sql no SQL Editor, ative o provider Google e cadastre a URL de retorno em
                  Authentication → URL Configuration.{" "}
                  <a
                    href="https://github.com/SysArchX/OmniStudio/blob/main/docs/google-login-setup.md"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-dotted"
                    style={{ color: "var(--text)" }}
                  >
                    Passo a passo completo
                  </a>
                </p>
              </div>

              <div className="panel space-y-2.5 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {session?.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.avatar} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full text-[11px]" style={{ background: "var(--surface-3)" }}>
                        OS
                      </span>
                    )}
                    <div>
                      <p className="text-[12px] font-medium">{session ? session.user.name : "Modo local"}</p>
                      <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                        {session ? session.user.email : "sem conta conectada"}
                      </p>
                    </div>
                  </div>
                  {session ? (
                    <button type="button" onClick={() => void signOut()} className="btn btn-ghost !text-[11px]">
                      <LogOut className="h-3 w-3" />
                      Sair
                    </button>
                  ) : (
                    <button type="button" onClick={signIn} disabled={!configured} className="btn !text-[11px]">
                      Entrar com Google
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => void cloudTest()} disabled={busy} className="btn btn-ghost !text-[11px]">
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Testar conexão
                  </button>
                  <button type="button" onClick={() => void cloudPush()} disabled={busy || !session} className="btn btn-ghost !text-[11px]">
                    <CloudUpload className="h-3 w-3" />
                    Enviar
                  </button>
                  <button type="button" onClick={() => void cloudPull()} disabled={busy || !session} className="btn btn-ghost !text-[11px]">
                    <CloudDownload className="h-3 w-3" />
                    Baixar
                  </button>
                </div>
                {sync ? (
                  <p className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
                    {sync}
                  </p>
                ) : null}
              </div>

              <div className="panel space-y-2 p-3.5">
                <p className="text-[12px] font-medium">Sobre as chaves</p>
                <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                  Groq, OpenRouter e GitHub Models são gratuitos dentro dos limites de cada serviço. A pesquisa web não usa
                  chave: consulta Wikipédia e DuckDuckGo e lê páginas pelo Jina Reader.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
