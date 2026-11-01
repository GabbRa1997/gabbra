import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Photograph from "@/components/media/Photograph";
import SelectedWorks from "@/components/photo/SelectedWorks";
import TLink from "@/components/shell/TLink";
import { PHOTO_PROJECTS, PRINTS } from "@/lib/media";
import { PageFrame, Placeholder } from "@/components/shell/PageFrame";
import {
  PHOTO_SECTIONS,
  PLACEHOLDER_SUBJECTS,
  type PhotoSectionSlug,
} from "@/content/photo";

type Params = { section: string };

export function generateStaticParams() {
  return PHOTO_SECTIONS.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { section } = await params;
  const s = PHOTO_SECTIONS.find((x) => x.slug === section);
  return { title: s ? `${s.title} — Photography` : "Photography" };
}

export default async function PhotoSectionPage({ params }: { params: Promise<Params> }) {
  const { section } = await params;
  const idx = PHOTO_SECTIONS.findIndex((s) => s.slug === section);
  if (idx < 0) notFound();
  const s = PHOTO_SECTIONS[idx];
  const next = PHOTO_SECTIONS[(idx + 1) % PHOTO_SECTIONS.length];

  return (
    <PageFrame tint="#e6b980" eyebrow={`01 / Photography — ${s.n}`} title={s.title} lead={s.lead}>
      <Body slug={s.slug} />

      <nav aria-label="Section navigation" className="mt-24 flex items-center justify-between border-t border-line pt-6">
        <TLink href="/photo" className="t-label text-bone/70 hover:text-[var(--tint)]">
          ← Back to the camera
        </TLink>
        <TLink href={`/photo/${next.slug}`} className="t-label text-bone/70 hover:text-[var(--tint)]">
          Next: {next.title} →
        </TLink>
      </nav>
    </PageFrame>
  );
}

function Body({ slug }: { slug: PhotoSectionSlug }) {
  if (slug === "prints" && PRINTS.length > 0) {
    return (
      <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {PRINTS.map(({ photo, project }) => (
          <article key={`${project.slug}/${photo.id}`}>
            <div className="overflow-hidden" style={{ aspectRatio: `${photo.w} / ${photo.h}`, maxHeight: "70svh" }}>
              <Photograph photo={photo} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" fit="contain" />
            </div>
            <h2 className="t-wide mt-4 text-[1.3rem]">{project.title}</h2>
            <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
              {[
                ["Sizes", photo.print?.sizes],
                ["Paper", photo.print?.paper],
                ["Edition", photo.print?.edition],
                ["Price", photo.print?.price],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-2.5">
                  <dt className="t-label text-steel">{k}</dt>
                  <dd className={v ? "text-bone/80" : "text-bone/35"}>{v || "On request"}</dd>
                </div>
              ))}
            </dl>
            <TLink
              href={`/contact?type=print&ref=${encodeURIComponent(`${project.title} (${photo.file})`)}`}
              variant="fade"
              className="t-label mt-4 inline-flex border border-[var(--tint)] px-4 py-3 text-[var(--tint)] transition-colors hover:bg-[var(--tint)] hover:text-ink"
            >
              Enquire about this print →
            </TLink>
          </article>
        ))}
      </div>
    );
  }

  if (slug === "prints") {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {["Edition 01", "Edition 02", "Edition 03"].map((n) => (
          <div key={n} className="space-y-3">
            <Placeholder label={n} ratio="4 / 5" />
            <p className="t-label flex justify-between text-steel">
              <span>Size · paper · edition size</span>
              <span>TBC</span>
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (slug === "experiments") {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {["Experiment 01", "Experiment 02", "Experiment 03", "Experiment 04"].map((n) => (
          <Placeholder key={n} label={n} ratio="16 / 10" note="Placeholder — ongoing project" />
        ))}
      </div>
    );
  }

  if (PHOTO_PROJECTS.length > 0) return <SelectedWorks projects={PHOTO_PROJECTS} />;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {PLACEHOLDER_SUBJECTS.map((n, i) => (
        <div key={n} className={i % 5 === 0 ? "sm:col-span-2 lg:col-span-2" : ""}>
          <Placeholder label={n} ratio={i % 5 === 0 ? "21 / 9" : "3 / 2"} />
        </div>
      ))}
    </div>
  );
}
