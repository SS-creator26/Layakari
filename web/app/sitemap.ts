import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/supabase/env";
import { TAAL_IDS } from "@/lib/music";
import type { Database } from "@/lib/supabase/database.types";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/compositions`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/artists`, changeFrequency: "weekly" },
    { url: `${base}/academies`, changeFrequency: "weekly" },
    { url: `${base}/licensing`, changeFrequency: "monthly" },
    ...TAAL_IDS.map((t) => ({ url: `${base}/taals/${t}`, changeFrequency: "weekly" as const })),
  ];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return pages;
  // Anonymous client: the sitemap lists only what a visitor can see.
  const sb = createClient<Database>(url, key, { auth: { persistSession: false } });
  const [comps, members, academies] = await Promise.all([
    sb.from("compositions").select("slug, updated_at").eq("status", "published"),
    sb.from("members").select("handle, updated_at"),
    sb.from("academies").select("slug, updated_at"),
  ]);
  return [
    ...pages,
    ...(comps.data ?? []).map((c) => ({ url: `${base}/compositions/${c.slug}`, lastModified: c.updated_at })),
    ...(members.data ?? []).map((m) => ({ url: `${base}/artists/${m.handle}`, lastModified: m.updated_at })),
    ...(academies.data ?? []).map((a) => ({ url: `${base}/academies/${a.slug}`, lastModified: a.updated_at })),
  ];
}
