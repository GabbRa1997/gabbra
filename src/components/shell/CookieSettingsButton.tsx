"use client";

import { OPEN_CONSENT } from "./Analytics";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT))}
      className="t-label border border-line px-5 py-3 text-bone/80 transition-colors hover:border-[var(--tint)] hover:text-[var(--tint)]"
    >
      Change my cookie choice
    </button>
  );
}
