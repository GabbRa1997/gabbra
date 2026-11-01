import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FilmPlayer from "@/components/film/FilmPlayer";
import VideoEmbed from "@/components/film/VideoEmbed";
import { PageFrame, Placeholder } from "@/components/shell/PageFrame";
import TLink from "@/components/shell/TLink";
import { FILM_SECTIONS, sectionBySlug } from "@/content/film";

type Params = { section: string; project: string };

export function generateStaticParams() {
  return FILM_SECTIONS.flatMap((s) => s.projects.map((p) => ({ section: s.slug, project: p.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { section, project } = await params;
  const p = sectionBySlug(section)?.projects.find((x) => x.slug === project);
  return { title: p ? `${p.title} — Film` : "Film" };
}

export default async function FilmProjectPage({ params }: { params: Promise<Params> }) {
  const { section, project } = await params;
  const s = sectionBySlug(section);
  const idx = s?.projects.findIndex((p) => p.slug === project) ?? -1;
  if (!s || idx < 0) notFound();
  const p = s.projects[idx];
  const prev = s.projects[(idx - 1 + s.projects.length) % s.projects.length];
  const next = s.projects[(idx + 1) % s.projects.length];

  return (
    <PageFrame tint="#e6b980" eyebrow={`03 / Film — ${s.title} — ${p.code}`} title={p.title} lead={p.synopsis}>
      {p.embed ? (
        <VideoEmbed url={p.embed} title={p.title} />
      ) : (
        <FilmPlayer title={p.title} code={p.code} src={p.src} poster={p.poster} />
      )}

      <div className="mt-16 grid gap-16 md:grid-cols-2">
        <section aria-labelledby="production">
          <h2 id="production" className="t-label mb-4 text-[var(--tint)]">
            Production details
          </h2>
          <dl className="divide-y divide-line border-y border-line">
            {p.details.map((d) => (
              <div key={d.label} className="flex items-baseline justify-between gap-6 py-4">
                <dt className="t-label text-steel">{d.label}</dt>
                <dd className={/to be supplied/i.test(d.value) ? "text-bone/35" : "text-bone"}>{d.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="credits">
          <h2 id="credits" className="t-label mb-4 text-[var(--tint)]">
            Credits
          </h2>
          <dl className="divide-y divide-line border-y border-line">
            {p.credits.map((c) => (
              <div key={c.role} className="flex items-baseline justify-between gap-6 py-4">
                <dt className="t-label text-steel">{c.role}</dt>
                <dd className={/to be supplied/i.test(c.name) ? "text-bone/35" : "text-bone"}>{c.name}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {p.placeholder && <section aria-labelledby="stills" className="mt-16">
        <h2 id="stills" className="t-label mb-4 text-[var(--tint)]">
          Stills
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {["Still 01", "Still 02", "Still 03"].map((n) => (
            <Placeholder key={n} label={n} ratio="2.39 / 1" note="Placeholder" />
          ))}
        </div>
      </section>}

      <nav aria-label="Project navigation" className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <TLink href={`/film/${prev.slug === p.slug ? s.slug : `${s.slug}/${prev.slug}`}`} className="t-label text-bone/70 hover:text-[var(--tint)]">
          ← {prev.title}
        </TLink>
        <TLink href={`/film/${s.slug}`} className="t-label text-bone/70 hover:text-[var(--tint)]">
          All {s.title}
        </TLink>
        <TLink href={`/film/${s.slug}/${next.slug}`} className="t-label text-bone/70 hover:text-[var(--tint)]">
          {next.title} →
        </TLink>
      </nav>
    </PageFrame>
  );
}
