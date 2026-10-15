// Web Audio theka engine, independent of React. Beats are scheduled slightly ahead on the audio
// clock so tempo stays steady even when the page is busy; the UI hears about each beat as it sounds.

import { strokesFor, secondsPerBeat, type Stroke } from "./strokes";

export interface ThekaOptions {
  bols: string[];
  bpm: number;
  onBeat?: (index: number) => void;
}

const LOOKAHEAD_S = 0.12;
const TICK_MS = 25;

type AudioContextCtor = typeof AudioContext;

export class ThekaEngine {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private uiTimers = new Set<ReturnType<typeof setTimeout>>();
  private bols: string[] = [];
  private bpm = 90;
  private nextIndex = 0;
  private nextTime = 0;
  private onBeat?: (index: number) => void;

  get playing(): boolean {
    return this.timer !== null;
  }

  private audio(): AudioContext {
    if (!this.ctx) {
      const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
      const Ctor = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) throw new Error("Web Audio is not available in this browser");
      this.ctx = new Ctor();
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.2), this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  start({ bols, bpm, onBeat }: ThekaOptions): void {
    this.stop();
    const ctx = this.audio();
    this.bols = bols;
    this.bpm = bpm;
    this.onBeat = onBeat;
    this.nextIndex = 0;
    this.nextTime = ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
  }

  setTempo(bpm: number): void {
    this.bpm = bpm;
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const t of this.uiTimers) clearTimeout(t);
    this.uiTimers.clear();
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.bols.length) return;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      const index = this.nextIndex;
      const beat = secondsPerBeat(this.bpm);
      for (const s of strokesFor(this.bols[index] ?? "")) this.play(s, this.nextTime + s.at * beat);
      const delay = Math.max(0, (this.nextTime - ctx.currentTime) * 1000);
      const t = setTimeout(() => {
        this.uiTimers.delete(t);
        this.onBeat?.(index);
      }, delay);
      this.uiTimers.add(t);
      this.nextIndex = (index + 1) % this.bols.length;
      this.nextTime += beat;
    }
  }

  private envelope(g: GainNode, t: number, peak: number, decay: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  }

  private play(s: Stroke, t: number): void {
    const ctx = this.ctx!;
    if (s.voice === "bayan") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(68, t + 0.25);
      this.envelope(g, t, 0.55 * s.velocity, 0.55);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.6);
    } else if (s.voice === "dayan") {
      for (const [mult, amp] of [[1, 0.32], [2.01, 0.16], [3.02, 0.08], [4.1, 0.05]] as const) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = s.pitch * mult;
        this.envelope(g, t, amp * s.velocity, (s.decay / mult) * 1.4);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + s.decay + 0.05);
      }
      this.play({ voice: "click", at: 0, velocity: 0.12 * s.velocity, freq: 3200 }, t);
    } else {
      const src = ctx.createBufferSource();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      src.buffer = this.noise;
      bp.type = "bandpass";
      bp.frequency.value = s.freq;
      this.envelope(g, t, s.velocity, 0.05);
      src.connect(bp).connect(g).connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.08);
    }
  }
}
