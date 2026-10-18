import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/actions/auth";
import { getViewer } from "@/lib/supabase/server";
import { AuthForm } from "../AuthForm";
import s from "../auth.module.css";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (await getViewer()) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/library");
  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        {error ? (
          <p role="alert" className="small" style={{ marginTop: 12, color: "var(--danger)" }}>
            That link has expired or was already used. Sign in, or ask for a new link.
          </p>
        ) : null}
        <AuthForm mode="sign-in" action={signIn} next={next} />
        <p className={s.alt}>
          New to Layakari? <Link href={`/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
