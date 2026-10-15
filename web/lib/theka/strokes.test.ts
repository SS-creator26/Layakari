import { describe, expect, it } from "vitest";
import { strokesFor, secondsPerBeat } from "./strokes";
import { TAALS } from "../music";

describe("strokes", () => {
  it("plays both drums for Dha and Dhin, with a longer ring on Dhin", () => {
    const dha = strokesFor("Dha");
    const dhin = strokesFor("Dhin");
    expect(dha.map((s) => s.voice)).toEqual(["bayan", "dayan"]);
    const decay = (ss: typeof dha) => ss.find((s) => s.voice === "dayan")!;
    expect(decay(dhin)).toMatchObject({ decay: 0.55 });
    expect(decay(dha)).toMatchObject({ decay: 0.3 });
  });
  it("plays only the right drum on khali bols", () => {
    expect(strokesFor("Tin").map((s) => s.voice)).toEqual(["dayan"]);
    expect(strokesFor("Ta").map((s) => s.voice)).toEqual(["dayan"]);
  });
  it("rests on a dash", () => {
    expect(strokesFor("–")).toEqual([]);
  });
  it("splits Tirakita into four strokes across the matra", () => {
    expect(strokesFor("Tirakita").map((s) => s.at)).toEqual([0, 0.25, 0.5, 0.75]);
  });
  it("has a sound for every bol in every theka", () => {
    for (const t of Object.values(TAALS)) {
      expect(t.bols).toHaveLength(t.beats);
      for (const b of t.bols) if (b !== "–") expect(strokesFor(b).length).toBeGreaterThan(0);
    }
  });
  it("keeps tempo in range", () => {
    expect(secondsPerBeat(60)).toBe(1);
    expect(secondsPerBeat(0)).toBeCloseTo(60 / 90);
    expect(secondsPerBeat(1000)).toBe(60 / 240);
  });
});
