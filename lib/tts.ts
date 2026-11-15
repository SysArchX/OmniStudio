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
