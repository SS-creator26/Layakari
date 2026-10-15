import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listCompositions } from "@/lib/data/public";
import { isTaalId, TAAL_IDS, TAALS } from "@/lib/music";
import { CompositionGrid } from "@/components/catalogue/CompositionCard";
import { ThekaPanel } from "@/components/theka/ThekaPanel";
import { Empty } from "@/components/ui/Empty";
import { btn } from "@/components/ui/ui";

type Props = { params: Promise<{ taal: string }> };

export function generateStaticParams() {
  return TAAL_IDS.map((taal) => ({ taal }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { taal } = await params;
  if (!isTaalId(taal)) return { title: "Taal not found" };
  const t = TAALS[taal];
  return {
    title: `${t.name}: ${t.beats} matras, theka and compositions`,
    description: `${t.about} Hear the ${t.name} theka at any laya and browse Kathak and tabla compositions set in it.`,
    alternates: { canonical: `/taals/${taal}` },
  };
}

export default async function TaalPage({ params }: Props) {
  const { taal } = await params;
  if (!isTaalId(taal)) notFound();
  const t = TAALS[taal];
  const comps = await listCompositions({ taal });
  const vibhags = Object.keys(t.marks)
    .map(Number)
    .sort((a, b) => a - b)
    .map((start, i, all) => (all[i + 1] ?? t.beats) - start);
  return (
    <div className="page">
      <nav aria-label="Breadcrumb" className="small muted row" style={{ gap: 6 }}>
        <Link href="/compositions">Catalogue</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.name}</span>
      </nav>
      <p className="eyebrow" style={{ marginTop: 22 }}>
        Taal · {t.beats} matras · vibhags {vibhags.join("-")}
      </p>
      <h1>{t.name}</h1>
      <p className="lede">{t.about}</p>
      <nav aria-label="Other taals" className="row" style={{ marginTop: 18 }}>
        {TAAL_IDS.filter((id) => id !== taal).map((id) => (
          <Link key={id} href={`/taals/${id}`} className={btn("ghost", { size: "sm" })}>
            {TAALS[id].name} · {TAALS[id].beats}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: 28 }}>
        <ThekaPanel piece={{ key: `taal:${taal}`, title: `${t.name} theka`, subtitle: `${t.beats} matras`, taal, bpm: 80, href: `/taals/${taal}` }} />
      </div>
      <div className="section-head">
        <div>
          <h2>Compositions in {t.name}</h2>
          <p>{comps.length} published</p>
        </div>
      </div>
      {comps.length ? (
        <CompositionGrid items={comps} />
      ) : (
        <Empty
          title={`No ${t.name} compositions yet`}
          actions={
            <Link href="/studio/compositions/new" className={btn()}>
              Publish one
            </Link>
          }
        >
          Composers publish from Studio.
        </Empty>
      )}
    </div>
  );
}
