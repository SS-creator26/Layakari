import { hue } from "@/lib/format";
import { taalOf } from "@/lib/music";

/** Square artwork for a composition: its taal's cycle drawn as a ring, sam in gold, khali hollow. */
export function TaalCover({
  taal,
  seed,
  label,
  className,
  litBeat,
  decorative = false,
}: {
  taal: string;
  seed: string;
  /** Small tag in the corner, such as the form. */
  label?: string;
  className?: string;
  litBeat?: number;
  decorative?: boolean;
}) {
  const t = taalOf(taal);
  const h = hue(seed);
  const id = `cv-${h}-${t.id}`;
  const dots = Array.from({ length: t.beats }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / t.beats;
    const mark = t.marks[i];
    const r = mark ? (i === 0 ? 4.6 : 3.4) : 2.2;
    const lit = litBeat === i;
    const fill = lit ? "#FFFFFF" : i === 0 ? "#E8A33D" : mark === "0" ? "none" : `hsl(${h} 70% 84%)`;
    return (
      <circle
        key={i}
        cx={(50 + 38 * Math.cos(a)).toFixed(2)}
        cy={(50 + 38 * Math.sin(a)).toFixed(2)}
        r={r}
        fill={fill}
        stroke={i === 0 ? "#E8A33D" : `hsl(${h} 70% 84%)`}
        strokeWidth="1"
      />
    );
  });
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": `${t.name} cycle, ${t.beats} beats` })}
    >
      <defs>
        <radialGradient id={id} cx="30%" cy="25%" r="90%">
          <stop offset="0" stopColor={`hsl(${h} 45% 38%)`} />
          <stop offset="1" stopColor={`hsl(${(h + 30) % 360} 40% 14%)`} />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={`hsl(${h} 60% 80% / .22)`} strokeWidth=".8" />
      {dots}
      <text x="50" y="57" textAnchor="middle" fontFamily="var(--font-display), Georgia, serif" fontSize="19" fill="#F6EFF8">
        {t.beats}
      </text>
      {label ? (
        <g>
          <rect x="6" y="6" width={label.length * 5.2 + 10} height="12" rx="6" fill="rgba(20,10,26,.6)" />
          <text x="11" y="14.6" fontFamily="var(--font-mono), monospace" fontSize="6.4" letterSpacing=".4" fill="#F6EFF8">
            {label.toUpperCase()}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
