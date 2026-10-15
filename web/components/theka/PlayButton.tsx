"use client";

import { Icon } from "@/components/ui/Icon";
import { btn } from "@/components/ui/ui";
import { useTheka, type ThekaPiece } from "./ThekaProvider";

export function PlayButton({ piece, withLabel = false, variant = "ghost" }: { piece: ThekaPiece; withLabel?: boolean; variant?: "ghost" | "primary" }) {
  const { piece: current, toggle } = useTheka();
  const on = current?.key === piece.key;
  const label = on ? "Pause theka" : "Play theka";
  return (
    <button
      type="button"
      className={btn(variant, { size: withLabel ? undefined : "sm", icon: !withLabel })}
      onClick={() => toggle(piece)}
      aria-pressed={on}
      aria-label={withLabel ? undefined : `${label}: ${piece.title}`}
    >
      <Icon name={on ? "pause" : "play"} size={18} />
      {withLabel ? label : null}
    </button>
  );
}
