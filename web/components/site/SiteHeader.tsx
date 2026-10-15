import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { LogoMark } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { btn } from "@/components/ui/ui";
import { NavLinks, TabBar, type NavItem } from "./NavLinks";
import s from "./site.module.css";

const PUBLIC_NAV: NavItem[] = [
  { href: "/compositions", label: "Catalogue", match: ["/taals"] },
  { href: "/artists", label: "Artists" },
  { href: "/academies", label: "Academies" },
];

const APP_NAV: NavItem[] = [
  { href: "/compositions", label: "Discover", icon: "discover", match: ["/taals", "/artists", "/academies"] },
  { href: "/library", label: "Library", icon: "library" },
  { href: "/academy", label: "Academy", icon: "academy" },
  { href: "/studio", label: "Studio", icon: "studio" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export async function SiteHeader() {
  const viewer = await getViewer().catch(() => null);
  const member = viewer?.member;
  return (
    <>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href={member ? "/compositions" : "/"} className={s.brand}>
            <LogoMark />
            Layakari
          </Link>
          <NavLinks items={member ? APP_NAV.slice(0, 4) : PUBLIC_NAV} label="Main" />
          <div className={s.actions}>
            {member ? (
              <Link href="/profile" className={s.me} aria-label={`Your profile: ${member.name}`}>
                <Avatar name={member.name} seed={member.id} size={36} />
                <span className={s.meName}>{member.name.split(" ")[0]}</span>
              </Link>
            ) : viewer ? (
              <Link href="/onboarding" className={btn("beat", { size: "sm" })}>
                Finish your profile
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className={btn("onHero", { size: "sm" })}>
                  Sign in
                </Link>
                <Link href="/sign-up" className={btn("beat", { size: "sm" })}>
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {member ? <TabBar items={APP_NAV} /> : null}
    </>
  );
}
