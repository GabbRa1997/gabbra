"use client";

import { DESC_MAX, TITLE_MAX } from "@/lib/seoDefaults";

/** how a result looks on Google, so you can judge the wording */
export function Snippet({ title, url, description }: { title: string; url: string; description: string }) {
  const t = title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1).trimEnd()}…` : title;
  const d = description.length > DESC_MAX ? `${description.slice(0, DESC_MAX - 1).trimEnd()}…` : description;
  return (
    <div aria-label="Google preview" className="rounded border border-line bg-white p-4 text-left text-[#202124]">
      <p className="truncate text-[0.8rem] text-[#4d5156]">{url}</p>
      <p className="mt-1 text-[1.2rem] leading-snug text-[#1a0dab]">{t || "Title"}</p>
      <p className="mt-1 text-[0.88rem] leading-snug text-[#4d5156]">{d || "No description yet: Google will pick some text from the page."}</p>
    </div>
  );
}

export type Verdict = { tone: "good" | "warn" | "bad"; text: string };

export function titleVerdict(t: string): Verdict {
  const n = t.trim().length;
  if (n === 0) return { tone: "bad", text: "Missing" };
  if (n < 15) return { tone: "warn", text: "A bit short: say what the page is about" };
  if (n > TITLE_MAX) return { tone: "warn", text: `Too long: Google will cut it off after ${TITLE_MAX} characters` };
  return { tone: "good", text: "Good length" };
}

export function descVerdict(d: string): Verdict {
  const n = d.trim().length;
  if (n === 0) return { tone: "bad", text: "Missing" };
  if (n < 70) return { tone: "warn", text: "A bit short: aim for one or two full sentences" };
  if (n > DESC_MAX) return { tone: "warn", text: `Too long: Google will cut it off after about ${DESC_MAX} characters` };
  return { tone: "good", text: "Good length" };
}

/** do the phrases people should find you with actually appear in the text? */
export function focusVerdict(focus: string[], text: string): Verdict | null {
  if (focus.length === 0) return null;
  const low = text.toLowerCase();
  const missing = focus.filter((f) => !low.includes(f.toLowerCase()));
  return missing.length === 0
    ? { tone: "good", text: "Your focus phrases appear in the title or description" }
    : { tone: "warn", text: `Not yet in the title or description: ${missing.map((m) => `“${m}”`).join(", ")}` };
}

const dot = { good: "bg-emerald-400", warn: "bg-amber-400", bad: "bg-red-400" } as const;

export function VerdictLine({ v, count, max }: { v: Verdict | null; count?: number; max?: number }) {
  if (!v) return null;
  return (
    <p className="mt-2 flex items-center gap-2 text-sm text-bone/65">
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${dot[v.tone]}`} />
      <span>
        {count !== undefined && max !== undefined && (
          <span className="mr-2 text-bone/45">
            {count}/{max}
          </span>
        )}
        {v.text}
      </span>
    </p>
  );
}
