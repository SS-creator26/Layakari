"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { taalOf } from "@/lib/music";
import { TaalCover } from "@/components/ui/TaalCover";
import { Icon } from "@/components/ui/Icon";
import { useTheka } from "./ThekaProvider";
import s from "./player.module.css";

/** Floating bar for whatever is playing, visible on every page. */
export function MiniPlayer() {
  const { piece, beat, toggle } = useTheka();
  const pathname = usePathname();
  useEffect(() => {
    document.body.style.setProperty("--player-h", piece ? "88px" : "0px");
  }, [piece]);
  if (!piece) return null;
  const t = taalOf(piece.taal);
  const onPage = piece.href && pathname === piece.href;
  return (
    <div className={s.mini} role="region" aria-label="Now playing">
      <TaalCover decorative taal={piece.taal} seed={piece.key} litBeat={beat} className={s.miniCover} />
      <div className={s.miniMeta}>
        {piece.href && !onPage ? (
          <Link href={piece.href} className={s.miniTitle}>
            {piece.title}
          </Link>
        ) : (
          <b className={s.miniTitle}>{piece.title}</b>
        )}
        <span className={s.miniBeat}>
          {t.name} · matra {Math.max(beat, 0) + 1}/{t.beats} · {t.bols[Math.max(beat, 0)]}
        </span>
      </div>
      <button type="button" className={s.miniButton} onClick={() => toggle(piece)} aria-label={`Stop the theka for ${piece.title}`}>
        <Icon name="pause" size={18} />
      </button>
    </div>
  );
}
