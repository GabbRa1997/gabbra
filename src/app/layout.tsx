import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SoundProvider from "@/components/shell/SoundProvider";
import TransitionProvider from "@/components/shell/TransitionProvider";
import SiteHeader from "@/components/shell/SiteHeader";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://gabbra.net"),
  title: { default: "GabbRa — Photo / FPV / Film", template: "%s — GabbRa" },
  description:
    "GabbRa is an independent creative practice across photography, FPV and film. Reality, reframed.",
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
