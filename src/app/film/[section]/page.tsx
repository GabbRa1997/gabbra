import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactSheet from "@/components/film/ContactSheet";
import { PageFrame } from "@/components/shell/PageFrame";
import TLink from "@/components/shell/TLink";
import { FILM_SECTIONS, sectionBySlug } from "@/content/film";

type Params = { section: string };

export function generateStaticParams() {
  return FILM_SECTIONS.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { section } = await params;
  const s = sectionBySlug(section);
  return { title: s ? `${s.title} — Film` : "Film" };
}

export default async function FilmSectionPage({ params }: { params: Promise<Params> }) {
  const { section } = await params;
  const s = sectionBySlug(section);
  if (!s) notFound();
  const idx = FILM_SECTIONS.findIndex((x) => x.slug === s.slug);
  const next = FILM_SECTIONS[(idx + 1) % FILM_SECTIONS.length];

  return (
    <PageFrame tint="#e6b980" eyebrow={`03 / Film — ${s.n}`} title={s.title} lead={s.lead}>
      <ContactSheet section={s.slug} projects={s.projects} />

      <nav aria-label="Section navigation" className="mt-24 flex items-center justify-between border-t border-line pt-6">
        <TLink href="/film" className="t-label text-bone/70 hover:text-[var(--tint)]">
          ← Back to the strip
        </TLink>
        <TLink href={`/film/${next.slug}`} className="t-label text-bone/70 hover:text-[var(--tint)]">
          Next: {next.title} →
        </TLink>
      </nav>
    </PageFrame>
  );
}
