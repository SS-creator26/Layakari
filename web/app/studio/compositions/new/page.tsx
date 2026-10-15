import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/supabase/require";
import { CompositionForm, NEW_COMPOSITION } from "@/components/app/CompositionForm";
import a from "@/components/app/app.module.css";

export const metadata: Metadata = { title: "New composition", robots: { index: false } };

export default async function NewCompositionPage() {
  await requireMember("/studio/compositions/new");
  return (
    <div className="page">
      <p className="eyebrow">
        <Link href="/studio">Studio</Link> / New composition
      </p>
      <h1>Publish a composition</h1>
      <p className="lede">Anyone can preview the first lines and hear the theka. The full notation unlocks with a licence.</p>
      <div className={`panel ${a.formCard}`} style={{ marginTop: 24 }}>
        <CompositionForm initial={NEW_COMPOSITION} />
      </div>
    </div>
  );
}
