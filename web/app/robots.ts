import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/supabase/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/library", "/academy", "/studio", "/profile", "/onboarding", "/auth/", "/update-password"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
