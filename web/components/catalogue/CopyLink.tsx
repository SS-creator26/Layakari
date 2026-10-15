"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { btn } from "@/components/ui/ui";

export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btn("ghost")}
      onClick={async () => {
        const url = new URL(path, window.location.origin).toString();
        try {
          if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ url });
          else await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          /* dismissed */
        }
      }}
    >
      <Icon name="link" size={18} />
      <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
    </button>
  );
}
