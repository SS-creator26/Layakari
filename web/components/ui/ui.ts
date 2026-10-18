import s from "./ui.module.css";

type Variant = "primary" | "ghost" | "danger" | "beat" | "onHero";

/** Class names for a button or a link styled as one. */
export function btn(variant: Variant = "primary", opts: { size?: "sm"; block?: boolean; icon?: boolean } = {}): string {
  return [s.btn, variant !== "primary" && s[variant], opts.size === "sm" && s.sm, opts.block && s.block, opts.icon && s.icon]
    .filter(Boolean)
    .join(" ");
}

export function pill(tone?: "gold" | "teal" | "solidTeal" | "soft"): string {
  const map = { gold: s.pillGold, teal: s.pillTeal, solidTeal: s.pillSolidTeal, soft: s.pillSoft };
  return [s.pill, tone && map[tone]].filter(Boolean).join(" ");
}

export const ui = s;
