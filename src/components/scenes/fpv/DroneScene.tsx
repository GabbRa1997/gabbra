"use client";

import * as THREE from "three";
import ExplodedScene, { type SceneConfig, type SceneProps } from "../shared/ExplodedScene";
import { PART_MODELS } from "./DroneParts";
import { makeDroneMaterials } from "./materials";
import { CENTER, FIXED, MOVING } from "./partData";

const CONFIG: SceneConfig = {
  parts: MOVING,
  fixedParts: FIXED,
  models: PART_MODELS,
  makeMats: makeDroneMaterials as SceneConfig["makeMats"],
  accent: "#e6b980",
  // the same warm key and cool rim as the studio, so the three worlds belong together
  palette: { key: "#ffe2bd", rim: "#9ec9ff", kick: "#ffb070", sparkle: "#e8dcc8" },
  // from the front-left and well above, so props, stack and layers all read
  view: { azimuth: -34, elevation: 0.42 },
  layout: { axis: "y", rotatePortrait: false, center: CENTER },
  frame: (t) => ({
    // the high camera adds the quad's depth to its apparent height, so allow for it
    w: THREE.MathUtils.lerp(32, 34, t),
    h: THREE.MathUtils.lerp(19, 42, t),
  }),
};

export default function DroneScene(props: SceneProps) {
  return <ExplodedScene {...props} {...CONFIG} />;
}
