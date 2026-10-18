"use client";

import { useActionState } from "react";
import { createChoreography } from "@/lib/actions/app";
import { initialResult } from "@/lib/actions/result";
import { Field, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ui } from "@/components/ui/ui";

export function ChoreographyForm({ compositions, selected }: { compositions: { id: string; title: string; by: string }[]; selected?: string }) {
  const [state, action] = useActionState(createChoreography, initialResult);
  const errs = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate>
      <Field label="Title" name="title" error={errs.title}>
        {(p) => <input {...p} required maxLength={80} placeholder="Varsha Ritu" />}
      </Field>
      <Field label="Set to" name="composition_id" error={errs.composition_id} hint="Its composer earns 15% of each licence you sell">
        {(p) => (
          <select {...p} defaultValue={selected ?? ""} required>
            <option value="" disabled>
              Choose a composition
            </option>
            {compositions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} · {c.by}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Price (CAD)" name="price" error={errs.price}>
        {(p) => <input {...p} type="number" inputMode="decimal" min={0} step="0.01" defaultValue={49} />}
      </Field>
      <Field label="Short description" name="about" error={errs.about} hint="One line, shown on the composition page">
        {(p) => <input {...p} maxLength={140} placeholder="Monsoon abhinaya with a chakkar tihai" />}
      </Field>
      <FormMessage ok={state.ok} message={state.message} />
      <div className={ui.formFoot}>
        <SubmitButton pendingText="Publishing…">Publish choreography</SubmitButton>
      </div>
    </form>
  );
}
