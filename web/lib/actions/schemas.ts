import { z } from "zod";
import { FORMS, LAYAS, ROLES, TAAL_IDS } from "@/lib/music";

const money = (fallback: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? fallback : Number(v)),
    z.number({ error: "Enter a number" }).min(0, "Prices can't be negative").max(100000, "That's too high").transform((n) => Math.round(n * 100) / 100),
  );

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`);

export const profileSchema = z.object({
  name: text(60).min(1, "Add the name people will see"),
  city: text(60),
  bio: text(600),
  roles: z.array(z.enum(ROLES.map(([id]) => id) as [string, ...string[]])).default([]),
});

export const compositionSchema = z.object({
  title: text(80).min(1, "Give the composition a title"),
  form: z.enum(FORMS),
  taal: z.enum(TAAL_IDS as [string, ...string[]]),
  laya: z.enum(LAYAS),
  bpm: z.preprocess((v) => (v === "" ? 90 : Number(v)), z.number().int("Use a whole number").min(30, "At least 30 bpm").max(240, "At most 240 bpm")),
  bols: z.string().max(4000, "Keep the notation under 4,000 characters").transform((s) => s.replace(/\s+$/, "")),
  price_listen: money(2),
  price_perform: money(25),
  price_teach: money(99),
  status: z.enum(["published", "draft"]).default("published"),
});

export const choreographySchema = z.object({
  title: text(80).min(1, "Give the choreography a title"),
  composition_id: z.string().uuid("Choose a composition"),
  price: money(49),
  about: text(140),
});

export const academySchema = z.object({
  name: text(80).min(1, "Name your academy"),
  about: text(600),
  fee: money(40),
});

export const levelSchema = z.object({ name: text(40).min(1, "Name the level") });

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
