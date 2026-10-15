import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/supabase/require";
import { getGuruAcademy } from "@/lib/data/private";
import { declineStudent, deleteLevel, removeStudent } from "@/lib/actions/app";
import { firstName, money, plural, shortDate } from "@/lib/format";
import { taalOf } from "@/lib/music";
import { ActionButton } from "@/components/ui/ActionButton";
import { Avatar } from "@/components/ui/Avatar";
import { Empty } from "@/components/ui/Empty";
import { FlashToast } from "@/components/ui/Toast";
import { btn } from "@/components/ui/ui";
import { CompositionRow, RowList } from "@/components/catalogue/CompositionRow";
import { AcademyForm, EditAcademyButton, LevelForm, OpenSwitch, PieceSwitch, PlaceStudent } from "@/components/app/AcademyControls";
import a from "@/components/app/app.module.css";

export const metadata: Metadata = { title: "Your academy", robots: { index: false } };

export default async function GuruAcademyPage({ searchParams }: { searchParams: Promise<{ level?: string; welcome?: string }> }) {
  const [{ level: levelParam, welcome }, viewer] = await Promise.all([searchParams, requireMember("/academy")]);
  const data = await getGuruAcademy(viewer.id);

  if (!data) {
    return (
      <div className="page">
        <FlashToast message={welcome ? `Welcome, ${firstName(viewer.member.name)}.` : null} />
        <p className="eyebrow">Academy</p>
        <h1>Teach on Layakari</h1>
        <p className="lede">
          Run your class here: students ask to join, you place them in a level, and release the pieces each level is ready for.
          They read the notation and practise with the theka at home.
        </p>
        <div className={`panel ${a.formCard}`} style={{ marginTop: 24 }}>
          <h2>Start your academy</h2>
          <p className="muted small" style={{ marginTop: 6 }}>
            We&rsquo;ll set up three levels to begin with: Prarambhik, Madhyama and Visharad. Rename or add to them any time.
          </p>
          <AcademyForm />
        </div>
      </div>
    );
  }

  const { academy, levels, students, requests, teachable } = data;
  const level = levels.find((l) => l.id === levelParam) ?? levels[0];
  const levelOptions = levels.map(({ id, name }) => ({ id, name }));
  const inLevel = level ? students.filter((s) => s.enrollment.level_id === level.id) : [];
  // Students also see everything released to earlier levels.
  const visible = level ? new Set(levels.filter((l) => l.position <= level.position).flatMap((l) => l.pieceIds)) : new Set<string>();

  return (
    <div className="page">
      <FlashToast message={welcome ? `Welcome, ${firstName(viewer.member.name)}.` : null} />
      <div className={a.head}>
        <div>
          <p className="eyebrow">Your academy</p>
          <h1>{academy.name}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {plural(students.length, "student")} · {money(academy.fee)} a month
          </p>
        </div>
        <div className="row">
          <OpenSwitch open={academy.open} />
          <Link href={`/academies/${academy.slug}`} className={btn("ghost")}>
            Public page
          </Link>
          <EditAcademyButton initial={{ name: academy.name, about: academy.about, fee: Number(academy.fee) }} />
        </div>
      </div>

      {requests.length ? (
        <section aria-labelledby="req-h">
          <div className="section-head">
            <div>
              <h2 id="req-h">Asking to join</h2>
              <p>Choose a level to accept each student.</p>
            </div>
          </div>
          <ul className={a.people}>
            {requests.map((r) => (
              <li key={r.member.id} className={a.person}>
                <Avatar name={r.member.name} seed={r.member.id} size={40} />
                <div className={a.personName}>
                  <Link href={`/artists/${r.member.handle}`}>{r.member.name}</Link>
                  <span>
                    {r.member.city ? `${r.member.city} · ` : ""}asked {shortDate(r.enrollment.requested_at)}
                  </span>
                </div>
                <PlaceStudent studentId={r.member.id} name={r.member.name} levels={levelOptions} label="Accept" />
                <ActionButton variant="ghost" size="sm" action={declineStudent.bind(null, r.member.id)}>
                  Decline<span className="visually-hidden"> {r.member.name}</span>
                </ActionButton>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="levels-h">
        <div className="section-head">
          <div>
            <h2 id="levels-h">Levels</h2>
            <p>Students see the pieces released to their level and every level before it.</p>
          </div>
          <LevelForm submit="Add level" />
        </div>
        <nav aria-label="Levels" className={a.tabs}>
          {levels.map((l) => {
            const count = students.filter((s) => s.enrollment.level_id === l.id).length;
            return (
              <Link key={l.id} href={`/academy?level=${l.id}`} className={a.tab} aria-current={l.id === level?.id ? "page" : undefined} scroll={false}>
                {l.name} <span className={a.count}>{count}</span>
              </Link>
            );
          })}
        </nav>

        {level ? (
          <div className={a.split}>
            <div className="panel stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>Pieces for {level.name}</h3>
                <span className="muted small">{plural(visible.size, "piece")} visible to these students</span>
              </div>
              {teachable.length === 0 ? (
                <Empty
                  actions={
                    <>
                      <Link href="/studio/compositions/new" className={btn("ghost", { size: "sm" })}>
                        Publish your own
                      </Link>
                      <Link href="/compositions" className={btn("ghost", { size: "sm" })}>
                        Browse the catalogue
                      </Link>
                    </>
                  }
                >
                  You can teach your own compositions and any piece you hold a Teach licence for.
                </Empty>
              ) : (
                <RowList>
                  {teachable.map(({ composition: c, canTeach }) => {
                    const here = level.pieceIds.includes(c.id);
                    const earlier = !here && visible.has(c.id);
                    return (
                      <CompositionRow
                        key={c.id}
                        c={c}
                        meta={
                          <>
                            {c.owner?.id === viewer.id ? "Yours" : c.owner?.name} · {taalOf(c.taal).name}
                            {earlier ? " · released to an earlier level" : ""}
                            {!canTeach ? " · needs a Teach licence" : ""}
                          </>
                        }
                      >
                        {!canTeach && !here ? (
                          <Link href={`/compositions/${c.slug}#licences`} className={btn("ghost", { size: "sm" })}>
                            Get Teach
                          </Link>
                        ) : null}
                        <PieceSwitch key={`${level.id}:${here}`} levelId={level.id} compositionId={c.id} title={c.title} released={here} canTeach={canTeach} />
                      </CompositionRow>
                    );
                  })}
                </RowList>
              )}
            </div>

            <div className="stack">
              <div className="panel stack">
                <h3>Students in {level.name}</h3>
                {inLevel.length === 0 ? (
                  <p className="muted small">No students at this level yet.</p>
                ) : (
                  <ul className={a.people}>
                    {inLevel.map((s) => (
                      <li key={s.member.id} className={a.person}>
                        <div className={a.personName}>
                          <Link href={`/artists/${s.member.handle}`}>{s.member.name}</Link>
                          <span>since {shortDate(s.enrollment.updated_at)}</span>
                        </div>
                        {levels.length > 1 ? (
                          <PlaceStudent studentId={s.member.id} name={s.member.name} levels={levelOptions} current={level.id} label="Move" />
                        ) : null}
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={removeStudent.bind(null, s.member.id)}
                          confirm={{
                            title: `Remove ${s.member.name}?`,
                            body: "They lose access to the pieces you've released. They can ask to join again.",
                            action: "Remove student",
                          }}
                        >
                          Remove<span className="visually-hidden"> {s.member.name}</span>
                        </ActionButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="panel stack">
                <h3>Level settings</h3>
                <LevelForm key={level.id} id={level.id} name={level.name} submit="Rename" />
                {levels.length > 1 ? (
                  <div>
                    <ActionButton
                      variant="danger"
                      size="sm"
                      action={deleteLevel.bind(null, level.id)}
                      confirm={{
                        title: `Delete ${level.name}?`,
                        body: inLevel.length
                          ? `Its ${plural(inLevel.length, "student")} move to your first remaining level. Pieces released only here are hidden from them.`
                          : "Pieces released only to this level are hidden from students.",
                        action: "Delete level",
                      }}
                    >
                      Delete level
                    </ActionButton>
                  </div>
                ) : (
                  <p className="muted small">An academy needs at least one level.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Empty title="No levels yet">Add a level to start placing students.</Empty>
        )}
      </section>

    </div>
  );
}
