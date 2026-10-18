import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/supabase/require";
import { signOut } from "@/lib/actions/auth";
import { roleLabel } from "@/lib/music";
import { Avatar } from "@/components/ui/Avatar";
import { FlashToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { btn, pill } from "@/components/ui/ui";
import a from "@/components/app/app.module.css";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [{ saved }, viewer] = await Promise.all([searchParams, requireMember("/profile")]);
  const m = viewer.member;
  return (
    <div className="page">
      <FlashToast message={saved ? "Profile saved." : null} />
      <div className={a.head}>
        <div className="row" style={{ gap: 18 }}>
          <Avatar name={m.name} seed={m.id} size={72} />
          <div>
            <p className="eyebrow">Your profile</p>
            <h1>{m.name}</h1>
            {m.city ? <p className="muted">{m.city}</p> : null}
          </div>
        </div>
        <div className="row">
          <Link href={`/artists/${m.handle}`} className={btn("ghost")}>
            View public page
          </Link>
          <Link href="/profile/edit" className={btn()}>
            Edit profile
          </Link>
        </div>
      </div>

      <div className={a.split} style={{ marginTop: 32 }}>
        <section className="panel stack" aria-labelledby="about-h">
          <h2 id="about-h">About</h2>
          {m.roles.length ? (
            <div className="row">
              {m.roles.map((r) => (
                <span key={r} className={pill("soft")}>
                  {roleLabel(r)}
                </span>
              ))}
            </div>
          ) : null}
          <p className={m.bio ? undefined : "muted"} style={{ whiteSpace: "pre-line" }}>
            {m.bio || "You haven't written anything about yourself yet."}
          </p>
        </section>
        <section className="panel stack" aria-labelledby="account-h">
          <h2 id="account-h">Account</h2>
          <p>
            <span className="muted small">Signed in as</span>
            <br />
            {viewer.email}
          </p>
          <div className="row">
            <Link href="/update-password" className={btn("ghost", { size: "sm" })}>
              Change password
            </Link>
            <form action={signOut}>
              <button type="submit" className={btn("ghost", { size: "sm" })}>
                <Icon name="signout" size={16} /> Sign out
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
