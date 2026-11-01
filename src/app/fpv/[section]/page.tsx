import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TLink from "@/components/shell/TLink";
import { PageFrame, Placeholder } from "@/components/shell/PageFrame";
import VideoEmbed from "@/components/film/VideoEmbed";
import { DRONE_SHEET_FIELDS, FPV_DRONES, FPV_REELS, FPV_SECTIONS, type FpvSectionSlug } from "@/content/fpv";

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
    if (FPV_DRONES.length > 0) {
      return (
        <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {FPV_DRONES.map((d) => (
            <li key={d.id}>
              {d.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.photo} alt={d.name} loading="lazy" className="aspect-[4/3] w-full border border-line object-cover" />
              ) : (
                <Placeholder label={d.name} ratio="4 / 3" note="Placeholder — photo of the drone" />
              )}
              <h2 className="t-wide mt-5 text-[1.5rem] text-bone">{d.name}</h2>
              {d.notes && <p className="mt-2 text-bone/60">{d.notes}</p>}
              <dl className="mt-4 divide-y divide-line border-y border-line">
                {DRONE_SHEET_FIELDS.map((f) => (
                  <div key={f} className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="t-label text-steel">{f}</dt>
                    <dd className={d.specs[f] ? "text-right text-bone" : "text-bone/35"}>{d.specs[f] || "To be supplied"}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      );
    }
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
  if (FPV_REELS.length > 0) {
    return (
      <div className="grid gap-10 sm:grid-cols-2">
        {FPV_REELS.map((r, i) => (
          <figure key={r.id} className={i === 0 ? "sm:col-span-2" : ""}>
            <VideoEmbed url={r.url} title={r.title} />
            <figcaption className="mt-4">
              <span className="t-wide block text-[1.3rem] text-bone">{r.title}</span>
              {r.description && <span className="mt-1 block text-bone/60">{r.description}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }
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
