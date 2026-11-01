"use client";

import { useEffect, useState } from "react";
import { DRONE_SHEET_FIELDS, type FpvDrone, type FpvReel } from "@/content/fpv";
import { blobToBase64, commit, readText } from "@/lib/github";
import { processImage } from "@/lib/image";
import { embedUrl } from "@/lib/video";
import { Btn, Input, Label, Notice, PublishBar, RowTools, Textarea, move, usePublisher } from "./ui";

const FILE = "src/content/admin/fpv.json";
type Data = { reels: FpvReel[]; drones: FpvDrone[] };

export default function FpvAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [original, setOriginal] = useState("");
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<Record<string, { blob: Blob; url: string }>>({}); // site path → file
  const [existing, setExisting] = useState<Set<string>>(new Set());
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [openDrone, setOpenDrone] = useState<string | null>(null);
  const pub = usePublisher();

  const load = async () => {
    try {
      const d = JSON.parse((await readText(FILE)) ?? '{"reels":[],"drones":[]}') as Data;
      setData(d);
      setOriginal(JSON.stringify(d));
      setExisting(new Set(d.drones.map((x) => x.photo).filter((x): x is string => !!x)));
      setPhotos({});
      setRemoved(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load FPV content.");
    }
  };
  useEffect(() => void load(), []);

  const dirty = !!data && (JSON.stringify(data) !== original || Object.keys(photos).length > 0 || removed.size > 0);
  const publish = () =>
    pub.run(async () => {
      if (!data) return;
      const badReel = data.reels.find((r) => !embedUrl(r.url));
      if (badReel) throw new Error(`“${badReel.title || "A reel"}” needs a YouTube or Vimeo link.`);
      const used = new Set(data.drones.map((d) => d.photo));
      const changes = [{ path: FILE, text: JSON.stringify(data, null, 2) + "\n" } as import("@/lib/github").FileChange];
      for (const [site, { blob }] of Object.entries(photos)) if (used.has(site)) changes.push({ path: `public${site}`, base64: await blobToBase64(blob) });
      for (const site of removed) if (!used.has(site)) changes.push({ path: `public${site}`, remove: true });
      await commit(changes, "FPV: update reels and drones");
      await load();
    });

  const setReel = (id: string, p: Partial<FpvReel>) => setData((d) => d && { ...d, reels: d.reels.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const setDrone = (id: string, p: Partial<FpvDrone>) => setData((d) => d && { ...d, drones: d.drones.map((r) => (r.id === id ? { ...r, ...p } : r)) });

  const uploadPhoto = async (d: FpvDrone, file: File) => {
    try {
      const out = await processImage(file, [1600]);
      const v = out.variants[0];
      const site = `/uploads/fpv/${d.id}-${Date.now()}.${v.ext}`;
      setPhotos((p) => ({ ...p, [site]: { blob: v.blob, url: URL.createObjectURL(v.blob) } }));
      if (d.photo && existing.has(d.photo)) setRemoved((r) => new Set([...r, d.photo!]));
      setDrone(d.id, { photo: site });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not add that photo.");
    }
  };

  if (error) return <Notice>{error}</Notice>;
  if (!data) return <Notice>Loading…</Notice>;

  const drone = data.drones.find((d) => d.id === openDrone);

  return (
    <div>
      {drone ? (
        <div className="max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="t-wide text-[1.6rem] text-bone">{drone.name || "New drone"}</h2>
            <Btn onClick={() => setOpenDrone(null)}>← All drones</Btn>
          </div>
          <Label text="Name">
            <Input value={drone.name} onChange={(e) => setDrone(drone.id, { name: e.target.value })} placeholder="e.g. The Cinewhoop" />
          </Label>
          <div>
            <span className="t-label mb-2 block text-[0.62rem] text-steel">Photo</span>
            {drone.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[drone.photo]?.url ?? drone.photo} alt="" className="mb-3 max-h-56 border border-line" />
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && void uploadPhoto(drone, e.target.files[0])} className="text-sm text-bone/60" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {DRONE_SHEET_FIELDS.map((f) => (
              <Label key={f} text={f}>
                <Input value={drone.specs[f] ?? ""} onChange={(e) => setDrone(drone.id, { specs: { ...drone.specs, [f]: e.target.value } })} />
              </Label>
            ))}
          </div>
          <Label text="Notes" hint="optional: a line about this machine">
            <Textarea rows={3} value={drone.notes ?? ""} onChange={(e) => setDrone(drone.id, { notes: e.target.value || undefined })} />
          </Label>
        </div>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between">
              <h2 className="t-wide text-[1.6rem] text-bone">Flight reels</h2>
              <Btn tone="main" onClick={() => setData((d) => d && { ...d, reels: [...d.reels, { id: `reel-${Date.now()}`, title: "", url: "" }] })}>Add a reel</Btn>
            </div>
            <p className="mt-2 max-w-xl text-bone/55">Paste a YouTube or Vimeo link. The first reel is shown largest.</p>
            <ul className="mt-6 space-y-5">
              {data.reels.length === 0 && <li className="border-y border-line py-5 text-bone/45">No reels yet: the site shows labelled placeholders.</li>}
              {data.reels.map((r, i) => (
                <li key={r.id} className="space-y-3 border border-line p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input aria-label="Reel title" placeholder="Title" value={r.title} onChange={(e) => setReel(r.id, { title: e.target.value })} />
                    <Input aria-label="Video link" placeholder="https://www.youtube.com/watch?v=…" value={r.url} onChange={(e) => setReel(r.id, { url: e.target.value })} />
                  </div>
                  <Input aria-label="Short description" placeholder="One line about it (optional)" value={r.description ?? ""} onChange={(e) => setReel(r.id, { description: e.target.value || undefined })} />
                  {r.url && !embedUrl(r.url) && <p className="text-sm text-red-300">That is not a YouTube or Vimeo address.</p>}
                  <RowTools
                    onUp={() => setData((d) => d && { ...d, reels: move(d.reels, i, -1) })}
                    onDown={() => setData((d) => d && { ...d, reels: move(d.reels, i, 1) })}
                    onRemove={() => setData((d) => d && { ...d, reels: d.reels.filter((x) => x.id !== r.id) })}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <div className="flex items-center justify-between">
              <h2 className="t-wide text-[1.6rem] text-bone">Drones owned</h2>
              <Btn
                tone="main"
                onClick={() => {
                  const id = `drone-${Date.now()}`;
                  setData((d) => d && { ...d, drones: [...d.drones, { id, name: "", specs: {} }] });
                  setOpenDrone(id);
                }}
              >
                Add a drone
              </Btn>
            </div>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {data.drones.length === 0 && <li className="py-5 text-bone/45">No drones yet: the site shows labelled placeholders.</li>}
              {data.drones.map((d, i) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <span className="text-bone">{d.name || "Untitled drone"}</span>
                  <span className="flex gap-2">
                    <Btn onClick={() => setOpenDrone(d.id)}>Edit</Btn>
                    <RowTools
                      onUp={() => setData((x) => x && { ...x, drones: move(x.drones, i, -1) })}
                      onDown={() => setData((x) => x && { ...x, drones: move(x.drones, i, 1) })}
                      onRemove={() => {
                        if (!window.confirm(`Remove “${d.name || "this drone"}”?`)) return;
                        if (d.photo && existing.has(d.photo)) setRemoved((r) => new Set([...r, d.photo!]));
                        setData((x) => x && { ...x, drones: x.drones.filter((y) => y.id !== d.id) });
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <PublishBar dirty={dirty} phase={pub.phase} message={pub.message} onPublish={() => void publish()} />
    </div>
  );
}
