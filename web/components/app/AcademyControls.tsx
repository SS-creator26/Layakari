"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { placeStudent, saveAcademy, saveLevel, setAcademyOpen, setPieceReleased } from "@/lib/actions/app";
import { initialResult, type ActionResult } from "@/lib/actions/result";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { btn, ui } from "@/components/ui/ui";
import a from "./app.module.css";

/** Runs a quick action and reports the result in a toast. */
function useQuickAction() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      if (r.message) toast(r.message, r.ok ? "ok" : "error");
    });
  return [pending, run] as const;
}

export interface AcademyValues {
  name: string;
  about: string;
  fee: number;
}

export function AcademyForm({ initial, onDone }: { initial?: AcademyValues; onDone?: () => void }) {
  const [state, action] = useActionState(saveAcademy, initialResult);
  const toast = useToast();
  const errs = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok && state.message) {
      toast(state.message);
      onDone?.();
    }
  }, [state, toast, onDone]);
  return (
    <form action={action} noValidate>
      <Field label="Academy name" name="name" error={errs.name}>
        {(p) => <input {...p} required maxLength={80} defaultValue={initial?.name} placeholder="Nritya Sadhana Academy" />}
      </Field>
      <Field label="Monthly fee (CAD)" name="fee" error={errs.fee} hint="Shown to students. Fees are collected outside Layakari for now.">
        {(p) => <input {...p} type="number" inputMode="decimal" min={0} step="1" defaultValue={initial?.fee ?? 40} />}
      </Field>
      <Field label="About" name="about" error={errs.about} hint="Your lineage, who it's for, when classes meet">
        {(p) => <textarea {...p} maxLength={600} defaultValue={initial?.about} />}
      </Field>
      {state.ok ? null : <FormMessage ok={false} message={state.message} />}
      <div className={ui.formFoot}>
        <SubmitButton>{initial ? "Save details" : "Start my academy"}</SubmitButton>
      </div>
    </form>
  );
}

export function EditAcademyButton({ initial }: { initial: AcademyValues }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Academy details"
      trigger={
        <button type="button" className={btn("ghost")}>
          Edit details
        </button>
      }
    >
      <AcademyForm initial={initial} onDone={() => setOpen(false)} />
    </Dialog>
  );
}

function Switch({ checked, label, disabled, onChange }: { checked: boolean; label: string; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={a.switch}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

export function OpenSwitch({ open }: { open: boolean }) {
  const [pending, run] = useQuickAction();
  const [on, setOn] = useState(open);
  return (
    <div className="row" style={{ gap: 10 }}>
      <Switch
        checked={on}
        disabled={pending}
        label="Taking new students"
        onChange={(v) => {
          setOn(v);
          run(() => setAcademyOpen(v));
        }}
      />
      <span className="small" aria-hidden="true">
        {on ? "Taking new students" : "Closed to new students"}
      </span>
    </div>
  );
}

export function PieceSwitch({ levelId, compositionId, title, released, canTeach }: { levelId: string; compositionId: string; title: string; released: boolean; canTeach: boolean }) {
  const [pending, run] = useQuickAction();
  const [on, setOn] = useState(released);
  return (
    <Switch
      checked={on}
      disabled={pending || (!canTeach && !on)}
      label={`Release ${title} to this level`}
      onChange={(v) => {
        setOn(v);
        run(async () => {
          const r = await setPieceReleased(levelId, compositionId, v);
          if (!r.ok) setOn(!v);
          return r;
        });
      }}
    />
  );
}

export function PlaceStudent({ studentId, name, levels, current, label }: { studentId: string; name: string; levels: { id: string; name: string }[]; current?: string | null; label: string }) {
  const [pending, run] = useQuickAction();
  const [level, setLevel] = useState(current ?? levels[0]?.id ?? "");
  return (
    <div className={a.inlineForm}>
      <label className="visually-hidden" htmlFor={`lvl-${studentId}`}>
        Level for {name}
      </label>
      <select id={`lvl-${studentId}`} value={level} onChange={(e) => setLevel(e.target.value)}>
        {levels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={btn(current ? "ghost" : "primary", { size: "sm" })}
        disabled={pending || !level || level === current}
        onClick={() => run(() => placeStudent(studentId, level))}
      >
        {label}
        <span className="visually-hidden"> {name}</span>
      </button>
    </div>
  );
}

export function LevelForm({ id, name, submit }: { id?: string; name?: string; submit: string }) {
  const [state, action] = useActionState(saveLevel, initialResult);
  const toast = useToast();
  const [value, setValue] = useState(name ?? "");
  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? "ok" : "error");
  }, [state, toast]);
  const fieldId = `level-${id ?? "new"}`;
  return (
    <form action={action} className={a.inlineForm} onSubmit={() => !id && setTimeout(() => setValue(""), 0)}>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <label htmlFor={fieldId} className="visually-hidden">
        {id ? "Level name" : "New level name"}
      </label>
      <input
        id={fieldId}
        name="name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={40}
        required
        placeholder={id ? undefined : "New level, e.g. Alankar"}
        style={{ minHeight: 40, border: "1px solid var(--line-strong)", borderRadius: 10, padding: "4px 12px", background: "var(--bg)" }}
      />
      <SubmitButton variant="ghost" pendingText="Saving…">
        {submit}
      </SubmitButton>
    </form>
  );
}
