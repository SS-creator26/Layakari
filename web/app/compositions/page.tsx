import type { Metadata } from "next";
import Link from "next/link";
import { listAcademies, listArtists, listCompositions } from "@/lib/data/public";
import { getViewer } from "@/lib/supabase/server";
import { LAYAS, TAAL_IDS, TAALS, isTaalId } from "@/lib/music";
import { firstName } from "@/lib/format";
import { CompositionGrid } from "@/components/catalogue/CompositionCard";
import { PersonCard } from "@/components/catalogue/PersonCard";
import { AcademyCard } from "@/components/catalogue/AcademyCard";
import { Empty } from "@/components/ui/Empty";
import { Icon } from "@/components/ui/Icon";
import { FlashToast } from "@/components/ui/Toast";
import { btn } from "@/components/ui/ui";
import people from "@/components/catalogue/people.module.css";
import s from "./catalogue.module.css";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Browse Kathak and tabla compositions by taal and laya, hear each theka, and find composers and academies. No account needed.",
  alternates: { canonical: "/compositions" },
};

type Show = "all" | "compositions" | "artists" | "academies";
type Params = { q?: string; taal?: string; laya?: string; show?: string; welcome?: string };

function href(current: Params, patch: Partial<Params>) {
  const next = { ...current, ...patch, welcome: undefined };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v && !(k === "show" && v === "all")) qs.set(k, v);
  const str = qs.toString();
  return `/compositions${str ? `?${str}` : ""}`;
}

export default async function CataloguePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 80);
  const taal = params.taal && isTaalId(params.taal) ? params.taal : undefined;
  const laya = (LAYAS as readonly string[]).includes(params.laya ?? "") ? params.laya : undefined;
  const show: Show = (["compositions", "artists", "academies"] as const).find((x) => x === params.show) ?? "all";
  const current: Params = { q: q || undefined, taal, laya, show };

  const [viewer, comps, artists, academies] = await Promise.all([
    getViewer(),
    listCompositions({ q, taal, laya }),
    listArtists(q || undefined),
    listAcademies(q || undefined),
  ]);
  const filtered = !!(q || taal || laya);
  const tabs: [Show, string, number][] = [
    ["all", "Everything", comps.length + artists.length + academies.length],
    ["compositions", "Compositions", comps.length],
    ["artists", "Artists", artists.length],
    ["academies", "Academies", academies.length],
  ];

  return (
    <>
      <FlashToast message={params.welcome ? "Profile created. Welcome to Layakari." : null} />
      <div className={s.hero}>
        <div className={s.heroInner}>
          <p className="eyebrow" style={{ color: "var(--beat)" }}>
            {viewer?.member ? `Namaste, ${firstName(viewer.member.name)}` : "Open catalogue · no account needed"}
          </p>
          <h1 className={s.title}>Kathak and tabla compositions, with the theka to practise them</h1>
          <p className={s.lede}>
            Browse parans, tihais, kavitts and more from working composers. Hear every taal, read the first line of notation, and find an
            academy that teaches it.
          </p>
          <form role="search" action="/compositions" className={s.search}>
            <label htmlFor="q" className={s.searchLabel}>
              Search titles, composers, academies or forms
            </label>
            <div className={s.searchBox}>
              <Icon name="search" />
              <input id="q" name="q" type="search" defaultValue={q} placeholder="Try “paran”, “Jhaptaal” or “Meera”" />
              {taal ? <input type="hidden" name="taal" value={taal} /> : null}
              {laya ? <input type="hidden" name="laya" value={laya} /> : null}
              {show !== "all" ? <input type="hidden" name="show" value={show} /> : null}
              <button type="submit" className={btn()}>
                Search
              </button>
            </div>
          </form>
          <nav aria-label="Filter by taal" className={s.chips}>
            <Link href={href(current, { taal: undefined })} className={s.chip} aria-current={!taal ? "true" : undefined}>
              All taals
            </Link>
            {TAAL_IDS.map((id) => (
              <Link key={id} href={href(current, { taal: id })} className={s.chip} aria-current={taal === id ? "true" : undefined}>
                {TAALS[id].name} · {TAALS[id].beats}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 8 }}>
        <nav aria-label="What to show" className={s.tabs}>
          {tabs.map(([key, label, count]) => (
            <Link key={key} href={href(current, { show: key })} className={s.tab} aria-current={show === key ? "page" : undefined}>
              {label} <span className={s.count}>{count}</span>
            </Link>
          ))}
        </nav>

        {show === "all" || show === "compositions" ? (
          <section aria-labelledby="h-comps">
            <div className="section-head">
              <div>
                <h2 id="h-comps">Compositions</h2>
                <p aria-live="polite">
                  {filtered ? `${comps.length} matching` : `${comps.length} published · open any piece to hear its taal`}
                  {taal ? (
                    <>
                      {" · "}
                      <Link href={`/taals/${taal}`}>About {TAALS[taal].name}</Link>
                    </>
                  ) : null}
                </p>
              </div>
              <nav aria-label="Laya" className={s.segmented}>
                {[undefined, ...LAYAS].map((l) => (
                  <Link key={l ?? "any"} href={href(current, { laya: l })} aria-current={laya === l ? "true" : undefined}>
                    {l ?? "Any laya"}
                  </Link>
                ))}
              </nav>
            </div>
            {comps.length ? (
              <CompositionGrid items={comps} />
            ) : (
              <Empty
                title={filtered ? "Nothing matches yet" : "No compositions published yet"}
                actions={
                  filtered ? (
                    <Link href="/compositions" className={btn("ghost")}>
                      Clear filters
                    </Link>
                  ) : (
                    <Link href="/studio" className={btn()}>
                      Publish the first one
                    </Link>
                  )
                }
              >
                {filtered ? "Try another taal, laya, or a shorter search." : "Composers publish from Studio."}
              </Empty>
            )}
          </section>
        ) : null}

        {show === "all" || show === "artists" ? (
          <section aria-labelledby="h-artists">
            <div className="section-head">
              <div>
                <h2 id="h-artists">Artists</h2>
                <p>Composers, choreographers and gurus, each with a public page of their work.</p>
              </div>
            </div>
            {artists.length ? (
              <ul className={people.cards}>
                {(show === "all" ? artists.slice(0, 8) : artists).map((p) => (
                  <li key={p.id}>
                    <PersonCard p={p} />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>{q ? `No artists match “${q}”.` : "No artists yet."}</Empty>
            )}
            {show === "all" && artists.length > 8 ? (
              <p style={{ marginTop: 16 }}>
                <Link href={href(current, { show: "artists" })}>See all {artists.length} artists</Link>
              </p>
            ) : null}
          </section>
        ) : null}

        {show === "all" || show === "academies" ? (
          <section aria-labelledby="h-acad">
            <div className="section-head">
              <div>
                <h2 id="h-acad">Academies</h2>
                <p>Gurus teaching in levels, with the pieces each level learns.</p>
              </div>
            </div>
            {academies.length ? (
              <ul className={people.cardsWide}>
                {academies.map((a) => (
                  <li key={a.id}>
                    <AcademyCard a={a} />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>{q ? `No academies match “${q}”.` : "No academies yet. Gurus can start one from the Academy tab."}</Empty>
            )}
          </section>
        ) : null}

        {!viewer ? (
          <section aria-labelledby="h-join" className={s.band}>
            <div>
              <h2 id="h-join">Publish your own compositions</h2>
              <p>Composers keep 80% of every licence. Gurus can release pieces to each level of their academy.</p>
            </div>
            <Link href="/sign-up" className={btn("beat")}>
              Create a free account
            </Link>
          </section>
        ) : null}
      </div>
    </>
  );
}
