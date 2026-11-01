"use client";

import { useEffect, useState } from "react";
import { checkToken, clearToken, getToken, setToken } from "@/lib/github";
import BlogAdmin from "./BlogAdmin";
import FilmAdmin from "./FilmAdmin";
import FpvAdmin from "./FpvAdmin";
import PhotoAdmin from "./PhotoAdmin";
import { Btn, Input, Label } from "./ui";

const TABS = [
  { id: "blog", label: "Blog", View: BlogAdmin },
  { id: "photo", label: "Photography", View: PhotoAdmin },
  { id: "film", label: "Film", View: FilmAdmin },
  { id: "fpv", label: "FPV", View: FpvAdmin },
] as const;

export default function AdminApp() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("blog");

  useEffect(() => {
    setSignedIn(!!getToken());
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!signedIn) return <SignIn onDone={() => setSignedIn(true)} />;

  const View = TABS.find((t) => t.id === tab)!.View;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`t-label border px-4 py-2.5 transition-colors ${
                tab === t.id ? "border-[var(--tint)] text-[var(--tint)]" : "border-line text-bone/65 hover:text-bone"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <Btn
          tone="danger"
          onClick={() => {
            clearToken();
            setSignedIn(false);
          }}
        >
          Sign out
        </Btn>
      </div>
      <div className="mt-10">
        <View key={tab} />
      </div>
    </div>
  );
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const token = value.trim();
    if (!token) return;
    setBusy(true);
    setError("");
    const problem = await checkToken(token);
    setBusy(false);
    if (problem) return setError(problem);
    setToken(token);
    onDone();
  };

  return (
    <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
      <div className="max-w-xl">
        <h2 className="t-wide text-[1.8rem] text-bone">Sign in with your GitHub key</h2>
        <p className="mt-4 text-bone/60">
          Only you can change the site. The key lives in this browser only, never on the website. You make it once, and it
          lasts up to a year.
        </p>
        <div className="mt-8 space-y-4">
          <Label text="Your key">
            <Input
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="github_pat_…"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
            />
          </Label>
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
          <Btn tone="main" disabled={busy || !value.trim()} onClick={() => void submit()}>
            {busy ? "Checking…" : "Sign in"}
          </Btn>
        </div>
      </div>
      <ol className="space-y-4 border border-line p-6 text-sm text-bone/65">
        <li className="t-label text-[0.62rem] text-[var(--tint)]">How to make the key</li>
        <li>
          1. Open{" "}
          <a
            className="text-bone underline underline-offset-4"
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub → new fine-grained token
          </a>{" "}
          (signed in as GabbRa1997).
        </li>
        <li>2. Name it “GabbRa admin” and set the expiry to 1 year.</li>
        <li>3. Under Repository access, choose “Only select repositories” and pick <strong>gabbra</strong>.</li>
        <li>
          4. Under Permissions → Repository permissions, set <strong>Contents</strong> to “Read and write”.
        </li>
        <li>5. Press Generate token, copy it, and paste it here.</li>
      </ol>
    </div>
  );
}
