import Link from "next/link";
import { btn } from "@/components/ui/ui";

export default function NotFound() {
  return (
    <div className="page">
      <p className="eyebrow">Not found</p>
      <h1>This page has fallen off the cycle</h1>
      <p className="lede">The link may be old, or the piece may have been removed by its composer.</p>
      <div className="row" style={{ marginTop: 24 }}>
        <Link href="/compositions" className={btn()}>
          Browse the catalogue
        </Link>
        <Link href="/" className={btn("ghost")}>
          Home
        </Link>
      </div>
    </div>
  );
}
