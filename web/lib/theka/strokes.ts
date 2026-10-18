// Which drum sounds make up each bol. Pure data, so it can be tested without audio.
// Ported from the synth in the original index.html; real tabla samples can replace the voices later
// without changing this mapping.

export type Stroke =
  | { voice: "bayan"; at: number; velocity: number }
  | { voice: "dayan"; at: number; pitch: number; decay: number; velocity: number }
  | { voice: "click"; at: number; velocity: number; freq: number };

/** `at` is a fraction of one matra after the beat. */
export function strokesFor(bol: string): Stroke[] {
  const b = bol.toLowerCase();
  if (b === "–" || b === "-") return [];
  if (b === "tirakita") {
    return [0, 0.25, 0.5, 0.75].map((at, i) =>
      i % 2 ? { voice: "dayan", at, pitch: 470, decay: 0.12, velocity: 0.6 } : { voice: "click", at, velocity: 0.35, freq: 1500 },
    );
  }
  if (b === "dhage") {
    return [
      { voice: "bayan", at: 0, velocity: 1 },
      { voice: "dayan", at: 0, pitch: 440, decay: 0.3, velocity: 0.8 },
      { voice: "bayan", at: 0.5, velocity: 0.7 },
    ];
  }
  if (b.startsWith("dh")) {
    return [
      { voice: "bayan", at: 0, velocity: 1 },
      { voice: "dayan", at: 0, pitch: 440, decay: /in|dhi/.test(b) ? 0.55 : 0.3, velocity: 0.9 },
    ];
  }
  if (/^tin|^ti$|^tu/.test(b)) return [{ voice: "dayan", at: 0, pitch: 466, decay: 0.6, velocity: 0.8 }];
  if (b.startsWith("ga")) return [{ voice: "bayan", at: 0, velocity: 0.7 }];
  if (/^kat|^ka|^ke/.test(b)) return [{ voice: "click", at: 0, velocity: 0.5, freq: 1200 }];
  return [{ voice: "dayan", at: 0, pitch: 440, decay: 0.25, velocity: 1 }];
}

export function secondsPerBeat(bpm: number): number {
  return 60 / Math.min(240, Math.max(20, bpm || 90));
}
