export function supabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"].filter(Boolean);
    throw new Error(`Supabase is not configured. Missing: ${missing.join(", ")} (see web/.env.example).`);
  }
  return { url, key };
}

export function siteUrl(): string {
  const vercel = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  return (process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
}
