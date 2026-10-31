"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Leader, { timecode } from "./Leader";

interface Props {
  title: string;
  code: string;
  /** real footage; when absent the player runs the leader placeholder on a simulated clock */
  src?: string;
  poster?: string;
  /** length of the placeholder reel, in seconds */
  duration?: number;
}

/**
 * Cinematic 2.39:1 player with true full-screen, a scrubbable timeline and
 * keyboard control (Space/K play, F full-screen, M mute, ←/→ seek 5 s).
 * It works the same with or without footage, so Stage 6 only has to supply `src`.
 */
export default function FilmPlayer({ title, code, src, poster, duration = 96 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const tRef = useRef(0);
  const hideTimer = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(duration);
  const [muted, setMuted] = useState(false);
  const [full, setFull] = useState(false);
  const [ui, setUi] = useState(true);

  // simulated clock for the placeholder reel
  useEffect(() => {
    if (!playing || src) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      tRef.current += (now - last) / 1000;
      last = now;
      if (tRef.current >= dur) {
        tRef.current = 0;
        setPlaying(false);
      }
      setT(tRef.current);
      if (tRef.current !== 0) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, src, dur]);

  const toggle = useCallback(() => {
    if (src && video.current) {
      if (video.current.paused) void video.current.play();
      else video.current.pause();
    }
    setPlaying((p) => !p);
  }, [src]);

  const seek = useCallback(
    (to: number) => {
      const v = Math.max(0, Math.min(dur, to));
      tRef.current = v;
      setT(v);
      if (src && video.current) video.current.currentTime = v;
    },
    [dur, src],
  );

  const toggleFull = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el.requestFullscreen) void el.requestFullscreen();
    else (video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)?.webkitEnterFullscreen?.();
  }, []);

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // controls fade away while playing, and return on any movement
  const wake = useCallback(() => {
    setUi(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setUi(false), 2600);
  }, []);
  useEffect(() => {
    if (!playing) {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      setUi(true);
    } else wake();
  }, [playing, wake]);

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT" && e.key !== "f" && e.key !== "m") return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "f") toggleFull();
    else if (e.key === "m") setMuted((m) => !m);
    else if (e.key === "ArrowRight") seek(tRef.current + 5);
    else if (e.key === "ArrowLeft") seek(tRef.current - 5);
    wake();
  };

  const showUi = ui || !playing;

  return (
    <div
      ref={wrap}
      role="group"
      aria-label={`${title} video player`}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerMove={wake}
      className="group/player relative w-full overflow-hidden bg-black outline-offset-4"
      style={{ aspectRatio: full ? undefined : "2.39 / 1", height: full ? "100%" : undefined, cursor: playing && !ui ? "none" : undefined }}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="relative w-full" style={{ aspectRatio: "2.39 / 1", maxHeight: "100%" }}>
          {src ? (
            <video
              ref={video}
              src={src}
              poster={poster}
              muted={muted}
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-contain"
              onClick={toggle}
              onTimeUpdate={(e) => {
                tRef.current = e.currentTarget.currentTime;
                setT(e.currentTarget.currentTime);
              }}
              onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={toggle} className="absolute inset-0 block h-full w-full cursor-pointer">
              <Leader t={playing || t > 0 ? t : 0} label={`${code} · Placeholder reel · no footage yet`} />
            </button>
          )}
        </div>
      </div>

      {!playing && t === 0 && (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Play ${title}`}
          className="t-label-lg absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-bone/50 bg-ink/40 px-7 py-4 text-bone backdrop-blur-sm transition-colors hover:border-film hover:bg-film hover:text-bone"
        >
          ▶ Play
        </button>
      )}

      {/* controls */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center gap-4 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 transition-opacity duration-500 md:gap-6 md:px-6 ${
          showUi ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="t-label-lg w-8 text-bone hover:text-film">
          {playing ? "❚❚" : "▶"}
        </button>
        <span className="t-label hidden tabular-nums text-bone/70 sm:inline">{timecode(t)}</span>
        <input
          type="range"
          min={0}
          max={dur}
          step={0.1}
          value={t}
          onChange={(e) => seek(parseFloat(e.target.value))}
          aria-label="Seek"
          className="h-px flex-1 cursor-pointer appearance-none bg-bone/30 accent-[#e6b980] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-film"
        />
        <span className="t-label hidden tabular-nums text-bone/40 sm:inline">{timecode(dur)}</span>
        {src && (
          <button type="button" onClick={() => setMuted((m) => !m)} aria-pressed={muted} className="t-label text-bone/70 hover:text-bone">
            {muted ? "Unmute" : "Mute"}
          </button>
        )}
        <button type="button" onClick={toggleFull} aria-pressed={full} className="t-label text-bone/70 hover:text-bone">
          {full ? "Exit full screen" : "Full screen"}
        </button>
      </div>
    </div>
  );
}
