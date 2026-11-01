import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parsePost, type Post } from "./frontmatter";

export type { Post };

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

const DIR = path.join(process.cwd(), "src", "content", "blog");

/** Newest first. Drafts only show while working on the site, never on the live one. */
export function getPosts(): Post[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {}
  const showDrafts = process.env.NODE_ENV === "development";
  return files
    .map((f) => parsePost(f.replace(/\.md$/, ""), readFileSync(path.join(DIR, f), "utf8")))
    .filter((p) => showDrafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
