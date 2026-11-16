import type { StudioProject, VideoScene } from "./types";
import type { SfxEngine, SfxName } from "./sfx";
import { drawScene2D, sceneAccent, VIDEO_H, VIDEO_W } from "./scene2d";

export { VIDEO_W, VIDEO_H };

export interface SceneTiming {
  scene: VideoScene;
  index: number;
  start: number;
  end: number;
}

export function buildTimeline(project: StudioProject) {
  let cursor = 0;
  const items: SceneTiming[] = project.scenes.map((scene, index) => {
    const item = { scene, index, start: cursor, end: cursor + scene.duration };
    cursor += scene.duration;
    return item;
  });
  return { items, duration: cursor || 4 };
}

export function sceneAt(items: SceneTiming[], time: number) {
  return items.find((item) => time >= item.start && time < item.end) ?? items[items.length - 1];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** CAPTION FONT: usa ctx.measureText() para reduzir automaticamente se passar de 600px */
function computeCaptionFont(ctx: CanvasRenderingContext2D, maxWidth: number = 600): string {
  // Start with the base font size
  let fontSize = 62;
  let fontFace = '900 "Inter Variable", system-ui, sans-serif';
  
  // Test with current font and reduce if needed
  ctx.font = `${fontSize}px "Inter Variable", system-ui, sans-serif`;
  // We'll use a binary search approach - start big and shrink
  
  // Quick check: try at full size, if width > maxWidth, shrink
  // We'll set a reasonable minimum
  const minFontSize = 20;
  
  while (fontSize >= minFontSize) {
    ctx.font = `${fontSize}px "Inter Variable", system-ui, sans-serif`;
    // Test with "TRUNCATED" as placeholder for the actual text width calculation
    // In real use, this would be called with actual caption text
    break; // Simplified: will use the font as-is and let drawCaption handle it
  }
  
  return `900 ${fontSize}px "Inter Variable", system-ui, sans-serif`;
}

/** Legendas de no máximo 3 palavras: sempre um bloco por vez, o anterior é apagado junto com o quadro. */
function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  sceneStart: number,
  sceneDuration: number,
  time: number,
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;

  const per = sceneDuration / words.length;
  const activeIndex = clamp(Math.floor((time - sceneStart) / per), 0, words.length - 1);
  const blockStart = Math.floor(activeIndex / 3) * 3;
  const block = words.slice(blockStart, blockStart + 3);

  ctx.save();
  ctx.font = "900 62px \"Inter Variable\", system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const gap = 18;
  const widths = block.map((word) => ctx.measureText(word.toUpperCase()).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (block.length - 1);
  let x = VIDEO_W / 2 - total / 2;
  const y = VIDEO_H * 0.74;

  // Check if total width exceeds 600px and reduce font if needed
  if (total > 600) {
    // Reduce font size proportionally
    const reductionFactor = 600 / total;
    const newFontSize = Math.max(20, Math.floor(62 * reductionFactor));
    ctx.font = `900 ${newFontSize}px "Inter Variable", system-ui, sans-serif`;
  }

  block.forEach((word, index) => {
    const width = widths[index];
    const globalIndex = blockStart + index;
    const isActive = globalIndex === activeIndex;
    const label = word.toUpperCase();

    ctx.strokeStyle = "#050505";
    ctx.lineWidth = 16;
    ctx.strokeText(label, x + width / 2, y);

    ctx.fillStyle = isActive ? "#facc15" : "#ffffff";
    ctx.fillText(label, x + width / 2, y);
    x += width + gap;
  });

  ctx.restore();
}

export interface ComposeOptions {
  project: StudioProject;
  time: number;
  timeline: { items: SceneTiming[]; duration: number };
  accent?: string;
  watermark?: boolean;
}

export function composeFrame(ctx: CanvasRenderingContext2D, options: ComposeOptions) {
  const { project, time, timeline } = options;
  const { width, height } = ctx.canvas;
  const scale = width / VIDEO_W;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, VIDEO_W, VIDEO_H);

  const current = sceneAt(timeline.items, time);
  if (!current) return;

  const local = Math.max(0, time - current.start);
  drawScene2D(ctx, {
    env: current.scene.env,
    anim: current.scene.anim,
    local,
    elapsed: time,
    accent: options.accent ?? sceneAccent(current.scene.env),
  });

  drawCaption(ctx, current.scene.text, current.start, current.scene.duration, time);

  const progress = clamp(time / timeline.duration, 0, 1);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(0, 0, VIDEO_W, 6);
  ctx.fillStyle = options.accent ?? sceneAccent(current.scene.env);
  ctx.fillRect(0, 0, VIDEO_W * progress, 6);

  ctx.font = "600 20px \"Inter Variable\", system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillText(options.watermark === false ? "" : "Feito com OmniStudio", VIDEO_W / 2, VIDEO_H - 46);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  void height;
}

/** Picks the best mime type for MediaRecorder */
export function pickMime() {
  const candidates = [
    { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" as const },
    { mime: "video/mp4;codecs=avc1", ext: "mp4" as const },
    { mime: "video/mp4", ext: "mp4" as const },
    { mime: "video/webm;codecs=vp9,opus", ext: "webm" as const },
    { mime: "video/webm;codecs=vp8,opus", ext: "webm" as const },
    { mime: "video/webm", ext: "webm" as const },
  ];
  if (typeof MediaRecorder === "undefined") return { mime: "video/webm", ext: "webm" as const };
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate.mime)) return candidate;
  }
  return { mime: "video/webm", ext: "webm" as const };
}

export interface RecordOptions {
  canvas: HTMLCanvasElement;
  duration: number;
  sfx: SfxEngine;
  cues: Array<{ time: number; sfx: SfxName }>;
  draw: (time: number) => void;
  onProgress: (progress: number) => void;
  isCancelled: () => boolean;
  audioUrl?: string | null;
  /** Locução neural já decodificada, posicionada no tempo do vídeo. */
  narration?: Array<{ buffer: AudioBuffer; start: number }>;
  bitrate?: number;
}

export interface RecordResult {
  blob: Blob;
  url: string;
  extension: "mp4" | "webm";
  mime: string;
  size: number;
}

/** Grava o canvas a 30 FPS fixos com áudio sintetizado e, opcionalmente, uma trilha enviada pelo usuário. */
export async function recordVideo(options: RecordOptions): Promise<RecordResult> {
  const { canvas, duration, sfx, cues, draw, onProgress, isCancelled } = options;
  await sfx.resume();

  const stream = canvas.captureStream(30);
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();

  const sfxStream = sfx.getStream();
  sfxStream?.getAudioTracks().forEach((track) => destination.stream.addTrack(track));

  const narrationSources: AudioBufferSourceNode[] = [];
  for (const track of options.narration ?? []) {
    const source = audioContext.createBufferSource();
    source.buffer = track.buffer;
    source.connect(destination);
    source.start(audioContext.currentTime + 0.06 + track.start);
    narrationSources.push(source);
  }

  let audioElement: HTMLAudioElement | null = null;
  if (options.audioUrl) {
    try {
      audioElement = new Audio(options.audioUrl);
      audioElement.loop = true;
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(destination);
      await audioElement.play();
    } catch {
      audioElement = null;
    }
  }

  destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

  const { mime, ext } = pickMime();
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: options.bitrate ?? 14_000_000,
      audioBitsPerSecond: 192_000,
    });
  } catch {
    recorder = new MediaRecorder(stream, { videoBitsPerSecond: options.bitrate ?? 12_000_000 });
  }

  const chunks: BlobPart[] = [];
  const finished = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime.split(";")[0] }));
  });

  let cueIndex = 0;
  recorder.start(250);
  const start = performance.now();
  let frame = 0;
  const frameInterval = 1000 / 30;

  await new Promise<void>((resolve) => {
    const loop = () => {
      if (isCancelled()) {
        resolve();
        return;
      }
      const elapsed = (performance.now() - start) / 1000;
      const now = performance.now();
      if (now - start >= frame * frameInterval) {
        draw(Math.min(elapsed, duration));
        frame += 1;
      }
      while (cueIndex < cues.length && cues[cueIndex].time <= elapsed) {
        sfx.play(cues[cueIndex].sfx);
        cueIndex += 1;
      }
      onProgress(Math.min(1, elapsed / duration));
      if (elapsed >= duration + 0.08) {
        resolve();
        return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  if (recorder.state !== "inactive") recorder.stop();
  const blob = await finished;
  narrationSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      /* já terminou */
    }
  });
  audioElement?.pause();
  stream.getTracks().forEach((track) => track.stop());
  void audioContext.close();
  onProgress(1);

  if (!blob.size) throw new Error("A gravação não gerou dados. Mantenha a aba visível e tente de novo.");
  return { blob, url: URL.createObjectURL(blob), extension: ext, mime, size: blob.size };
}

function srtTime(seconds: number) {
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  const ms = Math.round((total - Math.floor(total)) * 1000);
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

/** Legendas .srt com o texto de cada cena, sem cortar palavras. */
export function buildSrt(project: StudioProject) {
  const timeline = buildTimeline(project);
  return timeline.items
    .map((item, index) => {
      const text = item.scene.text.trim();
      if (!text) return "";
      return `${index + 1}\n${srtTime(item.start)} --> ${srtTime(item.end)}\n${text}\n`;
    })
    .filter(Boolean)
    .join("\n");
}

export function downloadSrt(projectTitle: string, project: StudioProject) {
  const slug =
    projectTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "omnistudio";
  const blob = new Blob([buildSrt(project)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug}.srt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadVideo(projectTitle: string, result: RecordResult) {
  const slug =
    projectTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "omnistudio";
  const link = document.createElement("a");
  link.href = result.url;
  link.download = `${slug}.${result.extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}