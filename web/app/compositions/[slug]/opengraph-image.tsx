import { getComposition } from "@/lib/data/public";
import { OG_SIZE, shareCard } from "@/lib/og";
import { taalOf } from "@/lib/music";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Composition on Layakari";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getComposition(slug);
  const c = page?.composition;
  if (!c) return shareCard({ eyebrow: "Kathak · Tabla", title: "Layakari", subtitle: "Every composition finds its sam", taal: "teentaal", seed: "layakari" });
  return shareCard({
    eyebrow: `${c.form} · ${taalOf(c.taal).name} · ${c.laya} laya`,
    title: c.title,
    subtitle: `by ${c.owner.name}`,
    taal: c.taal,
    seed: c.id,
  });
}
