import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectGallery from "@/components/photo/ProjectGallery";
import { PageFrame } from "@/components/shell/PageFrame";
import TLink from "@/components/shell/TLink";
import Photograph from "@/components/media/Photograph";
import { PHOTO_PROJECTS, coverOf, projectBySlug } from "@/lib/media";

type Params = { project: string };

export function generateStaticParams() {
  return PHOTO_PROJECTS.map((p) => ({ project: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { project } = await params;
  const p = projectBySlug(project);
  return { title: p ? `${p.title} — Selected Works` : "Selected Works", description: p?.description };
}

export default async function PhotoProjectPage({ params }: { params: Promise<Params> }) {
  const { project } = await params;
  const p = projectBySlug(project);
  if (!p) notFound();
  const i = PHOTO_PROJECTS.findIndex((x) => x.slug === p.slug);
  const prev = PHOTO_PROJECTS[(i - 1 + PHOTO_PROJECTS.length) % PHOTO_PROJECTS.length];
  const next = PHOTO_PROJECTS[(i + 1) % PHOTO_PROJECTS.length];
  const cover = coverOf(p);
  const paragraphs = (p.description ?? "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);

  return (
    <PageFrame
      tint="#e6b980"
      eyebrow={["01 / Photography", p.subject !== "Photography" && p.subject, p.year].filter(Boolean).join(" — ")}
      title={p.title}
    >
      {paragraphs.length > 0 && (
        // the cover and the story side by side, as on the "Who am I?" page
        <div className="grid gap-10 md:grid-cols-[minmax(0,24rem)_1fr] md:items-start md:gap-20">
          <figure className="overflow-hidden border border-line" style={{ aspectRatio: `${cover.w} / ${cover.h}` }}>
            <Photograph photo={cover} sizes="(min-width: 768px) 24rem, 100vw" priority />
          </figure>
          <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-bone/70">
            {paragraphs.map((t, k) => (
              <p key={k}>{t}</p>
            ))}
          </div>
        </div>
      )}

      <div className={paragraphs.length > 0 ? "mt-16 border-t border-line pt-12 md:mt-24 md:pt-16" : ""}>
        <ProjectGallery title={p.title} slug={p.slug} photos={p.photos} />
      </div>

      <nav aria-label="Project navigation" className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <TLink href={`/photo/selected-works/${prev.slug}`} className="t-label text-bone/70 hover:text-[var(--tint)]">
          ← {prev.title}
        </TLink>
        <TLink href="/photo/selected-works" className="t-label text-bone/70 hover:text-[var(--tint)]">
          All projects
        </TLink>
        <TLink href={`/photo/selected-works/${next.slug}`} className="t-label text-bone/70 hover:text-[var(--tint)]">
          {next.title} →
        </TLink>
      </nav>
    </PageFrame>
  );
}
