import { pageSeo } from "@/lib/seo";
import { PageFrame, Placeholder } from "@/components/shell/PageFrame";
import TLink from "@/components/shell/TLink";
import { formatDate, getPosts } from "@/lib/blog";

export const metadata = pageSeo("/blog");

export default function Blog() {
  const posts = getPosts();
  return (
    <PageFrame
      tint="#e6b980"
      eyebrow="04 — Words"
      title="Blog"
      lead="Notes from behind the lens: photography, FPV and film, and how the work is made."
    >
      {posts.length === 0 ? (
        <Placeholder label="First post" ratio="3 / 1" note="Placeholder — the first post is on its way" />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {posts.map((p) => (
            <li key={p.slug}>
              <TLink
                href={`/blog/${p.slug}`}
                className="group grid gap-3 py-8 md:grid-cols-[11rem_1fr] md:gap-10"
              >
                <time dateTime={p.date} className="t-label pt-2 text-steel">
                  {formatDate(p.date)}
                </time>
                <span>
                  <span className="t-wide block text-[clamp(1.6rem,3.2vw,2.4rem)] text-bone/90 transition-colors group-hover:text-[var(--tint)]">
                    {p.title}
                    {p.draft && <span className="t-label ml-3 text-[0.62rem] text-steel">Draft</span>}
                  </span>
                  {p.description && <span className="mt-3 block max-w-2xl text-bone/55">{p.description}</span>}
                  {p.tags.length > 0 && (
                    <span className="t-label mt-4 block text-[0.62rem] text-steel">{p.tags.join(" · ")}</span>
                  )}
                </span>
              </TLink>
            </li>
          ))}
        </ul>
      )}
    </PageFrame>
  );
}
