import type { ReactNode } from "react";

/**
 * A small, safe renderer for blog text: paragraphs, ## headings, lists, quotes,
 * images, links, **bold** and *italic*. It builds React elements, never raw HTML.
 */

const INLINE = /(!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;

function safeUrl(u: string) {
  return /^(https?:\/\/|\/|#|mailto:)/i.test(u) ? u : "#";
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = k++;
    if (m[3] !== undefined) {
      // eslint-disable-next-line @next/next/no-img-element
      out.push(<img key={key} src={safeUrl(m[3])} alt={m[2]} loading="lazy" className="my-8 h-auto w-full border border-line" />);
    } else if (m[5] !== undefined) {
      out.push(
        <a key={key} href={safeUrl(m[5])} className="text-[var(--tint)] underline underline-offset-4">
          {m[4]}
        </a>,
      );
    } else if (m[6] !== undefined) out.push(<strong key={key} className="font-semibold text-bone">{m[6]}</strong>);
    else if (m[7] !== undefined) out.push(<em key={key}>{m[7]}</em>);
    else out.push(<code key={key} className="bg-coal px-1.5 py-0.5 text-[0.9em]">{m[8]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-6 text-lg leading-relaxed text-bone/70">
      {blocks.map((raw, i) => {
        const b = raw.trim();
        if (!b) return null;
        const h = b.match(/^(#{2,3})\s+(.*)$/);
        if (h) {
          return h[1].length === 2 ? (
            <h2 key={i} className="t-wide pt-6 text-[clamp(1.6rem,3.4vw,2.4rem)] text-bone">
              {inline(h[2])}
            </h2>
          ) : (
            <h3 key={i} className="t-wide pt-4 text-[1.3rem] text-bone">
              {inline(h[2])}
            </h3>
          );
        }
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-2 pl-6 marker:text-[var(--tint)]">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\.\s+/.test(l))) {
          return (
            <ol key={i} className="list-decimal space-y-2 pl-6 marker:text-[var(--tint)]">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\d+\.\s+/, ""))}</li>
              ))}
            </ol>
          );
        }
        if (lines.every((l) => l.startsWith(">"))) {
          return (
            <blockquote key={i} className="border-l-2 border-[var(--tint)] pl-5 italic text-bone/85">
              {inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}
            </blockquote>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
