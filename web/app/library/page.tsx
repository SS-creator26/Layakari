import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/supabase/require";
import { getLibrary } from "@/lib/data/private";
import { leaveAcademy } from "@/lib/actions/app";
import { LICENCE_KINDS, KIND_ORDER } from "@/lib/licensing";
import { firstName, plural } from "@/lib/format";
import { taalOf } from "@/lib/music";
import { ActionButton } from "@/components/ui/ActionButton";
import { Empty } from "@/components/ui/Empty";
import { FlashToast } from "@/components/ui/Toast";
import { btn, pill } from "@/components/ui/ui";
import { CompositionRow, RowList } from "@/components/catalogue/CompositionRow";
import { PlayButton } from "@/components/theka/PlayButton";

export const metadata: Metadata = { title: "Your library", robots: { index: false } };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const [{ welcome }, viewer] = await Promise.all([searchParams, requireMember("/library")]);
  const { licences, memberships } = await getLibrary(viewer.id);

  return (
    <div className="page">
      <FlashToast message={welcome ? `Welcome to Layakari, ${firstName(viewer.member.name)}.` : null} />
      <p className="eyebrow">Library</p>
      <h1>Your pieces</h1>
      <p className="lede">Everything you&rsquo;ve licensed, and what your gurus have released to you.</p>

      <section aria-labelledby="academies-h">
        <div className="section-head">
          <div>
            <h2 id="academies-h">From your academies</h2>
            <p>Pieces unlock as your guru releases them to your level.</p>
          </div>
          <Link href="/academies" className={btn("ghost", { size: "sm" })}>
            Find an academy
          </Link>
        </div>
        {memberships.length === 0 ? (
          <Empty title="You haven't joined an academy yet">Join a guru&rsquo;s academy to learn the pieces they teach.</Empty>
        ) : (
          <div className="stack">
            {memberships.map((m) => (
              <article key={m.academy.id} className="panel stack">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <h3>
                      <Link href={`/academies/${m.academy.slug}`} style={{ color: "inherit" }}>
                        {m.academy.name}
                      </Link>
                    </h3>
                    <p className="muted small">Guru {m.academy.guru?.name}</p>
                  </div>
                  <div className="row">
                    {m.status === "active" ? (
                      <span className={pill("solidTeal")}>{m.level?.name ?? "Enrolled"}</span>
                    ) : m.status === "pending" ? (
                      <span className={pill("gold")}>Waiting for the guru</span>
                    ) : (
                      <span className={pill("soft")}>Not accepted</span>
                    )}
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      action={leaveAcademy.bind(null, m.academy.id)}
                      confirm={
                        m.status === "active"
                          ? {
                              title: `Leave ${m.academy.name}?`,
                              body: "You'll lose access to the pieces released to you. You can ask to join again later.",
                              action: "Leave academy",
                            }
                          : undefined
                      }
                    >
                      {m.status === "active" ? "Leave" : m.status === "pending" ? "Withdraw request" : "Remove"}
                    </ActionButton>
                  </div>
                </div>
                {m.status === "active" ? (
                  m.pieces.length ? (
                    <RowList>
                      {m.pieces.map((c) => (
                        <CompositionRow key={c.id} c={c}>
                          <PlayButton piece={{ key: c.id, title: c.title, subtitle: c.owner?.name ?? "", taal: c.taal, bpm: c.bpm, href: `/compositions/${c.slug}` }} />
                        </CompositionRow>
                      ))}
                    </RowList>
                  ) : (
                    <p className="muted small">Nothing released to your level yet.</p>
                  )
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="licences-h">
        <div className="section-head">
          <div>
            <h2 id="licences-h">Licensed by you</h2>
            <p>{plural(licences.length, "composition")}</p>
          </div>
          <Link href="/compositions" className={btn("ghost", { size: "sm" })}>
            Browse compositions
          </Link>
        </div>
        {licences.length === 0 ? (
          <Empty
            title="No licences yet"
            actions={
              <Link href="/compositions" className={btn()}>
                Explore the catalogue
              </Link>
            }
          >
            A Listen licence unlocks the full notation of a piece. Perform and Teach add the right to use it on stage and in class.
          </Empty>
        ) : (
          <RowList>
            {licences.map(({ composition: c, kinds }) => {
              const top = [...KIND_ORDER].reverse().find((k) => kinds.includes(k));
              return (
                <CompositionRow
                  key={c.id}
                  c={c}
                  meta={
                    <>
                      {c.owner?.name} · {taalOf(c.taal).name} · {top ? `${LICENCE_KINDS[top].name} licence` : "Choreography"}
                    </>
                  }
                >
                  <PlayButton piece={{ key: c.id, title: c.title, subtitle: c.owner?.name ?? "", taal: c.taal, bpm: c.bpm, href: `/compositions/${c.slug}` }} />
                </CompositionRow>
              );
            })}
          </RowList>
        )}
      </section>
    </div>
  );
}
