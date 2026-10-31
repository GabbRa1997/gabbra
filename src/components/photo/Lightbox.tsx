"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Photo } from "@/lib/media";

/** Full-screen viewing: arrows, swipe, Esc, focus kept inside, focus returned on close. */
export default function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
  title,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
  title: string;
}) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const photo = photos[index];
  const go = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, photos.length, onIndex]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && root.current) {
        const f = [...root.current.querySelectorAll<HTMLElement>("button")];
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // preload the neighbours so arrow-keying is instant
  useEffect(() => {
    for (const d of [1, -1]) {
      const n = photos[(index + d + photos.length) % photos.length];
      const img = new Image();
      img.src = n.srcset[n.srcset.length - 1].url;
    }
  }, [index, photos]);

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, photograph ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[90] flex flex-col bg-ink/97"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <span className="t-label text-steel">
          {title} · {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </span>
        <button ref={closeBtn} type="button" onClick={onClose} className="t-label text-bone/80 hover:text-bone">
          Close ✕
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.srcset[photo.srcset.length - 1].url}
          srcSet={photo.srcset.map((s) => `${s.url} ${s.w}w`).join(", ")}
          sizes="100vw"
          alt={photo.alt}
          className="max-h-full max-w-full object-contain"
          style={{ backgroundColor: photo.color, backgroundImage: `url(${photo.blur})`, backgroundSize: "cover" }}
        />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photograph" className="t-label-lg absolute left-1 top-1/2 -translate-y-1/2 p-4 text-bone/70 hover:text-bone md:left-5">
              ←
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photograph" className="t-label-lg absolute right-1 top-1/2 -translate-y-1/2 p-4 text-bone/70 hover:text-bone md:right-5">
              →
            </button>
          </>
        )}
      </div>
      <p className="px-5 py-4 text-center text-sm text-bone/50 md:px-8">{photo.alt}</p>
    </div>
  );
}
