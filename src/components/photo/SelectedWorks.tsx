"use client";

import { useState } from "react";
import Photograph from "@/components/media/Photograph";
import TLink from "@/components/shell/TLink";
import { coverOf, type PhotoProject } from "@/lib/media";

/** The portfolio index: large covers, filterable by subject. */
export default function SelectedWorks({ projects }: { projects: PhotoProject[] }) {
  const subjects = [...new Set(projects.map((p) => p.subject))];
  const [subject, setSubject] = useState<string | null>(null);
  const shown = subject ? projects.filter((p) => p.subject === subject) : projects;

  return (
    <div>
      {subjects.length > 1 && (
        <div role="group" aria-label="Filter by subject" className="mb-10 flex flex-wrap gap-x-6 gap-y-2">
          {[null, ...subjects].map((s) => (
            <button
              key={s ?? "all"}
              type="button"
              onClick={() => setSubject(s)}
              aria-pressed={subject === s}
              className={`t-label border-b pb-1 transition-colors ${
                subject === s ? "border-[var(--tint)] text-[var(--tint)]" : "border-transparent text-bone/50 hover:text-bone"
              }`}
            >
              {s ?? "All"}
            </button>
          ))}
        </div>
      )}

      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 md:gap-x-8 md:gap-y-14">
        {shown.map((p, i) => {
          const cover = coverOf(p);
          const about = (p.description ?? "").split(/\n\s*\n/)[0]?.trim();
          return (
            <li key={p.slug}>
              <TLink href={`/photo/selected-works/${p.slug}`} className="group block">
                <span className="relative block aspect-square overflow-hidden">
                  <Photograph
                    photo={cover}
                    sizes="(min-width: 1400px) 660px, (min-width: 640px) 50vw, 100vw"
                    priority={i < 2}
                    className="transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                  />
                  {about && (
                    // the album's description fades in over the cover on hover (not on touch screens)
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 hidden px-5 pb-5 pt-20 text-[0.92rem] leading-snug text-bone opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:hover)]:block"
                      style={{ background: "linear-gradient(to top, rgba(5,5,6,.9), rgba(5,5,6,.6) 55%, rgba(5,5,6,0))" }}
                    >
                      <span className="line-clamp-3">{about}</span>
                    </span>
                  )}
                </span>
                <span className="mt-4 flex items-baseline justify-between gap-6">
                  <span className="t-wide text-[1.6rem] text-bone/90 transition-colors group-hover:text-[var(--tint)] group-focus-visible:text-[var(--tint)]">
                    {p.title}
                  </span>
                  <span className="t-label shrink-0 text-[0.62rem] text-bone/40">
                    {p.subject}
                    {p.year ? ` · ${p.year}` : ""} · {p.photos.length}
                  </span>
                </span>
              </TLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
