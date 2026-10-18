import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/supabase/require";
import { listCompositionsForChoreography } from "@/lib/data/private";
import { ChoreographyForm } from "@/components/app/ChoreographyForm";
import a from "@/components/app/app.module.css";

export const metadata: Metadata = { title: "New choreography", robots: { index: false } };

export default async function NewChoreographyPage({ searchParams }: { searchParams: Promise<{ composition?: string }> }) {
  const [{ composition }] = await Promise.all([searchParams, requireMember("/studio/choreographies/new")]);
  const comps = await listCompositionsForChoreography();
  return (
    <div className="page">
      <p className="eyebrow">
        <Link href="/studio">Studio</Link> / New choreography
      </p>
      <h1>Publish a choreography</h1>
      <p className="lede">Sell your movement set to a composition in the catalogue. You keep 70% of each licence.</p>
      <div className={`panel ${a.formCard}`} style={{ marginTop: 24 }}>
        <ChoreographyForm
          selected={composition}
          compositions={comps.map((c) => ({ id: c.id, title: c.title, by: c.owner?.name ?? "" }))}
        />
      </div>
    </div>
  );
}
