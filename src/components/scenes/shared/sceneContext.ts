import { createContext, useContext, type MutableRefObject } from "react";
import type * as THREE from "three";

export type Vec3 = [number, number, number];

/** What the engine needs to know about a part to move it. */
export interface PartLike {
  id: string;
  home: Vec3;
  exploded: Vec3;
  /** 0 = moves first, 1 = moves last */
  delay: number;
  /** camera distance when inspecting this part */
  focus: number;
  /** fades to a ghost when exploded so internals show */
  ghost?: boolean;
}

/** What the interface needs to describe a part to a person. */
export interface PartInfo extends PartLike {
  name: string;
  group: string;
  role: string;
  function: string;
  spec?: string;
  /** the section this part opens */
  section?: string;
}

/** Mutable animation state, read every frame without re-rendering React. */
export interface SceneState {
  /** current explosion, 0..1 (animated) */
  t: number;
  /** where t is heading */
  target: number;
  selected: string | null;
  hovered: string | null;
  reduced: boolean;
  autoRotate: boolean;
}

export interface SceneApi<M = Record<string, THREE.Material>> {
  state: MutableRefObject<SceneState>;
  /** world position of each part, updated every frame */
  registry: Map<string, THREE.Vector3>;
  mats: M;
  /** highlight colour for hover and selection */
  accent: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export const SceneCtx = createContext<SceneApi | null>(null);

export function useScene<M = Record<string, THREE.Material>>() {
  const c = useContext(SceneCtx);
  if (!c) throw new Error("useScene outside <SceneCtx.Provider>");
  return c as unknown as SceneApi<M>;
}
