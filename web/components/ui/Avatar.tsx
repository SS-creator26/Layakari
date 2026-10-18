import { hue, initials } from "@/lib/format";

export function Avatar({ name, seed, size = 44 }: { name: string; seed: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        font: `400 ${Math.round(size * 0.38)}px var(--font-display)`,
        color: "#fff",
        background: `hsl(${hue(seed)} 38% 36%)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
