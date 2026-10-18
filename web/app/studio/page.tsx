import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/supabase/require";
import { getStudio } from "@/lib/data/private";
import { addSampleCompositions, deleteChoreography } from "@/lib/actions/app";
import { LICENCE_KINDS } from "@/lib/licensing";
import { firstName, money, plural, shortDate } from "@/lib/format";
import { taalOf } from "@/lib/music";
import { ActionButton } from "@/components/ui/ActionButton";
import { Empty } from "@/components/ui/Empty";
import { FlashToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { btn, pill } from "@/components/ui/ui";
import { CompositionRow, RowList } from "@/components/catalogue/CompositionRow";
import a from "@/components/app/app.module.css";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };

type Flags = { welcome?: string; published?: string; saved?: string; deleted?: string; choreography?: string };

function flash(f: Flags, name: string): string | null {
  if (f.welcome) return `Welcome, ${firstName(name)}. This is your Studio: publish compositions and see what they earn.`;
  if (f.published) return "Composition saved.";
  if (f.saved) return "Changes saved.";
  if (f.deleted) return "Composition deleted.";
  if (f.choreography) return "Choreography published.";
  return null;
}

export default async function StudioPage({ searchParams }: { searchParams: Promise<Flags> }) {
  const [flags, viewer] = await Promise.all([searchParams, requireMember("/studio")]);
  const studio = await getStudio(viewer.id);
  const earned = studio.sales.reduce((sum, s) => sum + s.share, 0);
  const published = studio.compositions.filter((c) => c.status === "published").length;
  const allDemo = studio.sales.length > 0 && studio.sales.every((s) => s.is_demo);

  return (
    <div className="page">
      <FlashToast message={flash(flags, viewer.member.name)} />
      <div className={a.head}>
        <div>
          <p className="eyebrow">Studio</p>
          <h1>Your work</h1>
        </div>
        <div className="row">
          <Link href="/studio/choreographies/new" className={btn("ghost")}>
            New choreography
          </Link>
          <Link href="/studio/compositions/new" className={btn()}>
            <Icon name="plus" size={18} /> New composition
          </Link>
        </div>
      </div>

      <section aria-label="Earnings" style={{ marginTop: 24 }}>
        <div className={a.hero}>
          <div>
            <p className="eyebrow">Earned so far</p>
            <p className={a.heroFigure}>{money(earned)}</p>
            <p className={a.heroNote}>
              Your share: 80% of your compositions&rsquo; licences, 70% of your choreographies, and 15% when someone licenses a
              choreography set to your composition.
            </p>
          </div>
          {allDemo ? <span className={a.heroTag}>Demo purchases only</span> : null}
        </div>
        <div className={a.tiles}>
          <div className={a.tile}>
            <strong>{studio.sales.length}</strong>
            <span>{studio.sales.length === 1 ? "sale" : "sales"}</span>
          </div>
          <div className={a.tile}>
            <strong>{published}</strong>
            <span>published</span>
          </div>
          <div className={a.tile}>
            <strong>{studio.choreographies.length}</strong>
            <span>{studio.choreographies.length === 1 ? "choreography" : "choreographies"}</span>
          </div>
          <div className={a.tile}>
            <strong>{studio.taughtIn}</strong>
            <span>{studio.taughtIn === 1 ? "academy teaches" : "academies teach"} your work</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="comps-h">
        <div className="section-head">
          <div>
            <h2 id="comps-h">Compositions</h2>
            <p>{plural(studio.compositions.length, "piece")}</p>
          </div>
        </div>
        {studio.compositions.length === 0 ? (
          <Empty
            title="Nothing published yet"
            actions={
              <>
                <Link href="/studio/compositions/new" className={btn()}>
                  Publish your first composition
                </Link>
                <ActionButton variant="ghost" action={addSampleCompositions}>
                  Add six sample pieces
                </ActionButton>
              </>
            }
          >
            Write out the bols, set a taal and tempo, and choose your prices. Samples are a quick way to see how it all works.
          </Empty>
        ) : (
          <RowList>
            {studio.compositions.map((c) => (
              <CompositionRow
                key={c.id}
                c={c}
                meta={
                  <>
                    {taalOf(c.taal).name} · {c.form} · Listen {money(c.price_listen)}, Perform {money(c.price_perform)}, Teach{" "}
                    {money(c.price_teach)}
                  </>
                }
              >
                {c.status === "draft" ? <span className={pill("soft")}>Draft</span> : null}
                <Link href={`/studio/compositions/${c.id}/edit`} className={btn("ghost", { size: "sm" })}>
                  Edit<span className="visually-hidden"> {c.title}</span>
                </Link>
              </CompositionRow>
            ))}
          </RowList>
        )}
      </section>

      <section aria-labelledby="chor-h">
        <div className="section-head">
          <div>
            <h2 id="chor-h">Choreographies</h2>
            <p>Your movement set to any published composition.</p>
          </div>
          <Link href="/studio/choreographies/new" className={btn("ghost", { size: "sm" })}>
            New choreography
          </Link>
        </div>
        {studio.choreographies.length === 0 ? (
          <Empty>No choreographies yet. The composer of the piece earns 15% of each one you sell.</Empty>
        ) : (
          <ul className={a.people}>
            {studio.choreographies.map((ch) => (
              <li key={ch.id} className={a.person}>
                <div className={a.personName}>
                  <strong>{ch.title}</strong>
                  <span>
                    {ch.composition ? (
                      <>
                        Set to <Link href={`/compositions/${ch.composition.slug}`}>{ch.composition.title}</Link> by{" "}
                        {ch.composition.owner?.name}
                      </>
                    ) : (
                      "Its composition was removed"
                    )}{" "}
                    · {money(ch.price)}
                  </span>
                </div>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  action={deleteChoreography.bind(null, ch.id)}
                  confirm={{ title: `Delete ${ch.title}?`, body: "People who licensed it keep their licence.", action: "Delete" }}
                >
                  Delete<span className="visually-hidden"> {ch.title}</span>
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="sales-h">
        <div className="section-head">
          <div>
            <h2 id="sales-h">Sales</h2>
            <p>Checkout is in demo mode: no money changes hands until payments are switched on.</p>
          </div>
        </div>
        {studio.sales.length === 0 ? (
          <Empty>No sales yet. When someone licenses your work it shows up here.</Empty>
        ) : (
          <div className={a.tableWrap}>
            <table className={a.table}>
              <caption className="visually-hidden">Your sales, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Piece</th>
                  <th scope="col">Licence</th>
                  <th scope="col">Buyer</th>
                  <th scope="col" className={a.num}>
                    Price
                  </th>
                  <th scope="col" className={a.num}>
                    Your share
                  </th>
                </tr>
              </thead>
              <tbody>
                {studio.sales.map((s) => (
                  <tr key={s.licence_id}>
                    <td>{shortDate(s.sold_at)}</td>
                    <td>{s.choreography_title ?? s.composition_title ?? "Removed piece"}</td>
                    <td>
                      {s.kind === "choreo" ? "Choreography" : LICENCE_KINDS[s.kind].name}
                      {s.is_demo ? <span className="muted"> · demo</span> : null}
                    </td>
                    <td>{s.buyer_name}</td>
                    <td className={a.num}>{money(s.price)}</td>
                    <td className={a.num}>{money(s.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
