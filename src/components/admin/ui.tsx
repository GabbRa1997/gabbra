"use client";

import { useCallback, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { REPO } from "@/lib/github";

export const field =
  "w-full border border-line bg-transparent px-3 py-2.5 text-bone placeholder:text-bone/30 focus:border-[var(--tint)] focus:outline-none";

export function Btn({ tone = "plain", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "plain" | "main" | "danger" }) {
  const t =
    tone === "main"
      ? "border-bone/50 text-bone hover:border-bone hover:bg-bone hover:text-ink"
      : tone === "danger"
        ? "border-line text-bone/60 hover:border-red-400/70 hover:text-red-300"
        : "border-line text-bone/75 hover:border-[var(--tint)] hover:text-[var(--tint)]";
  return (
    <button
      type="button"
      {...p}
      className={`t-label border px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${t} ${className}`}
    />
  );
}

export function Label({ text, hint, children }: { text: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="t-label mb-2 block text-[0.62rem] text-steel">
        {text}
        {hint && <span className="ml-2 normal-case tracking-normal text-bone/30">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${field} ${p.className ?? ""}`} />;

const parseList = (t: string) => t.split(",").map((x) => x.trim()).filter(Boolean);

/**
 * A comma-separated list in one box. It keeps exactly what is typed (commas, spaces and
 * all) and hands back the cleaned-up list, so typing "fpv, " is not undone mid-sentence.
 * Give it a `key` when the list it shows can be swapped for another one.
 */
export function ListInput({
  value,
  onChange,
  ...p
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(", "));
  return (
    <Input
      {...p}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseList(e.target.value));
      }}
      onBlur={() => setText(value.join(", "))}
    />
  );
}
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={`${field} ${p.className ?? ""}`} />
);

/** up / down / remove, used on every list the admin can sort */
export function RowTools({
  onUp,
  onDown,
  onRemove,
  removeLabel = "Remove",
}: {
  onUp?: () => void;
  onDown?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <span className="flex gap-2">
      {onUp && (
        <Btn aria-label="Move up" title="Move up" onClick={onUp} className="px-3">
          ↑
        </Btn>
      )}
      {onDown && (
        <Btn aria-label="Move down" title="Move down" onClick={onDown} className="px-3">
          ↓
        </Btn>
      )}
      {onRemove && (
        <Btn tone="danger" onClick={onRemove}>
          {removeLabel}
        </Btn>
      )}
    </span>
  );
}

export function move<T>(list: T[], i: number, by: -1 | 1): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

type Phase = "idle" | "saving" | "done" | "error";

/** Runs a save and tracks how it went, for the Publish bar. */
export function usePublisher() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const run = useCallback(async (fn: () => Promise<void>) => {
    setPhase("saving");
    setMessage("");
    try {
      await fn();
      setPhase("done");
    } catch (e) {
      setPhase("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, []);
  const reset = useCallback(() => setPhase("idle"), []);
  return { phase, message, run, reset };
}

export function PublishBar({
  dirty,
  phase,
  message,
  onPublish,
  label = "Publish changes",
}: {
  dirty: boolean;
  phase: Phase;
  message: string;
  onPublish: () => void;
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line bg-ink/95 px-5 py-4 backdrop-blur-sm md:-mx-10 md:px-10">
      <Btn tone="main" disabled={!dirty || phase === "saving"} onClick={onPublish}>
        {phase === "saving" ? "Publishing…" : label}
      </Btn>
      <p role="status" className="text-sm text-bone/60">
        {phase === "saving" && "Saving to the site. Large photos can take a minute."}
        {phase === "done" && (
          <>
            Saved. The site rebuilds now and is live in about 2 minutes.{" "}
            <a
              className="text-[var(--tint)] underline underline-offset-4"
              href={`https://github.com/${REPO}/actions`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch progress
            </a>
          </>
        )}
        {phase === "error" && <span className="text-red-300">{message}</span>}
        {phase === "idle" && (dirty ? "You have changes that are not published yet." : "Nothing to publish.")}
      </p>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="border border-line px-4 py-3 text-sm text-bone/60">{children}</p>;
}
