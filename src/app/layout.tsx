import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SoundProvider from "@/components/shell/SoundProvider";
import TransitionProvider from "@/components/shell/TransitionProvider";
import SiteHeader from "@/components/shell/SiteHeader";
import Analytics from "@/components/shell/Analytics";
import JsonLd from "@/components/shell/JsonLd";
import { SITE, instagramUrl } from "@/content/site";
import { seoText } from "@/lib/seo";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const home = seoText("/");

export const metadata: Metadata = {
  metadataBase: new URL("https://gabbra.net"),
  title: { default: home.title, template: "%s — GabbRa" },
  description: home.description,
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "GabbRa",
    locale: "en_GB",
    title: home.title,
    description: home.description,
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "GabbRa" }],
  },
  twitter: { card: "summary_large_image", images: ["/brand/og.png"] },
  ...(SITE.googleVerification ? { verification: { google: SITE.googleVerification } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="grain">
        <a
          href="#main"
          className="t-label sr-only z-[200] bg-bone px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://gabbra.net/#site",
                url: "https://gabbra.net/",
                name: SITE.name,
                description: "Photography, FPV and film. Reality, reframed.",
                inLanguage: "en-GB",
              },
              {
                "@type": "Person",
                "@id": "https://gabbra.net/#person",
                name: "Gabriel Octavian Tudosie",
                alternateName: SITE.name,
                url: "https://gabbra.net/",
                jobTitle: "Photographer, FPV pilot and filmmaker",
                email: `mailto:${SITE.email}`,
                ...(instagramUrl ? { sameAs: [instagramUrl] } : {}),
              },
            ],
          }}
        />
        <Analytics />
        <SoundProvider>
          <TransitionProvider>
            <SiteHeader />
            {children}
          </TransitionProvider>
        </SoundProvider>
      </body>
    </html>
  );
}
