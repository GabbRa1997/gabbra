"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState, type MutableRefObject, type ReactElement } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import PartGroup from "./PartGroup";
import { SceneCtx, type PartLike, type SceneState } from "./sceneContext";

export type Quality = "full" | "lite";

/** What a page hands to the scene each render. */
export interface SceneProps {
  quality: Quality;
  portrait: boolean;
  state: MutableRefObject<SceneState>;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onMissed: () => void;
}

/** What makes one exploded scene different from another. */
export interface SceneConfig {
  parts: PartLike[];
  /** parts that never explode and sit in the background (set home = exploded) */
  fixedParts?: PartLike[];
  models: Record<string, () => ReactElement>;
  makeMats: (q: Quality) => Record<string, THREE.Material>;
  accent: string;
  palette: { key: string; rim: string; kick: string; sparkle: string };
  /** degrees around the vertical axis, and camera height as a fraction of distance */
  view: { azimuth: number; elevation: number };
  layout: {
    /** which axis of the assembly grows when it explodes */
    axis: "y" | "z";
    /** stand the assembly upright on narrow screens */
    rotatePortrait: boolean;
    /** middle of the assembly along that axis, so it stays centred */
    center: { assembled: number; exploded: number };
  };
  /** how much space the assembly needs on screen, in the scene's units */
  frame: (t: number, portrait: boolean) => { w: number; h: number };
}

const FOV_LANDSCAPE = 28;
const FOV_PORTRAIT = 34;

/** Animates the explosion value and keeps the assembly centred as it grows. */
function Clock({
  state,
  portrait,
  asm,
  layout,
}: {
  state: MutableRefObject<SceneState>;
  portrait: boolean;
  asm: MutableRefObject<THREE.Group | null>;
  layout: SceneConfig["layout"];
}) {
  useFrame((_, dt) => {
    const s = state.current;
    s.t = s.reduced ? s.target : THREE.MathUtils.damp(s.t, s.target, 2.6, dt);
    const g = asm.current;
    if (!g) return;
    const c = THREE.MathUtils.lerp(layout.center.assembled, layout.center.exploded, s.t);
    if (layout.axis === "y" || (portrait && layout.rotatePortrait)) g.position.set(0, -c, 0);
    else g.position.set(0, 0, -c);
  }, -5);
  return null;
}

/** Frames the shot: dollies with the explosion, and flies to whatever is selected. */
function Rig({
  state,
  registry,
  portrait,
  controls,
  focusById,
  frame,
}: {
  state: MutableRefObject<SceneState>;
  registry: Map<string, THREE.Vector3>;
  portrait: boolean;
  controls: MutableRefObject<OrbitControlsImpl | null>;
  focusById: Record<string, number>;
  frame: SceneConfig["frame"];
}) {
  const { camera, size } = useThree();
  const key = useRef("");
  const tween = useRef(3.2);
  const goalTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const ctl = controls.current;
    if (!ctl) return;
    const s = state.current;
    const fov = portrait ? FOV_PORTRAIT : FOV_LANDSCAPE;
    const aspect = size.width / size.height;
    const tanH = Math.tan(THREE.MathUtils.degToRad(fov / 2));

    const k = `${s.selected}|${Math.round(s.target * 10)}|${portrait}`;
    if (k !== key.current) {
      key.current = k;
      tween.current = 2.4;
    }

    // where to look
    if (s.selected) {
      const p = registry.get(s.selected);
      if (p) goalTarget.copy(p);
    } else goalTarget.set(0, 0, 0);
    ctl.target.lerp(goalTarget, 1 - Math.exp(-dt * 4));

    // how far back to stand
    if (tween.current > 0) {
      tween.current -= dt;
      let goal: number;
      if (s.selected) {
        const f = (focusById[s.selected] ?? 12) * 1.6;
        goal = portrait ? f * Math.max(1, 1 / (aspect * 1.25)) : f;
      } else {
        const need = frame(s.t, portrait);
        // On desktop the text columns own the sides, so frame for the middle of the
        // screen while assembled, and use more of the width once it is pulled apart.
        const usable = portrait ? 1 : THREE.MathUtils.lerp(0.58, 0.8, s.t);
        const byHeight = need.h / (2 * tanH);
        const byWidth = need.w / (2 * tanH * Math.max(aspect * usable, 0.3));
        goal = Math.max(byHeight, byWidth) * 1.04;
      }
      const offset = camera.position.clone().sub(ctl.target);
      const cur = offset.length();
      const next = THREE.MathUtils.damp(cur, goal, 3.2, dt);
      camera.position.copy(ctl.target).add(offset.setLength(next));
    }
  }, -2);
  return null;
}

/** Hangs in the dark: a slow, tiny drift so it never feels pinned. */
function Float({ float, state }: { float: MutableRefObject<THREE.Group | null>; state: MutableRefObject<SceneState> }) {
  useFrame(({ clock }) => {
    const g = float.current;
    if (!g) return;
    const s = state.current;
    if (s.reduced) return;
    const calm = s.selected ? 0.25 : 1;
    const t = clock.elapsedTime;
    g.rotation.y = Math.sin(t * 0.18) * 0.05 * calm;
    g.position.y = Math.sin(t * 0.35) * 0.18 * calm;
  });
  return null;
}

export default function ExplodedScene(props: SceneProps & SceneConfig) {
  const { quality, portrait, state, onSelect, onHover, onMissed } = props;
  const { parts, fixedParts = [], models, makeMats, accent, palette, view, layout, frame } = props;

  const mats = useMemo(() => makeMats(quality), [makeMats, quality]);
  const registry = useMemo(() => new Map<string, THREE.Vector3>(), []);
  const asm = useRef<THREE.Group | null>(null);
  const float = useRef<THREE.Group | null>(null);
  const controls = useRef<OrbitControlsImpl | null>(null);
  const [dpr, setDpr] = useState<[number, number]>(quality === "full" ? [1, 1.75] : [1, 1.25]);

  const api = useMemo(
    () => ({ state, registry, mats, accent, onSelect, onHover }),
    [state, registry, mats, accent, onSelect, onHover],
  );
  const focusById = useMemo(
    () => Object.fromEntries([...parts, ...fixedParts].map((p) => [p.id, p.focus])),
    [parts, fixedParts],
  );

  const az = THREE.MathUtils.degToRad(view.azimuth);
  const D0 = 70;
  const camPos: [number, number, number] = [Math.sin(az) * D0, D0 * view.elevation, Math.cos(az) * D0];
  const upright = portrait && layout.rotatePortrait;

  return (
    <Canvas
      dpr={dpr}
      camera={{ fov: portrait ? FOV_PORTRAIT : FOV_LANDSCAPE, near: 0.5, far: 700, position: camPos }}
      gl={{ antialias: quality === "full", alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={onMissed}
      style={{ touchAction: "none" }}
    >
      <PerformanceMonitor onDecline={() => setDpr([1, 1])} />
      <SceneCtx.Provider value={api}>
        <Suspense fallback={null}>
          <Environment resolution={256} frames={1}>
            <color attach="background" args={["#030304"]} />
            <Lightformer form="rect" intensity={8} color={palette.key} position={[-9, 11, 9]} scale={[18, 5, 1]} rotation={[-0.6, 0.55, 0]} />
            <Lightformer form="rect" intensity={5} color={palette.rim} position={[13, 3, -11]} scale={[16, 3, 1]} rotation={[0, -2.4, 0]} />
            <Lightformer form="rect" intensity={2.2} color={palette.kick} position={[-12, -4, -10]} scale={[12, 2.5, 1]} rotation={[0, 2.2, 0]} />
            <Lightformer form="ring" intensity={1.6} color="#ffffff" position={[0, -9, 6]} scale={9} rotation={[Math.PI / 2, 0, 0]} />
            <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[0, 2, 15]} scale={[11, 11, 1]} />
          </Environment>
        </Suspense>

        <directionalLight position={[-12, 16, 18]} intensity={3.4} color={palette.key} />
        <directionalLight position={[18, 6, -20]} intensity={2.6} color={palette.rim} />
        <directionalLight position={[2, -10, 12]} intensity={0.5} color="#ffffff" />

        <Clock state={state} portrait={portrait} asm={asm} layout={layout} />
        <Rig state={state} registry={registry} portrait={portrait} controls={controls} focusById={focusById} frame={frame} />
        <Float float={float} state={state} />

        <group ref={asm} rotation={upright ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
          <group ref={float}>
            {parts.map((p) => {
              const Model = models[p.id];
              return (
                <PartGroup key={p.id} part={p}>
                  <Model />
                </PartGroup>
              );
            })}
          </group>
        </group>

        {fixedParts.length > 0 && (
          <group>
            {fixedParts.map((p) => {
              const Model = models[p.id];
              return (
                <PartGroup key={p.id} part={p}>
                  <Model />
                </PartGroup>
              );
            })}
          </group>
        )}

        <Sparkles
          count={quality === "full" ? 70 : 28}
          scale={[70, 30, 40]}
          size={2.2}
          speed={0.22}
          opacity={0.32}
          color={palette.sparkle}
        />

        <OrbitControls
          ref={controls as MutableRefObject<OrbitControlsImpl>}
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.7}
          zoomSpeed={0.7}
          minDistance={4}
          maxDistance={190}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI - 0.3}
        />
      </SceneCtx.Provider>
    </Canvas>
  );
}
