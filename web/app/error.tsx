"use client";

import { btn } from "@/components/ui/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page">
      <p className="eyebrow">Something went wrong</p>
      <h1>We couldn&apos;t load this page</h1>
      <p className="lede">Check your connection and try again. If it keeps happening, the service may be briefly unavailable.</p>
      <div className="row" style={{ marginTop: 24 }}>
        <button type="button" className={btn()} onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
