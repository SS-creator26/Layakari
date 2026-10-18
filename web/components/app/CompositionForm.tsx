"use client";

import { useActionState, useState } from "react";
import { saveComposition } from "@/lib/actions/app";
import { initialResult } from "@/lib/actions/result";
import { FORMS, LAYAS, TAAL_IDS, TAALS, MAX_BPM, MIN_BPM } from "@/lib/music";
import { Field, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ui } from "@/components/ui/ui";

export interface CompositionValues {
  id?: string;
  title: string;
  form: string;
  taal: string;
  laya: string;
  bpm: number;
  bols: string;
  price_listen: number;
  price_perform: number;
  price_teach: number;
  status: "published" | "draft";
}

export const NEW_COMPOSITION: CompositionValues = {
  title: "",
  form: "Paran",
  taal: "teentaal",
  laya: "Madhya",
  bpm: 90,
  bols: "",
  price_listen: 2,
  price_perform: 25,
  price_teach: 99,
  status: "published",
};

export function CompositionForm({ initial }: { initial: CompositionValues }) {
  const [state, action] = useActionState(saveComposition, initialResult);
  const [taal, setTaal] = useState(initial.taal);
  const errs = state.fieldErrors ?? {};
  const t = TAALS[taal as keyof typeof TAALS];
  return (
    <form action={action} noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <Field label="Title" name="title" error={errs.title}>
        {(p) => <input {...p} required maxLength={80} defaultValue={initial.title} placeholder="Megh Malhar Paran" />}
      </Field>
      <div className={ui.fieldRow}>
        <Field label="Form" name="form" error={errs.form}>
          {(p) => (
            <select {...p} defaultValue={initial.form}>
              {FORMS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Taal" name="taal" error={errs.taal}>
          {(p) => (
            <select {...p} value={taal} onChange={(e) => setTaal(e.target.value)}>
              {TAAL_IDS.map((id) => (
                <option key={id} value={id}>
                  {TAALS[id].name} ({TAALS[id].beats} beats)
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Laya" name="laya" error={errs.laya}>
          {(p) => (
            <select {...p} defaultValue={initial.laya}>
              {LAYAS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tempo (bpm)" name="bpm" error={errs.bpm}>
          {(p) => <input {...p} type="number" inputMode="numeric" min={MIN_BPM} max={MAX_BPM} defaultValue={initial.bpm} />}
        </Field>
      </div>
      <Field
        label="Notation"
        name="bols"
        error={errs.bols}
        hint={`Write the bols line by line. Only licence holders and students in academies that teach it can read them.${t ? ` ${t.name} theka: ${t.bols.join(" ")}` : ""}`}
      >
        {(p) => <textarea {...p} className={ui.mono} rows={8} maxLength={4000} defaultValue={initial.bols} placeholder="Dha-ge-tita Kat-ta Gadi-gana Dha" />}
      </Field>
      <fieldset style={{ border: 0, padding: 0, margin: "24px 0 0" }}>
        <legend className="eyebrow">Prices (CAD)</legend>
        <div className={ui.fieldRow}>
          <Field label="Listen" name="price_listen" error={errs.price_listen} hint="Read the notation and practise">
            {(p) => <input {...p} type="number" inputMode="decimal" min={0} step="0.01" defaultValue={initial.price_listen} />}
          </Field>
          <Field label="Perform" name="price_perform" error={errs.price_perform} hint="Perform it on stage">
            {(p) => <input {...p} type="number" inputMode="decimal" min={0} step="0.01" defaultValue={initial.price_perform} />}
          </Field>
          <Field label="Teach" name="price_teach" error={errs.price_teach} hint="Teach it in your academy">
            {(p) => <input {...p} type="number" inputMode="decimal" min={0} step="0.01" defaultValue={initial.price_teach} />}
          </Field>
        </div>
      </fieldset>
      <FormMessage ok={state.ok} message={state.message} />
      <div className={ui.formFoot}>
        <SubmitButton variant="ghost" name="draft" value="1" pendingText="Saving…">
          Save as draft
        </SubmitButton>
        <SubmitButton pendingText="Publishing…">{initial.id && initial.status === "published" ? "Save changes" : "Publish"}</SubmitButton>
      </div>
    </form>
  );
}
