const PREFERRED = [/antonio/i, /francisca/i, /google portugu[eê]s do brasil/i, /luciana/i];

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function isBrazilian(voice: SpeechSynthesisVoice) {
  const lang = (voice.lang || "").toLowerCase().replace("_", "-");
  return lang === "pt-br" || lang.startsWith("pt-br");
}

/**
 * Só aceita voz brasileira. Voz em inglês ou pt-PT é descartada:
 * narrar em português de Portugal ou em inglês estraga o vídeo.
 */
export function ptBrVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const all = window.speechSynthesis.getVoices();
  const brazilian = all.filter(isBrazilian);
  const preferred = brazilian.filter((voice) => PREFERRED.some((pattern) => pattern.test(voice.name)));
  return [...preferred, ...brazilian.filter((voice) => !preferred.includes(voice))];
}

export function voiceIsAllowed(voice: SpeechSynthesisVoice | null | undefined) {
  return Boolean(voice && isBrazilian(voice));
}

export function speak(
  text: string,
  options: { voiceURI?: string | null; rate?: number; pitch?: number; volume?: number } = {},
) {
  if (!ttsSupported()) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = ptBrVoices();
  const match = options.voiceURI ? voices.find((voice) => voice.voiceURI === options.voiceURI) : undefined;
  const chosen = match ?? voices[0];
  if (chosen) {
    utterance.voice = chosen;
    utterance.lang = "pt-BR";
  } else {
    utterance.lang = "pt-BR";
  }
  utterance.rate = options.rate ?? 1.02;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function cancelSpeech() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

export function onVoicesChanged(callback: (voices: SpeechSynthesisVoice[]) => void) {
  if (!ttsSupported()) return () => undefined;
  const handler = () => callback(ptBrVoices());
  window.speechSynthesis.addEventListener("voiceschanged", handler);
  callback(ptBrVoices());
  return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
}

/** Áudio próprio do usuário: devolve URL temporária usada na exportação. */
export function loadUserAudio(file: File) {
  return {
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
  };
}

/* ----------------------------- narração neural ----------------------------- */

export type NeuralVoice = "pt-BR-AntonioNeural" | "pt-BR-FranciscaNeural";

export interface NarrationSegment {
  text: string;
  /** segundo em que a fala começa dentro do vídeo */
  start: number;
  duration: number;
}

interface SpeakPayload {
  buffer: AudioBuffer;
  duration: number;
}

const POLLY_VOICE: Record<NeuralVoice, string> = {
  "pt-BR-AntonioNeural": "Ricardo",
  "pt-BR-FranciscaNeural": "Vitoria",
};

/**
 * Baixa a locução em MP3 por um endpoint neural público.
 *
 * Navegador não tem como capturar speechSynthesis no MediaRecorder, então a
 * narração do vídeo precisa vir de um arquivo. Tentamos o serviço neural da
 * StreamElements (vozes Polly pt-BR) e devolvemos null quando a rede/CORS
 * bloqueia — nesse caso a exportação continua sem locução em vez de quebrar.
 */
export async function fetchNarrationMp3(text: string, voice: NeuralVoice = "pt-BR-AntonioNeural") {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 480);
  if (!clean) return null;
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(POLLY_VOICE[voice])}&text=${encodeURIComponent(clean)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return buffer.byteLength > 1200 ? buffer : null;
  } catch {
    return null;
  }
}

/** Decodifica os MP3 das cenas e devolve buffers prontos para tocar no AudioContext. */
export async function buildNarration(
  context: AudioContext,
  segments: NarrationSegment[],
  voice: NeuralVoice = "pt-BR-AntonioNeural",
): Promise<Array<{ buffer: AudioBuffer; start: number }>> {
  const tracks: Array<{ buffer: AudioBuffer; start: number }> = [];
  for (const segment of segments) {
    const mp3 = await fetchNarrationMp3(segment.text, voice);
    if (!mp3) continue;
    try {
      const buffer = await context.decodeAudioData(mp3.slice(0));
      tracks.push({ buffer, start: segment.start });
    } catch {
      /* arquivo inválido */
    }
  }
  return tracks;
}

/** Converte a narração em um único AudioBuffer contínuo (usado no preview). */
export async function speechBuffer(context: AudioContext, text: string, voice: NeuralVoice): Promise<SpeakPayload | null> {
  const mp3 = await fetchNarrationMp3(text, voice);
  if (!mp3) return null;
  try {
    const buffer = await context.decodeAudioData(mp3.slice(0));
    return { buffer, duration: buffer.duration };
  } catch {
    return null;
  }
}
