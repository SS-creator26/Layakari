import { OG_SIZE, shareCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Layakari: Kathak and tabla compositions, academies and practice";

export default async function Image() {
  return shareCard({
    eyebrow: "Kathak · Tabla · Taal",
    title: "Every composition finds its sam",
    subtitle: "Publish, license, teach and practise",
    taal: "teentaal",
    seed: "layakari",
  });
}
