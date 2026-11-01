import { pageSeo } from "@/lib/seo";
import { Suspense } from "react";
import ContactForm from "@/components/shell/ContactForm";
import { PageFrame } from "@/components/shell/PageFrame";
import { SITE, instagramUrl } from "@/content/site";

export const metadata = pageSeo("/contact");

export default function Contact() {
  return (
    <PageFrame
      tint="#e6b980"
      eyebrow="Contact"
      title="Commission enquiries"
      lead="For photography, FPV and film commissions, prints and collaborations."
    >
      <div className="grid gap-16 md:grid-cols-[1.3fr_1fr]">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
        <dl className="h-fit divide-y divide-line border-y border-line">
          <div className="flex items-baseline justify-between gap-6 py-4">
            <dt className="t-label text-steel">Email</dt>
            <dd>
              <a className="text-bone hover:text-[var(--tint)]" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-4">
            <dt className="t-label text-steel">Instagram</dt>
            <dd>
              {instagramUrl ? (
                <a className="text-bone hover:text-[var(--tint)]" href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  @{SITE.instagram}
                </a>
              ) : (
                <span className="text-bone/35">Handle to be supplied</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </PageFrame>
  );
}
