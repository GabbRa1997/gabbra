"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TLink from "@/components/shell/TLink";
import { useReducedMotion } from "@/lib/hooks";
import { ALL_FILM_PROJECTS, FILM_SECTIONS } from "@/content/film";
import FilmStrips, { type StripApi, type StripItem } from "./FilmStrips";

export default function FilmHub() {
  const reduced = useReducedMotion();
  const api = useRef<StripApi | null>(null);
  const scrub = useRef<HTMLInputElement>(null);
  const scrubbing = useRef(false);
  const [chapter, setChapter] = useState<string | null>(null);

  const items: StripItem[] = useMemo(
    () =>
      ALL_FILM_PROJECTS.map((p, i) => ({
        key: `${p.section}-${p.slug}`,
        href: `/film/${p.section}/${p.slug}`,
        code: p.code,
        title: p.title,
        hue: 8 + ((i * 37) % 40),
        poster: p.poster,
        src: p.src,
      })),
    [],
  );

  // chapter n starts at its first frame in the strip
  const stops = FILM_SECTIONS.map((_, i) => (i * 3) / items.length);

  // the timeline thumb follows the strip as it travels
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const a = api.current;
      const el = scrub.current;
      if (a && el && !scrubbing.current) el.value = String(a.progress());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      className="relative isolate min-h-svh overflow-hidden bg-ink"
      style={{ ["--tint" as string]: "#e6b980" }}
    >
      {/* projector light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 72% 38%, rgba(230,185,128,.12), transparent 70%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(236,235,230,.06), transparent 70%)",
        }}
      />

      {/* desktop: strips travelling through space */}
      <FilmStrips items={items} reduced={reduced} apiRef={api} />

      {/* keep the words readable over the strips */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{ background: "linear-gradient(90deg, #050506 0%, rgba(5,5,6,.88) 26%, rgba(5,5,6,0) 58%), linear-gradient(0deg, #050506 0%, rgba(5,5,6,0) 22%), linear-gradient(180deg, #050506 0%, rgba(5,5,6,0) 16%)" }}
      />

      <div className="relative z-10 flex min-h-svh flex-col px-5 pb-8 pt-28 md:px-10 md:pt-32">
        <div className="max-w-[26rem]">
          <p className="t-label text-[var(--tint)]">03 / Film</p>
          <h1 className="t-wide mt-4 text-[clamp(2.25rem,5vw,4.25rem)]">Frames, in sequence.</h1>
          <p className="mt-4 max-w-sm text-sm text-bone/55">
            Story, emotion, movement and time. Drag the strip, or choose a reel.
          </p>
        </div>

        <nav aria-label="Film" className="mt-8 w-full max-w-[26rem] border-t border-line md:mt-10">
          <ul>
            {FILM_SECTIONS.map((s, i) => (
              <li key={s.slug} className="border-b border-line">
                <TLink
                  href={`/film/${s.slug}`}
                  onPointerEnter={() => {
                    setChapter(s.slug);
                    api.current?.setProgress(stops[i]);
                  }}
                  onPointerLeave={() => setChapter(null)}
                  onFocus={() => {
                    setChapter(s.slug);
                    api.current?.setProgress(stops[i]);
                  }}
                  onBlur={() => setChapter(null)}
                  className="group flex items-baseline gap-4 py-3.5"
                >
                  <span className="t-label w-6 text-steel">{s.n}</span>
                  <span className="flex flex-col">
                    <span className="t-wide text-[1.35rem] text-bone/85 transition-colors group-hover:text-[var(--tint)] group-focus-visible:text-[var(--tint)]">
                      {s.title}
                    </span>
                    <span className="mt-1 text-xs text-bone/40">{s.blurb}</span>
                  </span>
                  <span aria-hidden className="t-label ml-auto text-bone/0 transition-all group-hover:text-[var(--tint)] group-focus-visible:text-[var(--tint)]">
                    →
                  </span>
                </TLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* phone: the same four reels as a vertical strip you scroll through */}
        <ul className="mt-10 md:hidden" aria-label="Reels">
          {FILM_SECTIONS.map((s) => (
            <li key={s.slug} className="mb-4">
              <TLink href={`/film/${s.slug}`} className="relative flex bg-[#100d0c]">
                <span aria-hidden className="sprockets-y shrink-0" />
                <span className="relative flex-1 border-y border-bone/10 px-4 py-9">
                  <span className="t-label text-[0.62rem] text-film">{s.code} · {s.projects.length} {s.projects[0]?.placeholder ? "placeholder " : ""}project{s.projects.length === 1 ? "" : "s"}</span>
                  <span className="t-wide mt-3 block text-[1.6rem] text-bone">{s.title}</span>
                  <span className="mt-1 block text-sm text-bone/45">{s.blurb}</span>
                </span>
                <span aria-hidden className="sprockets-y shrink-0" />
              </TLink>
            </li>
          ))}
        </ul>

        <div className="mt-auto hidden pt-10 md:block">
          <div className="mx-auto max-w-[min(70rem,100%)]">
            <div className="flex items-center gap-5">
              <label htmlFor="film-timeline" className="t-label text-steel">
                Timeline
              </label>
              <input
                id="film-timeline"
                ref={scrub}
                type="range"
                min={0}
                max={1}
                step={0.001}
                defaultValue={0}
                aria-label="Scrub the film strip"
                onPointerDown={() => (scrubbing.current = true)}
                onPointerUp={() => (scrubbing.current = false)}
                onKeyDown={() => (scrubbing.current = true)}
                onKeyUp={() => (scrubbing.current = false)}
                onChange={(e) => api.current?.setProgress(parseFloat(e.target.value))}
                className="h-px flex-1 cursor-pointer appearance-none bg-bone/30 accent-[var(--tint)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[var(--tint)]"
              />
            </div>
            <ol className="relative mt-3 flex pl-[5.5rem]" aria-label="Chapters">
              {FILM_SECTIONS.map((s, i) => (
                <li key={s.slug} className="flex-1">
                  <button
                    type="button"
                    onClick={() => api.current?.setProgress(stops[i])}
                    className={`t-label border-l pl-3 text-left text-[0.62rem] transition-colors ${
                      chapter === s.slug ? "border-[var(--tint)] text-[var(--tint)]" : "border-line text-bone/40 hover:text-bone"
                    }`}
                  >
                    {s.code} · {s.title}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
