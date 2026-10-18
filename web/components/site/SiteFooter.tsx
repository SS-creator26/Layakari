import Link from "next/link";
import s from "./site.module.css";

export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <span>
          <b className={s.footerBrand}>Layakari</b> · Made in Canada for Kathak and tabla artists · © {new Date().getFullYear()}
        </span>
        <nav aria-label="Footer" className={s.footerNav}>
          <Link href="/compositions">Catalogue</Link>
          <Link href="/taals/teentaal">Taals</Link>
          <Link href="/artists">Artists</Link>
          <Link href="/academies">Academies</Link>
          <Link href="/licensing">Licensing</Link>
        </nav>
      </div>
    </footer>
  );
}
