import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TLink from "@/components/shell/TLink";
import { PageFrame, Placeholder } from "@/components/shell/PageFrame";
import { DRONE_SHEET_FIELDS, FPV_SECTIONS, type FpvSectionSlug } from "@/content/fpv";

type Params = { section: string };

export function generateStaticParams() {
  return FPV_SECTIONS.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { section } = await params;
  const s = FPV_SECTIONS.find((x) => x.slug === section);
  return { title: s ? `${s.title} — FPV` : "FPV" };
}

export default async function FpvSectionPage({ params }: { params: Promise<Params> }) {
  const { section } = await params;
  const idx = FPV_SECTIONS.findIndex((s) => s.slug === section);
  if (idx < 0) notFound();
  const s = FPV_SECTIONS[idx];
  const next = FPV_SECTIONS[(idx + 1) % FPV_SECTIONS.length];

  return (
    <PageFrame tint="#e6b980" eyebrow={`02 / FPV — ${s.n}`} title={s.title} lead={s.lead}>
      <Body slug={s.slug} />

      <nav aria-label="Section navigation" className="mt-24 flex items-center justify-between border-t border-line pt-6">
        <TLink href="/fpv" className="t-label text-bone/70 hover:text-[var(--tint)]">
          ← Back to the quad
        </TLink>
        <TLink href={`/fpv/${next.slug}`} className="t-label text-bone/70 hover:text-[var(--tint)]">
          Next: {next.title} →
        </TLink>
      </nav>
    </PageFrame>
  );
}

function Body({ slug }: { slug: FpvSectionSlug }) {
  if (slug === "drones-owned") {
    return (
      <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2">
        {["Drone 01", "Drone 02", "Drone 03"].map((n) => (
          <li key={n}>
            <Placeholder label={n} ratio="4 / 3" note="Placeholder — photo of the drone" />
            <h2 className="t-wide mt-5 text-[1.5rem] text-bone/70">{n}</h2>
            <p className="t-label mt-1 text-[0.62rem] text-bone/35">Name and build to be supplied</p>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {DRONE_SHEET_FIELDS.map((f) => (
                <div key={f} className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="t-label text-steel">{f}</dt>
                  <dd className="text-bone/35">To be supplied</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    );
  }

  // flight reels
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {["Reel 01", "Reel 02", "Reel 03", "Reel 04"].map((n, i) => (
        <div key={n} className={i === 0 ? "sm:col-span-2" : ""}>
          <Placeholder label={n} ratio={i === 0 ? "21 / 9" : "16 / 9"} note="Placeholder — video to be supplied" />
        </div>
      ))}
    </div>
  );
}
