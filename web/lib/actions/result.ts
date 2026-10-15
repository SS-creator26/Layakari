export interface ActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

export const initialResult: ActionResult = { ok: false, message: "" };

export function ok(message: string): ActionResult {
  return { ok: true, message };
}

export function fail(message: string, fieldErrors?: Record<string, string>): ActionResult {
  return { ok: false, message, fieldErrors };
}

/** Turns a Supabase/PostgREST error into words for the person who caused it. */
export function friendly(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "Something went wrong. Try again.";
  if (error.code === "42501" || /row-level security/i.test(error.message ?? "")) return "You can't change that with your account.";
  if (error.code === "23505" && !/already hold/i.test(error.message ?? "")) return "That already exists.";
  if (["P0001", "P0002", "22023", "23505", "28000"].includes(error.code ?? "") && error.message) return error.message;
  if (/fetch failed|network/i.test(error.message ?? "")) return "Couldn't reach the server. Check your connection and try again.";
  return "Couldn't save. Try again in a moment.";
}
