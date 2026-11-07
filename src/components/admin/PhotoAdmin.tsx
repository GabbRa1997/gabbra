"use client";

import { useEffect, useState, type DragEvent } from "react";
import { blobToBase64, commit, readText, type FileChange } from "@/lib/github";
import { processImage } from "@/lib/image";
import type { Photo, PhotoProject } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { Btn, Input, Label, Notice, PublishBar, RowTools, Textarea, move, usePublisher } from "./ui";

const FILE = "src/content/generated/photos.json";
type Blobs = Record<string, Blob>; // site path → file waiting to be published

const paths = (p: Photo) => p.srcset.map((s) => s.url);

export default function PhotoAdmin() {
  const [projects, setProjects] = useState<PhotoProject[] | null>(null);
  const [original, setOriginal] = useState("");
  const [existing, setExisting] = useState<Set<string>>(new Set());
  const [blobs, setBlobs] = useState<Blobs>({});
  const [previews, setPreviews] = useState<Record<string, string>>({}); // site path → local preview
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [note, setNote] = useState<{ added: number; failed: string[] } | null>(null);
  const pub = usePublisher();
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const load = async () => {
    try {
      const raw = (await readText(FILE)) ?? '{"projects":[]}';
      const data = JSON.parse(raw) as { projects: PhotoProject[] };
      setProjects(data.projects);
      setOriginal(JSON.stringify(data.projects));
      setExisting(new Set(data.projects.flatMap((p) => p.photos.flatMap(paths))));
      setBlobs({});
      setRemoved(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load photographs.");
    }
  };
  useEffect(() => void load(), []);

  const update = (slug: string, fn: (p: PhotoProject) => PhotoProject) =>
    setProjects((list) => list?.map((p) => (p.slug === slug ? fn(p) : p)) ?? list);

  /** prepare files in the browser and add them to a project; one bad file never stops the others */
  const addPhotos = async (slug: string, files: File[], title?: string) => {
    setNote(null);
    const made: Photo[] = [];
    const failed: string[] = [];
    const newBlobs: Blobs = {};
    const newPrev: Record<string, string> = {};
    const taken = new Set(projects?.find((p) => p.slug === slug)?.photos.map((p) => p.id) ?? []);
    for (const [n, file] of files.entries()) {
      setBusy(`Preparing photo ${n + 1} of ${files.length}…`);
      try {
        const out = await processImage(file);
        let id = slugify(file.name.replace(/\.[^.]+$/, "")) || `photo-${Date.now()}`;
        while (taken.has(id)) id += "-2";
        taken.add(id);
        const srcset = out.variants.map((v) => ({ w: v.w, url: `/media/photo/${slug}/${id}-${v.w}.${v.ext}` }));
        for (const v of out.variants) newBlobs[`/media/photo/${slug}/${id}-${v.w}.${v.ext}`] = v.blob;
        const biggest = out.variants[out.variants.length - 1];
        newPrev[srcset[srcset.length - 1].url] = URL.createObjectURL(biggest.blob);
        made.push({
          id,
          file: file.name,
          alt: `Photograph from ${title ?? projects?.find((p) => p.slug === slug)?.title ?? slug}`,
          w: out.w,
          h: out.h,
          blur: out.blur,
          color: out.color,
          srcset,
          src: srcset[srcset.length - 1].url,
        });
      } catch (e) {
        failed.push(e instanceof Error ? e.message : `${file.name}: could not be prepared.`);
      }
    }
    if (made.length) {
      setBlobs((b) => ({ ...b, ...newBlobs }));
      setPreviews((p) => ({ ...p, ...newPrev }));
      setProjects((list) => {
        const l = list ?? [];
        if (l.some((p) => p.slug === slug)) return l.map((p) => (p.slug === slug ? { ...p, photos: [...p.photos, ...made] } : p));
        return [...l, { slug, title: title ?? slug, subject: "Photography", order: l.length, cover: made[0].id, photos: made }];
      });
    }
    setNote({ added: made.length, failed });
    setBusy("");
    return made.length;
  };

  const isImage = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif|tiff?)$/i.test(f.name);
  const onDrop = (e: DragEvent, add: (files: File[]) => void) => {
    e.preventDefault();
    add([...e.dataTransfer.files].filter(isImage));
  };

  const dropFiles = (photo: Photo) => {
    const gone = paths(photo);
    setBlobs((b) => Object.fromEntries(Object.entries(b).filter(([k]) => !gone.includes(k))));
    setRemoved((r) => new Set([...r, ...gone.filter((g) => existing.has(g))]));
  };

  const removePhoto = (slug: string, photo: Photo) => {
    if (!window.confirm("Remove this photograph?")) return;
    dropFiles(photo);
    update(slug, (p) => {
      const photos = p.photos.filter((x) => x.id !== photo.id);
      return { ...p, photos, cover: p.cover === photo.id ? photos[0].id : p.cover };
    });
  };

  const removeProject = (p: PhotoProject) => {
    if (!window.confirm(`Delete the whole project “${p.title}” and its ${p.photos.length} photographs?`)) return;
    p.photos.forEach(dropFiles);
    setProjects((l) => l?.filter((x) => x.slug !== p.slug) ?? l);
    setOpen(null);
  };

  const final = projects?.map((p, i) => ({ ...p, order: i }));
  const dirty = !!projects && (JSON.stringify(final) !== original || Object.keys(blobs).length > 0 || removed.size > 0);

  const publish = () =>
    pub.run(async () => {
      if (!final) return;
      const changes: FileChange[] = [{ path: FILE, text: JSON.stringify({ projects: final }, null, 2) + "\n" }];
      for (const [site, blob] of Object.entries(blobs)) changes.push({ path: `public${site}`, base64: await blobToBase64(blob) });
      for (const site of removed) changes.push({ path: `public${site}`, remove: true });
      await commit(changes, "Photography: update projects");
      await load();
    });

  if (error) return <Notice>{error}</Notice>;
  if (!projects) return <Notice>Loading photographs…</Notice>;

  const current = projects.find((p) => p.slug === open);
  const src = (p: Photo) => previews[p.src] ?? p.src;

  return (
    <div>
      {busy && <p role="status" className="mb-6 border border-line px-4 py-3 text-bone/70">{busy}</p>}

      {!current ? (
        <>
          <h2 className="t-wide text-[1.6rem] text-bone">Photography projects</h2>
          <p className="mt-2 max-w-xl text-bone/55">The order here is the order on the Selected Works page.</p>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {projects.length === 0 && <li className="py-6 text-bone/50">No projects yet.</li>}
            {projects.map((p, i) => (
              <li key={p.slug} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <span className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src(p.photos.find((x) => x.id === p.cover) ?? p.photos[0])} alt="" className="h-14 w-20 border border-line object-cover" />
                  <span>
                    <span className="text-bone">{p.title}</span>
                    <span className="t-label mt-1 block text-[0.62rem] text-steel">{p.photos.length} photographs</span>
                  </span>
                </span>
                <span className="flex gap-2">
                  <Btn onClick={() => setOpen(p.slug)}>Open</Btn>
                  <RowTools onUp={() => setProjects((l) => (l ? move(l, i, -1) : l))} onDown={() => setProjects((l) => (l ? move(l, i, 1) : l))} />
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 max-w-xl space-y-4 border border-line p-6">
            <h3 className="t-label text-[0.62rem] text-[var(--tint)]">New project</h3>
            <Label text="Project title">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Lisbon Nights" />
            </Label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewFiles([...(e.target.files ?? [])])}
              className="text-sm text-bone/60"
            />
            <div>
              <Btn
                tone="main"
                disabled={!newTitle.trim() || !!busy}
                onClick={async () => {
                  const files = newFiles;
                  const slug = slugify(newTitle);
                  if (!files.length) return alert("Choose at least one photograph.");
                  if (!slug || projects.some((p) => p.slug === slug)) return alert("That title is empty or already used.");
                  if ((await addPhotos(slug, files, newTitle.trim())) === 0) return;
                  setNewTitle("");
                  setNewFiles([]);
                  setOpen(slug);
                }}
              >
                Create project
              </Btn>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="t-wide text-[1.6rem] text-bone">{current.title}</h2>
            <span className="flex gap-2">
              <Btn tone="danger" onClick={() => removeProject(current)}>Delete project</Btn>
              <Btn onClick={() => setOpen(null)}>← All projects</Btn>
            </span>
          </div>
          <div className="mt-6 grid max-w-3xl gap-6 sm:grid-cols-2">
            <Label text="Title">
              <Input value={current.title} onChange={(e) => update(current.slug, (p) => ({ ...p, title: e.target.value }))} />
            </Label>
            <Label text="Year">
              <Input inputMode="numeric" value={current.year ?? ""} onChange={(e) => update(current.slug, (p) => ({ ...p, year: Number(e.target.value.replace(/\D/g, "")) || undefined }))} />
            </Label>
            <div className="sm:col-span-2">
              <Label text="Description" hint="shown under the title and used by Google">
                <Textarea rows={3} value={current.description ?? ""} onChange={(e) => update(current.slug, (p) => ({ ...p, description: e.target.value || undefined }))} />
              </Label>
            </div>
          </div>

          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, (f) => f.length && void addPhotos(current.slug, f))}
            className="mt-8 block cursor-pointer border border-dashed border-line px-6 py-10 text-center text-bone/70 transition-colors hover:border-[var(--tint)] hover:text-[var(--tint)]"
          >
            <span className="t-label text-[0.7rem]">{busy ? "Preparing…" : "Add photographs"}</span>
            <span className="mt-2 block text-sm text-bone/45">Click to choose several at once, or drop them here. They are added straight away; then press Publish.</span>
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={!!busy}
              onChange={(e) => {
                const input = e.currentTarget;
                const files = [...(input.files ?? [])];
                input.value = "";
                if (files.length) void addPhotos(current.slug, files);
              }}
            />
          </label>
          {note && (
            <div aria-live="polite" className="mt-4 space-y-1 border border-line px-4 py-3 text-sm">
              {note.added > 0 && (
                <p className="text-bone/80">
                  Added {note.added} photograph{note.added > 1 ? "s" : ""}. Press “Publish changes” below to put {note.added > 1 ? "them" : "it"} on the site.
                </p>
              )}
              {note.failed.map((f) => (
                <p key={f} className="text-red-300">
                  Not added: {f}
                </p>
              ))}
            </div>
          )}

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {current.photos.map((ph, i) => (
              <li key={ph.id} className="border border-line p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(ph)} alt={ph.alt} className="aspect-[3/2] w-full object-cover" />
                <p className="t-label mt-3 text-[0.62rem] text-steel">
                  {i + 1} · {ph.file} {current.cover === ph.id && <span className="text-[var(--tint)]">· cover</span>}
                </p>
                <Label text="Describe this photo" hint="for accessibility and Google">
                  <Textarea rows={2} value={ph.alt} onChange={(e) => update(current.slug, (p) => ({ ...p, photos: p.photos.map((x) => (x.id === ph.id ? { ...x, alt: e.target.value } : x)) }))} />
                </Label>
                <label className="mt-3 flex items-center gap-3 text-sm text-bone/70">
                  <input
                    type="checkbox"
                    checked={!!ph.print}
                    onChange={(e) =>
                      update(current.slug, (p) => ({ ...p, photos: p.photos.map((x) => (x.id === ph.id ? { ...x, print: e.target.checked ? (x.print ?? {}) : undefined } : x)) }))
                    }
                  />
                  Show in Selected Prints
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RowTools
                    onUp={() => update(current.slug, (p) => ({ ...p, photos: move(p.photos, i, -1) }))}
                    onDown={() => update(current.slug, (p) => ({ ...p, photos: move(p.photos, i, 1) }))}
                    onRemove={current.photos.length > 1 ? () => removePhoto(current.slug, ph) : undefined}
                  />
                  {current.cover !== ph.id && <Btn onClick={() => update(current.slug, (p) => ({ ...p, cover: ph.id }))}>Make cover</Btn>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <PublishBar dirty={dirty} phase={pub.phase} message={pub.message} onPublish={() => void publish()} />
    </div>
  );
}
