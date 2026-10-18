"use client";

import Link from "next/link";
import { useActionState } from "react";
import { initialResult, type ActionResult } from "@/lib/actions/result";
import { Field, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Mode = "sign-in" | "sign-up" | "reset" | "update";

const COPY: Record<Mode, { submit: string; pending: string }> = {
  "sign-in": { submit: "Sign in", pending: "Signing in…" },
  "sign-up": { submit: "Create account", pending: "Creating your account…" },
  reset: { submit: "Send reset link", pending: "Sending…" },
  update: { submit: "Save new password", pending: "Saving…" },
};

export function AuthForm({ mode, action, next }: { mode: Mode; action: (s: ActionResult, f: FormData) => Promise<ActionResult>; next?: string }) {
  const [state, formAction] = useActionState(action, initialResult);
  const errs = state.fieldErrors ?? {};
  if (state.ok && (mode === "sign-up" || mode === "reset")) {
    return <FormMessage ok message={state.message} />;
  }
  return (
    <form action={formAction} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {mode !== "update" ? (
        <Field label="Email" name="email" error={errs.email}>
          {(p) => <input {...p} type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />}
        </Field>
      ) : null}
      {mode !== "reset" ? (
        <Field
          label={mode === "update" ? "New password" : "Password"}
          name="password"
          error={errs.password}
          hint={mode === "sign-in" ? undefined : "At least 8 characters"}
        >
          {(p) => (
            <input {...p} type="password" required minLength={8} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} />
          )}
        </Field>
      ) : null}
      <FormMessage ok={state.ok} message={state.message} />
      <div style={{ marginTop: 20 }}>
        <SubmitButton block pendingText={COPY[mode].pending}>
          {COPY[mode].submit}
        </SubmitButton>
      </div>
      {mode === "sign-in" ? (
        <p className="small" style={{ marginTop: 14, textAlign: "center" }}>
          <Link href="/reset-password">Forgot your password?</Link>
        </p>
      ) : null}
    </form>
  );
}
