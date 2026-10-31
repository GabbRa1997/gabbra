import type { CSSProperties, ReactNode } from "react";

export function PageFrame({
  tint = "#ecebe6",
  eyebrow,
  title,
  lead,
  children,
}: {
  tint?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <main
      id="main"
      className="mx-auto min-h-svh w-full max-w-[1400px] px-5 pb-24 pt-32 md:px-10 md:pt-44"
      style={{ ["--tint" as string]: tint } as CSSProperties}
    >
      {eyebrow && <p className="t-label mb-6 text-[var(--tint)]">{eyebrow}</p>}
      <h1 className="t-wide text-[clamp(2.5rem,8vw,7rem)]">{title}</h1>
      {lead && <p className="mt-8 max-w-xl text-lg text-bone/60">{lead}</p>}
      <div className="mt-16">{children}</div>
    </main>
  );
}

/** A clearly labelled stand-in for real content. */
export function Placeholder({
  label,
  ratio = "3 / 2",
  note = "Placeholder — image to be supplied",
}: {
  label: string;
  ratio?: string;
  note?: string;
}) {
  return (
    <figure className="group relative overflow-hidden border border-line bg-coal" style={{ aspectRatio: ratio }}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "repeating-linear-gradient(135deg, transparent 0 14px, rgba(236,235,230,.035) 14px 15px)",
        }}
      />
      <figcaption className="t-label absolute inset-x-4 bottom-4 flex justify-between text-steel">
        <span>{label}</span>
        <span className="hidden text-bone/30 sm:inline">{note}</span>
      </figcaption>
    </figure>
  );
}
