"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { SITE } from "@/content/site";
import TLink from "./TLink";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || SITE.gaId;
const KEY = "gabbra:consent";
export const OPEN_CONSENT = "gabbra:consent-open";

type Choice = "granted" | "denied" | null;

const read = (): Choice => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
};

/** Forget any Google Analytics cookies, e.g. when a visitor withdraws consent. */
function clearGaCookies() {
  const host = window.location.hostname;
  const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const name of document.cookie.split(";").map((c) => c.split("=")[0].trim())) {
    if (name === "_ga" || name.startsWith("_ga_")) {
      for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=${d}`;
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}

/**
 * Google Analytics, loaded only after a visitor says yes. Until a measurement ID is
 * set in src/content/site.ts, this renders nothing and loads nothing.
 */
export default function Analytics() {
  const [choice, setChoice] = useState<Choice>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    const c = read();
    setChoice(c);
    setAsking(c === null);
    const reopen = () => setAsking(true);
    window.addEventListener(OPEN_CONSENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT, reopen);
  }, []);

  if (!GA_ID) return null;

  const decide = (c: Exclude<Choice, null>) => {
    try {
      localStorage.setItem(KEY, c);
    } catch {}
    if (c === "denied") {
      (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true;
      clearGaCookies();
    } else {
      (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = false;
    }
    setChoice(c);
    setAsking(false);
  };

  return (
    <>
      {choice === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {asking && (
        <div
          role="dialog"
          aria-label="Cookies"
          className="fixed inset-x-4 bottom-4 z-[60] border border-line bg-ink/95 p-5 backdrop-blur-sm md:left-auto md:right-6 md:max-w-sm"
        >
          <p className="text-sm leading-relaxed text-bone/70">
            May I use Google Analytics to count visits? It sets cookies and tells me which pages people enjoy. Nothing is
            tracked unless you say yes.{" "}
            <TLink href="/privacy" variant="fade" className="text-bone underline underline-offset-4">
              Privacy
            </TLink>
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => decide("granted")}
              className="t-label border border-bone/40 px-5 py-2.5 text-bone transition-colors hover:border-bone hover:bg-bone hover:text-ink"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => decide("denied")}
              className="t-label border border-transparent px-5 py-2.5 text-bone/60 transition-colors hover:text-bone"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}
