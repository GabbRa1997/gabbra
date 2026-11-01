import type { Metadata } from "next";
import CookieSettingsButton from "@/components/shell/CookieSettingsButton";
import { PageFrame } from "@/components/shell/PageFrame";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy & cookies",
  description: "What GabbRa collects when you visit, and how to say no.",
};

const body = "text-lg leading-relaxed text-bone/70";

export default function Privacy() {
  return (
    <PageFrame tint="#e6b980" eyebrow="Privacy" title="Privacy & cookies" lead="Short and plain: what this site does with your visit.">
      <div className={`max-w-2xl space-y-6 ${body}`}>
        <h2 className="t-wide text-[1.6rem] text-bone">Who runs this site</h2>
        <p>
          GabbRa is run by Gabriel Octavian Tudosie. Questions about privacy can go to{" "}
          <a className="text-[var(--tint)] underline underline-offset-4" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
          .
        </p>

        <h2 className="t-wide pt-4 text-[1.6rem] text-bone">Counting visits</h2>
        <p>
          If you accept, the site uses Google Analytics to count visits and see which pages people look at. It sets
          cookies named <code>_ga</code> and <code>_ga_…</code> and sends anonymous usage information to Google. If you
          decline, or do nothing, no analytics are loaded and no cookies are set.
        </p>
        <p>You can change your mind at any time:</p>
        <div>
          <CookieSettingsButton />
        </div>

        <h2 className="t-wide pt-4 text-[1.6rem] text-bone">Everything else</h2>
        <p>
          There are no adverts and no other trackers. The contact form opens your own email app with the message ready to
          send, so nothing you type is stored on this site. The site is hosted by GitHub Pages, which, like any web host,
          may keep technical logs such as IP addresses.
        </p>
      </div>
    </PageFrame>
  );
}
