import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { TAALS } from "@/lib/music";
import { DEMO_PIECE } from "@/lib/samples";
import { listCompositions } from "@/lib/data/public";
import { TaalCover } from "@/components/ui/TaalCover";
import { Icon, LogoMark } from "@/components/ui/Icon";
import { btn, pill } from "@/components/ui/ui";
import { ThekaPanel } from "@/components/theka/ThekaPanel";
import { Notation } from "@/components/catalogue/Notation";
import { CompositionGrid } from "@/components/catalogue/CompositionCard";
import s from "./landing.module.css";

export default async function Home() {
  const viewer = await getViewer();
  if (viewer?.member) redirect("/compositions");
  if (viewer) redirect("/onboarding");
  const latest = (await listCompositions().catch(() => [])).slice(0, 4);
  const t = TAALS.teentaal;
  const demo = { key: "demo", title: DEMO_PIECE.title, subtitle: "Sample composition", taal: DEMO_PIECE.taal, bpm: DEMO_PIECE.bpm };

  return (
    <>
      <section className={s.hero} aria-labelledby="land-h">
        <div className={s.heroInner}>
          <div className={s.copy}>
            <p className={s.kicker}>Kathak · Tabla · Taal</p>
            <h1 id="land-h" className={s.title}>
              Every composition finds its <em>sam</em>.
            </h1>
            <p className={s.lede}>
              A home for Kathak and tabla artists. Composers publish and license their work, gurus run their academies, and students
              practise every piece with full notation and a live theka.
            </p>
            <div className={s.ctas}>
              <Link href="/sign-up" className={btn("beat")}>
                Join free
              </Link>
              <Link href="/compositions" className={btn("onHero")}>
                Browse the catalogue
                <Icon name="arrow" size={18} />
              </Link>
            </div>
            <ul className={s.reassure}>
              <li>Free to join</li>
              <li>No card needed</li>
              <li>Browse without an account</li>
            </ul>
          </div>
          <div className={s.ringWrap}>
            <svg className={s.ring} viewBox="0 0 120 120" role="img" aria-label="Teentaal, 16 matras, cycling to sam">
              <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(246,239,248,.14)" strokeWidth=".8" />
              {t.bols.map((_, i) => {
                const a = -Math.PI / 2 + (i * 2 * Math.PI) / t.beats;
                const x = 60 + 46 * Math.cos(a);
                const y = 60 + 46 * Math.sin(a);
                const m = t.marks[i];
                return (
                  <g key={i}>
                    <circle
                      className={i === 0 ? s.sam : s.dot}
                      cx={x.toFixed(1)}
                      cy={y.toFixed(1)}
                      r={i === 0 ? 5.2 : m ? 4 : 2.8}
                      style={{ animationDelay: `${(i * 0.5).toFixed(1)}s` }}
                    />
                    {m === "0" ? <circle className={s.khali} cx={x.toFixed(1)} cy={y.toFixed(1)} r="6.5" /> : null}
                  </g>
                );
              })}
              <text x="60" y="62" textAnchor="middle" className={s.ringNum}>
                16
              </text>
              <text x="60" y="76" textAnchor="middle" className={s.ringLabel}>
                TEENTAAL
              </text>
            </svg>
            <p className={s.legend}>
              <b>Dha Dhin Dhin Dha</b>
              <br />
              Dha Dhin Dhin Dha
              <br />
              Dha Tin Tin Ta
              <br />
              Ta Dhin Dhin Dha
            </p>
          </div>
        </div>
        <ul className={s.feats}>
          <li>
            <span className={s.tag}>Composers</span>
            <b>Publish and earn</b>
            Share parans, tihais and kavitts with notation and theka. License them to listen, perform or teach, and keep 80%.
          </li>
          <li>
            <span className={s.tag}>Dancers &amp; students</span>
            <b>Practise at your laya</b>
            Open every piece you hold with the full bols and a theka you can slow down or speed up.
          </li>
          <li>
            <span className={s.tag}>Gurus</span>
            <b>Run your academy</b>
            Organise students into levels and release compositions to each level as they grow.
          </li>
        </ul>
      </section>

      <div className={s.more}>
        <section aria-labelledby="how-h">
          <h2 className={s.sh} id="how-h">
            How Layakari works
          </h2>
          <p className={s.sl}>Three steps, whatever your role.</p>
          <ol className={s.steps}>
            <li>
              <b>Create your profile</b>
              <span>Tell people whether you compose, dance, play tabla, teach or are learning.</span>
            </li>
            <li>
              <b>Publish or find compositions</b>
              <span>Composers share pieces with their taal, laya and bols. Everyone else browses by taal and form.</span>
            </li>
            <li>
              <b>Practise, perform and teach</b>
              <span>License a piece to listen, perform or teach, or join a guru&apos;s academy to get pieces for your level.</span>
            </li>
          </ol>
        </section>

        <section aria-labelledby="demo-h" className={s.demo}>
          <div>
            <h2 className={s.sh} id="demo-h">
              Hear it before you sign up
            </h2>
            <p className={s.sl}>This is what every composition looks like inside Layakari. Press play to hear the theka.</p>
            <ul className={s.points}>
              <li>
                <Icon name="check" />
                <div>
                  <b>A live theka at your laya</b>
                  <span>Slow it down to learn, speed it up to perform.</span>
                </div>
              </li>
              <li>
                <Icon name="check" />
                <div>
                  <b>Sam and khali marked on every matra</b>
                  <span>So you always know where you are in the cycle.</span>
                </div>
              </li>
              <li>
                <Icon name="check" />
                <div>
                  <b>Full bols once you hold a licence</b>
                  <span>The first line is always free to preview.</span>
                </div>
              </li>
            </ul>
          </div>
          <div className={s.demoCard}>
            <div className={s.demoTop}>
              <TaalCover taal="teentaal" seed="demo:megh" className={s.demoCover} decorative />
              <div style={{ minWidth: 0 }}>
                <p className="eyebrow" style={{ margin: 0 }}>
                  {DEMO_PIECE.form} · sample
                </p>
                <h3 className={s.demoTitle}>{DEMO_PIECE.title}</h3>
                <div className="row" style={{ marginTop: 6 }}>
                  <span className={pill("gold")}>Teentaal · 16 matras</span>
                  <span className={pill()}>
                    {DEMO_PIECE.laya} · {DEMO_PIECE.bpm} bpm
                  </span>
                </div>
              </div>
            </div>
            <ThekaPanel piece={demo} headingLevel={3}>
              <Notation
                full={null}
                preview={DEMO_PIECE.bols.split("\n")[0] ?? ""}
                lineCount={DEMO_PIECE.bols.split("\n").length}
                lockedMessage="The full notation unlocks with a Listen licence."
              />
            </ThekaPanel>
          </div>
        </section>

        {latest.length ? (
          <section aria-labelledby="latest-h">
            <div className="section-head" style={{ marginTop: 0 }}>
              <div>
                <h2 className={s.sh} id="latest-h">
                  New in the catalogue
                </h2>
              </div>
              <Link href="/compositions">See everything</Link>
            </div>
            <CompositionGrid items={latest} />
          </section>
        ) : null}

        <section aria-labelledby="faq-h">
          <h2 className={s.sh} id="faq-h">
            Questions
          </h2>
          <div className={s.faq}>
            <details>
              <summary>Is Layakari free?</summary>
              <p>
                Yes. Creating an account, setting up your profile and browsing compositions are free. You pay only when you choose to license
                a composition or join an academy.
              </p>
            </details>
            <details>
              <summary>How do composers get paid?</summary>
              <p>
                Composers keep 80% of every licence. Choreographers keep 70% of theirs, with 15% going to the composer of the piece it&apos;s
                set to. Card payments are being added now; until then, licences are recorded for testing and no money changes hands.
              </p>
            </details>
            <details>
              <summary>What&apos;s the difference between Listen, Perform and Teach?</summary>
              <p>
                Listen lets you stream the theka and read the full notation. Perform adds one public performance. Teach lets you teach the
                piece, including in your own academy, for a year. Each level includes the ones before it.
              </p>
            </details>
            <details>
              <summary>How do academies work?</summary>
              <p>
                A guru creates an academy with levels, such as Prarambhik, Madhyama and Visharad. Students ask to join, the guru places them
                in a level, and they get every piece released up to that level.
              </p>
            </details>
            <details>
              <summary>Which taals are supported?</summary>
              <p>
                <Link href="/taals/teentaal">Teentaal</Link>, <Link href="/taals/jhaptaal">Jhaptaal</Link>,{" "}
                <Link href="/taals/rupak">Rupak</Link>, <Link href="/taals/ektaal">Ektaal</Link> and <Link href="/taals/dhamar">Dhamar</Link>{" "}
                today, with more to come.
              </p>
            </details>
          </div>
        </section>

        <section className={s.band} aria-labelledby="cta-h">
          <div>
            <h2 id="cta-h">Ready to find your sam?</h2>
            <p>Free to join. Set up your profile in a minute.</p>
          </div>
          <Link href="/sign-up" className={btn("beat")}>
            <LogoMark size={20} ring="var(--beat-ink)" />
            Create your account
          </Link>
        </section>
      </div>
    </>
  );
}
