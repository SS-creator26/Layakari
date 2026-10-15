import type { ReactNode } from "react";
import { ui } from "./ui";

/** A labelled control with an optional hint and error, wired up for screen readers. */
export function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; name: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = `f-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={ui.field} data-invalid={error ? "true" : undefined}>
      <label htmlFor={id}>{label}</label>
      {children({ id, name, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint ? (
        <span id={`${id}-hint`} className={ui.hint}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-err`} className={ui.error}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function FormMessage({ ok, message }: { ok: boolean; message: string }) {
  if (!message) return null;
  return (
    <p className={ui.formMessage} data-ok={ok ? "true" : "false"} role={ok ? "status" : "alert"}>
      {message}
    </p>
  );
}
