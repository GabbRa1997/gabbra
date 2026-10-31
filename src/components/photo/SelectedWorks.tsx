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

      <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2">
        {shown.map((p, i) => {
          const cover = coverOf(p);
          return (
            <li key={p.slug} className={i % 3 === 0 ? "md:col-span-2" : ""}>
              <TLink href={`/photo/selected-works/${p.slug}`} className="group block">
                <span className="relative block overflow-hidden" style={{ aspectRatio: i % 3 === 0 ? "21 / 9" : "4 / 3" }}>
                  <Photograph
                    photo={cover}
                    sizes={i % 3 === 0 ? "(min-width: 1400px) 1320px, 100vw" : "(min-width: 768px) 50vw, 100vw"}
                    priority={i === 0}
                    className="transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                  />
                </span>
                <span className="mt-4 flex items-baseline justify-between gap-6">
                  <span className="t-wide text-[1.6rem] text-bone/90 transition-colors group-hover:text-[var(--tint)] group-focus-visible:text-[var(--tint)]">
                    {p.title}
                  </span>
                  <span className="t-label text-[0.62rem] text-bone/40">
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
