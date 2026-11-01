"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DISCIPLINES } from "@/lib/disciplines";
import { useReducedMotion } from "@/lib/hooks";
import { useSound } from "@/components/shell/SoundProvider";
import SoundToggle from "@/components/shell/SoundToggle";
import TLink from "@/components/shell/TLink";
import Dust from "./Dust";

type Stage = "boot" | "gate" | "reveal" | "hub";

export default function Landing() {
  const [stage, setStage] = useState<Stage>("boot");
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const { setEnabled, cue } = useSound();

  const root = useRef<HTMLDivElement>(null);
  const stageEl = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // Returning within the same visit: skip the ceremony, keep the destination.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("gabbra:entered") === "1";
    } catch {}
    setStage(seen ? "hub" : "gate");
  }, []);

  const enter = useCallback(
    (withSound: boolean) => {
      if (started.current) return;
      started.current = true;
      setEnabled(withSound);
      try {
        sessionStorage.setItem("gabbra:entered", "1");
      } catch {}
      setStage("reveal");
    },
    [setEnabled],
  );

  // The logo reveal: a diagonal wipe that follows the leg of the R.
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => () => void tlRef.current?.kill(), []);

  useLayoutEffect(() => {
    const hubItems = ".hub-item";
    if (stage === "hub" && !started.current) {
      gsap.set(stageEl.current, { "--p": 125 });
      gsap.fromTo(
        [hubItems, ".reveal-late"],
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power2.out" },
      );
      return;
    }
    if (stage !== "reveal") return;

    if (reduced) {
      gsap.set(stageEl.current, { "--p": 125 });
      gsap.fromTo(
        [".logo-img", hubItems, ".reveal-late"],
        { opacity: 0 },
        { opacity: 1, duration: 0.8, onComplete: () => setStage("hub") },
      );
      return;
    }

    {
      const tl = gsap.timeline({ onComplete: () => setStage("hub") });
      tlRef.current = tl;
      tl.to(".gate", { opacity: 0, duration: 0.6, ease: "power2.out" }, 0)
        .fromTo(".glow-base", { opacity: 0 }, { opacity: 1, duration: 2.4, ease: "power2.out" }, 0.2)
        .fromTo(
          stageEl.current,
          { "--p": -20 },
          { "--p": 125, duration: 2.1, ease: "power3.inOut" },
          0.5,
        )
        .fromTo(
          ".logo-img",
          { filter: "blur(14px)", scale: 1.07 },
          { filter: "blur(0px)", scale: 1, duration: 2.6, ease: "power3.out" },
          0.5,
        )
        .fromTo(".glint", { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.55)
        .to(".glint", { opacity: 0, duration: 0.5 }, 2.2)
        .fromTo(
          ".reveal-late",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" },
          2.1,
        )
        .fromTo(
          hubItems,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" },
          2.35,
        );
      cue("thud");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const ready = stage === "hub";

  return (
    <div
      ref={root}
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink"
      style={{ ["--tint" as string]: "#ecebe6" }}
    >
      {/* light */}
      <div className="glow-base pointer-events-none absolute inset-0 -z-10 opacity-0">
        <div
          className="absolute left-1/2 top-[34%] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(closest-side, rgba(236,235,230,.09), rgba(236,235,230,.03) 55%, transparent 100%)",
          }}
        />
        {DISCIPLINES.map((d) => (
          <div
            key={d.id}
            className="absolute left-1/2 top-[34%] h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700"
            style={{
              opacity: active === d.id ? 1 : 0,
              background: `radial-gradient(closest-side, ${d.tint}2e, ${d.tint}0d 55%, transparent 100%)`,
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Dust />
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 38%, transparent 35%, rgba(5,5,6,.85) 100%)",
        }}
      />

      {/* top bar — only once the hub is open */}
      <div
        className={`reveal-late relative z-10 flex items-center justify-between px-5 pt-5 opacity-0 md:px-10 md:pt-7 ${
          ready ? "" : "pointer-events-none"
        }`}
      >
        <span className="t-label text-steel">Reality, reframed.</span>
        <SoundToggle />
      </div>

      {/* logo */}
      <main id="main" className="relative z-10 flex flex-1 flex-col items-center justify-center px-5">
        <h1 className="sr-only">GabbRa — Photo, FPV, Film</h1>
        <div
          ref={stageEl}
          className="relative w-[min(86vw,1040px)]"
          style={{ ["--p" as string]: -20 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/gabbra-wordmark-alpha.png"
            alt=""
            width={1200}
            height={220}
            className="logo-img block h-auto w-full"
            style={{
              clipPath:
                "polygon(0 -10%, calc(var(--p) * 1%) -10%, calc(var(--p) * 1% + 14%) 110%, 0 110%)",
              opacity: stage === "boot" || stage === "gate" ? 0 : 1,
            }}
          />
          {/* the glint travels with the wipe edge */}
          <div
            aria-hidden
            className="glint pointer-events-none absolute left-0 top-0 h-full w-[2px] origin-top opacity-0"
            style={{
              left: "calc(var(--p) * 1%)",
              transform: "skewX(37deg)",
              background: "linear-gradient(180deg, transparent, #fff 20%, #fff 80%, transparent)",
              boxShadow: "0 0 24px 6px rgba(255,255,255,.35)",
            }}
          />
        </div>

        {/* a way to the person behind it all, set apart from the three destinations */}
        <TLink
          href="/artist"
          variant="fade"
          className="reveal-late group mt-10 flex w-full max-w-[24rem] items-center justify-between gap-6 border border-line px-5 py-4 opacity-0 transition-colors hover:border-[var(--tint)] focus-visible:border-[var(--tint)] md:mt-12"
          style={{ ["--tint" as string]: "#e6b980" }}
        >
          <span>
            <span className="t-label block text-[0.62rem] text-steel transition-colors group-hover:text-[var(--tint)]">
              The person behind it
            </span>
            <span className="t-wide mt-1.5 block text-[1.05rem] text-bone/90 transition-colors group-hover:text-[var(--tint)]">
              Who am I?
            </span>
          </span>
          <span aria-hidden className="t-label text-bone/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--tint)]">
            →
          </span>
        </TLink>
      </main>

      {/* hub */}
      <nav
        aria-label="Enter a section"
        className={`relative z-10 mx-auto w-full max-w-[1400px] px-5 pb-6 md:px-10 md:pb-9 ${
          ready ? "" : "pointer-events-none"
        }`}
      >
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {DISCIPLINES.map((d) => {
            const dim = active && active !== d.id;
            return (
              <li
                key={d.id}
                className="hub-item relative opacity-0"
                style={{ ["--tint" as string]: d.tint }}
              >
                <TLink
                  href={d.href}
                  onPointerEnter={() => setActive(d.id)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(d.id)}
                  onBlur={() => setActive(null)}
                  className={`group block border-t border-line px-1 py-5 transition-opacity duration-500 md:px-6 md:py-8 ${
                    dim ? "opacity-35" : "opacity-100"
                  }`}
                >
                  <span className="flex items-baseline justify-between">
                    <span className="t-label whitespace-nowrap text-steel transition-colors group-hover:text-[var(--tint)] group-focus-visible:text-[var(--tint)]">
                      {d.n} — {d.kicker}
                    </span>
                    <span
                      aria-hidden
                      className="t-label hidden translate-x-[-6px] text-[var(--tint)] opacity-0 lg:inline transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                    >
                      Enter →
                    </span>
                  </span>
                  <span className="t-wide mt-3 block text-[clamp(2.25rem,4.4vw,4rem)] text-bone transition-colors duration-500 group-hover:text-[var(--tint)] group-focus-visible:text-[var(--tint)]">
                    {d.label}
                  </span>
                  <span className="mt-3 block text-sm text-bone/55 md:mt-4">{d.line}</span>
                  <span
                    aria-hidden
                    className="mt-5 block h-px w-0 bg-[var(--tint)] transition-all duration-700 group-hover:w-full group-focus-visible:w-full"
                  />
                </TLink>
                {/* the slash: the R's diagonal, used as a divider */}
                {d.id !== "blog" && (
                  <span
                    aria-hidden
                    className="absolute right-0 top-6 hidden h-16 w-px origin-center -skew-x-[37deg] bg-line lg:block"
                  />
                )}
              </li>
            );
          })}
        </ul>
        <div className="reveal-late t-label mt-6 flex items-center justify-between text-steel opacity-0">
          <span>© GabbRa</span>
          <span className="flex gap-6">
            <TLink href="/about" variant="fade" className="hover:text-bone">
              About
            </TLink>
            <TLink href="/contact" variant="fade" className="hover:text-bone">
              Contact
            </TLink>
            <TLink href="/privacy" variant="fade" className="hover:text-bone">
              Privacy
            </TLink>
          </span>
        </div>
      </nav>

      {/* gate — browsers need a click before they will play sound, so it doubles as the opening shot */}
      {(stage === "gate" || stage === "reveal") && (
        <div
          className="gate absolute inset-0 z-20 flex flex-col items-center justify-center gap-10 bg-ink/40 px-6 text-center"
          style={{ pointerEvents: stage === "gate" ? "auto" : "none" }}
        >
          <p className="t-label text-steel">GabbRa · Photo / FPV / Film</p>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row">
            <button
              type="button"
              autoFocus
              onClick={() => enter(true)}
              className="t-label-lg border border-bone/40 px-8 py-4 text-bone transition-colors hover:border-bone hover:bg-bone hover:text-ink"
            >
              Enter — with sound
            </button>
            <button
              type="button"
              onClick={() => enter(false)}
              className="t-label-lg border border-transparent px-8 py-4 text-bone/60 transition-colors hover:text-bone"
            >
              Enter silent
            </button>
          </div>
          <p className="t-label max-w-xs text-bone/35">Best experienced full-screen, with headphones.</p>
        </div>
      )}
    </div>
  );
}
