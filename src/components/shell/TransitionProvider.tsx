"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import gsap from "gsap";
import { useSound } from "./SoundProvider";
import { useReducedMotion } from "@/lib/hooks";

export type TransitionVariant = "iris" | "whip" | "leader" | "fade";

interface TransitionApi {
  go: (href: string, variant?: TransitionVariant) => void;
}
const Ctx = createContext<TransitionApi>({ go: () => {} });
export const useTransitionNav = () => useContext(Ctx);

export function variantFor(href: string): TransitionVariant {
  if (href.startsWith("/photo")) return "iris";
  if (href.startsWith("/fpv")) return "whip";
  if (href.startsWith("/film")) return "leader";
  return "fade";
}

const TINT: Record<TransitionVariant, string> = {
  iris: "#e6b980",
  whip: "#e6b980",
  leader: "#e6b980",
  fade: "#ecebe6",
};

/**
 * One overlay, three behaviours:
 *  iris   — aperture closes, then opens on the new page (Photo)
 *  whip   — a fast slanted pan across the frame (FPV)
 *  leader — a film-leader wipe with a red edge (Film)
 */
export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { cue } = useSound();

  const overlay = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const pending = useRef<TransitionVariant | null>(null);
  const busy = useRef(false);
  const failsafe = useRef<number | null>(null);

  const prep = (v: TransitionVariant) => {
    const el = overlay.current!;
    const ed = edge.current!;
    gsap.killTweensOf([el, ed]);
    gsap.set(el, {
      display: "block",
      clearProps: "transform,clipPath,opacity,maskImage,webkitMaskImage",
    });
    gsap.set(ed, { opacity: 0, background: TINT[v] });
    el.style.backgroundImage = "none";
    el.dataset.variant = v;
  };

  const cover = useCallback(
    (v: TransitionVariant) =>
      new Promise<void>((resolve) => {
        const el = overlay.current!;
        const ed = edge.current!;
        prep(v);
        if (reduced || v === "fade") {
          gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, onComplete: resolve });
          return;
        }
        if (v === "iris") {
          const mask = "radial-gradient(circle at 50% 50%, transparent calc(var(--r) * 1vmax), #000 calc(var(--r) * 1vmax + 1px))";
          el.style.maskImage = mask;
          el.style.webkitMaskImage = mask;
          gsap.fromTo(
            el,
            { "--r": 80 },
            { "--r": 0, duration: 0.8, ease: "power3.inOut", onComplete: resolve },
          );
        } else if (v === "whip") {
          el.style.backgroundImage =
            "repeating-linear-gradient(90deg, rgba(230,185,128,.10) 0 2px, transparent 2px 46px)";
          gsap.set(ed, { opacity: 1, left: 0, right: "auto", width: 3, top: 0, bottom: 0, height: "auto" });
          gsap.fromTo(
            el,
            { xPercent: 105, skewX: -14 },
            { xPercent: 0, skewX: 0, duration: 0.5, ease: "power3.in", onComplete: resolve },
          );
        } else {
          gsap.set(ed, { opacity: 1, left: 0, right: 0, width: "auto", height: 3, bottom: 0, top: "auto" });
          gsap.fromTo(
            el,
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", duration: 0.65, ease: "power3.inOut", onComplete: resolve },
          );
        }
      }),
    [reduced],
  );

  const uncover = useCallback(
    (v: TransitionVariant) =>
      new Promise<void>((resolve) => {
        const el = overlay.current!;
        const done = () => {
          gsap.set(el, { display: "none" });
          resolve();
        };
        if (reduced || v === "fade") {
          gsap.to(el, { opacity: 0, duration: 0.3, onComplete: done });
          return;
        }
        if (v === "iris") {
          gsap.to(el, { "--r": 80, duration: 0.95, ease: "power3.inOut", delay: 0.1, onComplete: done });
        } else if (v === "whip") {
          gsap.to(el, { xPercent: -105, skewX: 10, duration: 0.55, ease: "power3.out", delay: 0.05, onComplete: done });
        } else {
          gsap.to(el, { clipPath: "inset(100% 0 0% 0)", duration: 0.8, ease: "power3.inOut", delay: 0.15, onComplete: done });
        }
      }),
    [reduced],
  );

  const go = useCallback(
    (href: string, variant?: TransitionVariant) => {
      if (busy.current) return;
      const here = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
      if (href === here) return;
      const v = variant ?? variantFor(href);
      busy.current = true;
      pending.current = v;
      cue(v === "iris" ? "shutter" : v === "whip" ? "whoosh" : v === "leader" ? "thud" : "tick");
      void cover(v).then(() => router.push(href));
      // If navigation never lands, never leave the visitor staring at black.
      failsafe.current = window.setTimeout(() => {
        if (pending.current) {
          const p = pending.current;
          pending.current = null;
          void uncover(p).then(() => (busy.current = false));
        }
      }, 5000);
    },
    [cover, uncover, cue, pathname, router],
  );

  // Route changed: open the overlay again.
  useEffect(() => {
    const v = pending.current;
    if (!v) return;
    pending.current = null;
    if (failsafe.current) window.clearTimeout(failsafe.current);
    // The new page is here: let the visitor navigate again straight away,
    // even while the overlay is still opening (a new transition takes over).
    busy.current = false;
    const raf = requestAnimationFrame(() => {
      void uncover(v);
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, uncover]);

  const value = useMemo(() => ({ go }), [go]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        ref={overlay}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] hidden bg-ink"
      >
        <div ref={edge} className="absolute opacity-0" />
      </div>
    </Ctx.Provider>
  );
}
