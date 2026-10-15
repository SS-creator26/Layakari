import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Mukta, Rozha_One } from "next/font/google";
import { ThekaProvider } from "@/components/theka/ThekaProvider";
import { MiniPlayer } from "@/components/theka/MiniPlayer";
import { ToastProvider } from "@/components/ui/Toast";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { siteUrl } from "@/lib/supabase/env";
import "./globals.css";

const rozha = Rozha_One({ weight: "400", subsets: ["latin", "devanagari"], variable: "--font-rozha", display: "swap" });
const mukta = Mukta({ weight: ["400", "500", "600", "700"], subsets: ["latin", "devanagari"], variable: "--font-mukta", display: "swap" });
const plex = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

const description =
  "A home for Kathak and tabla artists. Composers publish and license their work, gurus run their academies, and students practise every piece with notation and a live theka.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Layakari · Kathak and tabla compositions, academies and practice", template: "%s · Layakari" },
  description,
  applicationName: "Layakari",
  openGraph: { type: "website", siteName: "Layakari", title: "Layakari · Every composition finds its sam", description, locale: "en_CA" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#2A1B33",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={`${rozha.variable} ${mukta.variable} ${plex.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ToastProvider>
          <ThekaProvider>
            <SiteHeader />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
            <MiniPlayer />
          </ThekaProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
