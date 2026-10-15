import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "@/lib/actions/auth";
import { getViewer } from "@/lib/supabase/server";
import { AuthForm } from "../AuthForm";
import s from "../auth.module.css";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getViewer()) redirect("/library");
  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <p className="eyebrow">Join Layakari</p>
        <h1>Create your account</h1>
        <AuthForm mode="sign-up" action={signUp} />
        <ul className={s.reassure}>
          <li>Free to join</li>
          <li>No card needed</li>
          <li>Browse and practise right away</li>
        </ul>
        <p className={s.alt}>
          Already have an account? <Link href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
