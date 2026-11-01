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

const AMBER = "#e6b980";
const IN_OUT = "cubic-bezier(0.76, 0, 0.24, 1)";
const OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Fine amber lines, the same family for every transition. */
const LINES = {
  whip: "repeating-linear-gradient(90deg, rgba(230,185,128,.12) 0 1px, transparent 1px 46px)",
  leader: "repeating-linear-gradient(0deg, rgba(230,185,128,.12) 0 1px, transparent 1px 46px)",
  iris: "repeating-radial-gradient(circle at 50% 50%, rgba(230,185,128,.14) 0 1px, transparent 1px 44px)",
};

/**
 * One overlay, three behaviours, all drawn with transforms only:
 *  iris   — a ringed disc opens from the centre, then closes back (Photo)
 *  whip   — a fast slanted pan with fine vertical lines (FPV)
 *  leader — a film-leader wipe with fine horizontal lines, drawn downwards (Film)
 *
 * They run as Web Animations, which the browser's compositor plays on its own, so
 * they stay smooth even while the next page (and its 3D scene) is busy loading.
 */
export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { cue } = useSound();

  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const pending = useRef<TransitionVariant | null>(null);
  const busy = useRef(false);
  const failsafe = useRef<number | null>(null);
  const gen = useRef(0);

  /** play one animation on an element; resolves when it ends, or never if it is replaced */
  const play = (el: HTMLElement, frames: Keyframe[], duration: number, easing: string, delay = 0) =>
    new Promise<boolean>((resolve) => {
      const a = el.animate(frames, { duration, easing, delay, fill: "both" });
      a.onfinish = () => resolve(true);
      a.oncancel = () => resolve(false);
    });

  const prep = (v: TransitionVariant) => {
    gen.current++;
    for (const el of [panel.current!, edge.current!, disc.current!]) el.getAnimations().forEach((a) => a.cancel());
    const o = overlay.current!;
    const pn = panel.current!;
    const ed = edge.current!;
    const dc = disc.current!;
    o.style.display = "block";
    const iris = v === "iris" && !reduced;
    pn.style.display = iris ? "none" : "block";
    dc.style.display = iris ? "block" : "none";
    pn.style.backgroundImage = !reduced && (v === "whip" || v === "leader") ? LINES[v] : "none";
    ed.style.opacity = "0";
    if (v === "whip") Object.assign(ed.style, { left: "0", right: "auto", top: "0", bottom: "0", width: "3px", height: "auto", background: AMBER });
    if (v === "leader") Object.assign(ed.style, { left: "0", right: "0", top: "auto", bottom: "0", width: "auto", height: "3px", background: AMBER });
    if (iris) {
      const d = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) * 1.06);
      Object.assign(dc.style, { width: `${d}px`, height: `${d}px`, marginLeft: `${-d / 2}px`, marginTop: `${-d / 2}px`, backgroundImage: LINES.iris });
    }
  };

  const cover = useCallback(
    (v: TransitionVariant) => {
      prep(v);
      const pn = panel.current!;
      const ed = edge.current!;
      const dc = disc.current!;
      if (reduced || v === "fade") return play(pn, [{ opacity: 0 }, { opacity: 1 }], 220, "linear").then(() => {});
      if (v === "iris") return play(dc, [{ transform: "scale(0)" }, { transform: "scale(1)" }], 520, IN_OUT).then(() => {});
      ed.style.opacity = "1";
      if (v === "whip")
        return play(pn, [{ transform: "translateX(105%) skewX(-14deg)" }, { transform: "translateX(0) skewX(0deg)" }], 440, "cubic-bezier(0.55, 0, 0.9, 0.35)").then(() => {});
      return play(pn, [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }], 520, IN_OUT).then(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced],
  );

  const uncover = useCallback(
    async (v: TransitionVariant) => {
      const mine = gen.current;
      const pn = panel.current!;
      const dc = disc.current!;
      let ok = true;
      if (reduced || v === "fade") ok = await play(pn, [{ opacity: 1 }, { opacity: 0 }], 260, "linear");
      else if (v === "iris") ok = await play(dc, [{ transform: "scale(1)" }, { transform: "scale(0)" }], 640, OUT, 60);
      else if (v === "whip")
        ok = await play(pn, [{ transform: "translateX(0) skewX(0deg)" }, { transform: "translateX(-105%) skewX(10deg)" }], 520, OUT, 40);
      else ok = await play(pn, [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], 620, IN_OUT, 80);
      // a newer transition took over: leave the overlay to it
      if (ok && mine === gen.current) overlay.current!.style.display = "none";
    },
     
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
      // start fetching the next page, and its 3D scene, while the overlay is still closing
      try {
        router.prefetch(href);
      } catch {}
      if (href.startsWith("/photo")) void import("@/components/scenes/photo/CameraScene");
      else if (href.startsWith("/fpv")) void import("@/components/scenes/fpv/DroneScene");
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
      <div ref={overlay} aria-hidden className="pointer-events-none fixed inset-0 z-[100] hidden overflow-hidden">
        <div ref={panel} className="absolute inset-0 bg-ink will-change-transform">
          <div ref={edge} className="absolute opacity-0" />
        </div>
        <div
          ref={disc}
          className="absolute left-1/2 top-1/2 hidden rounded-full border-2 bg-ink will-change-transform"
          style={{ borderColor: AMBER }}
        />
      </div>
    </Ctx.Provider>
  );
}
