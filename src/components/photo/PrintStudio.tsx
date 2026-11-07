"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Photograph from "@/components/media/Photograph";
import TLink from "@/components/shell/TLink";
import type { Photo } from "@/lib/media";
import { PRINTS_CFG, buyUrl, cm, isStripeLink, printDims } from "@/lib/prints";

export interface PrintItem {
  key: string;
  project: string;
  projectTitle: string;
  photo: Photo;
}

// the wall is drawn in centimetres so a print really is to scale against the sofa
const VX = 25; // the part of the wall that is in view: 210 × 130 cm
const VY = 22;
const VW = 210;
const VH = 130;
const CENTRE = 130;
const BOTTOM = 82; // where the bottom edge of every print hangs
const pc = (n: number, of: number) => `${(n / of) * 100}%`;

function Wall() {
  return (
    <svg viewBox={`${VX} ${VY} ${VW} ${VH}`} className="absolute inset-0 h-full w-full" aria-hidden>
      <rect x={VX} y="140" width={VW} height="20" fill="#1b1a1e" />
      <rect x={VX} y="139.5" width={VW} height="1" fill="#2a282e" />
      {/* a 180 cm sofa */}
      <rect x="45" y="96" width="170" height="30" rx="7" fill="#2a2830" />
      <rect x="36" y="106" width="18" height="34" rx="7" fill="#33303a" />
      <rect x="206" y="106" width="18" height="34" rx="7" fill="#33303a" />
      <rect x="50" y="116" width="160" height="22" rx="5" fill="#36333d" />
      <rect x="129.5" y="116" width="1" height="22" fill="#262429" />
      <rect x="44" y="138" width="5" height="4" fill="#161518" />
      <rect x="211" y="138" width="5" height="4" fill="#161518" />
    </svg>
  );
}

/** Choose a size and see the print on a wall, to scale; then go to the payment page. */
export default function PrintStudio({ items }: { items: PrintItem[] }) {
  const key = useSearchParams().get("photo") ?? "";
  const item = items.find((i) => i.key === key);
  const sizes = PRINTS_CFG.sizes;
  const [pick, setPick] = useState(Math.min(1, sizes.length - 1));

  if (!item) {
    return (
      <p className="max-w-xl text-lg text-bone/60">
        Choose a photograph first.{" "}
        <TLink href="/photo/selected-works" variant="fade" className="text-[var(--tint)] underline underline-offset-4">
          Open Selected Works
        </TLink>
        .
      </p>
    );
  }

  const { photo } = item;
  const size = sizes[pick];
  const d = printDims(photo.w, photo.h, size.long);
  const ready = !!size.price && isStripeLink(size.link);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
      <figure>
        <div
          className="relative w-full overflow-hidden border border-line"
          style={{ aspectRatio: `${VW} / ${VH}`, background: "linear-gradient(#18171b, #0d0d0f)" }}
        >
          <Wall />
          <div
            className="absolute transition-all duration-500 ease-out"
            style={{
              left: pc(CENTRE - d.w / 2 - VX, VW),
              top: pc(BOTTOM - d.h - VY, VH),
              width: pc(d.w, VW),
              height: pc(d.h, VH),
              boxShadow: "0 1.2% 3% rgba(0,0,0,.65)",
              outline: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <Photograph photo={photo} sizes="(min-width: 1024px) 40vw, 90vw" priority />
          </div>
          <p className="t-label absolute bottom-3 right-4 text-[0.62rem] text-bone/70">
            {cm(d.w)} × {cm(d.h)} cm
          </p>
        </div>
        <figcaption className="t-label mt-3 text-[0.62rem] text-steel">Shown to scale against a 180 cm sofa</figcaption>
      </figure>

      <div>
        <p className="t-label text-[0.62rem] text-steel">{item.projectTitle}</p>
        <p className="mt-3 max-w-md text-bone/60">{photo.alt}</p>

        <div role="radiogroup" aria-label="Print size" className="mt-8 divide-y divide-line border-y border-line">
          {sizes.map((s, i) => {
            const dd = printDims(photo.w, photo.h, s.long);
            const on = i === pick;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPick(i)}
                className={`flex w-full items-baseline justify-between gap-6 py-4 text-left transition-colors ${on ? "text-[var(--tint)]" : "text-bone/70 hover:text-bone"}`}
              >
                <span>
                  <span className="t-wide text-[1.15rem]">{s.label}</span>
                  <span className="t-label ml-3 text-[0.62rem] text-bone/45">
                    {cm(dd.w)} × {cm(dd.h)} cm
                  </span>
                </span>
                <span className="t-label text-[0.7rem]">{s.price || "—"}</span>
              </button>
            );
          })}
        </div>

        {PRINTS_CFG.paper && <p className="mt-5 text-sm text-bone/55">Paper: {PRINTS_CFG.paper}</p>}
        {PRINTS_CFG.note && <p className="mt-2 text-sm text-bone/55">{PRINTS_CFG.note}</p>}

        {ready ? (
          <>
            <a
              href={buyUrl(size.link, item.key)}
              className="t-label mt-8 inline-flex border border-[var(--tint)] px-6 py-4 text-[var(--tint)] transition-colors hover:bg-[var(--tint)] hover:text-ink"
            >
              Buy this print · {size.price} →
            </a>
            <p className="mt-3 text-sm text-bone/40">You pay on a secure Stripe page.</p>
          </>
        ) : (
          <p className="t-label mt-8 border border-line px-6 py-4 text-[0.7rem] text-bone/45">Checkout opens soon</p>
        )}

        <p className="mt-10">
          <TLink href={`/photo/selected-works/${item.project}`} className="t-label text-bone/60 hover:text-[var(--tint)]">
            ← Back to {item.projectTitle}
          </TLink>
        </p>
      </div>
    </div>
  );
}
