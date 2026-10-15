import type { Metadata } from "next";
import { listAcademies } from "@/lib/data/public";
import { AcademyCard } from "@/components/catalogue/AcademyCard";
import { Empty } from "@/components/ui/Empty";
import people from "@/components/catalogue/people.module.css";

export const metadata: Metadata = {
  title: "Academies",
  description: "Kathak and tabla academies teaching in levels, with the compositions each level learns.",
  alternates: { canonical: "/academies" },
};

export default async function AcademiesPage() {
  const academies = await listAcademies();
  return (
    <div className="page">
      <p className="eyebrow">Academies</p>
      <h1>Learn with a guru, level by level</h1>
      <p className="lede">
        Ask to join an academy and your guru places you in a level. You get the notation and theka for every piece released up to that level.
      </p>
      <div style={{ marginTop: 32 }}>
        {academies.length ? (
          <ul className={people.cardsWide}>
            {academies.map((a) => (
              <li key={a.id}>
                <AcademyCard a={a} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No academies yet">Gurus can start one from the Academy tab.</Empty>
        )}
      </div>
    </div>
  );
}
