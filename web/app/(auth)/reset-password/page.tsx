import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { AuthForm } from "../AuthForm";
import s from "../auth.module.css";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <p className="eyebrow">Forgot your password?</p>
        <h1>Reset it by email</h1>
        <p className="muted small" style={{ marginTop: 8 }}>
          We&apos;ll send a link that lets you choose a new password.
        </p>
        <AuthForm mode="reset" action={requestPasswordReset} />
        <p className={s.alt}>
          Remembered it? <Link href="/sign-in">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
