import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updatePassword } from "@/lib/actions/auth";
import { getViewer } from "@/lib/supabase/server";
import { AuthForm } from "../AuthForm";
import s from "../auth.module.css";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function UpdatePasswordPage() {
  if (!(await getViewer())) redirect("/sign-in?error=link");
  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <p className="eyebrow">Almost done</p>
        <h1>Choose a new password</h1>
        <AuthForm mode="update" action={updatePassword} />
      </div>
    </div>
  );
}
