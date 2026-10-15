"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actions/result";
import { btn } from "./ui";
import { Dialog, DialogClose } from "./Dialog";
import { useToast } from "./Toast";

type Variant = Parameters<typeof btn>[0];

/**
 * Runs a server action from a button, shows a toast with the result, and can ask for confirmation first.
 * Server actions that redirect simply navigate away.
 */
export function ActionButton({
  action,
  children,
  variant = "primary",
  size,
  confirm,
  className,
  disabled,
  "aria-label": ariaLabel,
}: {
  action: () => Promise<ActionResult | void>;
  children: ReactNode;
  variant?: Variant;
  size?: "sm";
  confirm?: { title: string; body: string; action: string };
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const run = () =>
    start(async () => {
      const result = await action();
      setOpen(false);
      if (result && result.message) toast(result.message, result.ok ? "ok" : "error");
    });
  const button = (
    <button
      type="button"
      className={className ?? btn(variant, { size })}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      aria-label={ariaLabel}
      onClick={confirm ? undefined : run}
    >
      {children}
    </button>
  );
  if (!confirm) return button;
  return (
    <Dialog open={open} onOpenChange={setOpen} trigger={button} title={confirm.title} description={confirm.body}>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 24 }}>
        <DialogClose className={btn("ghost")}>Cancel</DialogClose>
        <button type="button" className={btn("danger")} onClick={run} disabled={pending} aria-busy={pending || undefined}>
          {pending ? "Working…" : confirm.action}
        </button>
      </div>
    </Dialog>
  );
}
