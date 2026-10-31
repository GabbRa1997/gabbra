"use client";

import dynamic from "next/dynamic";
import ExplodeExperience, { SceneLoading, type ExplodeConfig } from "@/components/explode/ExplodeExperience";
import { PHOTO_SECTIONS } from "@/content/photo";
import { PARTS } from "@/components/scenes/photo/partData";

// The whole 3D scene (three.js, R3F, models) loads only on this page.
const Scene = dynamic(() => import("@/components/scenes/photo/CameraScene"), {
  ssr: false,
  loading: () => <SceneLoading label="Loading the camera…" />,
});

const CONFIG: ExplodeConfig = {
  tint: "#e6b980",
  eyebrow: "01 / Photography",
  title: "Open the camera.",
  intro: "Every way into the photography runs through the machine that made it.",
  hrefBase: "/photo",
  sections: PHOTO_SECTIONS,
  sectionsLabel: "Photography",
  parts: PARTS,
  groups: ["Lens", "Optics", "Body", "Electronics"],
  Scene,
  ariaLabel:
    "Interactive 3D exploded view of a Canon EOS 550D. Drag to orbit, pinch or scroll to zoom, select a part to inspect it. The same controls are available as buttons and lists.",
  inspectText:
    "Take the camera apart, then select any component. The lens, the sensor, the viewfinder and the shutter each open a part of the work.",
  modelNote: "Simplified, representative model. Not a manufacturer drawing.",
  atmosphere:
    "radial-gradient(ellipse 60% 55% at 52% 42%, rgba(230,185,128,.10), transparent 70%), radial-gradient(ellipse 120% 90% at 50% 120%, rgba(143,211,255,.05), transparent 60%)",
  fallbackNote: "3D view unavailable on this device. Here is the camera as a technical sheet.",
};

export default function PhotoExperience() {
  return <ExplodeExperience config={CONFIG} />;
}
