import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAcademy } from "@/lib/data/public";
import { enrollmentStatus, getMyEnrollment } from "@/lib/data/private";
import { getViewer } from "@/lib/supabase/server";
import { leaveAcademy, requestToJoin } from "@/lib/actions/app";
import { money, plural } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { ActionButton } from "@/components/ui/ActionButton";
import { Empty } from "@/components/ui/Empty";
import { btn, pill } from "@/components/ui/ui";
import { CompositionRow, RowList } from "@/components/catalogue/CompositionRow";
import { PlayButton } from "@/components/theka/PlayButton";
import s from "./academy.module.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getAcademy(slug);
  if (!page) return { title: "Academy not found" };
  const a = page.academy;
  return {
    title: a.name,
    description: `${a.name}, run by Guru ${a.guru.name}${a.guru.city ? ` in ${a.guru.city}` : ""}. ${a.about}`.slice(0, 300),
    alternates: { canonical: `/academies/${a.slug}` },
  };
}

export default async function AcademyPage({ params }: Props) {
  const { slug } = await params;
  const page = await getAcademy(slug);
  if (!page) notFound();
  const { academy: a, levels } = page;
  const [viewer, enrollment] = await Promise.all([getViewer(), getMyEnrollment(a.id)]);
  const isGuru = viewer?.id === a.guru_id;
  const status = enrollment ? enrollmentStatus(enrollment) : null;
  const myLevel = levels.find((l) => l.id === enrollment?.level_id);
  const path = `/academies/${a.slug}`;
  const pieceCount = new Set(levels.flatMap((l) => l.pieces.map((p) => p.id))).size;

  let join: React.ReactNode;
  if (isGuru) {
    join = (
      <Link href="/academy" className={btn()}>
        Manage your academy
      </Link>
    );
  } else if (status === "active") {
    join = (
      <>
        <span className={pill("solidTeal")}>Enrolled{myLevel ? ` · ${myLevel.name}` : ""}</span>
        <Link href="/library" className={btn("ghost", { size: "sm" })}>
          Your pieces
        </Link>
      </>
    );
  } else if (status === "pending") {
    join = (
      <>
        <span className={pill("gold")}>Waiting for the guru</span>
        <ActionButton action={leaveAcademy.bind(null, a.id)} variant="ghost" size="sm">
          Withdraw request
        </ActionButton>
      </>
    );
  } else if (status === "declined") {
    join = (
      <>
        <span className={pill("soft")}>Not accepted this time</span>
        <ActionButton action={leaveAcademy.bind(null, a.id)} variant="ghost" size="sm">
          Clear
        </ActionButton>
      </>
    );
  } else if (!a.open) {
    join = <span className={pill("soft")}>Not taking new students</span>;
  } else if (!viewer) {
    join = (
      <Link href={`/sign-in?next=${encodeURIComponent(path)}`} className={btn()}>
        Sign in to join
      </Link>
    );
  } else if (!viewer.member) {
    join = (
      <Link href="/onboarding" className={btn()}>
        Finish your profile to join
      </Link>
    );
  } else {
    join = <ActionButton action={requestToJoin.bind(null, a.id)}>Ask to join</ActionButton>;
  }

  return (
    <div className="page">
      <nav aria-label="Breadcrumb" className="small muted row" style={{ gap: 6 }}>
        <Link href="/academies">Academies</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{a.name}</span>
      </nav>
      <section className={s.head}>
        <div className={s.headText}>
          <p className="eyebrow">Academy</p>
          <h1>{a.name}</h1>
          {a.about ? <p className="lede">{a.about}</p> : null}
          <div className="row" style={{ marginTop: 20 }}>
            {join}
          </div>
        </div>
        <aside className={s.facts}>
          <div className={s.guru}>
            <Avatar name={a.guru.name} seed={a.guru.id} size={52} />
            <div>
              <span className="muted small">Guru</span>
              <Link href={`/artists/${a.guru.handle}`} className={s.guruName}>
                {a.guru.name}
              </Link>
              {a.guru.city ? <span className="muted small">{a.guru.city}</span> : null}
            </div>
          </div>
          <dl className={s.dl}>
            <div>
              <dt>Fee</dt>
              <dd>{money(a.fee)} / month</dd>
            </div>
            <div>
              <dt>Levels</dt>
              <dd>{levels.length}</dd>
            </div>
            <div>
              <dt>Pieces</dt>
              <dd>{pieceCount}</dd>
            </div>
          </dl>
          <p className="muted small">Fees are shown for information. Billing isn&apos;t connected yet.</p>
        </aside>
      </section>

      <div className="section-head">
        <div>
          <h2>Syllabus</h2>
          <p>Students get every piece released to their level and the levels before it.</p>
        </div>
      </div>
      {levels.length ? (
        <ol className={s.levels}>
          {levels.map((l, i) => (
            <li key={l.id} className={s.level} data-mine={myLevel?.id === l.id ? "true" : undefined}>
              <div className={s.levelHead}>
                <span className={s.levelNum} aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{l.name}</h3>
                <span className="muted small">{plural(l.pieces.length, "piece")}</span>
                {myLevel?.id === l.id ? <span className={pill("solidTeal")}>Your level</span> : null}
              </div>
              {l.pieces.length ? (
                <RowList>
                  {l.pieces.map((c) => (
                    <CompositionRow key={c.id} c={c}>
                      <PlayButton piece={{ key: c.id, title: c.title, subtitle: c.owner?.name ?? "", taal: c.taal, bpm: c.bpm, href: `/compositions/${c.slug}` }} />
                    </CompositionRow>
                  ))}
                </RowList>
              ) : (
                <p className="muted small">Nothing released to this level yet.</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <Empty>This academy hasn&apos;t set up its levels yet.</Empty>
      )}
    </div>
  );
}
