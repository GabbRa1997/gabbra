import type { MetadataRoute } from "next";
import { FILM_SECTIONS } from "@/content/film";
import { FPV_SECTIONS } from "@/content/fpv";
import { PHOTO_SECTIONS } from "@/content/photo";
import { getPosts } from "@/lib/blog";
import { PHOTO_PROJECTS } from "@/lib/media";

export const dynamic = "force-static";

const ORIGIN = "https://gabbra.net";

/** Every public page, so search engines find them all. It follows the content on its own. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/photo",
    ...PHOTO_SECTIONS.map((s) => `/photo/${s.slug}`),
    ...PHOTO_PROJECTS.map((p) => `/photo/selected-works/${p.slug}`),
    "/fpv",
    ...FPV_SECTIONS.map((s) => `/fpv/${s.slug}`),
    "/film",
    ...FILM_SECTIONS.flatMap((s) => [`/film/${s.slug}`, ...s.projects.map((p) => `/film/${s.slug}/${p.slug}`)]),
    "/blog",
    ...getPosts().map((p) => `/blog/${p.slug}`),
    "/artist",
    "/about",
    "/contact",
    "/privacy",
  ];
  return paths.map((p) => ({ url: `${ORIGIN}${p}${p ? "/" : ""}`, lastModified: new Date() }));
}
