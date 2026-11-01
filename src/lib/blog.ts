import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Blog posts are plain text files in /src/content/blog, one per post:
 *
 *   ---
 *   title: ...
 *   date: 2026-11-01
 *   description: one or two sentences, shown on Google
 *   cover: /uploads/blog/my-cover.jpg      (optional)
 *   tags: fpv, drone, cinematic            (optional, comma separated)
 *   draft: true                            (optional, hides it from the live site)
 *   ---
 *   The post itself.
 *
 * The file name is the web address: my-first-post.md becomes /blog/my-first-post/.
 */

export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  cover?: string;
  tags: string[];
  draft: boolean;
  body: string;
}

const DIR = path.join(process.cwd(), "src", "content", "blog");

function parse(slug: string, raw: string): Post {
  const m = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  for (const line of (m?.[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return {
    slug,
    title: meta.title || slug.replace(/-/g, " "),
    date: meta.date || "1970-01-01",
    description: meta.description || "",
    cover: meta.cover || undefined,
    tags: (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    draft: meta.draft === "true",
    body: (m?.[2] ?? raw).trim(),
  };
}

/** Newest first. Drafts only show while working on the site, never on the live one. */
export function getPosts(): Post[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {}
  const showDrafts = process.env.NODE_ENV === "development";
  return files
    .map((f) => parse(f.replace(/\.md$/, ""), readFileSync(path.join(DIR, f), "utf8")))
    .filter((p) => showDrafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
