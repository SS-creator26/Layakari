import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/app/ProfileForm";
import s from "../(auth)/auth.module.css";

export const metadata: Metadata = { title: "Set up your profile", robots: { index: false } };

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/onboarding");
  if (viewer.member) redirect("/profile/edit");
  return (
    <div className={s.wrap}>
      <div className={s.card} style={{ width: "min(620px, 100%)" }}>
        <p className="eyebrow">One last step</p>
        <h1>Tell us who you are</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          This is how other dancers, musicians and gurus will see you. You can change it any time.
        </p>
        <ProfileForm creating initial={{ name: "", city: "", bio: "", roles: [] }} />
      </div>
    </div>
  );
}
