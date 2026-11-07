"use client";

import { useEffect, useState } from "react";
import { commit, readText } from "@/lib/github";
import { PRINTS_CFG, isStripeLink, type PrintsConfig, type PrintSize } from "@/lib/prints";
import { slugify } from "@/lib/slug";
import { Btn, Input, Label, Notice, PublishBar, RowTools, move, usePublisher } from "./ui";

const FILE = "src/content/admin/prints.json";

export default function PrintsAdmin() {
  const [cfg, setCfg] = useState<PrintsConfig | null>(null);
  const [original, setOriginal] = useState("");
  const [error, setError] = useState("");
  const pub = usePublisher();

  const load = async () => {
    try {
      const raw = await readText(FILE);
      const d = raw ? (JSON.parse(raw) as PrintsConfig) : PRINTS_CFG;
      setCfg(d);
      setOriginal(JSON.stringify(d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the print list.");
    }
  };
  useEffect(() => void load(), []);

  if (error) return <Notice>{error}</Notice>;
  if (!cfg) return <Notice>Loading the print list…</Notice>;

  const set = (patch: Partial<PrintsConfig>) => setCfg({ ...cfg, ...patch });
  const setSize = (i: number, patch: Partial<PrintSize>) => set({ sizes: cfg.sizes.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const dirty = JSON.stringify(cfg) !== original;

  const publish = () =>
    pub.run(async () => {
      const sizes = cfg.sizes.map((s) => ({ ...s, link: s.link.trim(), price: s.price.trim(), label: s.label.trim() }));
      if (sizes.length === 0) throw new Error("Keep at least one size.");
      for (const s of sizes) {
        if (!s.label) throw new Error("Every size needs a name.");
        if (!(s.long > 0)) throw new Error(`“${s.label}”: the long edge must be a number of centimetres.`);
        if (s.link && !isStripeLink(s.link)) throw new Error(`“${s.label}”: the payment link must be a Stripe link (it starts with https://buy.stripe.com/).`);
      }
      const next: PrintsConfig = { paper: cfg.paper.trim(), note: cfg.note.trim(), sizes };
      await commit([{ path: FILE, text: JSON.stringify(next, null, 2) + "\n" }], "Prints: update sizes and prices");
      await load();
    });

  return (
    <div className="max-w-3xl">
      <h2 className="t-wide text-[1.6rem] text-bone">Print sizes and prices</h2>
      <p className="mt-2 max-w-xl text-bone/55">
        Every photograph is offered in these sizes, measured along the long edge, so any shape of photograph works. Each size has its own Stripe payment link; the site tells you which photograph was ordered.
        Until a size has both a price and a link, its buy button shows “Checkout opens soon”.
      </p>

      <ul className="mt-8 space-y-5">
        {cfg.sizes.map((s, i) => (
          <li key={s.id} className="border border-line p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem_8rem]">
              <Label text="Name">
                <Input value={s.label} onChange={(e) => setSize(i, { label: e.target.value })} />
              </Label>
              <Label text="Long edge" hint="cm">
                <Input inputMode="numeric" value={s.long || ""} onChange={(e) => setSize(i, { long: Number(e.target.value.replace(/\D/g, "")) })} />
              </Label>
              <Label text="Price" hint="e.g. €120">
                <Input value={s.price} onChange={(e) => setSize(i, { price: e.target.value })} />
              </Label>
            </div>
            <div className="mt-4">
              <Label text="Stripe payment link" hint="https://buy.stripe.com/…">
                <Input value={s.link} onChange={(e) => setSize(i, { link: e.target.value })} placeholder="paste the link from Stripe" />
              </Label>
              {s.link && !isStripeLink(s.link.trim()) && <p className="mt-2 text-sm text-red-300">This is not a Stripe link.</p>}
            </div>
            <div className="mt-4">
              <RowTools
                onUp={i > 0 ? () => set({ sizes: move(cfg.sizes, i, -1) }) : undefined}
                onDown={i < cfg.sizes.length - 1 ? () => set({ sizes: move(cfg.sizes, i, 1) }) : undefined}
                onRemove={cfg.sizes.length > 1 ? () => set({ sizes: cfg.sizes.filter((_, k) => k !== i) }) : undefined}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Btn
          onClick={() => {
            const n = cfg.sizes.length + 1;
            set({ sizes: [...cfg.sizes, { id: `${slugify("size")}-${Date.now()}`, label: `Size ${n}`, long: 60, price: "", link: "" }] });
          }}
        >
          Add a size
        </Btn>
      </div>

      <div className="mt-10 grid gap-6">
        <Label text="Paper" hint="shown on the print page; leave empty to hide">
          <Input value={cfg.paper} onChange={(e) => set({ paper: e.target.value })} placeholder="e.g. Archival matte fine-art paper" />
        </Label>
        <Label text="A note under the sizes" hint="shipping, delivery time, edition… leave empty to hide">
          <Input value={cfg.note} onChange={(e) => set({ note: e.target.value })} />
        </Label>
      </div>

      <PublishBar dirty={dirty} phase={pub.phase} message={pub.message} onPublish={() => void publish()} />
    </div>
  );
}
