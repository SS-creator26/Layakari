import Link from "next/link";
import type { ReactNode } from "react";
import { TaalCover } from "@/components/ui/TaalCover";
import { taalOf } from "@/lib/music";
import s from "./catalogue.module.css";

interface RowData {
  id: string;
  slug: string;
  title: string;
  taal: string;
  form: string;
  owner?: { name: string } | null;
}

/** One composition in a list, with room for actions on the right. */
export function CompositionRow({ c, meta, children }: { c: RowData; meta?: ReactNode; children?: ReactNode }) {
  return (
    <li className={s.row}>
      <TaalCover taal={c.taal} seed={c.id} className={s.rowCover} decorative />
      <div className={s.rowMeta}>
        <Link href={`/compositions/${c.slug}`} className={s.rowTitle}>
          {c.title}
        </Link>
        <span className={s.rowSub}>
          {meta ?? (
            <>
              {c.owner?.name ? `${c.owner.name} · ` : ""}
              {taalOf(c.taal).name} · {c.form}
            </>
          )}
        </span>
      </div>
      {children ? <div className={s.rowActions}>{children}</div> : null}
    </li>
  );
}

export function RowList({ children }: { children: ReactNode }) {
  return <ul className={s.rows}>{children}</ul>;
}
