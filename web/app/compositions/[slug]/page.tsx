import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getComposition } from "@/lib/data/public";
import { getAccess } from "@/lib/data/private";
import { getViewer } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";
import { buyChoreography, buyLicence } from "@/lib/actions/app";
import { KIND_ORDER, LICENCE_KINDS, OWNER_RANK, priceOf, rankName } from "@/lib/licensing";
import { money, plural } from "@/lib/format";
import { roleLabel, taalOf } from "@/lib/music";
import { TaalCover } from "@/components/ui/TaalCover";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { ActionButton } from "@/components/ui/ActionButton";
import { btn, pill } from "@/components/ui/ui";
import { ThekaPanel } from "@/components/theka/ThekaPanel";
import { PlayButton } from "@/components/theka/PlayButton";
import { CopyLink } from "@/components/catalogue/CopyLink";
import { Notation } from "@/components/catalogue/Notation";
import s from "./composition.module.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getComposition(slug);
  if (!page) return { title: "Composition not found" };
  const c = page.composition;
  const t = taalOf(c.taal);
  const description = `${c.form} in ${t.name} (${t.beats} matras), ${c.laya} laya, by ${c.owner.name}. Hear the theka, read the first line of notation, and license it to listen, perform or teach.`;
  return {
    title: `${c.title} by ${c.owner.name}`,
    description,
    alternates: { canonical: `/compositions/${c.slug}` },
    openGraph: { type: "music.song", title: `${c.title} · ${c.form} in ${t.name}`, description, url: `/compositions/${c.slug}` },
  };
}

export default async function CompositionPage({ params }: Props) {
  const { slug } = await params;
  const page = await getComposition(slug);
  if (!page) notFound();
  const { composition: c, choreographies, moreByOwner, taughtAt } = page;
  const [viewer, access] = await Promise.all([getViewer(), getAccess(c.id, choreographies.map((ch) => ch.id))]);
  const t = taalOf(c.taal);
  const isOwner = access.rank >= OWNER_RANK;
  const held = rankName(access.rank);
  const path = `/compositions/${c.slug}`;
  const signInHref = `/sign-in?next=${encodeURIComponent(path)}`;
  const piece = { key: c.id, title: c.title, subtitle: c.owner.name, taal: c.taal, bpm: c.bpm, href: path };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: c.title,
    url: `${siteUrl()}${path}`,
    composer: { "@type": "Person", name: c.owner.name, url: `${siteUrl()}/artists/${c.owner.handle}` },
    genre: ["Kathak", "Tabla", c.form],
    musicalKey: undefined,
    inLanguage: "hi",
    offers: KIND_ORDER.map((k) => ({ "@type": "Offer", name: `${LICENCE_KINDS[k].name} licence`, price: priceOf(c, k), priceCurrency: "CAD" })),
  };

  return (
    <div className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className={s.crumbs}>
        <Link href="/compositions">Catalogue</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/taals/${t.id}`}>{t.name}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{c.title}</span>
      </nav>

      <section className={s.top}>
        <TaalCover taal={c.taal} seed={c.id} className={s.cover} />
        <div className={s.intro}>
          <p className="eyebrow">{c.form} · {c.status === "draft" ? "Draft, only you can see it" : "Kathak · Tabla"}</p>
          <h1 className={s.title}>{c.title}</h1>
          <p className={s.by}>
            by <Link href={`/artists/${c.owner.handle}`}>{c.owner.name}</Link>
            {c.owner.city ? ` · ${c.owner.city}` : ""}
          </p>
          <div className={s.pills}>
            <span className={pill("gold")}>
              {t.name} · {t.beats} matras
            </span>
            <span className={pill()}>
              {c.laya} laya · {c.bpm} bpm
            </span>
            {c.line_count ? <span className={pill()}>{plural(c.line_count, "line")} of notation</span> : null}
          </div>
          <div className={s.actions}>
            <PlayButton piece={piece} withLabel variant="primary" />
            <CopyLink path={path} />
          </div>
          {held ? (
            <p className={s.access}>
              <Icon name="check" size={18} />
              {isOwner ? "Your composition" : `You hold a ${held} licence`}
            </p>
          ) : access.via ? (
            <p className={s.access}>
              <Icon name="check" size={18} />
              Released to you by {access.via}
            </p>
          ) : null}
        </div>
      </section>

      <div className={s.columns}>
        <div className={s.main}>
          <ThekaPanel piece={piece}>
            <Notation
              full={access.notation}
              preview={c.preview}
              lineCount={c.line_count}
              lockedMessage={
                c.line_count > 1
                  ? `The first line is free. Any licence unlocks all ${c.line_count} lines.`
                  : "Any licence unlocks the full notation."
              }
            />
          </ThekaPanel>

          {choreographies.length ? (
            <section aria-labelledby="h-chor">
              <div className={s.sectionHead}>
                <h2 id="h-chor">Choreographies to this piece</h2>
                <span className="muted small">Choreographer keeps 70%, composer 15%</span>
              </div>
              <ul className={s.list}>
                {choreographies.map((ch) => {
                  const mine = viewer?.id === ch.owner_id;
                  const has = access.ownedChoreographies.includes(ch.id);
                  return (
                    <li key={ch.id} className={s.listRow}>
                      <Avatar name={ch.owner.name} seed={ch.owner.id} size={44} />
                      <div className={s.grow}>
                        <b>{ch.title}</b>
                        <span className="muted small">
                          <Link href={`/artists/${ch.owner.handle}`}>{ch.owner.name}</Link>
                          {ch.about ? ` · ${ch.about}` : ""}
                        </span>
                      </div>
                      {mine ? (
                        <span className={pill()}>Yours</span>
                      ) : has ? (
                        <span className={pill("teal")}>Licensed</span>
                      ) : viewer?.member ? (
                        <ActionButton action={buyChoreography.bind(null, ch.id)} size="sm">
                          License · {money(ch.price)}
                        </ActionButton>
                      ) : (
                        <span className="mono">{money(ch.price)}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {moreByOwner.length ? (
            <section aria-labelledby="h-more">
              <div className={s.sectionHead}>
                <h2 id="h-more">More from {c.owner.name}</h2>
              </div>
              <ul className={s.more}>
                {moreByOwner.map((m) => (
                  <li key={m.id}>
                    <Link href={`/compositions/${m.slug}`} className={s.moreCard}>
                      <TaalCover taal={m.taal} seed={m.id} className={s.moreCover} decorative />
                      <span>
                        <b>{m.title}</b>
                        <span className="muted small">
                          {taalOf(m.taal).name} · {m.laya} · from {money(Math.min(m.price_listen, m.price_perform, m.price_teach))}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className={s.aside}>
          <section id="licences" aria-labelledby="h-lic" className={s.card}>
            <h2 id="h-lic">{isOwner ? "Your licence prices" : "License this piece"}</h2>
            <p className="muted small" style={{ margin: "4px 0 6px" }}>
              {isOwner ? "You keep 80% of every licence." : `${c.owner.name} keeps 80% of every licence.`}
            </p>
            <ul className={s.licences}>
              {KIND_ORDER.map((k) => {
                const K = LICENCE_KINDS[k];
                const included = access.rank >= K.rank;
                return (
                  <li key={k} className={s.licence} data-owned={included && !isOwner ? "true" : undefined}>
                    <div>
                      <b>{K.name}</b>
                      <span className="muted small">{K.description}</span>
                    </div>
                    {isOwner || !viewer?.member ? (
                      <span className={s.price}>{money(priceOf(c, k))}</span>
                    ) : included ? (
                      <span className={s.included}>
                        <Icon name="check" size={16} /> Included
                      </span>
                    ) : (
                      <ActionButton action={buyLicence.bind(null, c.id, k)} size="sm" aria-label={`Get ${K.name} licence for ${money(priceOf(c, k))}`}>
                        {money(priceOf(c, k))}
                      </ActionButton>
                    )}
                  </li>
                );
              })}
            </ul>
            {isOwner ? (
              <Link href={`/studio/compositions/${c.id}/edit`} className={btn("ghost", { block: true })} style={{ marginTop: 14 }}>
                Edit composition
              </Link>
            ) : !viewer ? (
              <>
                <Link href={signInHref} className={btn("primary", { block: true })} style={{ marginTop: 14 }}>
                  Sign in to license
                </Link>
                <p className="muted small" style={{ marginTop: 10, textAlign: "center" }}>
                  New here? <Link href={`/sign-up?next=${encodeURIComponent(path)}`}>Create a free account</Link>
                </p>
              </>
            ) : !viewer.member ? (
              <Link href="/onboarding" className={btn("primary", { block: true })} style={{ marginTop: 14 }}>
                Finish your profile to license
              </Link>
            ) : (
              <p className={s.demo}>Demo checkout: the licence is recorded and the artist&apos;s earnings update, but no payment is taken.</p>
            )}
          </section>

          {taughtAt.length ? (
            <section aria-labelledby="h-taught" className={s.taught}>
              <h2 id="h-taught">Taught at</h2>
              <ul>
                {taughtAt.map((ta) => (
                  <li key={ta.academy.id}>
                    <Link href={`/academies/${ta.academy.slug}`}>
                      <b>{ta.academy.name}</b>
                    </Link>
                    <span>
                      Guru {ta.guru.name}
                      {ta.guru.city ? ` · ${ta.guru.city}` : ""} · from {ta.level}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="h-composer" className={s.card}>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <Avatar name={c.owner.name} seed={c.owner.id} size={56} />
              <div>
                <h2 id="h-composer" className={s.composerName}>
                  {c.owner.name}
                </h2>
                <span className="muted small">
                  {c.owner.roles.slice(0, 2).map(roleLabel).join(", ") || "Composer"}
                  {c.owner.city ? ` · ${c.owner.city}` : ""}
                </span>
              </div>
            </div>
            {c.owner.bio ? <p className={s.bio}>{c.owner.bio}</p> : null}
            <Link href={`/artists/${c.owner.handle}`} className={s.profileLink}>
              View profile and {plural(moreByOwner.length + 1, "composition")}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
