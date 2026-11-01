"use client";

import { useEffect, useState } from "react";
import { commit, readText } from "@/lib/github";
import { slugify } from "@/lib/slug";
import { embedUrl } from "@/lib/video";
import { Btn, Input, Label, Notice, PublishBar, RowTools, Textarea, usePublisher } from "./ui";

const FILE = "src/content/admin/film.json";

interface Item {
  section: string;
  slug: string;
  title: string;
  url: string;
  year?: number;
  runtime?: string;
  format?: string;
  synopsis?: string;
  credits?: { role: string; name: string }[];
}

const SECTIONS = [
  { slug: "short-films", title: "Short Films" },
  { slug: "commercial-creative", title: "Commercial & Creative Work" },
  { slug: "collaborations", title: "Collaborations" },
];

export default function FilmAdmin() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [original, setOriginal] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ item: Item; isNew: boolean } | null>(null);
  const [formError, setFormError] = useState("");
  const pub = usePublisher();

  const load = async () => {
    try {
      const data = JSON.parse((await readText(FILE)) ?? '{"items":[]}') as { items: Item[] };
      setItems(data.items);
      setOriginal(JSON.stringify(data.items));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load films.");
    }
  };
  useEffect(() => void load(), []);

  const dirty = !!items && JSON.stringify(items) !== original;
  const publish = () =>
    pub.run(async () => {
      await commit([{ path: FILE, text: JSON.stringify({ items }, null, 2) + "\n" }], "Film: update films");
      await load();
    });

  const patch = (p: Partial<Item>) => setEditing((e) => (e ? { ...e, item: { ...e.item, ...p } } : e));

  const done = () => {
    if (!editing || !items) return;
    const it = editing.item;
    if (!it.title.trim()) return setFormError("Give the film a title.");
    if (!embedUrl(it.url)) return setFormError("That link is not a YouTube or Vimeo video address.");
    let slug = it.slug;
    if (editing.isNew) {
      slug = slugify(it.title) || "film";
      const base = slug;
      let n = 2;
      while (items.some((x) => x.section === it.section && x.slug === slug)) slug = `${base}-${n++}`;
    }
    const clean: Item = { ...it, slug, credits: it.credits?.filter((c) => c.role.trim() || c.name.trim()) };
    setItems(editing.isNew ? [...items, clean] : items.map((x) => (x.section === it.section && x.slug === it.slug ? clean : x)));
    setEditing(null);
    setFormError("");
  };

  if (error) return <Notice>{error}</Notice>;
  if (!items) return <Notice>Loading films…</Notice>;

  if (editing) {
    const it = editing.item;
    const credits = it.credits ?? [];
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="t-wide text-[1.6rem] text-bone">{editing.isNew ? "Add a film" : "Edit film"}</h2>
          <Btn onClick={() => { setEditing(null); setFormError(""); }}>Cancel</Btn>
        </div>
        <Label text="Where does it go?">
          <select
            value={it.section}
            disabled={!editing.isNew}
            onChange={(e) => patch({ section: e.target.value })}
            className="w-full border border-line bg-ink px-3 py-2.5 text-bone"
          >
            {SECTIONS.map((s) => (
              <option key={s.slug} value={s.slug}>{s.title}</option>
            ))}
          </select>
        </Label>
        <Label text="Title">
          <Input value={it.title} onChange={(e) => patch({ title: e.target.value })} />
        </Label>
        <Label text="YouTube or Vimeo link" hint="paste the address from the browser or the Share button">
          <Input value={it.url} onChange={(e) => patch({ url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" />
        </Label>
        <div className="grid gap-6 sm:grid-cols-3">
          <Label text="Year">
            <Input inputMode="numeric" value={it.year ?? ""} onChange={(e) => patch({ year: Number(e.target.value.replace(/\D/g, "")) || undefined })} />
          </Label>
          <Label text="Runtime" hint="e.g. 3:20">
            <Input value={it.runtime ?? ""} onChange={(e) => patch({ runtime: e.target.value || undefined })} />
          </Label>
          <Label text="Format" hint="e.g. 4K">
            <Input value={it.format ?? ""} onChange={(e) => patch({ format: e.target.value || undefined })} />
          </Label>
        </div>
        <Label text="Synopsis" hint="a few sentences: also used by Google">
          <Textarea rows={4} value={it.synopsis ?? ""} onChange={(e) => patch({ synopsis: e.target.value || undefined })} />
        </Label>
        <div>
          <span className="t-label mb-2 block text-[0.62rem] text-steel">Credits</span>
          <div className="space-y-3">
            {credits.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <Input aria-label="Role" placeholder="Role" value={c.role} onChange={(e) => patch({ credits: credits.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })} />
                <Input aria-label="Name" placeholder="Name" value={c.name} onChange={(e) => patch({ credits: credits.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Btn tone="danger" onClick={() => patch({ credits: credits.filter((_, j) => j !== i) })}>×</Btn>
              </div>
            ))}
          </div>
          <Btn className="mt-3" onClick={() => patch({ credits: [...credits, { role: "", name: "" }] })}>Add a credit</Btn>
        </div>
        {formError && <p role="alert" className="text-red-300">{formError}</p>}
        <Btn tone="main" onClick={done}>Done</Btn>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="t-wide text-[1.6rem] text-bone">Films</h2>
        <Btn tone="main" onClick={() => { pub.reset(); setEditing({ isNew: true, item: { section: SECTIONS[0].slug, slug: "", title: "", url: "" } }); }}>
          Add a film
        </Btn>
      </div>
      <p className="mt-2 max-w-xl text-bone/55">Upload the video to YouTube or Vimeo as usual, then paste its link here. Press Publish when you are done.</p>
      {SECTIONS.map((s) => {
        const mine = items.map((it, index) => ({ it, index })).filter((x) => x.it.section === s.slug);
        return (
          <section key={s.slug} className="mt-10">
            <h3 className="t-label text-[0.62rem] text-[var(--tint)]">{s.title}</h3>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {mine.length === 0 && <li className="py-5 text-bone/45">Nothing here yet: the site shows labelled placeholders.</li>}
              {mine.map(({ it, index }, k) => (
                <li key={it.slug} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <span className="text-bone">{it.title}</span>
                  <span className="flex gap-2">
                    <Btn onClick={() => { pub.reset(); setEditing({ isNew: false, item: it }); }}>Edit</Btn>
                    <RowTools
                      onUp={k > 0 ? () => setItems((l) => (l ? swap(l, index, mine[k - 1].index) : l)) : undefined}
                      onDown={k < mine.length - 1 ? () => setItems((l) => (l ? swap(l, index, mine[k + 1].index) : l)) : undefined}
                      onRemove={() => window.confirm(`Remove “${it.title}”?`) && setItems((l) => l?.filter((_, j) => j !== index) ?? l)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <PublishBar dirty={dirty} phase={pub.phase} message={pub.message} onPublish={() => void publish()} />
    </div>
  );
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
