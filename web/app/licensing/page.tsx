import type { Metadata } from "next";
import Link from "next/link";
import { LICENCE_KINDS, KIND_ORDER } from "@/lib/licensing";

export const metadata: Metadata = {
  title: "Licensing",
  description: "How Listen, Perform and Teach licences work on Layakari, and how composers, choreographers and gurus are paid.",
  alternates: { canonical: "/licensing" },
};

export default function LicensingPage() {
  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <p className="eyebrow">Licensing</p>
      <h1>How licences work</h1>
      <p className="lede">Every composition on Layakari can be licensed three ways. Each level includes the ones before it.</p>
      <div className="stack" style={{ marginTop: 28 }}>
        {KIND_ORDER.map((k, i) => (
          <section key={k} className="panel">
            <p className="eyebrow">Level {i + 1}</p>
            <h2>{LICENCE_KINDS[k].name}</h2>
            <p style={{ marginTop: 6 }}>{LICENCE_KINDS[k].description}.</p>
          </section>
        ))}
      </div>
      <h2 style={{ marginTop: 40 }}>Who gets paid</h2>
      <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
        <li>Composers keep 80% of every Listen, Perform and Teach licence.</li>
        <li>Choreographers keep 70% of each choreography licence, and the composer of the piece it&apos;s set to earns 15%.</li>
        <li>Students in an academy get Listen access to every piece their guru releases to their level or below. The guru needs a Teach licence for pieces they didn&apos;t write.</li>
      </ul>
      <p className="panel small" style={{ marginTop: 28 }}>
        Card payments are being added. Until then, checkout is a demo: licences are recorded and earnings update, but no money changes hands.
      </p>
      <p style={{ marginTop: 28 }}>
        <Link href="/compositions">Browse the catalogue</Link>
      </p>
    </div>
  );
}
