import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "@/components/blog/Markdown";
import JsonLd from "@/components/shell/JsonLd";
import { PageFrame } from "@/components/shell/PageFrame";
import TLink from "@/components/shell/TLink";
import { SITE } from "@/content/site";
import { formatDate, getPost, getPosts } from "@/lib/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPost((await params).slug);
  if (!p) return { title: "Blog" };
  return {
    title: p.title,
    description: p.description || undefined,
    keywords: p.tags,
    alternates: { canonical: `/blog/${p.slug}/` },
    openGraph: {
      type: "article",
      title: p.title,
      description: p.description || undefined,
      publishedTime: p.date,
      tags: p.tags,
      siteName: SITE.name,
      locale: "en_GB",
      images: [p.cover ?? "/brand/og.png"],
    },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPost((await params).slug);
  if (!p) notFound();
  return (
    <PageFrame tint="#e6b980" eyebrow={formatDate(p.date)} title={p.title} lead={p.description || undefined}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: p.title,
          description: p.description || undefined,
          datePublished: p.date,
          image: p.cover ? `https://gabbra.net${p.cover}` : undefined,
          keywords: p.tags.join(", ") || undefined,
          mainEntityOfPage: `https://gabbra.net/blog/${p.slug}/`,
          author: { "@type": "Person", name: "Gabriel Octavian Tudosie", alternateName: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
      <article className="max-w-2xl">
        {p.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt="" className="mb-12 h-auto w-full border border-line" />
        )}
        <Markdown source={p.body} />
        {p.tags.length > 0 && <p className="t-label mt-12 text-[0.62rem] text-steel">{p.tags.join(" · ")}</p>}
      </article>
      <nav aria-label="Next" className="mt-20 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-8">
        <TLink href="/blog" className="t-label text-bone/70 hover:text-[var(--tint)]">
          ← All posts
        </TLink>
        <TLink href="/contact" variant="fade" className="t-label text-bone/70 hover:text-[var(--tint)]">
          Commission enquiries →
        </TLink>
      </nav>
    </PageFrame>
  );
}
