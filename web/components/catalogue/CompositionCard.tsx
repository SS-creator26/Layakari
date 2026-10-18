import Link from "next/link";
import { TaalCover } from "@/components/ui/TaalCover";
import { fromPrice } from "@/lib/licensing";
import { money } from "@/lib/format";
import { taalOf } from "@/lib/music";
import type { CompositionCard as Card } from "@/lib/data/public";
import s from "./catalogue.module.css";

export function CompositionCard({ c, headingLevel = 3 }: { c: Card; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className={s.card}>
      <TaalCover taal={c.taal} seed={c.id} label={c.form} className={s.cover} decorative />
      <H className={s.cardTitle}>
        <Link href={`/compositions/${c.slug}`} className={s.cardLink}>
          {c.title}
        </Link>
      </H>
      <span className={s.cardBy}>{c.owner?.name ?? "Unknown artist"}</span>
      <span className={s.cardMeta}>
        {taalOf(c.taal).name} · {c.laya} · {c.bpm} bpm
      </span>
      <span className={s.cardPrice}>Listen from {money(fromPrice(c))}</span>
    </article>
  );
}

export function CompositionGrid({ items }: { items: Card[] }) {
  return (
    <ul className={`grid-cards ${s.plain}`}>
      {items.map((c) => (
        <li key={c.id}>
          <CompositionCard c={c} />
        </li>
      ))}
    </ul>
  );
}
