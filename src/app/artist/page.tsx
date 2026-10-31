import type { Metadata } from "next";
import { PageFrame, Placeholder } from "@/components/shell/PageFrame";
import TLink from "@/components/shell/TLink";

export const metadata: Metadata = {
  title: "About the artist",
  description: "The person behind the lens, the drone and the camera.",
};

const FACTS = ["Based in", "Working across", "Started with", "Currently"];

export default function Artist() {
  return (
    <PageFrame
      tint="#e6b980"
      eyebrow="About the artist"
      title="Behind the work."
      lead="The person behind the lens, the drone and the camera."
    >
      <div className="grid gap-16 md:grid-cols-[minmax(0,22rem)_1fr]">
        <Placeholder label="Portrait" ratio="4 / 5" note="Placeholder — portrait to be supplied" />

        <div>
          <div className="space-y-6 text-lg leading-relaxed text-bone/70">
            <p className="t-label text-steel">Biography · placeholder</p>
            <p>The artist’s biography goes here: where the work began, what it looks for, and what drives it.</p>
            <p className="text-bone/40">This text is a stand-in. A few paragraphs will be set here in full measure once supplied.</p>
          </div>

          <dl className="mt-12 divide-y divide-line border-y border-line">
            {FACTS.map((f) => (
              <div key={f} className="flex items-baseline justify-between gap-6 py-4">
                <dt className="t-label text-steel">{f}</dt>
                <dd className="text-bone/35">To be supplied</dd>
              </div>
            ))}
          </dl>

          <nav aria-label="Next" className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
            <TLink href="/photo/behind-the-lens" className="t-label text-bone/70 hover:text-[var(--tint)]">
              Equipment and approach →
            </TLink>
            <TLink href="/contact" variant="fade" className="t-label text-bone/70 hover:text-[var(--tint)]">
              Commission enquiries →
            </TLink>
            <TLink href="/about" variant="fade" className="t-label text-bone/70 hover:text-[var(--tint)]">
              About GabbRa →
            </TLink>
          </nav>
        </div>
      </div>
    </PageFrame>
  );
}
