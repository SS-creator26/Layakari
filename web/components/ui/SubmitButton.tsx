"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { btn } from "./ui";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  block,
  name,
  value,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: Parameters<typeof btn>[0];
  block?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={btn(variant, { block })} disabled={pending} aria-busy={pending || undefined} name={name} value={value}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}
