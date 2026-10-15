import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/supabase/require";
import { getOwnComposition } from "@/lib/data/private";
import { deleteComposition } from "@/lib/actions/app";
import { CompositionForm } from "@/components/app/CompositionForm";
import { ActionButton } from "@/components/ui/ActionButton";
import a from "@/components/app/app.module.css";

export const metadata: Metadata = { title: "Edit composition", robots: { index: false } };

export default async function EditCompositionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireMember(`/studio/compositions/${id}/edit`);
  const c = /^[0-9a-f-]{36}$/i.test(id) ? await getOwnComposition(viewer.id, id) : null;
  if (!c) notFound();
  return (
    <div className="page">
      <p className="eyebrow">
        <Link href="/studio">Studio</Link> / Edit
      </p>
      <div className={a.head}>
        <h1>{c.title}</h1>
        {c.status === "published" ? (
          <Link href={`/compositions/${c.slug}`} className="small">
            View public page
          </Link>
        ) : null}
      </div>
      <div className={`panel ${a.formCard}`} style={{ marginTop: 24 }}>
        <CompositionForm initial={{ ...c, price_listen: Number(c.price_listen), price_perform: Number(c.price_perform), price_teach: Number(c.price_teach) }} />
      </div>
      <section className={`panel ${a.formCard}`} style={{ marginTop: 24 }} aria-labelledby="danger-h">
        <h2 id="danger-h" style={{ fontSize: "var(--text-lg)" }}>
          Delete this composition
        </h2>
        <p className="muted small" style={{ margin: "6px 0 14px" }}>
          It disappears from the catalogue and from academies that teach it. Licences already sold stay on record.
        </p>
        <ActionButton
          variant="danger"
          action={deleteComposition.bind(null, c.id)}
          confirm={{ title: `Delete ${c.title}?`, body: "This can't be undone.", action: "Delete composition" }}
        >
          Delete composition
        </ActionButton>
      </section>
    </div>
  );
}
