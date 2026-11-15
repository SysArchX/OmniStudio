export type SfxName = "pop" | "whoosh" | "tick" | "ding";

/** Efeitos sintetizados localmente, sem arquivos externos. */
export class SfxEngine {
  ctx: AudioContext;
  master: GainNode;
  destination: MediaStreamAudioDestinationNode | null = null;
  private noise: AudioBuffer | null = null;
  private volume: number;

  constructor(volume = 0.6, capture = false) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.volume = volume;
    this.master = this.ctx.createGain();
    this.master.gain.value = volume;
    this.master.connect(this.ctx.destination);
    if (capture) {
      this.destination = this.ctx.createMediaStreamDestination();
      this.master.connect(this.destination);
    }
  }

  setVolume(value: number) {
    this.volume = value;
    this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
  }

  getStream() {
    return this.destination?.stream ?? null;
  }

  async resume() {
    if (this.ctx.state !== "running") {
      try {
        await this.ctx.resume();
      } catch {
        /* bloqueado pelo navegador */
      }
    }
  }

  private getNoise() {
    if (this.noise) return this.noise;
    const length = Math.floor(this.ctx.sampleRate * 1.1);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }

  play(name: SfxName) {
    const t = this.ctx.currentTime;
    if (name === "pop") this.pop(t);
    else if (name === "whoosh") this.whoosh(t);
    else if (name === "tick") this.tick(t);
    else this.ding(t);
  }

  private pop(t: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(1080, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.42, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  private whoosh(t: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.getNoise();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(240, t);
    filter.frequency.exponentialRampToValueAtTime(3800, t + 0.4);
    filter.frequency.exponentialRampToValueAtTime(620, t + 0.6);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.64);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + 0.68);
  }

  private tick(t: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.03);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  private ding(t: number) {
    [1046.5, 1568, 2093].forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.24 / (index + 1), t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7 + index * 0.1);
      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  }

  close() {
    try {
      this.master.disconnect();
      this.ctx.close();
    } catch {
      /* já fechado */
    }
  }
}

let shared: SfxEngine | null = null;

export function getSfx(volume = 0.6) {
  if (typeof window === "undefined") return null;
  if (!shared) {
    try {
      shared = new SfxEngine(volume);
    } catch {
      return null;
    }
  }
  shared.setVolume(volume);
  return shared;
}
