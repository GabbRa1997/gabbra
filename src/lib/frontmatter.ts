/** Reading and writing a blog post file. No Node APIs, so /admin can use it in the browser too. */

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

export function parsePost(slug: string, raw: string): Post {
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

const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();

export function serializePost(p: Post): string {
  const head = [
    `title: ${oneLine(p.title)}`,
    `date: ${p.date}`,
    `description: ${oneLine(p.description)}`,
    ...(p.cover ? [`cover: ${p.cover}`] : []),
    ...(p.tags.length ? [`tags: ${p.tags.join(", ")}`] : []),
    ...(p.draft ? ["draft: true"] : []),
  ];
  return `---\n${head.join("\n")}\n---\n${p.body.trim()}\n`;
}
