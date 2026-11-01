import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { PageFrame, Placeholder } from "@/components/shell/PageFrame";
import TLink from "@/components/shell/TLink";

export const metadata: Metadata = {
  title: "Who am I?",
  description: "Behind the lens, beyond the frame: the story of the person behind GabbRa.",
};

/**
 * The Canon 550D photograph from home. Drop a file named camera.jpg (or .jpeg, .webp, .png)
 * into /public/artist and it replaces the placeholder: nothing else to change.
 */
const CAMERA = ["jpg", "jpeg", "webp", "png"]
  .map((ext) => `camera.${ext}`)
  .find((f) => existsSync(path.join(process.cwd(), "public", "artist", f)));

const body = "text-lg leading-relaxed text-bone/70";

export default function Artist() {
  return (
    <PageFrame
      tint="#e6b980"
      eyebrow="The artist"
      title="Who am I?"
      lead="Behind the lens, beyond the frame."
    >
      <div className="grid gap-12 md:grid-cols-[minmax(0,24rem)_1fr] md:gap-20">
        <figure className="md:sticky md:top-28 md:self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/artist/portrait.jpg"
            srcSet="/artist/portrait-700.jpg 700w, /artist/portrait.jpg 1169w"
            sizes="(min-width: 768px) 24rem, 100vw"
            width={1169}
            height={1346}
            alt="Black and white portrait of the artist, seated at a wooden pew, hands clasped, looking off to one side"
            className="h-auto w-full border border-line"
          />
          <figcaption className="t-label mt-3 text-[0.62rem] text-steel">Gabriel Octavian Tudosie</figcaption>
        </figure>

        <div className="max-w-2xl">
          <div className={`space-y-6 ${body}`}>
            <p>
              My story with photography began shortly after my tenth birthday, at a photography competition. Armed with a
              camera and a limited number of shots, I captured my own shadow beneath a graffiti inscription reading{" "}
              <em className="text-bone/90">BOSS</em>. A rather unexpected winner, and perhaps the first glimpse of an
              artistic curiosity I hadn’t yet discovered.
            </p>
          </div>

          {/* the camera: the object the story turns on */}
          <div className="my-12 grid gap-8 md:my-16">
            {CAMERA ? (
              <figure className="overflow-hidden border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/artist/${CAMERA}`}
                  alt="My Canon 550D, the camera I have used since 2012"
                  className="h-auto w-full"
                />
                <figcaption className="t-label border-t border-line px-4 py-3 text-[0.62rem] text-steel">
                  The Canon 550D · 2012 → today
                </figcaption>
              </figure>
            ) : (
              <Placeholder
                label="The Canon 550D · 2012 → today"
                ratio="3 / 2"
                note="Placeholder — photo of my camera to be supplied"
              />
            )}
            <p className={body}>
              In 2012, my parents gifted me my first DSLR, a Canon 550D. Nearly fifteen years later, I’m still using the
              very same body, accompanied by lenses collected along the way. What started as spontaneous snapshots
              gradually evolved into portraits, events, sports, nature and, eventually, a wider exploration of visual
              storytelling.
            </p>
          </div>

          <div className={`space-y-6 ${body}`}>
            <p>
              I’ve always been drawn to black and white photography, occasionally interrupted by a touch of colour when a
              particular detail deserves to stand out.
            </p>
            <p>More recently, drones and FPV have introduced me to new perspectives, naturally leading me towards filmmaking.</p>
          </div>
        </div>
      </div>

      <section aria-labelledby="the-now" className="mt-24 border-t border-line pt-14 md:mt-32 md:pt-20">
        <div className="grid gap-10 md:grid-cols-[minmax(0,24rem)_1fr] md:gap-20">
          <div>
            <p className="t-label mb-4 text-[var(--tint)]">A collection</p>
            <h2 id="the-now" className="t-wide text-[clamp(2rem,5vw,3.6rem)]">
              The Now
            </h2>
            <p className="mt-4 text-lg italic text-bone/55">A Peek into a Collection of Timeless Interruptions.</p>
          </div>
          <div className={`max-w-2xl space-y-6 ${body}`}>
            <p>
              I see photography as an interruption of time: a fleeting expression, a passing shadow, a coincidence or an
              otherwise ordinary moment worth keeping.
            </p>
            <p>
              The Now brings together fragments of life captured through my perspective. Moments that have passed, yet
              somehow remain.
            </p>
            <p className="text-bone/90">
              Because the present lasts only an instant. Sometimes, an image lets us visit it again.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="the-name" className="mt-24 border-t border-line pt-14 md:mt-32 md:pt-20">
        <div className="grid gap-10 md:grid-cols-[minmax(0,24rem)_1fr] md:gap-20">
          <div>
            <p className="t-label mb-4 text-[var(--tint)]">The name</p>
            <h2 id="the-name" className="t-wide text-[clamp(2rem,5vw,3.6rem)]">
              GabbRa
            </h2>
          </div>
          <div className={`max-w-2xl space-y-6 ${body}`}>
            <p>
              Behind the pseudonym is Gabriel Octavian Tudosie. A self-taught enthusiast, forever curious about
              perspectives, light and the stories hidden within ordinary moments.
            </p>
            <p className="text-bone">
              <strong className="font-semibold">
                The equipment may evolve. The perspective may change. But the curiosity stays.
              </strong>
            </p>
            <p className="t-wide pt-4 text-[1.4rem] text-[var(--tint)]">Welcome to GabbRa.</p>
          </div>
        </div>
      </section>

      <nav aria-label="Next" className="mt-20 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-8">
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
    </PageFrame>
  );
}
