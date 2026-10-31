"use client";

import { useSound } from "./SoundProvider";

/** The mute control. Always visible, always labelled. */
export default function SoundToggle({ className = "" }: { className?: string }) {
  const { enabled, toggle } = useSound();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute sound" : "Turn sound on"}
      className={`t-label group inline-flex items-center gap-3 text-bone/70 transition-colors hover:text-bone ${className}`}
    >
      <span aria-hidden className="flex h-3 items-end gap-[3px]">
        {[0.5, 1, 0.65, 0.85].map((h, i) => (
          <span
            key={i}
            className="w-[2px] bg-current transition-all duration-500"
            style={{ height: enabled ? `${h * 100}%` : "2px" }}
          />
        ))}
      </span>
      <span>{enabled ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
