"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import s from "./site.module.css";

export interface NavItem {
  href: string;
  label: string;
  icon?: IconName;
  /** Other paths that count as this section. */
  match?: string[];
}

function isActive(pathname: string, item: NavItem) {
  return [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function NavLinks({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={s.nav}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={s.navLink} aria-current={isActive(pathname, item) ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Bottom tab bar on phones, for signed-in people. */
export function TabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className={s.tabbar}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={s.tab} aria-current={isActive(pathname, item) ? "page" : undefined}>
          {item.icon ? <Icon name={item.icon} size={22} /> : null}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
