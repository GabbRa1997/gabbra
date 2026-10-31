"use client";

import { useEffect, useState } from "react";

/** Seconds since `active` became true; frozen at 0 when inactive. Runs one rAF loop per active consumer. */
export function useClock(active: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      setT(0);
    };
  }, [active]);
  return t;
}

/**
 * An academy-style film leader: the honest stand-in for footage that does not
 * exist yet. A sweep, a countdown, a circle and a cross; nothing pretending to be a film.
 */
export default function Leader({
  t,
  label = "Placeholder · no footage yet",
  compact = false,
}: {
  t: number;
  label?: string;
  compact?: boolean;
}) {
  const sweep = (t % 1) * 360;
  const count = 8 - (Math.floor(t) % 7); // 8 … 2
  const flicker = 0.94 + 0.06 * Math.sin(t * 41);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0b0b0d]" style={{ opacity: flicker }}>
      <div
        className="absolute inset-0"
        style={{ background: `conic-gradient(from -90deg at 50% 50%, rgba(236,235,230,.13) ${sweep}deg, transparent ${sweep}deg)` }}
      />
      <div className="absolute left-0 top-1/2 h-px w-full bg-bone/20" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-bone/20" />
      <div className="absolute left-1/2 top-1/2 aspect-square h-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-bone/40" />
      <div className="absolute left-1/2 top-1/2 aspect-square h-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-bone/25" />
      <div
        className="t-wide absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 tabular-nums text-bone/85"
        style={{ fontSize: compact ? "clamp(1.6rem, 4vw, 3rem)" : "clamp(3rem, 12vw, 9rem)" }}
      >
        {count}
      </div>
      <p className="t-label absolute bottom-3 left-4 text-[0.6rem] text-film">{label}</p>
      {!compact && (
        <p className="t-label absolute bottom-3 right-4 text-[0.6rem] text-bone/40 tabular-nums">
          {timecode(t)}
        </p>
      )}
    </div>
  );
}

/** 24 frames per second timecode, HH:MM:SS:FF. */
export function timecode(sec: number) {
  const total = Math.max(0, sec);
  const f = Math.floor((total % 1) * 24);
  const s = Math.floor(total) % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}:${p(f)}`;
}
