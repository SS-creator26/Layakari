import Link from "next/link";
import { money, plural } from "@/lib/format";
import { pill } from "@/components/ui/ui";
import type { AcademyCard as Card } from "@/lib/data/public";
import s from "./people.module.css";

export function AcademyCard({ a }: { a: Card }) {
  return (
    <article className={s.academy}>
      <div className={s.academyTop}>
        <div style={{ minWidth: 0 }}>
          <h3 className={s.academyName}>
            <Link href={`/academies/${a.slug}`} className={s.stretch}>
              {a.name}
            </Link>
          </h3>
          <span className={s.sub}>
            Guru {a.guru?.name}
            {a.guru?.city ? ` · ${a.guru.city}` : ""}
          </span>
        </div>
        <span className={pill(a.open ? "solidTeal" : "soft")}>{a.open ? "Taking students" : "Not taking students"}</span>
      </div>
      {a.about ? <p className={s.about}>{a.about}</p> : null}
      {a.levels.length ? (
        <ul className={s.levels} aria-label="Levels">
          {a.levels.map((l) => (
            <li key={l.id} className={pill("gold")}>
              {l.name}
            </li>
          ))}
        </ul>
      ) : null}
      <div className={s.academyFoot}>
        <span className="muted">
          {plural(a.pieceCount, "piece")} across {plural(a.levels.length, "level")}
        </span>
        <span className="mono">{money(a.fee)} / month</span>
      </div>
    </article>
  );
}
