import type { Metadata } from "next";
import { PageFrame } from "@/components/shell/PageFrame";
import TLink from "@/components/shell/TLink";
import { DISCIPLINES } from "@/lib/disciplines";

export const metadata: Metadata = { title: "About GabbRa" };

const STATEMENTS: Record<string, string> = {
  photo: "One frame, held: photography that treats perspective as the subject.",
  fpv: "The frame, in flight: first-person flying, built by hand and flown for the view.",
  film: "Frames, in sequence: story, emotion, movement and time.",
};

export default function About() {
  return (
    <PageFrame
      tint="#e6b980"
      eyebrow="About GabbRa"
      title="Reality, reframed."
      lead="GabbRa is an independent creative practice working across photography, FPV and film. Experimental, artistic and cinematic, with a technical curiosity and an obsession with perspective."
    >
      <ul className="divide-y divide-line border-y border-line">
        {DISCIPLINES.map((d) => (
          <li key={d.id}>
            <TLink href={d.href} className="group grid items-baseline gap-2 py-6 md:grid-cols-[6rem_14rem_1fr] md:gap-8">
              <span className="t-label text-steel">{d.n}</span>
              <span className="t-wide text-[1.6rem] text-bone/85 transition-colors group-hover:text-[var(--tint)]">{d.long}</span>
              <span className="text-bone/55">{STATEMENTS[d.id]}</span>
            </TLink>
          </li>
        ))}
      </ul>

      <p className="mt-12 text-bone/55">
        Looking for the person behind it?{" "}
        <TLink href="/artist" variant="fade" className="text-[var(--tint)] underline underline-offset-4">
          About the artist
        </TLink>
        .
      </p>
    </PageFrame>
  );
}
