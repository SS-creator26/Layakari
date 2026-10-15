import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/supabase/require";
import { ProfileForm } from "@/components/app/ProfileForm";
import a from "@/components/app/app.module.css";

export const metadata: Metadata = { title: "Edit profile", robots: { index: false } };

export default async function EditProfilePage() {
  const { member } = await requireMember("/profile/edit");
  return (
    <div className="page">
      <p className="eyebrow">
        <Link href="/profile">Profile</Link> / Edit
      </p>
      <h1>Edit your profile</h1>
      <div className={`panel ${a.formCard}`} style={{ marginTop: 24 }}>
        <ProfileForm creating={false} initial={member} />
      </div>
    </div>
  );
}
