"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import TLink from "@/components/shell/TLink";
import Leader, { useClock } from "./Leader";

export interface StripItem {
  key: string;
  href: string;
  code: string;
  title: string;
  hue: number;
  poster?: string;
  src?: string;
}

/** What the page can ask of the strips (for the timeline and the chapter list). */
export interface StripApi {
  progress: () => number;
  setProgress: (p: number) => void;
  setHover: (on: boolean) => void;
}

const SETS = 3; // each strip renders its frames three times so it can loop without a seam
const SPEED = [34, -24, 20]; // px/s at rest; the strips drift in opposing directions
const COUPLE = [1, -0.8, 0.6]; // how strongly a drag or a wheel push moves each strip
const rotate = <T,>(a: T[], n: number) => [...a.slice(n % a.length), ...a.slice(0, n % a.length)];

function Frame({ item, hidden, onHover }: { item: StripItem; hidden: boolean; onHover: (on: boolean) => void }) {
  const [active, setActive] = useState(false);
  const t = useClock(active);
  return (
    <TLink
      href={item.href}
      tabIndex={-1}
      aria-hidden={hidden || undefined}
      aria-label={item.src ? item.title : `${item.title} (placeholder)`}
      draggable={false}
      onPointerEnter={() => {
        setActive(true);
        onHover(true);
      }}
      onPointerLeave={() => {
        setActive(false);
        onHover(false);
      }}
      className="group relative block shrink-0 overflow-hidden border border-bone/10"
      style={{
        width: "clamp(260px, 22vw, 400px)",
        aspectRatio: "2.39 / 1",
        background: `linear-gradient(135deg, hsl( 22% 19%), hsl(${item.hue + 24} 18% 10%))`,
      }}
    >
      {item.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.poster} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {active && item.src ? (
        <video src={item.src} autoPlay muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        active && <Leader t={t} compact label="Preview · placeholder" />
      )}
      <span className="t-label absolute left-3 top-2.5 text-[0.6rem] text-bone/55">{item.code}</span>
      <span className="t-label absolute bottom-2.5 left-3 text-[0.6rem] text-bone/35 transition-colors group-hover:text-film">
        {item.title}
      </span>
    </TLink>
  );
}

function StripRow({
  items,
  index,
  setRef,
  onHover,
}: {
  items: StripItem[];
  index: number;
  setRef: (i: number, el: HTMLDivElement | null) => void;
  onHover: (on: boolean) => void;
}) {
  const seq = Array.from({ length: SETS }, () => items).flat();
  return (
    <div
      className="relative overflow-hidden bg-[#100d0c] py-0"
      style={{ transform: `translateZ(${-index * 150}px)`, marginBottom: 34 }}
    >
      <div className="sprockets-x" />
      <div ref={(el) => setRef(index, el)} className="flex gap-3 py-2.5 will-change-transform">
        {seq.map((it, i) => (
          <Frame key={`${it.key}-${i}`} item={it} hidden={i >= items.length} onHover={onHover} />
        ))}
      </div>
      <div className="sprockets-x" />
    </div>
  );
}

/**
 * Three film strips travelling through a slanted, perspective space.
 * Drag, wheel or arrow-scrub to push them; they coast on, then settle back to drift.
 */
export default function FilmStrips({
  items,
  reduced,
  apiRef,
}: {
  items: StripItem[];
  reduced: boolean;
  apiRef: MutableRefObject<StripApi | null>;
}) {
  const scene = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const widths = useRef([1, 1, 1]);
  const pos = useRef([0, 0, 0]);
  const boost = useRef(0);
  const hovering = useRef(false);

  const rowItems = [items, [...items].reverse(), rotate(items, 5)];

  const setRef = (i: number, el: HTMLDivElement | null) => {
    rows.current[i] = el;
  };

  // measure one set's width, so wrapping lands exactly on a repeat
  useLayoutEffect(() => {
    const measure = () => {
      rows.current.forEach((el, i) => {
        if (el) widths.current[i] = Math.max(1, el.scrollWidth / SETS);
      });
    };
    measure();
    pos.current = [widths.current[0] * 0.12, widths.current[1] * 0.4, widths.current[2] * 0.25];
    const ro = new ResizeObserver(measure);
    rows.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    apiRef.current = {
      progress: () => pos.current[0] / widths.current[0],
      setProgress: (p) => {
        pos.current[0] = (((p % 1) + 1) % 1) * widths.current[0];
        boost.current = 0;
      },
      setHover: (on) => {
        hovering.current = on;
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  // the motion: one ticker, three translations
  useEffect(() => {
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 64) / 1000;
      boost.current *= Math.exp(-2.4 * dt);
      const calm = reduced ? 0 : hovering.current ? 0.1 : 1;
      for (let i = 0; i < 3; i++) {
        const w = widths.current[i];
        pos.current[i] = (((pos.current[i] + (SPEED[i] * calm + boost.current * COUPLE[i]) * dt) % w) + w) % w;
        const el = rows.current[i];
        if (el) el.style.transform = `translate3d(${-pos.current[i]}px,0,0)`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [reduced]);

  // pushing the strips: wheel, drag, and arrow keys on the page
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const push = (v: number) => {
      boost.current = Math.max(-2400, Math.min(2400, boost.current + v));
    };
    const onWheel = (e: WheelEvent) => push((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 1.4);

    let drag: { x: number; t: number; v: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a") && e.pointerType === "mouse") return; // let frames be clicked
      drag = { x: e.clientX, t: performance.now(), v: 0 };
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const now = performance.now();
      const dx = e.clientX - drag.x;
      for (let i = 0; i < 3; i++) pos.current[i] -= dx * COUPLE[i];
      drag.v = (dx / Math.max(1, now - drag.t)) * 1000;
      drag.x = e.clientX;
      drag.t = now;
    };
    const onUp = () => {
      if (drag) boost.current = -drag.v;
      drag = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") push(700);
      if (e.key === "ArrowLeft") push(-700);
    };

    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const onHover = (on: boolean) => {
    hovering.current = on;
  };

  return (
    <div
      ref={scene}
      aria-hidden
      className="absolute inset-0 hidden cursor-grab touch-pan-y select-none active:cursor-grabbing md:block"
      style={{ perspective: "1500px", perspectiveOrigin: "68% 42%" }}
    >
      <div
        className="absolute -left-[6%] top-[9%] w-[124%]"
        style={{ transformStyle: "preserve-3d", transform: "rotateX(15deg) rotateY(-24deg) rotateZ(-7deg)" }}
      >
        {rowItems.map((its, i) => (
          <StripRow key={i} items={its} index={i} setRef={setRef} onHover={onHover} />
        ))}
      </div>
    </div>
  );
}
