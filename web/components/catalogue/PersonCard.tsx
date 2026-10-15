import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { plural } from "@/lib/format";
import { roleLabel } from "@/lib/music";
import type { ArtistCard } from "@/lib/data/public";
import s from "./people.module.css";

export function PersonCard({ p }: { p: ArtistCard }) {
  return (
    <article className={s.person}>
      <Avatar name={p.name} seed={p.id} size={56} />
      <div className={s.personMeta}>
        <h3 className={s.personName}>
          <Link href={`/artists/${p.handle}`} className={s.stretch}>
            {p.name}
          </Link>
        </h3>
        {p.city ? <span className={s.sub}>{p.city}</span> : null}
        <span className={s.sub2}>
          {p.roles.slice(0, 2).map(roleLabel).join(", ") || "Artist"} · {plural(p.compositionCount, "composition")}
        </span>
      </div>
    </article>
  );
}
