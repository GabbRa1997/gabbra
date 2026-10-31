import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TLink from "@/components/shell/TLink";
import { PageFrame, Placeholder } from "@/components/shell/PageFrame";
import { BUILD_SHEET, FPV_SECTIONS, type FpvSectionSlug } from "@/content/fpv";

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
  if (slug === "technical-experiments") {
    return (
      <div className="grid gap-16 md:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6 sm:grid-cols-2">
          {["Build 01", "Build 02", "Build 03", "Build 04"].map((n) => (
            <Placeholder key={n} label={n} ratio="4 / 3" note="Placeholder — build log" />
          ))}
        </div>
        <dl className="h-fit divide-y divide-line border-y border-line">
          {BUILD_SHEET.map((e) => (
            <div key={e.label} className="flex items-baseline justify-between gap-6 py-4">
              <dt className="t-label text-steel">{e.label}</dt>
              <dd className={e.placeholder ? "text-bone/35" : "text-bone"}>{e.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (slug === "projects") {
    return (
      <ul className="divide-y divide-line border-y border-line">
        {["Commission 01", "Commission 02", "Commission 03"].map((n, i) => (
          <li key={n} className="grid items-baseline gap-2 py-6 md:grid-cols-[6rem_1fr_auto] md:gap-8">
            <span className="t-label text-steel">{String(i + 1).padStart(2, "0")}</span>
            <span className="t-wide text-[clamp(1.5rem,3vw,2.5rem)] text-bone/60">{n}</span>
            <span className="t-label text-bone/35">Client · year · status · to be supplied</span>
          </li>
        ))}
      </ul>
    );
  }

  if (slug === "perspectives") {
    return (
      <div className="grid gap-6">
        <Placeholder label="Perspective 01" ratio="21 / 9" note="Placeholder — aerial or environmental image" />
        <div className="grid gap-6 sm:grid-cols-2">
          <Placeholder label="Perspective 02" ratio="16 / 10" />
          <Placeholder label="Perspective 03" ratio="16 / 10" />
        </div>
      </div>
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
