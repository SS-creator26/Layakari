"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ThekaEngine } from "@/lib/theka/engine";
import { taalOf } from "@/lib/music";

export interface ThekaPiece {
  /** Stable id (composition id, or "demo"). */
  key: string;
  title: string;
  subtitle: string;
  taal: string;
  bpm: number;
  href?: string;
}

interface ThekaState {
  piece: ThekaPiece | null;
  playing: boolean;
  beat: number;
  bpmFor: (key: string, fallback: number) => number;
  toggle: (piece: ThekaPiece) => void;
  stop: () => void;
  setBpm: (key: string, bpm: number) => void;
}

const Ctx = createContext<ThekaState | null>(null);

/**
 * One theka for the whole app. It lives in the root layout, so a piece keeps playing while you move between pages.
 */
export function ThekaProvider({ children }: { children: ReactNode }) {
  const engine = useRef<ThekaEngine | null>(null);
  const [piece, setPiece] = useState<ThekaPiece | null>(null);
  const [beat, setBeat] = useState(-1);
  const [tempos, setTempos] = useState<Record<string, number>>({});

  const stop = useCallback(() => {
    engine.current?.stop();
    setPiece(null);
    setBeat(-1);
  }, []);

  const bpmFor = useCallback((key: string, fallback: number) => tempos[key] ?? fallback, [tempos]);

  const toggle = useCallback(
    (p: ThekaPiece) => {
      if (piece?.key === p.key) {
        stop();
        return;
      }
      engine.current ??= new ThekaEngine();
      try {
        engine.current.start({ bols: taalOf(p.taal).bols, bpm: tempos[p.key] ?? p.bpm, onBeat: setBeat });
        setPiece(p);
      } catch {
        setPiece(null);
      }
    },
    [piece, stop, tempos],
  );

  const setBpm = useCallback(
    (key: string, bpm: number) => {
      setTempos((t) => ({ ...t, [key]: bpm }));
      if (piece?.key === key) engine.current?.setTempo(bpm);
    },
    [piece],
  );

  useEffect(() => () => engine.current?.stop(), []);

  const value = useMemo(
    () => ({ piece, playing: !!piece, beat, bpmFor, toggle, stop, setBpm }),
    [piece, beat, bpmFor, toggle, stop, setBpm],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheka(): ThekaState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheka must be used inside ThekaProvider");
  return v;
}
