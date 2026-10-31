"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/content/site";

const TYPES = ["Photography", "FPV", "Film", "Print", "Collaboration", "Something else"];
const FROM_QUERY: Record<string, string> = { print: "Print", photography: "Photography", fpv: "FPV", film: "Film" };

/**
 * Commission enquiries. Without a mail server there is nothing to hide, so the
 * form composes the message and hands it to the visitor's own email app.
 */
export default function ContactForm() {
  const q = useSearchParams();
  const ref = q.get("ref") ?? "";
  const [type, setType] = useState(FROM_QUERY[q.get("type") ?? ""] ?? TYPES[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(ref ? `I would like to enquire about: ${ref}\n\n` : "");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `${type} enquiry${name ? ` from ${name}` : ""}`;
    const body = `${message}\n\n—\n${name}\n${email}`;
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const field = "w-full border border-line bg-transparent px-4 py-3.5 text-bone placeholder:text-bone/30 focus:border-[var(--tint)] focus:outline-none";
  return (
    <form onSubmit={submit} className="grid max-w-xl gap-6">
      <label className="grid gap-2">
        <span className="t-label text-steel">What is it about?</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${field} appearance-none`}>
          {TYPES.map((t) => (
            <option key={t} value={t} className="bg-ink">
              {t}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="t-label text-steel">Your name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
        </label>
        <label className="grid gap-2">
          <span className="t-label text-steel">Your email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="t-label text-steel">Tell me about it</span>
        <textarea required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className={field} />
      </label>
      <div className="flex flex-wrap items-center gap-6">
        <button type="submit" className="t-label-lg border border-[var(--tint)] px-7 py-4 text-[var(--tint)] transition-colors hover:bg-[var(--tint)] hover:text-ink">
          Write the email →
        </button>
        {sent && (
          <p role="status" className="text-sm text-bone/55">
            Your email app should open with the message ready. If it did not, write to{" "}
            <a className="text-[var(--tint)] underline underline-offset-4" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}
