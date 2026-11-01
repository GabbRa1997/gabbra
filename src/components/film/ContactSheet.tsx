"use client";

import { useState } from "react";
import TLink from "@/components/shell/TLink";
import type { FilmProject } from "@/content/film";
import Leader, { useClock } from "./Leader";

function Tile({ href, project, index }: { href: string; project: FilmProject; index: number }) {
  const [active, setActive] = useState(false);
  const t = useClock(active);
  return (
    <li className={index === 0 ? "md:col-span-2" : ""}>
      <TLink
        href={href}
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="group block"
      >
        <span className="relative block bg-[#100d0c]">
          <span aria-hidden className="sprockets-x block" />
          <span
            className="relative block overflow-hidden border-y border-bone/10"
            style={{
              aspectRatio: index === 0 ? "2.39 / 1" : "16 / 9",
              background: `linear-gradient(135deg, hsl(${14 + index * 9} 16% 11%), hsl(${40 + index * 9} 14% 6%))`,
            }}
          >
            {project.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.poster} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            )}
            {active && project.src ? (
              <video src={project.src} autoPlay muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              active && !project.embed && <Leader t={t} compact label="Preview · placeholder" />
            )}
            <span className="t-label absolute left-4 top-3 text-[0.62rem] text-bone/55">{project.code}</span>
            {!active && (
              <span className="t-label absolute bottom-3 right-4 text-[0.62rem] text-bone/30">Hover to preview</span>
            )}
          </span>
          <span aria-hidden className="sprockets-x block" />
        </span>
        <span className="mt-4 flex items-baseline justify-between gap-6">
          <span className="t-wide text-[1.6rem] text-bone/85 transition-colors group-hover:text-film group-focus-visible:text-film">
            {project.title}
          </span>
          {project.placeholder && <span className="t-label text-[0.62rem] text-bone/35">Placeholder · title to be supplied</span>}
        </span>
      </TLink>
    </li>
  );
}

/** A contact sheet: every project as a strip of frame, previewed on hover or focus. */
export default function ContactSheet({ section, projects }: { section: string; projects: FilmProject[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2">
      {projects.map((p, i) => (
        <Tile key={p.slug} href={`/film/${section}/${p.slug}`} project={p} index={i} />
      ))}
    </ul>
  );
}
