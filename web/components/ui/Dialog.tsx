"use client";

import * as D from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import s from "./dialog.module.css";

/** Accessible modal: traps focus, closes on Escape, and returns focus to whatever opened it. */
export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  wide = false,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <D.Trigger asChild>{trigger}</D.Trigger> : null}
      <D.Portal>
        <D.Overlay className={s.overlay} />
        <D.Content className={s.content} data-wide={wide ? "true" : undefined} {...(description ? {} : { "aria-describedby": undefined })}>
          <D.Title className={s.title}>{title}</D.Title>
          {description ? <D.Description className={s.description}>{description}</D.Description> : null}
          {children}
          <D.Close className={s.close} aria-label="Close">
            <Icon name="x" size={16} />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DialogClose = D.Close;
