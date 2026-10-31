"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from "react";
import TLink from "@/components/shell/TLink";
import { useSound } from "@/components/shell/SoundProvider";
import { detectQuality, useMediaQuery, useReducedMotion, type Quality } from "@/lib/hooks";
import type { SceneProps } from "@/components/scenes/shared/ExplodedScene";
import type { PartInfo, SceneState } from "@/components/scenes/shared/sceneContext";

export interface ExplodeSection {
  slug: string;
  n: string;
  title: string;
  /** the part that opens this section */
  part: string;
}

export interface ExplodeConfig {
  tint: string;
  eyebrow: string;
  title: string;
  intro: string;
  /** e.g. "/photo" */
  hrefBase: string;
  sections: ExplodeSection[];
  sectionsLabel: string;
  parts: PartInfo[];
  groups: readonly string[];
  Scene: ComponentType<SceneProps>;
  ariaLabel: string;
  inspectText: string;
  modelNote: string;
  /** CSS background for the atmosphere behind the 3D */
  atmosphere: string;
  /** shown if 3D cannot run */
  fallbackNote: string;
}

export function SceneLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="t-label animate-pulse text-steel">{label}</span>
    </div>
  );
}

export default function ExplodeExperience({ config: c }: { config: ExplodeConfig }) {
  const reduced = useReducedMotion();
  const portrait = useMediaQuery("(max-width: 767px)");
  const { cue } = useSound();
  const [quality, setQuality] = useState<Quality | "pending">("pending");
  const [amount, setAmount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [spin, setSpin] = useState(true);
  const tip = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const state = useRef<SceneState>({
    t: 0,
    target: 0,
    selected: null,
    hovered: null,
    reduced: false,
    autoRotate: true,
  });

  const byId = useMemo(() => Object.fromEntries(c.parts.map((p, i) => [p.id, { p, i }])), [c.parts]);
  const Scene = c.Scene;

  useEffect(() => setQuality(detectQuality()), []);
  useEffect(() => void (state.current.reduced = reduced), [reduced]);
  useEffect(() => void (state.current.target = amount), [amount]);
  useEffect(() => void (state.current.selected = selected), [selected]);
  useEffect(() => void (state.current.hovered = hovered), [hovered]);
  useEffect(() => void (state.current.autoRotate = spin), [spin]);

  const select = useCallback(
    (id: string | null) => {
      setSelected(id);
      if (id) {
        cue("tick");
        setAmount((a) => (a < 0.6 ? 1 : a)); // you cannot inspect the inside of a closed machine
      }
    },
    [cue],
  );

  // choosing from the list on a phone brings the 3D view back into sight
  const pickFromList = (id: string | null) => {
    select(id);
    if (id && portrait) stage.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  // Escape closes the inspection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const exploded = amount > 0.5;
  const part = selected ? byId[selected]?.p : null;
  const section = part?.section ? c.sections.find((s) => s.slug === part.section) : undefined;
  const hoverPart = hovered ? byId[hovered]?.p : null;
  const num = (id: string) => String(byId[id].i + 1).padStart(2, "0");

  const onMove = (e: React.PointerEvent) => {
    if (tip.current) tip.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 16}px)`;
  };

  const toggle = () => {
    setAmount(exploded ? 0 : 1);
    cue("whoosh");
  };

  return (
    <section
      className="relative bg-ink md:h-svh md:overflow-hidden"
      style={{ ["--tint" as string]: c.tint } as CSSProperties}
      onPointerMove={onMove}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: c.atmosphere }} />

      {/* the stage */}
      <div
        ref={stage}
        className="relative h-[64svh] w-full md:absolute md:inset-0 md:h-auto"
        role="application"
        aria-label={c.ariaLabel}
      >
        {quality === "pending" && <SceneLoading />}
        {(quality === "full" || quality === "lite") && (
          <Scene
            quality={quality}
            portrait={portrait}
            state={state}
            onSelect={select}
            onHover={setHovered}
            onMissed={() => setSelected(null)}
          />
        )}
        {quality === "none" && <NoWebGL config={c} />}

        {/* phone: the controls and the description live on the stage itself, not at the foot of the page */}
        {(quality === "full" || quality === "lite") && (
          <>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={exploded}
              className="t-label absolute right-3 top-[4.6rem] z-20 border border-bone/40 bg-ink/70 px-4 py-2.5 text-bone backdrop-blur-sm md:hidden"
            >
              {exploded ? "Assemble" : "Disassemble"}
            </button>

            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 md:hidden" aria-live="polite">
              {part ? (
                <div className="pointer-events-auto max-h-[34svh] overflow-y-auto border border-line bg-ink/90 p-4 backdrop-blur-md">
                  <p className="t-label flex items-center justify-between text-[0.62rem] text-steel">
                    <span>
                      {num(part.id)} / {c.parts.length} · {part.group}
                    </span>
                    <button type="button" onClick={() => setSelected(null)} aria-label="Close description" className="-mr-2 px-2 py-1 text-bone/70">
                      ✕
                    </button>
                  </p>
                  <h2 className="t-wide mt-1.5 text-[1.25rem] text-[var(--tint)]">{part.name}</h2>
                  <p className="t-label mt-1 text-[0.62rem] text-bone/45">{part.role}</p>
                  <p className="mt-2.5 text-[0.82rem] leading-relaxed text-bone/75">{part.function}</p>
                  {part.spec && <p className="t-label mt-3 border-t border-line pt-2.5 text-[0.62rem] text-bone/60">{part.spec}</p>}
                  {section && (
                    <TLink
                      href={`${c.hrefBase}/${section.slug}`}
                      className="t-label mt-3 inline-flex border border-[var(--tint)] px-3.5 py-2.5 text-[var(--tint)]"
                    >
                      Enter {section.title} →
                    </TLink>
                  )}
                </div>
              ) : (
                <p className="mx-auto flex w-fit items-center gap-3 border border-line bg-ink/75 px-4 py-2.5 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--tint)] opacity-60" />
                    <span className="relative h-2 w-2 rounded-full bg-[var(--tint)]" />
                  </span>
                  <span className="t-label text-[0.62rem] text-bone/75">
                    {exploded ? "Tap any part to inspect it" : "Disassemble, then tap a part"}
                  </span>
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* hover label */}
      <div
        ref={tip}
        aria-hidden
        className="t-label pointer-events-none fixed left-0 top-0 z-30 hidden whitespace-nowrap border border-line bg-ink/85 px-3 py-2 text-bone backdrop-blur md:block"
        style={{ opacity: hoverPart && !portrait ? 1 : 0, transition: "opacity .15s" }}
      >
        {hoverPart ? `${num(hoverPart.id)} · ${hoverPart.name}` : ""}
      </div>

      {/* interface */}
      <div className="relative z-10 md:pointer-events-none md:absolute md:inset-0 md:grid md:grid-cols-[minmax(0,25rem)_1fr_minmax(0,23rem)] md:grid-rows-[1fr_auto] md:gap-x-10 md:px-10 md:pb-9 md:pt-28">
        {/* left: title + the four ways in */}
        <div className="px-5 pt-8 md:pointer-events-auto md:row-span-2 md:flex md:min-h-0 md:flex-col md:px-0 md:pt-0">
          <p className="t-label text-[var(--tint)]">{c.eyebrow}</p>
          <h1 className="t-wide mt-4 text-[clamp(2.25rem,5vw,4.25rem)]">{c.title}</h1>
          <p className="mt-4 max-w-sm text-sm text-bone/55">{c.intro}</p>

          <nav aria-label={c.sectionsLabel} className="mt-8 border-t border-line">
            <ul>
              {c.sections.map((s) => (
                <li key={s.slug} className="border-b border-line">
                  <TLink
                    href={`${c.hrefBase}/${s.slug}`}
                    onPointerEnter={() => setHovered(s.part)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(s.part)}
                    onBlur={() => setHovered(null)}
                    className="group flex items-baseline gap-4 py-3.5"
                  >
                    <span className="t-label w-6 text-steel">{s.n}</span>
                    <span className="t-wide text-[1.35rem] text-bone/85 transition-colors group-hover:text-[var(--tint)] group-focus-visible:text-[var(--tint)]">
                      {s.title}
                    </span>
                    <span aria-hidden className="t-label ml-auto text-bone/0 transition-all group-hover:text-[var(--tint)] group-focus-visible:text-[var(--tint)]">
                      →
                    </span>
                  </TLink>
                </li>
              ))}
            </ul>
          </nav>

          <details className="group mt-6 min-h-0 flex-1 md:overflow-hidden" open={!portrait}>
            <summary className="t-label cursor-pointer list-none text-steel hover:text-bone">
              <span aria-hidden className="mr-3 inline-block transition-transform group-open:rotate-90">▸</span>
              Components · {c.parts.length}
            </summary>
            <div className="mt-4 max-h-[22svh] overflow-y-auto pr-2 md:max-h-[calc(100svh-30rem)]">
              {c.groups.map((g) => (
                <div key={g} className="mb-4">
                  <p className="t-label mb-2 text-bone/30">{g}</p>
                  <ul>
                    {c.parts
                      .filter((p) => p.group === g)
                      .map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => pickFromList(selected === p.id ? null : p.id)}
                            onPointerEnter={() => setHovered(p.id)}
                            onPointerLeave={() => setHovered(null)}
                            aria-pressed={selected === p.id}
                            className={`flex w-full items-baseline gap-3 py-1.5 text-left text-sm transition-colors ${
                              selected === p.id ? "text-[var(--tint)]" : "text-bone/55 hover:text-bone"
                            }`}
                          >
                            <span className="t-label w-6 text-[0.62rem] text-bone/30">{num(p.id)}</span>
                            {p.name}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* right: what you are looking at */}
        <aside
          aria-live="polite"
          className="hidden border border-line bg-ink/70 p-5 backdrop-blur-sm md:pointer-events-auto md:col-start-3 md:row-span-1 md:row-start-1 md:block md:self-start"
        >
          {part ? (
            <div>
              <p className="t-label flex justify-between text-steel">
                <span>
                  {num(part.id)} / {c.parts.length} · {part.group}
                </span>
                <button type="button" onClick={() => setSelected(null)} className="hover:text-bone">
                  Close ✕
                </button>
              </p>
              <h2 className="t-wide mt-3 text-[1.6rem] text-[var(--tint)]">{part.name}</h2>
              <p className="t-label mt-2 text-bone/45">{part.role}</p>
              <p className="mt-4 text-sm leading-relaxed text-bone/75">{part.function}</p>
              {part.spec && <p className="t-label mt-4 border-t border-line pt-3 text-bone/60">{part.spec}</p>}
              {section && (
                <TLink
                  href={`${c.hrefBase}/${section.slug}`}
                  className="t-label mt-5 inline-flex items-center gap-3 border border-[var(--tint)] px-4 py-3 text-[var(--tint)] transition-colors hover:bg-[var(--tint)] hover:text-ink"
                >
                  Enter {section.title} →
                </TLink>
              )}
              <label className="t-label mt-5 flex cursor-pointer items-center gap-3 text-steel">
                <input type="checkbox" checked={spin} onChange={(e) => setSpin(e.target.checked)} className="accent-[var(--tint)]" />
                Slow turn
              </label>
            </div>
          ) : (
            <div>
              <p className="t-label text-steel">Inspect</p>
              <p className="mt-3 text-sm leading-relaxed text-bone/65">{c.inspectText}</p>
              <p className="t-label mt-4 text-bone/30">{c.modelNote}</p>
            </div>
          )}
        </aside>

        {/* bottom: the one control that matters */}
        <div className="pointer-events-none flex flex-col items-stretch gap-4 px-5 pb-10 pt-6 md:col-start-2 md:row-start-2 md:items-center md:px-0 md:pb-0 md:pt-0">
          <div className="pointer-events-auto flex flex-col items-stretch gap-4 md:w-[min(34rem,100%)] md:flex-row md:items-center md:gap-6 md:bg-ink/55 md:px-5 md:py-3 md:backdrop-blur-sm">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={exploded}
              className="t-label-lg shrink-0 border border-bone/40 px-6 py-3.5 text-bone transition-colors hover:border-[var(--tint)] hover:bg-[var(--tint)] hover:text-ink"
            >
              {exploded ? "Assemble" : "Disassemble"}
            </button>
            <label className="flex flex-1 items-center gap-4">
              <span className="t-label text-steel">Explode</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                aria-label="Explosion amount"
                className="h-px w-full flex-1 cursor-pointer appearance-none bg-bone/30 accent-[var(--tint)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--tint)]"
              />
            </label>
          </div>
          <p className="t-label hidden text-center text-bone/30 md:block">
            Drag to orbit · Scroll to zoom · Click a component · Esc to release
          </p>
        </div>
      </div>
    </section>
  );
}

/** A real fallback, not a blank box: the same content as a technical sheet. */
function NoWebGL({ config: c }: { config: ExplodeConfig }) {
  const byGroup = useMemo(() => c.groups.map((g) => [g, c.parts.filter((p) => p.group === g)] as const), [c]);
  return (
    <div className="h-full overflow-y-auto px-5 pb-10 pt-28 md:px-10">
      <p className="t-label text-steel">{c.fallbackNote}</p>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        {byGroup.map(([g, list]) => (
          <section key={g}>
            <h2 className="t-label mb-3 text-[var(--tint)]">{g}</h2>
            <dl className="divide-y divide-line border-y border-line">
              {list.map((p) => (
                <div key={p.id} className="py-3">
                  <dt className="text-bone">{p.name}</dt>
                  <dd className="mt-1 text-sm text-bone/55">{p.function}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
