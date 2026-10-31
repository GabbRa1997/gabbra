"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useScene, type PartLike } from "./sceneContext";

type Mat = THREE.MeshStandardMaterial;
interface Base {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  emissive: THREE.Color;
  emissiveIntensity: number;
}

const noRaycast = () => {};
const damp = THREE.MathUtils.damp;

/**
 * Wraps one component of an assembly. It owns the part's motion between
 * assembled and exploded, its highlight, its dimming, and its pointer events.
 */
export default function PartGroup({ part, children }: { part: PartLike; children: ReactNode }) {
  const sc = useScene();
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const mats = useRef<Mat[]>([]);
  const meshes = useRef<THREE.Mesh[]>([]);
  const world = useMemo(() => new THREE.Vector3(), []);
  const accent = useMemo(() => new THREE.Color(sc.accent), [sc.accent]);
  const hl = useRef(0);
  const rayOff = useRef(false);

  // Each part gets private copies of its materials so it can fade on its own.
  useLayoutEffect(() => {
    const list: Mat[] = [];
    const ms: THREE.Mesh[] = [];
    outer.current?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = (mesh.material as Mat).clone();
      mesh.material = m;
      const b: Base = {
        opacity: m.opacity,
        transparent: m.transparent,
        depthWrite: m.depthWrite,
        emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0),
        emissiveIntensity: m.emissiveIntensity ?? 0,
      };
      m.userData.base = b;
      list.push(m);
      ms.push(mesh);
    });
    mats.current = list;
    meshes.current = ms;
    sc.registry.set(part.id, world);
    return () => list.forEach((m) => m.dispose());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, dt) => {
    const g = outer.current;
    if (!g) return;
    const s = sc.state.current;

    // staggered, eased travel between home and exploded
    const k = THREE.MathUtils.clamp((s.t - part.delay * 0.45) / 0.55, 0, 1);
    const e = k * k * (3 - 2 * k);
    const h = part.home;
    const x = part.exploded;
    g.position.set(h[0] + (x[0] - h[0]) * e, h[1] + (x[1] - h[1]) * e, h[2] + (x[2] - h[2]) * e);
    g.getWorldPosition(world);

    // inspection: a selected part turns slowly on its own axis
    const selected = s.selected === part.id;
    const turn = inner.current;
    if (turn) {
      if (selected && s.autoRotate && !s.reduced) turn.rotation.y += dt * 0.55;
      else if (!selected) {
        const r = turn.rotation.y;
        turn.rotation.y = damp(((r + Math.PI) % (Math.PI * 2)) - Math.PI, 0, 5, dt);
      }
    }

    // fade: ghost shells when exploded, dim everything else when one part is selected
    const ghost = !!part.ghost && s.t > 0.15;
    const dim = s.selected !== null && !selected;
    const fadeTo = ghost ? 0.1 : dim ? 0.14 : 1;

    const hoverTo = selected ? 1 : s.hovered === part.id ? 0.4 : 0;
    hl.current = damp(hl.current, hoverTo, 10, dt);

    for (const m of mats.current) {
      const b = m.userData.base as Base;
      m.opacity = damp(m.opacity, b.opacity * fadeTo, 8, dt);
      const faded = m.opacity < 0.995 * b.opacity;
      const transparent = faded || b.transparent;
      if (m.transparent !== transparent) {
        m.transparent = transparent;
        m.needsUpdate = true;
      }
      m.depthWrite = faded ? false : b.depthWrite;
      if (m.emissive) {
        m.emissive.copy(b.emissive).lerp(accent, hl.current * 0.8);
        m.emissiveIntensity = b.emissiveIntensity + hl.current * 0.12;
      }
    }

    // a ghost shell must not swallow clicks meant for what is inside it
    if (ghost !== rayOff.current) {
      rayOff.current = ghost;
      for (const mesh of meshes.current) {
        mesh.raycast = ghost ? noRaycast : THREE.Mesh.prototype.raycast;
      }
    }
  });

  return (
    <group
      ref={outer}
      onPointerOver={(e) => {
        e.stopPropagation();
        sc.onHover(part.id);
      }}
      onPointerOut={() => sc.onHover(null)}
      onClick={(e) => {
        if (e.delta > 6) return; // a drag, not a click
        e.stopPropagation();
        sc.onSelect(part.id);
      }}
    >
      <group ref={inner}>{children}</group>
    </group>
  );
}
