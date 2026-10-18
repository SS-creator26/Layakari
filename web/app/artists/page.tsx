import type { Metadata } from "next";
import { listArtists } from "@/lib/data/public";
import { PersonCard } from "@/components/catalogue/PersonCard";
import { Empty } from "@/components/ui/Empty";
import people from "@/components/catalogue/people.module.css";

export const metadata: Metadata = {
  title: "Artists",
  description: "Kathak and tabla composers, choreographers and gurus publishing on Layakari.",
  alternates: { canonical: "/artists" },
};

export default async function ArtistsPage() {
  const artists = await listArtists();
  return (
    <div className="page">
      <p className="eyebrow">Artists</p>
      <h1>Composers, choreographers and gurus</h1>
      <p className="lede">Each artist has a public page with their compositions, choreographies and the academy they run.</p>
      <div style={{ marginTop: 32 }}>
        {artists.length ? (
          <ul className={people.cards}>
            {artists.map((p) => (
              <li key={p.id}>
                <PersonCard p={p} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No artists yet">Composers appear here once they publish.</Empty>
        )}
      </div>
    </div>
  );
}
