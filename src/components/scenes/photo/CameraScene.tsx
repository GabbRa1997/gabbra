"use client";

import * as THREE from "three";
import ExplodedScene, { type SceneConfig, type SceneProps } from "../shared/ExplodedScene";
import { PART_MODELS } from "./CanonParts";
import { makeMaterials } from "./materials";
import { CENTER, PARTS, SPAN } from "./partData";

const CONFIG: SceneConfig = {
  parts: PARTS,
  models: PART_MODELS,
  makeMats: makeMaterials as SceneConfig["makeMats"],
  accent: "#e6b980",
  // warm tungsten key, cool rim: the photographer's studio
  palette: { key: "#ffe2bd", rim: "#9ec9ff", kick: "#ffd7a8", sparkle: "#e8dcc8" },
  // mostly side-on, so the optical axis runs across the screen
  view: { azimuth: -66, elevation: 0.2 },
  layout: { axis: "z", rotatePortrait: true, center: CENTER },
  frame: (t, portrait) => {
    const span = THREE.MathUtils.lerp(SPAN.assembled, SPAN.exploded, t);
    return portrait
      ? { w: THREE.MathUtils.lerp(14, 28, t), h: span * 1.23 }
      : { w: span, h: THREE.MathUtils.lerp(14, 26, t) };
  },
};

export default function CameraScene(props: SceneProps) {
  return <ExplodedScene {...props} {...CONFIG} />;
}
