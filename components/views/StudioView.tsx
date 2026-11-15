"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Music2, Pause, Play, Plus, Sparkles, Volume2 } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { generateVideoScript, ANIMATIONS, ENVIRONMENTS } from "@/lib/script-gen";
import { buildTimeline, composeFrame, downloadVideo, recordVideo, type RecordResult } from "@/lib/video-render";
import { VIDEO_H, VIDEO_W } from "@/lib/scene2d";
import { cancelSpeech, loadUserAudio, onVoicesChanged, speak } from "@/lib/tts";
import { SfxEngine, type SfxName } from "@/lib/sfx";
import type { StudioProject, VideoScene } from "@/lib/types";
import { Badge, Range } from "../ui";

const EMPTY_PROJECT: StudioProject = {
  topic: "",
  title: "Sem roteiro",
  scenes: [],
  voiceURI: null,
  rate: 1.02,
  sfxEnabled: true,
};

export default function StudioView() {
  const { settings } = useSettings();
  const [topic, setTopic] = useState("como sobreviver a areia movediça");
  const [project, setProject] = useState<StudioProject>(EMPTY_PROJECT);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RecordResult | null>(null);
  const [audio, setAudio] = useState<{ url: string; name: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const sceneRef = useRef(-1);
  const rafRef = useRef(0);
  const cancelRef = useRef(false);
  const playingRef = useRef(false);

  useEffect(() => onVoicesChanged(setVoices), []);

  useEffect(() => {
    const voice = voices[0];
    if (voice && !project.voiceURI) setProject((prev) => ({ ...prev, voiceURI: voice.voiceURI }));
  }, [voices, project.voiceURI]);

  const timeline = useMemo(() => buildTimeline(project), [project]);

  const drawAt = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (!project.scenes.length) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#0b0b0e";
        ctx.fillRect(0, 0, VIDEO_W, VIDEO_H);
        ctx.fillStyle = "#3f3f46";
        ctx.font = '500 26px "Inter Variable", system-ui, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("Gere um roteiro", VIDEO_W / 2, VIDEO_H / 2 - 16);
        ctx.font = '400 20px "Inter Variable", system-ui, sans-serif';
        ctx.fillStyle = "#27272a";
        ctx.fillText("720 × 1280 · 30 FPS", VIDEO_W / 2, VIDEO_H / 2 + 24);
        return;
      }
      composeFrame(ctx, { project, time, timeline });
    },
    [project, timeline],
  );

  useEffect(() => {
    drawAt(timeRef.current);
  }, [drawAt]);

  useEffect(() => {
    const loop = () => {
      if (playingRef.current) {
        const now = performance.now();
        const last = timeRef.current;
        const next = last + 1 / 60;
        timeRef.current = next;
        if (next >= timeline.duration) {
          timeRef.current = 0;
          playingRef.current = false;
          setPlaying(false);
          cancelSpeech();
        }
        setElapsed(timeRef.current);
        drawAt(timeRef.current);

        const current = timeline.items.find((item) => timeRef.current >= item.start && timeRef.current < item.end);
        if (current && current.index !== sceneRef.current) {
          sceneRef.current = current.index;
          cancelSpeech();
          speak(current.scene.text, { voiceURI: project.voiceURI, rate: project.rate });
        }
        void now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawAt, timeline, project.voiceURI, project.rate]);

  const togglePlay = () => {
    if (!project.scenes.length) return;
    if (!playing) {
      sceneRef.current = -1;
      if (timeRef.current >= timeline.duration) timeRef.current = 0;
      playingRef.current = true;
      setPlaying(true);
    } else {
      playingRef.current = false;
      setPlaying(false);
      cancelSpeech();
    }
  };

  const generate = async () => {
    const clean = topic.trim();
    if (!clean || busy) return;
    setBusy(true);
    setMessage(null);
    cancelSpeech();
    playingRef.current = false;
    setPlaying(false);
    timeRef.current = 0;
    setElapsed(0);
    try {
      const script = await generateVideoScript(clean, settings.keys, settings.fallback);
      const next: StudioProject = {
        ...EMPTY_PROJECT,
        topic: clean,
        title: script.title,
        scenes: script.scenes,
        voiceURI: project.voiceURI ?? voices[0]?.voiceURI ?? null,
        rate: project.rate,
      };
      setProject(next);
      setResult(null);
      setMessage(`Roteiro com ${script.scenes.length} cenas (${script.provider}).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao gerar roteiro.");
    } finally {
      setBusy(false);
    }
  };

  const patchScene = (id: string, patch: Partial<VideoScene>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)),
    }));
  };

  const testVoice = () => {
    speak("Teste de voz em português do Brasil. O vídeo começa em zero vírgula zero segundo.", {
      voiceURI: project.voiceURI,
      rate: project.rate,
    });
  };

  const exportVideo = async () => {
    if (!project.scenes.length || busy) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    setProgress(0);
    setResult(null);
    cancelRef.current = false;
    playingRef.current = false;
    setPlaying(false);
    cancelSpeech();

    const sfx = new SfxEngine(settings.sfxVolume, true);
    const cues: Array<{ time: number; sfx: SfxName }> = timeline.items.map((item) => ({
      time: item.start,
      sfx: "whoosh" as SfxName,
    }));
    cues.push({ time: Math.max(0, timeline.duration - 0.4), sfx: "ding" });

    try {
      const recorded = await recordVideo({
        canvas,
        duration: timeline.duration,
        sfx,
        cues,
        audioUrl: audio?.url ?? null,
        draw: (time) => composeFrame(canvas.getContext("2d")!, { project, time, timeline }),
        onProgress: setProgress,
        isCancelled: () => cancelRef.current,
      });
      setResult(recorded);
      setMessage("Vídeo pronto. Narração por voz do navegador não entra na gravação; use o áudio próprio se precisar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao exportar.");
    } finally {
      sfx.close();
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      <aside className="min-h-0 w-[330px] shrink-0 overflow-y-auto border-r px-4 py-4" style={{ borderColor: "var(--border)" }}>
        <p className="label">Tema do vídeo</p>
        <input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Ex.: como sobreviver a um ataque de tubarão"
          className="input mt-1.5"
        />
        <button type="button" onClick={() => void generate()} disabled={busy} className="btn mt-2 w-full justify-center">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Gerar roteiro
        </button>

        {message ? (
          <p className="mt-2 text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
            {message}
          </p>
        ) : null}

        <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="label">Cenas</p>
            <Badge tone="neutral">{project.scenes.length}</Badge>
          </div>
          <div className="space-y-2">
            {project.scenes.map((scene, index) => (
              <div key={scene.id} className="rounded-lg border p-2" style={{ borderColor: "var(--border)" }}>
                <textarea
                  value={scene.text}
                  onChange={(event) => patchScene(scene.id, { text: event.target.value })}
                  rows={2}
                  aria-label={`Texto da cena ${index + 1}`}
                  className="w-full resize-none bg-transparent text-[11.5px] leading-snug outline-none"
                />
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  <select
                    value={scene.env}
                    onChange={(event) => patchScene(scene.id, { env: event.target.value as VideoScene["env"] })}
                    className="input !h-7 !text-[10.5px]"
                    aria-label="Cenário"
                  >
                    {ENVIRONMENTS.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={scene.anim}
                    onChange={(event) => patchScene(scene.id, { anim: event.target.value as VideoScene["anim"] })}
                    className="input !h-7 !text-[10.5px]"
                    aria-label="Animação"
                  >
                    {ANIMATIONS.map((anim) => (
                      <option key={anim.id} value={anim.id}>
                        {anim.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <p className="label">Voz pt-BR</p>
          <select
            value={project.voiceURI ?? ""}
            onChange={(event) => setProject((prev) => ({ ...prev, voiceURI: event.target.value }))}
            className="input mt-1.5 !text-[11px]"
            aria-label="Voz"
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
          <div className="mt-2 flex gap-1.5">
            <button type="button" onClick={testVoice} className="btn btn-ghost flex-1 justify-center !text-[11px]">
              <Volume2 className="h-3 w-3" />
              Ouvir Teste de Voz
            </button>
            <label className="btn btn-ghost flex-1 cursor-pointer justify-center !text-[11px]">
              <Music2 className="h-3 w-3" />
              {audio ? "Trocar áudio" : "Áudio próprio"}
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setAudio(loadUserAudio(file));
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          {audio ? (
            <p className="mt-1 truncate text-[10px]" style={{ color: "var(--muted-2)" }}>
              trilha: {audio.name}
            </p>
          ) : null}
          <div className="mt-3">
            <Range
              label="Velocidade da voz"
              min={0.8}
              max={1.4}
              step={0.02}
              value={project.rate}
              onChange={(rate) => setProject((prev) => ({ ...prev, rate }))}
              format={(value) => `${value.toFixed(2)}x`}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void exportVideo()}
          disabled={busy || !project.scenes.length}
          className="btn mt-4 w-full justify-center"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Exportar vídeo 30 FPS
        </button>
        {busy ? (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
            <div className="h-full transition-all" style={{ width: `${Math.round(progress * 100)}%`, background: "var(--accent)" }} />
          </div>
        ) : null}
        {result ? (
          <button
            type="button"
            onClick={() => downloadVideo(project.title, result)}
            className="btn btn-ghost mt-2 w-full justify-center !text-[11px]"
          >
            <Download className="h-3 w-3" />
            Baixar {result.extension.toUpperCase()} ({(result.size / 1_000_000).toFixed(1)} MB)
          </button>
        ) : null}
      </aside>

      <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4">
        <div
          className="relative overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--border)", width: 288, height: Math.round((288 * VIDEO_H) / VIDEO_W) }}
        >
          <canvas ref={canvasRef} width={VIDEO_W} height={VIDEO_H} className="h-full w-full" />
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={togglePlay} disabled={!project.scenes.length} className="btn !px-3">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pausar" : "Pré-visualizar"}
          </button>
          <span className="mono text-[10.5px]" style={{ color: "var(--muted)" }}>
            {elapsed.toFixed(2)}s / {timeline.duration.toFixed(1)}s
          </span>
        </div>

        <p className="max-w-[420px] text-center text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
          Animação vetorial 2D em 720 × 1280, legendas de até 3 palavras e exportação a 30 FPS. A voz do sistema
          não é capturada pelo MediaRecorder: para narração no arquivo final, envie um áudio próprio.
        </p>

        {!project.scenes.length ? (
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
            <Plus className="h-3 w-3" />
            Gere um roteiro para começar
          </div>
        ) : null}
      </section>
    </div>
  );
}
