"use client";

import { useEffect, useState } from "react";
import { commit, listDir, readText } from "@/lib/github";
import { parsePost } from "@/lib/frontmatter";
import { DESC_MAX, SEO_PAGES, TITLE_MAX, type SeoFile, type SeoOverride } from "@/lib/seoDefaults";
import { Btn, Input, Label, Notice, PublishBar, Textarea, usePublisher } from "./ui";
import { Snippet, VerdictLine, descVerdict, focusVerdict, titleVerdict } from "./seoUi";

const FILE = "src/content/admin/seo.json";

type Tab = "blog" | "photo" | "film" | "fpv" | "seo";
interface Issue {
  where: Tab;
  what: string;
  fix: string;
}

const ORIGIN = "gabbra.net";
const crumb = (path: string) => (path === "/" ? ORIGIN : `${ORIGIN} › ${path.split("/").filter(Boolean).join(" › ")}`);

export default function SeoAdmin({ goTo }: { goTo: (t: Tab) => void }) {
  const [pages, setPages] = useState<Record<string, SeoOverride> | null>(null);
  const [original, setOriginal] = useState("");
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string>("/");
  const pub = usePublisher();

  const load = async () => {
    try {
      const f = JSON.parse((await readText(FILE)) ?? '{"pages":{}}') as SeoFile;
      setPages(f.pages);
      setOriginal(JSON.stringify(f.pages));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the SEO settings.");
    }
  };

  /** a quick look across everything on the site for missing search text */
  const audit = async () => {
    const found: Issue[] = [];
    try {
      const files = (await listDir("src/content/blog")).filter((f) => f.name.endsWith(".md"));
      for (const f of files) {
        const p = parsePost(f.name.replace(/\.md$/, ""), (await readText(f.path)) ?? "");
        if (p.draft) continue;
        if (!p.description.trim()) found.push({ where: "blog", what: `Post “${p.title}”`, fix: "has no description, so Google picks random text" });
        else if (p.description.length > DESC_MAX) found.push({ where: "blog", what: `Post “${p.title}”`, fix: "description is too long and will be cut off" });
        if (p.tags.length === 0) found.push({ where: "blog", what: `Post “${p.title}”`, fix: "has no tags" });
      }
      const photos = JSON.parse((await readText("src/content/generated/photos.json")) ?? '{"projects":[]}') as {
        projects: { title: string; description?: string; photos: { alt: string; file: string }[] }[];
      };
      for (const pr of photos.projects) {
        if (!pr.description?.trim()) found.push({ where: "photo", what: `Project “${pr.title}”`, fix: "has no description" });
        const plain = pr.photos.filter((x) => /^Photograph from /.test(x.alt)).length;
        if (plain > 0) found.push({ where: "photo", what: `Project “${pr.title}”`, fix: `${plain} photo${plain > 1 ? "s have" : " has"} a placeholder description (Google Images reads these)` });
      }
      const film = JSON.parse((await readText("src/content/admin/film.json")) ?? '{"items":[]}') as { items: { title: string; synopsis?: string }[] };
      for (const it of film.items) if (!it.synopsis?.trim()) found.push({ where: "film", what: `Film “${it.title}”`, fix: "has no synopsis" });
      const fpv = JSON.parse((await readText("src/content/admin/fpv.json")) ?? '{"reels":[],"drones":[]}') as {
        reels: { title: string; description?: string }[];
        drones: { name: string; photo?: string }[];
      };
      for (const r of fpv.reels) if (!r.description?.trim()) found.push({ where: "fpv", what: `Reel “${r.title || "untitled"}”`, fix: "has no description" });
      for (const d of fpv.drones) if (!d.photo) found.push({ where: "fpv", what: `Drone “${d.name || "untitled"}”`, fix: "has no photo" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check the content.");
    }
    setIssues(found);
  };

  useEffect(() => {
    void load();
    void audit();
  }, []);

  const set = (path: string, p: Partial<SeoOverride>) => setPages((all) => (all ? { ...all, [path]: { ...all[path], ...p } } : all));

  const clean = (all: Record<string, SeoOverride>) => {
    const out: Record<string, SeoOverride> = {};
    for (const [k, v] of Object.entries(all)) {
      const o: SeoOverride = {};
      if (v.title?.trim()) o.title = v.title.trim();
      if (v.description?.trim()) o.description = v.description.trim();
      if (v.focus?.length) o.focus = v.focus;
      if (Object.keys(o).length) out[k] = o;
    }
    return out;
  };

  const dirty = !!pages && JSON.stringify(clean(pages)) !== JSON.stringify(JSON.parse(original || "{}"));
  const publish = () =>
    pub.run(async () => {
      if (!pages) return;
      await commit([{ path: FILE, text: JSON.stringify({ pages: clean(pages) }, null, 2) + "\n" }], "SEO: update page titles and descriptions");
      await load();
    });

  if (error) return <Notice>{error}</Notice>;
  if (!pages) return <Notice>Loading…</Notice>;

  const base = SEO_PAGES.find((p) => p.path === open)!;
  const o = pages[open] ?? {};
  const title = o.title ?? "";
  const desc = o.description ?? "";
  const shownTitle = (title || base.title) + (open === "/" ? "" : " — GabbRa");
  const shownDesc = desc || base.description;
  const focus = o.focus ?? [];

  return (
    <div>
      <h2 className="t-wide text-[1.6rem] text-bone">Google search</h2>
      <p className="mt-2 max-w-2xl text-bone/60">
        This is how each page appears in Google. Write a clear title and one or two sentences, and include the words people would type to find you.
        Leave a box empty to keep the built-in text.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Pages" className="flex flex-wrap gap-2 lg:flex-col">
          {SEO_PAGES.map((p) => (
            <button
              key={p.path}
              type="button"
              onClick={() => setOpen(p.path)}
              aria-current={open === p.path ? "page" : undefined}
              className={`t-label border px-4 py-2.5 text-left transition-colors ${
                open === p.path ? "border-[var(--tint)] text-[var(--tint)]" : "border-line text-bone/65 hover:text-bone"
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="max-w-3xl space-y-6">
          <Snippet title={shownTitle} url={crumb(open)} description={shownDesc} />

          <div>
            <Label text="Page title" hint={open === "/" ? "shown as it is" : "“ — GabbRa” is added after it"}>
              <Input value={title} placeholder={base.title} onChange={(e) => set(open, { title: e.target.value })} />
            </Label>
            <VerdictLine v={titleVerdict(title || base.title)} count={(title || base.title).length} max={TITLE_MAX} />
          </div>

          <div>
            <Label text="Description" hint="the text under the title in Google">
              <Textarea rows={3} value={desc} placeholder={base.description} onChange={(e) => set(open, { description: e.target.value })} />
            </Label>
            <VerdictLine v={descVerdict(shownDesc)} count={shownDesc.length} max={DESC_MAX} />
          </div>

          <div>
            <Label text="Focus phrases" hint="what people should search to find this page, comma separated">
              <Input
                value={focus.join(", ")}
                placeholder="e.g. FPV drone filmmaker, cinematic drone footage"
                onChange={(e) => set(open, { focus: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
              />
            </Label>
            <VerdictLine v={focusVerdict(focus, `${title || base.title} ${shownDesc}`)} />
            <p className="mt-2 text-sm text-bone/40">Google ignores the old “keywords” tag, so these are a checklist for your wording rather than something sent to Google.</p>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="flex items-center justify-between gap-4">
          <h2 className="t-wide text-[1.4rem] text-bone">Content check</h2>
          <Btn onClick={() => { setIssues(null); void audit(); }}>Check again</Btn>
        </div>
        <p className="mt-2 max-w-2xl text-bone/55">Blog posts, photographs, films and reels that are missing the text Google needs.</p>
        {issues === null ? (
          <p className="mt-4 text-bone/50">Checking…</p>
        ) : issues.length === 0 ? (
          <p className="mt-4 text-bone/70">Everything has its search text. Nice.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {issues.map((i, k) => (
              <li key={k} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-bone/80">
                  {i.what} <span className="text-bone/50">{i.fix}</span>
                </span>
                <Btn onClick={() => goTo(i.where)}>Fix in {{ blog: "Blog", photo: "Photography", film: "Film", fpv: "FPV", seo: "SEO" }[i.where]}</Btn>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16">
        <h2 className="t-wide text-[1.4rem] text-bone">Your Google tools</h2>
        <ul className="mt-4 space-y-3 text-bone/70">
          {[
            ["How people find you (Search Console)", "https://search.google.com/search-console?resource_id=https%3A%2F%2Fgabbra.net%2F"],
            ["Visitor numbers (Analytics)", "https://analytics.google.com/"],
            ["Your sitemap, which lists every page", "https://gabbra.net/sitemap.xml"],
            ["Check how Google reads a page", "https://search.google.com/test/rich-results"],
          ].map(([label, href]) => (
            <li key={href}>
              <a className="text-[var(--tint)] underline underline-offset-4" href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-2xl text-sm text-bone/45">
          After publishing a new post, open Search Console, paste its address into the top bar and choose “Request indexing” to get it noticed sooner.
        </p>
      </section>

      <PublishBar dirty={dirty} phase={pub.phase} message={pub.message} onPublish={() => void publish()} />
    </div>
  );
}
