import type { Metadata } from "next";
import seoJson from "@/content/admin/seo.json";
import { SEO_PAGES, type SeoFile } from "./seoDefaults";

const file = seoJson as SeoFile;

/** the title and description for a page: what was set in /admin, else the built-in text */
export function seoText(path: string) {
  const base = SEO_PAGES.find((p) => p.path === path);
  const o = file.pages[path];
  return {
    title: o?.title?.trim() || base?.title || "GabbRa",
    description: o?.description?.trim() || base?.description || "",
  };
}

/** metadata for a main page, ready to export */
export function pageSeo(path: string): Metadata {
  const { title, description } = seoText(path);
  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "GabbRa",
      locale: "en_GB",
      title,
      description,
      images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "GabbRa" }],
    },
  };
}
