import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtist } from "@/lib/data/public";
import { getViewer } from "@/lib/supabase/server";
import { money, plural } from "@/lib/format";
import { roleLabel } from "@/lib/music";
import { Avatar } from "@/components/ui/Avatar";
import { Empty } from "@/components/ui/Empty";
import { btn, pill } from "@/components/ui/ui";
import { CompositionGrid } from "@/components/catalogue/CompositionCard";
import { AcademyCard } from "@/components/catalogue/AcademyCard";
import { RowList } from "@/components/catalogue/CompositionRow";
import s from "./artist.module.css";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const page = await getArtist(handle);
  if (!page) return { title: "Artist not found" };
  const m = page.member;
  const roles = m.roles.map(roleLabel).join(", ");
  return {
    title: m.name,
    description: `${m.name}${roles ? `, ${roles}` : ""}${m.city ? ` in ${m.city}` : ""}. ${plural(page.compositions.length, "composition")} on Layakari.${m.bio ? " " + m.bio.slice(0, 120) : ""}`,
    alternates: { canonical: `/artists/${m.handle}` },
    openGraph: { type: "profile", title: `${m.name} on Layakari` },
  };
}

export default async function ArtistPage({ params }: Props) {
  const { handle } = await params;
  const page = await getArtist(handle);
  if (!page) notFound();
  const { member: m, compositions, choreographies, academy } = page;
  const viewer = await getViewer();
  const isMe = viewer?.id === m.id;
  return (
    <div className="page">
      <section className={s.head}>
        <Avatar name={m.name} seed={m.id} size={96} />
        <div className={s.headText}>
          <p className="eyebrow">Artist</p>
          <h1>{m.name}</h1>
          {m.city ? <p className="muted" style={{ marginTop: 4 }}>{m.city}</p> : null}
          {m.roles.length ? (
            <ul className={s.roles} aria-label="Roles">
              {m.roles.map((r) => (
                <li key={r} className={pill("gold")}>
                  {roleLabel(r)}
                </li>
              ))}
            </ul>
          ) : null}
          {m.bio ? <p className={s.bio}>{m.bio}</p> : null}
          {isMe ? (
            <Link href="/profile/edit" className={btn("ghost", { size: "sm" })} style={{ marginTop: 16 }}>
              Edit your profile
            </Link>
          ) : null}
        </div>
      </section>

      <div className="section-head">
        <div>
          <h2>Compositions</h2>
          <p>{plural(compositions.length, "published piece")}</p>
        </div>
      </div>
      {compositions.length ? <CompositionGrid items={compositions} /> : <Empty>No published compositions yet.</Empty>}

      {choreographies.length ? (
        <>
          <div className="section-head">
            <h2>Choreographies</h2>
          </div>
          <RowList>
            {choreographies.map((ch) => (
              <li key={ch.id} className={s.chor}>
                <div>
                  <b>{ch.title}</b>
                  <span className="muted small">
                    {ch.composition ? (
                      <>
                        to <Link href={`/compositions/${ch.composition.slug}`}>{ch.composition.title}</Link>
                      </>
                    ) : (
                      "to a composition that has been removed"
                    )}
                    {ch.about ? ` · ${ch.about}` : ""}
                  </span>
                </div>
                <span className="mono">{money(ch.price)} / event</span>
              </li>
            ))}
          </RowList>
        </>
      ) : null}

      {academy ? (
        <>
          <div className="section-head">
            <h2>Academy</h2>
          </div>
          <div style={{ maxWidth: 560 }}>
            <AcademyCard a={academy} />
          </div>
        </>
      ) : null}
    </div>
  );
}

