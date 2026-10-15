"use client";

import { useActionState } from "react";
import { saveProfile } from "@/lib/actions/app";
import { initialResult } from "@/lib/actions/result";
import { ROLES } from "@/lib/music";
import { Field, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ui } from "@/components/ui/ui";

export interface ProfileValues {
  name: string;
  city: string;
  bio: string;
  roles: string[];
}

export function ProfileForm({ initial, creating }: { initial: ProfileValues; creating: boolean }) {
  const [state, action] = useActionState(saveProfile, initialResult);
  const errs = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate>
      <Field label="Your name" name="name" error={errs.name} hint="Shown on your compositions and in academies">
        {(p) => <input {...p} required maxLength={60} autoComplete="name" defaultValue={initial.name} />}
      </Field>
      <Field label="City" name="city" error={errs.city}>
        {(p) => <input {...p} maxLength={60} autoComplete="address-level2" defaultValue={initial.city} placeholder="Toronto" />}
      </Field>
      <fieldset className={ui.field} style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
        <legend style={{ padding: 0 }}>What do you do?</legend>
        <span className={ui.hint}>Pick any that fit. Composers get a Studio and gurus an Academy.</span>
        <div className={ui.checks}>
          {ROLES.map(([id, label]) => (
            <label key={id} className={ui.check}>
              <input type="checkbox" name="roles" value={id} defaultChecked={initial.roles.includes(id)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="About you" name="bio" error={errs.bio} hint="Your gharana, teachers, what you're working on">
        {(p) => <textarea {...p} maxLength={600} defaultValue={initial.bio} />}
      </Field>
      <FormMessage ok={state.ok} message={state.message} />
      <div className={ui.formFoot}>
        <SubmitButton pendingText="Saving…">{creating ? "Continue" : "Save profile"}</SubmitButton>
      </div>
    </form>
  );
}
