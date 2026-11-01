"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DISCIPLINES, breadcrumbFromPath, disciplineFromPath } from "@/lib/disciplines";
import SoundToggle from "./SoundToggle";
import TLink from "./TLink";

const EXTRA = [
  { label: "About GabbRa", href: "/about" },
  { label: "Who am I?", href: "/artist" },
  { label: "Contact / Commissions", href: "/contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const here = disciplineFromPath(pathname);
  const crumbs = breadcrumbFromPath(pathname);
  // one step up: a project goes back to its section, a section to its discipline, the rest to the start
  const parts = pathname.split("/").filter(Boolean);
  const backHref = parts.length > 1 ? `/${parts.slice(0, -1).join("/")}` : "/";

  // The landing page is its own experience and carries its own chrome.
  const hidden = pathname === "/";

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (hidden) return null;

  return (
    <>
      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between px-5 pt-5 md:px-10 md:pt-7"
        style={{ ["--tint" as string]: here?.tint ?? "#ecebe6" }}
      >
        <div className="pointer-events-auto">
          <TLink href="/" variant="fade" aria-label="GabbRa — return to the main experience">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/gabbra-wordmark-alpha.png"
              alt="GabbRa"
              width={1200}
              height={220}
              className="h-5 w-auto md:h-6"
            />
          </TLink>
          <div className="mt-3 flex items-center gap-4">
            <TLink
              href={backHref}
              variant="fade"
              aria-label={parts.length > 1 ? "Back one level" : "Back to the main experience"}
              className="t-label flex h-8 w-8 items-center justify-center border border-line text-bone/70 transition-colors hover:border-[var(--tint)] hover:text-[var(--tint)] focus-visible:border-[var(--tint)] focus-visible:text-[var(--tint)]"
            >
              <span aria-hidden>←</span>
            </TLink>
            <nav aria-label="Breadcrumb" className="hidden md:block">
              <ol className="t-label flex gap-3 text-steel">
                {crumbs.map((c, i) => (
                  <li key={i} className="flex gap-3">
                    {i > 0 && <span aria-hidden className="text-bone/30">/</span>}
                    <span
                      aria-current={i === crumbs.length - 1 ? "page" : undefined}
                      className={i === crumbs.length - 1 ? "text-[var(--tint)]" : ""}
                    >
                      {c}
                    </span>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-6 md:gap-9">
          <nav aria-label="Disciplines" className="t-label hidden items-center gap-3 md:flex">
            {DISCIPLINES.map((d, i) => (
              <span key={d.id} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-bone/30">/</span>}
                <TLink
                  href={d.href}
                  aria-current={here?.id === d.id ? "page" : undefined}
                  className={`transition-colors ${
                    here?.id === d.id ? "text-[var(--tint)]" : "text-bone/60 hover:text-bone"
                  }`}
                >
                  {d.label}
                </TLink>
              </span>
            ))}
          </nav>
          <SoundToggle className="hidden sm:inline-flex" />
          <button
            ref={menuBtn}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className="t-label text-bone/80 hover:text-bone"
          >
            Menu
          </button>
        </div>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 px-5 py-6 backdrop-blur-sm md:px-10 md:py-8"
        >
          <div className="flex items-center justify-between">
            <span className="t-label text-steel">Navigate</span>
            <button
              type="button"
              autoFocus
              onClick={() => {
                setOpen(false);
                menuBtn.current?.focus();
              }}
              className="t-label text-bone/80 hover:text-bone"
            >
              Close
            </button>
          </div>
          <ul className="my-auto flex flex-col gap-1 py-10">
            <li>
              <MenuLink href="/" n="00" label="Main experience" variant="fade" />
            </li>
            {DISCIPLINES.map((d) => (
              <li key={d.id}>
                <MenuLink href={d.href} n={d.n} label={d.long} tint={d.tint} />
              </li>
            ))}
            {EXTRA.map((x, i) => (
              <li key={x.href}>
                <MenuLink href={x.href} n={`0${i + 4}`} label={x.label} variant="fade" />
              </li>
            ))}
          </ul>
          <SoundToggle className="sm:hidden" />
        </div>
      )}
    </>
  );
}

function MenuLink({
  href,
  n,
  label,
  tint,
  variant,
}: {
  href: string;
  n: string;
  label: string;
  tint?: string;
  variant?: "fade";
}) {
  return (
    <TLink
      href={href}
      variant={variant}
      className="group flex items-baseline gap-5 border-b border-line py-3 md:gap-8 md:py-4"
      style={{ ["--tint" as string]: tint ?? "#ecebe6" }}
    >
      <span className="t-label w-8 text-steel">{n}</span>
      <span className="t-wide text-[clamp(1.75rem,5.5vw,3.75rem)] text-bone/80 transition-colors group-hover:text-[var(--tint)]">
        {label}
      </span>
    </TLink>
  );
}
