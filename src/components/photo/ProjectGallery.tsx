"use client";

import { useCallback, useState } from "react";
import Photograph from "@/components/media/Photograph";
import type { Photo } from "@/lib/media";
import Lightbox from "./Lightbox";

/** An immersive project: the first photograph runs wide, the rest fall into columns; any one opens full-screen. */
export default function ProjectGallery({ title, photos }: { title: string; photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const [hero, ...rest] = photos;

  const tile = (p: Photo, i: number, sizes: string, priority = false) => (
    <button
      key={p.id}
      type="button"
      onClick={() => setOpen(i)}
      aria-label={`Open photograph ${i + 1} of ${photos.length} full screen`}
      className="group relative block w-full cursor-zoom-in overflow-hidden"
      style={{ aspectRatio: `${p.w} / ${p.h}` }}
    >
      <Photograph photo={p} sizes={sizes} priority={priority} className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.015]" />
    </button>
  );

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {hero && tile(hero, 0, "(min-width: 1400px) 1320px, 100vw", true)}
        {rest.length > 0 && (
          <div className="columns-1 gap-4 sm:columns-2 md:gap-6 [&>*]:mb-4 md:[&>*]:mb-6 [&>*]:break-inside-avoid">
            {rest.map((p, i) => tile(p, i + 1, "(min-width: 640px) 50vw, 100vw"))}
          </div>
        )}
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onClose={close} onIndex={setOpen} title={title} />}
    </>
  );
}
