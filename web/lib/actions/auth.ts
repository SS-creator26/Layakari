"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "./result";

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

/** Only same-site paths, so a crafted link can't bounce someone to another site after sign-in. */
function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback;
}

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || `${proto}://${host}`;
}

export async function signIn(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return fail("Check your email and password.", { email: parsed.error.issues[0]?.message ?? "" });
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return fail(
      error.message === "Invalid login credentials"
        ? "That email and password don't match. Try again or create an account."
        : error.message === "Email not confirmed"
          ? "Confirm your email first: open the link we sent you, then sign in."
          : error.message,
    );
  }
  redirect(safeNext(form.get("next"), "/library"));
}

export async function signUp(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) {
    const errs: Record<string, string> = {};
    for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
    return fail("Check the highlighted fields.", errs);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=/onboarding` },
  });
  if (error) return fail(error.message);
  if (!data.session) {
    return { ok: true, message: "Almost there: check your email and open the confirmation link. It brings you back here to set up your profile." };
  }
  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_: ActionResult, form: FormData): Promise<ActionResult> {
  const email = z.string().trim().email().safeParse(form.get("email"));
  if (!email.success) return fail("Enter the email you signed up with.", { email: "Enter a valid email address" });
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${await origin()}/auth/callback?next=/update-password` });
  // Same answer whether or not the account exists, so this form can't be used to test addresses.
  return { ok: true, message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_: ActionResult, form: FormData): Promise<ActionResult> {
  const password = z.string().min(8).safeParse(form.get("password"));
  if (!password.success) return fail("Use at least 8 characters.", { password: "Use at least 8 characters" });
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return fail(error.message);
  redirect("/library");
}
