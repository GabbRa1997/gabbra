"use client";

import { useCallback, useEffect, useState } from "react";
import { blobToBase64, commit, listDir, readText, type FileChange } from "@/lib/github";
import { parsePost, serializePost, type Post } from "@/lib/frontmatter";
import { processImage } from "@/lib/image";
import { slugify } from "@/lib/slug";
import { DESC_MAX, TITLE_MAX } from "@/lib/seoDefaults";
import { Btn, Input, Label, Notice, PublishBar, Textarea, usePublisher } from "./ui";
import { Snippet, VerdictLine, descVerdict, titleVerdict } from "./seoUi";

const DIR = "src/content/blog";
type Pending = { path: string; blob: Blob; url: string };

const today = () => new Date().toISOString().slice(0, 10);

export default function BlogAdmin() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ post: Post; isNew: boolean } | null>(null);
  const [images, setImages] = useState<Pending[]>([]);
  const [busyImg, setBusyImg] = useState(false);
  const pub = usePublisher();

  const load = useCallback(async () => {
    try {
      const files = (await listDir(DIR)).filter((f) => f.name.endsWith(".md"));
      const all = await Promise.all(
        files.map(async (f) => parsePost(f.name.replace(/\.md$/, ""), (await readText(f.path)) ?? "")),
      );
      setPosts(all.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load posts.");
    }
  }, []);
  useEffect(() => void load(), [load]);

  const patch = (p: Partial<Post>) => setEditing((e) => (e ? { ...e, post: { ...e.post, ...p } } : e));

  const addImage = async (file: File, as: "cover" | "inline") => {
    if (!editing) return;
    setBusyImg(true);
    try {
      const out = await processImage(file, [1600]);
      const v = out.variants[0];
      const name = `${editing.post.slug || "post"}-${as === "cover" ? "cover" : Date.now()}.${v.ext}`;
      const path = `public/uploads/blog/${name}`;
      setImages((list) => [...list.filter((i) => i.path !== path), { path, blob: v.blob, url: URL.createObjectURL(v.blob) }]);
      const site = `/uploads/blog/${name}`;
      if (as === "cover") patch({ cover: site });
      else {
        const alt = window.prompt("Describe the image in a few words (for people who cannot see it):") ?? "";
        patch({ body: `${editing.post.body}\n\n![${alt.replace(/[\]\n]/g, " ")}](${site})\n` });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not add that image.");
    }
    setBusyImg(false);
  };

  const save = () =>
    pub.run(async () => {
      if (!editing) return;
      const p = editing.post;
      if (!p.title.trim()) throw new Error("Give the post a title first.");
      const slug = editing.isNew ? slugify(p.slug || p.title) : p.slug;
      if (!slug) throw new Error("The web address could not be made from that title.");
      if (editing.isNew && posts?.some((x) => x.slug === slug)) throw new Error("A post with that address already exists. Change the title a little.");
      const used = images.filter((i) => serializePost({ ...p, slug }).includes(i.path.replace(/^public/, "")));
      const changes: FileChange[] = [{ path: `${DIR}/${slug}.md`, text: serializePost({ ...p, slug }) }];
      for (const i of used) changes.push({ path: i.path, base64: await blobToBase64(i.blob) });
      await commit(changes, `Blog: ${p.title.trim()}`);
      setImages([]);
      setEditing(null);
      await load();
    });

  const remove = (p: Post) => {
    if (!window.confirm(`Delete “${p.title}”? It disappears from the site once published.`)) return;
    void pub.run(async () => {
      await commit([{ path: `${DIR}/${p.slug}.md`, remove: true }], `Blog: delete ${p.title}`);
      await load();
    });
  };

  if (error) return <Notice>{error}</Notice>;
  if (!posts) return <Notice>Loading posts…</Notice>;

  if (editing) {
    const p = editing.post;
    const cover = p.cover ? (images.find((i) => p.cover!.endsWith(i.path.split("/").pop()!))?.url ?? p.cover) : null;
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="t-wide text-[1.6rem] text-bone">{editing.isNew ? "New post" : "Edit post"}</h2>
          <Btn onClick={() => { setEditing(null); setImages([]); pub.reset(); }}>← All posts</Btn>
        </div>
        <Label text="Title">
          <Input value={p.title} onChange={(e) => patch({ title: e.target.value })} />
        </Label>
        {editing.isNew && (
          <p className="text-sm text-bone/45">Web address: /blog/{slugify(p.title) || "…"}/ (fixed once saved)</p>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <Label text="Date">
            <Input type="date" value={p.date} onChange={(e) => patch({ date: e.target.value })} />
          </Label>
          <Label text="Tags" hint="comma separated, e.g. fpv, drone, cinematic">
            <Input value={p.tags.join(", ")} onChange={(e) => patch({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
          </Label>
        </div>
        <VerdictLine v={titleVerdict(p.title)} count={p.title.length} max={TITLE_MAX} />
        <Label text="Description" hint="one or two sentences: this is what Google shows under the title">
          <Textarea rows={2} value={p.description} onChange={(e) => patch({ description: e.target.value })} />
        </Label>
        <VerdictLine v={descVerdict(p.description)} count={p.description.length} max={DESC_MAX} />
        <Snippet title={`${p.title} — GabbRa`} url={`gabbra.net › blog › ${editing.isNew ? slugify(p.title) || "…" : p.slug}`} description={p.description} />
        <div>
          <span className="t-label mb-2 block text-[0.62rem] text-steel">Cover image (optional)</span>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="mb-3 max-h-48 border border-line" />
          )}
          <input type="file" accept="image/*" disabled={busyImg} onChange={(e) => e.target.files?.[0] && void addImage(e.target.files[0], "cover")} className="text-sm text-bone/60" />
          {p.cover && (
            <Btn className="ml-3" onClick={() => patch({ cover: undefined })}>
              Remove cover
            </Btn>
          )}
        </div>
        <Label text="The post" hint="blank line = new paragraph · ## heading · - list · **bold** · [text](link)">
          <Textarea rows={16} value={p.body} onChange={(e) => patch({ body: e.target.value })} className="font-mono text-[0.92rem] leading-relaxed" />
        </Label>
        <div className="flex flex-wrap items-center gap-4">
          <label className="t-label cursor-pointer border border-line px-4 py-2.5 text-bone/75 hover:border-[var(--tint)] hover:text-[var(--tint)]">
            {busyImg ? "Preparing…" : "Add a photo into the text"}
            <input type="file" accept="image/*" hidden disabled={busyImg} onChange={(e) => e.target.files?.[0] && void addImage(e.target.files[0], "inline")} />
          </label>
          <label className="flex items-center gap-3 text-bone/70">
            <input type="checkbox" checked={p.draft} onChange={(e) => patch({ draft: e.target.checked })} />
            Draft (keep it off the live site)
          </label>
        </div>
        <PublishBar dirty phase={pub.phase} message={pub.message} onPublish={() => void save()} label={p.draft ? "Save draft" : "Publish post"} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="t-wide text-[1.6rem] text-bone">Posts</h2>
        <Btn tone="main" onClick={() => { pub.reset(); setEditing({ isNew: true, post: { slug: "", title: "", date: today(), description: "", tags: [], draft: false, body: "" } }); }}>
          New post
        </Btn>
      </div>
      {pub.phase === "done" && <div className="mt-6"><PublishBar dirty={false} phase="done" message="" onPublish={() => {}} /></div>}
      {pub.phase === "error" && <p className="mt-6 text-red-300">{pub.message}</p>}
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {posts.length === 0 && <li className="py-6 text-bone/50">No posts yet.</li>}
        {posts.map((p) => (
          <li key={p.slug} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <span>
              <span className="text-bone">{p.title}</span>
              {p.draft && <span className="t-label ml-3 text-[0.62rem] text-steel">Draft</span>}
              <span className="t-label mt-1 block text-[0.62rem] text-steel">{p.date}</span>
            </span>
            <span className="flex gap-2">
              <Btn onClick={() => { pub.reset(); setEditing({ isNew: false, post: p }); }}>Edit</Btn>
              <Btn tone="danger" onClick={() => remove(p)}>Delete</Btn>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
