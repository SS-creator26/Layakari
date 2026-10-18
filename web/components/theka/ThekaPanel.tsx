"use client";

import type { ReactNode } from "react";
import { beatColumns, MAX_BPM, MIN_BPM, taalOf } from "@/lib/music";
import { Icon } from "@/components/ui/Icon";
import { useTheka, type ThekaPiece } from "./ThekaProvider";
import s from "./player.module.css";

/** The dark practice panel: beat grid with sam and khali marked, play, and laya (tempo). */
export function ThekaPanel({ piece, children, headingLevel = 2 }: { piece: ThekaPiece; children?: ReactNode; headingLevel?: 2 | 3 }) {
  const { piece: current, beat, toggle, bpmFor, setBpm } = useTheka();
  const t = taalOf(piece.taal);
  const on = current?.key === piece.key;
  const bpm = bpmFor(piece.key, piece.bpm);
  const H = headingLevel === 2 ? "h2" : "h3";
  const headingId = `theka-${piece.key}`;
  return (
    <section className={s.panel} aria-labelledby={headingId}>
      <div className={s.panelHead}>
        <H id={headingId} className={s.panelTitle}>
          Theka · {t.name}
        </H>
        <span className={s.legend}>X sam · 0 khali · numbers are tali</span>
      </div>
      <ol className={s.beats} style={{ gridTemplateColumns: `repeat(${beatColumns(t.beats)}, minmax(0, 1fr))` }} aria-label={`${t.beats} matras`}>
        {t.bols.map((bol, i) => {
          const mark = t.marks[i];
          return (
            <li
              key={i}
              className={s.beat}
              data-on={on && beat === i ? "true" : undefined}
              data-sam={i === 0 ? "true" : undefined}
              data-vibhag={mark ? "true" : undefined}
              aria-current={on && beat === i ? "step" : undefined}
            >
              <small aria-hidden="true">{mark ?? i + 1}</small>
              <span className="visually-hidden">{mark === "X" ? "Sam, " : mark === "0" ? "Khali, " : mark ? `Tali ${mark}, ` : ""}matra {i + 1}: </span>
              {bol}
            </li>
          );
        })}
      </ol>
      <div className={s.controls}>
        <button type="button" className={s.bigPlay} onClick={() => toggle(piece)} aria-label={on ? "Pause theka" : "Play theka"} aria-pressed={on}>
          <Icon name={on ? "pause" : "play"} size={24} />
        </button>
        <label className={s.tempo}>
          <span>
            Laya <b>{bpm} bpm</b>
          </span>
          <input type="range" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={(e) => setBpm(piece.key, Number(e.target.value))} />
        </label>
      </div>
      {children}
    </section>
  );
}
