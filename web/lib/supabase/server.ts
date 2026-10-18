import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database, MemberRow } from "./database.types";
import { supabaseEnv } from "./env";

export async function createClient() {
  // Read cookies first: it marks every page that touches Supabase as per-request, so a build never needs the database.
  const store = await cookies();
  const { url, key } = supabaseEnv();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes the session instead.
        }
      },
    },
  });
}

export interface Viewer {
  id: string;
  email: string | null;
  member: MemberRow | null;
}

/** The signed-in person (verified with Supabase Auth) and their profile, once per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: member } = await supabase.from("members").select("*").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? null, member: member ?? null };
});
