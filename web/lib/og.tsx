import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { hue } from "./format";
import { taalOf } from "./music";

export const OG_SIZE = { width: 1200, height: 630 };

async function fonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [rozha, mukta] = await Promise.all([readFile(join(dir, "RozhaOne-Regular.ttf")), readFile(join(dir, "Mukta-Medium.ttf"))]);
  return [
    { name: "Rozha One", data: rozha, weight: 400 as const, style: "normal" as const },
    { name: "Mukta", data: mukta, weight: 500 as const, style: "normal" as const },
  ];
}

/** The link-preview card from the design mockup: title on the left, the taal ring on the right. */
export async function shareCard({ eyebrow, title, subtitle, taal, seed }: { eyebrow: string; title: string; subtitle: string; taal: string; seed: string }) {
  const t = taalOf(taal);
  const h = hue(seed);
  const dots = Array.from({ length: t.beats }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / t.beats;
    const mark = t.marks[i];
    const d = mark ? (i === 0 ? 38 : 28) : 18;
    return {
      left: 210 + 160 * Math.cos(a) - d / 2,
      top: 210 + 160 * Math.sin(a) - d / 2,
      d,
      fill: i === 0 ? "#E8A33D" : mark === "0" ? "transparent" : `hsl(${h}, 70%, 84%)`,
      stroke: i === 0 ? "#E8A33D" : `hsl(${h}, 70%, 84%)`,
    };
  });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "64px 72px",
          background: "radial-gradient(120% 140% at 100% 0%, #5A2E4E 0%, #2A1B33 62%)",
          color: "#F6EFF8",
          fontFamily: "Mukta",
        }}
      >
        <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ fontSize: 24, letterSpacing: 3, textTransform: "uppercase", color: "#E8A33D" }}>{eyebrow}</div>
          <div style={{ marginTop: 18, fontFamily: "Rozha One", fontSize: title.length > 26 ? 72 : 92, lineHeight: 1.02 }}>{title}</div>
          <div style={{ marginTop: 20, fontSize: 32, color: "#DCCDE4" }}>{subtitle}</div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="44" height="44" viewBox="0 0 32 32">
              <circle cx="16" cy="17" r="9" fill="none" stroke="#E8A33D" strokeWidth="2.4" />
              <circle cx="16" cy="8" r="3" fill="#E8A33D" />
            </svg>
            <span style={{ fontFamily: "Rozha One", fontSize: 36 }}>Layakari</span>
            <span style={{ marginLeft: 10, fontSize: 22, color: "#CDBBD6" }}>layakari.ca</span>
          </div>
        </div>
        <div
          style={{
            position: "relative",
            width: 420,
            height: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 32,
            background: `radial-gradient(circle at 30% 25%, hsl(${h}, 45%, 38%), hsl(${(h + 30) % 360}, 40%, 14%))`,
          }}
        >
          {dots.map((d, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: d.left,
                top: d.top,
                width: d.d,
                height: d.d,
                borderRadius: d.d,
                background: d.fill,
                border: `3px solid ${d.stroke}`,
              }}
            />
          ))}
          <div style={{ fontFamily: "Rozha One", fontSize: 88 }}>{String(t.beats)}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
