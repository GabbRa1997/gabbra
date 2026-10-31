"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string, initial = false) {
  const [match, setMatch] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

export const useReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

export type Quality = "full" | "lite" | "none";

/** Decide how much 3D this device can take. Runs on the client only. */
export function detectQuality(): Quality {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl) return "none";
    const small = window.matchMedia("(max-width: 820px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
    return small || coarse || weak ? "lite" : "full";
  } catch {
    return "none";
  }
}
