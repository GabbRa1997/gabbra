"use client";

import dynamic from "next/dynamic";
import ExplodeExperience, { SceneLoading, type ExplodeConfig } from "@/components/explode/ExplodeExperience";
import { FPV_SECTIONS } from "@/content/fpv";
import { GROUPS, PARTS } from "@/components/scenes/fpv/partData";

// The drone scene loads only here; the camera's code never reaches this page.
const Scene = dynamic(() => import("@/components/scenes/fpv/DroneScene"), {
  ssr: false,
  loading: () => <SceneLoading label="Loading the quad…" />,
});

const CONFIG: ExplodeConfig = {
  tint: "#e6b980",
  eyebrow: "02 / FPV",
  title: "Built for flight.",
  intro: "A five-inch freestyle quad, built by hand. Strip it to the carbon and see what it takes to fly.",
  hrefBase: "/fpv",
  sections: FPV_SECTIONS,
  sectionsLabel: "FPV",
  parts: PARTS,
  groups: GROUPS,
  Scene,
  ariaLabel:
    "Interactive 3D exploded view of a five-inch FPV drone with analog goggles in the background. Drag to orbit, pinch or scroll to zoom, select a part to inspect it. The same controls are available as buttons and lists.",
  inspectText:
    "Take the quad apart, then select any component. The camera, the goggles, the flight controller and the frame each open a part of the work.",
  modelNote: "A classic analog build. Simplified, representative model.",
  atmosphere:
    "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(230,185,128,.10), transparent 70%), radial-gradient(ellipse 90% 60% at 20% 115%, rgba(255,154,85,.07), transparent 60%)",
  fallbackNote: "3D view unavailable on this device. Here is the quad as a technical sheet.",
};

export default function FpvExperience() {
  return <ExplodeExperience config={CONFIG} />;
}
