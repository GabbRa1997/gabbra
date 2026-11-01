"use client";

import { RoundedBox } from "@react-three/drei";
import { useMemo, type ReactElement } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  lensGeometry,
  pentamirrorGeometry,
  plateGeometry,
  tubeGeometry,
} from "./geometry";
import { smooth } from "../shared/detail";
import { useScene } from "../shared/sceneContext";

/** Geometry is built once per part and kept; never rebuilt per frame. */
const useOnce = <T,>(f: () => T): T => useMemo(f, []); // eslint-disable-line react-hooks/exhaustive-deps

const TAU = Math.PI * 2;

/** Grip ridges for rings and dials: many small bars around an axis, merged into one mesh. */
function ridgedRing(r: number, len: number, count: number, w: number, h: number, axis: "z" | "y" = "z") {
  const bars: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU;
    const g = new THREE.BoxGeometry(w, h, len);
    g.rotateZ(a - Math.PI / 2);
    g.translate(Math.cos(a) * r, Math.sin(a) * r, 0);
    bars.push(g);
  }
  const merged = mergeGeometries(bars)!;
  if (axis === "y") merged.rotateX(Math.PI / 2);
  return merged;
}

// ───────────────────────── Lens ─────────────────────────

function Ring({ r, len }: { r: number; len: number }) {
  const { mats } = useScene();
  const g = useOnce(() => tubeGeometry(r + 0.22, r - 0.04, len, { seg: 48 }));
  return <mesh geometry={g} material={mats.metalDark} />;
}

function Element({
  R,
  edge,
  cf,
  cb,
  z = 0,
  ring = true,
}: {
  R: number;
  edge: number;
  cf: number;
  cb: number;
  z?: number;
  ring?: boolean;
}) {
  const { mats } = useScene();
  const g = useOnce(() => lensGeometry(R, edge, cf, cb));
  return (
    <group position={[0, 0, z]}>
      <mesh geometry={g} material={mats.glass} />
      {ring && <Ring r={R} len={edge + 0.12} />}
    </group>
  );
}

function FrontRing() {
  const { mats } = useScene();
  const base = useOnce(() => tubeGeometry(3.32, 2.5, 0.8));
  const thread = useOnce(() => tubeGeometry(3.15, 2.45, 0.3));
  const ridges = useOnce(() => ridgedRing(3.34, 0.6, 72, 0.09, 0.1));
  return (
    <>
      <mesh geometry={base} material={mats.rubber} />
      <mesh geometry={ridges} material={mats.rubberDark} position={[0, 0, -0.05]} />
      <mesh geometry={thread} material={mats.metal} position={[0, 0, 0.45]} />
    </>
  );
}

function ZoomRing() {
  const { mats } = useScene();
  const base = useOnce(() => tubeGeometry(3.4, 3.28, 2.2, { seg: 96 }));
  const ridges = useOnce(() => ridgedRing(3.42, 1.7, 110, 0.085, 0.12));
  const edge = useOnce(() => tubeGeometry(3.46, 3.28, 0.1, { seg: 96 }));
  return (
    <>
      <mesh geometry={base} material={mats.rubber} />
      <mesh geometry={ridges} material={mats.rubberDark} />
      <mesh geometry={edge} material={mats.metalDark} position={[0, 0, 1.05]} />
      <mesh geometry={edge} material={mats.metalDark} position={[0, 0, -1.05]} />
      {/* focal-length marks on the front edge */}
      {[-14, -7, 0, 7, 14].map((d) => {
        const a = Math.PI / 2 + (d / 180) * Math.PI;
        return (
          <mesh key={d} position={[Math.cos(a) * 3.47, Math.sin(a) * 3.47, 0.78]} rotation={[0, 0, a - Math.PI / 2]} material={mats.white}>
            <boxGeometry args={[0.05, 0.3, 0.02]} />
          </mesh>
        );
      })}
    </>
  );
}

function OuterBarrel() {
  const { mats } = useScene();
  const g = useOnce(() => tubeGeometry(3.3, 3.0, 5.8, { seg: 96 }));
  const band = useOnce(() => tubeGeometry(3.34, 3.0, 0.14));
  return (
    <>
      <mesh geometry={g} material={mats.plastic} />
      <mesh geometry={band} material={mats.metal} position={[0, 0, 2.55]} />
      <mesh geometry={band} material={mats.metal} position={[0, 0, -2.55]} />
      {/* AF / MF switch */}
      <mesh position={[3.33, 0, -0.9]} material={mats.rubberDark}>
        <boxGeometry args={[0.12, 1.5, 0.55]} />
      </mesh>
      <mesh position={[3.4, 0.28, -0.9]} material={mats.metalDark}>
        <boxGeometry args={[0.12, 0.45, 0.3]} />
      </mesh>
      {/* lens-mount index dot */}
      <mesh position={[0, 3.31, -2.55]} material={mats.white}>
        <cylinderGeometry args={[0.13, 0.13, 0.06, 16]} />
      </mesh>
      {/* a distance window, dark and reflective */}
      <mesh position={[0, 3.33, 0.9]} material={mats.chip}>
        <boxGeometry args={[1.5, 0.05, 0.6]} />
      </mesh>
    </>
  );
}

function InnerTube() {
  const { mats } = useScene();
  const g = useOnce(() => tubeGeometry(2.7, 2.5, 4.6));
  const flange = useOnce(() => tubeGeometry(2.85, 2.5, 0.2));
  return (
    <>
      <mesh geometry={g} material={mats.metalDark} />
      <mesh geometry={flange} material={mats.metal} position={[0, 0, 2.2]} />
      <mesh geometry={flange} material={mats.metal} position={[0, 0, -2.2]} />
    </>
  );
}

function Diaphragm() {
  const { mats } = useScene();
  const ring = useOnce(() => tubeGeometry(2.45, 1.95, 0.16));
  const blades = 7;
  return (
    <>
      <mesh geometry={ring} material={mats.metalDark} />
      {Array.from({ length: blades }, (_, i) => {
        const a = (i / blades) * TAU;
        return (
          <group key={i} rotation={[0, 0, a]} position={[0, 0, (i % 2) * 0.03 - 0.015]}>
            <mesh position={[1.5, 0, 0]} rotation={[0, 0, 0.5]} material={mats.metalDark}>
              <boxGeometry args={[1.35, 0.85, 0.02]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function Doublet() {
  return (
    <>
      <Element R={1.9} edge={0.2} cf={0.5} cb={0.1} z={0.2} ring={false} />
      <Element R={1.9} edge={0.18} cf={0.12} cb={-0.2} z={-0.2} />
    </>
  );
}

// ───────────────────────── Body ─────────────────────────

function Mount() {
  const { mats } = useScene();
  const g = useOnce(() => tubeGeometry(3.1, 2.35, 0.6, { seg: 96 }));
  return (
    <>
      <mesh geometry={g} material={mats.metal} />
      {[90, 210, 330].map((d) => {
        const a = (d / 180) * Math.PI;
        return (
          <mesh
            key={d}
            position={[Math.cos(a) * 2.25, Math.sin(a) * 2.25, 0.12]}
            rotation={[0, 0, a]}
            material={mats.metal}
          >
            <boxGeometry args={[0.4, 0.75, 0.22]} />
          </mesh>
        );
      })}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[(i - 2) * 0.28, 2.32, -0.2]} rotation={[Math.PI / 2, 0, 0]} material={mats.gold}>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 12]} />
        </mesh>
      ))}
      <mesh position={[-2.55, 2.55, 0.32]} rotation={[Math.PI / 2, 0, 0]} material={mats.white}>
        <cylinderGeometry args={[0.14, 0.14, 0.06, 16]} />
      </mesh>
    </>
  );
}

function FrontPlate() {
  const { mats } = useScene();
  const g = useOnce(() => plateGeometry(12.7, 7.3, 1.3, 0.3, { circle: 2.72, y: 0.25 }, 0.1));
  return (
    <>
      <mesh geometry={g} material={mats.rubber} />
      {/* lens release and depth-of-field preview */}
      <mesh position={[3.9, -0.8, 0.28]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
        <cylinderGeometry args={[0.3, 0.3, 0.14, 24]} />
      </mesh>
      <mesh position={[3.9, -2.0, 0.26]} rotation={[Math.PI / 2, 0, 0]} material={mats.metalDark}>
        <cylinderGeometry args={[0.24, 0.24, 0.1, 24]} />
      </mesh>
      {/* self-timer lamp */}
      <mesh position={[-3.9, 1.6, 0.26]} rotation={[Math.PI / 2, 0, 0]} material={mats.glass}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
      </mesh>
      {/* a hint of mic holes */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[3.3 + (i % 3) * 0.28, 2.6 + Math.floor(i / 3) * 0.28, 0.26]} rotation={[Math.PI / 2, 0, 0]} material={mats.chip}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 8]} />
        </mesh>
      ))}
    </>
  );
}

function Grip() {
  const { mats } = useScene();
  return (
    <>
      <RoundedBox args={[3.0, 7.5, 2.1]} radius={0.95} smoothness={smooth(6)} material={mats.rubberSoft} />
      {/* the contour the fingers wrap around */}
      <RoundedBox args={[1.5, 6.6, 1.0]} radius={0.5} smoothness={smooth(5)} position={[0.35, -0.1, 1.0]} material={mats.rubberSoft} />
      {[-2.4, -1.5, -0.6, 0.3, 1.2].map((y) => (
        <mesh key={y} position={[0.35, y, 1.52]} material={mats.rubberDark}>
          <boxGeometry args={[1.3, 0.06, 0.05]} />
        </mesh>
      ))}
      {/* infrared remote window */}
      <mesh position={[-0.2, 2.9, 1.06]} material={mats.chip}>
        <boxGeometry args={[0.8, 0.5, 0.06]} />
      </mesh>
    </>
  );
}

function Frame() {
  const { mats } = useScene();
  // outer 12.9 × 7.5 × 5.0; the bevel is what makes it read as moulded, not cut
  const g = useOnce(() => plateGeometry(12.66, 7.26, 1.4, 4.76, { w: 12.24, h: 6.84, r: 0.5 }, 0.12));
  const lug = useOnce(() => new THREE.TorusGeometry(0.42, 0.1, 10, 28, Math.PI * 1.55));
  return (
    <>
      <mesh geometry={g} material={mats.rubber} />
      {/* strap lugs */}
      {[6.55, -6.55].map((x) => (
        <group key={x} position={[x, 2.2, -1.6]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={mats.metalDark}>
            <boxGeometry args={[0.9, 0.5, 0.5]} />
          </mesh>
          <mesh geometry={lug} material={mats.metal} position={[0, 0.1, 0.3]} rotation={[0, 0, -0.4]} />
        </group>
      ))}
      {/* tripod socket */}
      <mesh position={[0, -3.76, -2.2]} material={mats.metal}>
        <cylinderGeometry args={[0.62, 0.62, 0.1, 28]} />
      </mesh>
      <mesh position={[0, -3.8, -2.2]} material={mats.chip}>
        <cylinderGeometry args={[0.36, 0.36, 0.1, 20]} />
      </mesh>
      {/* connector cover */}
      <mesh position={[6.48, -0.4, -3.0]} material={mats.rubberDark}>
        <boxGeometry args={[0.1, 3.6, 2.2]} />
      </mesh>
      {/* the seam between front shell and back */}
      <mesh position={[0, 0, 2.28]} material={mats.rubberDark}>
        <boxGeometry args={[12.92, 7.52, 0.04]} />
      </mesh>
    </>
  );
}

function Hump() {
  const { mats } = useScene();
  const hotShoe = useOnce(() => plateGeometry(2.1, 1.8, 0.2, 0.08, { w: 1.5, h: 1.2, r: 0.1 }));
  return (
    <>
      {/* two stacked, softened masses: the body of the prism housing and its crown */}
      <RoundedBox args={[7.6, 1.5, 4.3]} radius={0.55} smoothness={smooth(5)} position={[0, -0.4, 0]} material={mats.plastic} />
      <RoundedBox args={[5.4, 1.5, 3.7]} radius={0.72} smoothness={smooth(6)} position={[0, 0.45, -0.15]} material={mats.plastic} />
      {/* the recess the flash rises from */}
      <mesh position={[0, 0.78, 1.55]} rotation={[0.28, 0, 0]} material={mats.chip}>
        <boxGeometry args={[3.0, 0.08, 1.0]} />
      </mesh>
      {/* AF assist lamp */}
      <mesh position={[0, -0.55, 2.19]} rotation={[Math.PI / 2, 0, 0]} material={mats.glass}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 16]} />
      </mesh>
      {/* speaker slots */}
      {[-2.9, -2.65, -2.4].map((x) => (
        <mesh key={x} position={[x, 0.9, 1.0]} material={mats.chip}>
          <boxGeometry args={[0.07, 0.04, 1.2]} />
        </mesh>
      ))}
      {/* hot shoe */}
      <mesh geometry={hotShoe} position={[0, 1.2, -0.4]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal} />
      <mesh position={[0, 1.18, -0.4]} material={mats.rubberDark}>
        <boxGeometry args={[1.2, 0.05, 1.0]} />
      </mesh>
      {/* viewfinder: eyecup and diopter wheel */}
      <RoundedBox args={[2.4, 1.2, 0.6]} radius={0.2} smoothness={smooth(4)} position={[0, 0.1, -2.35]} material={mats.rubberSoft} />
      <mesh position={[0, 0.1, -2.68]} material={mats.chip}>
        <boxGeometry args={[1.5, 0.7, 0.04]} />
      </mesh>
      <mesh position={[1.7, 0.1, -2.25]} rotation={[0, 0, Math.PI / 2]} material={mats.rubberDark}>
        <cylinderGeometry args={[0.28, 0.28, 0.4, 20]} />
      </mesh>
    </>
  );
}

function Flash() {
  const { mats } = useScene();
  return (
    // origin is the hinge; the head leans forward a little, as it does when popped up
    <group rotation={[-0.28, 0, 0]}>
      {/* two arms and their hinge */}
      {[1.35, -1.35].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]} material={mats.metalDark}>
          <boxGeometry args={[0.2, 2.3, 0.34]} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.metal}>
        <cylinderGeometry args={[0.16, 0.16, 3.0, 16]} />
      </mesh>
      {/* the head */}
      <RoundedBox args={[3.4, 1.0, 1.1]} radius={0.3} smoothness={smooth(4)} position={[0, 2.5, 0.2]} material={mats.plastic} />
      {/* ribbed fresnel lens over the tube */}
      <mesh position={[0, 2.5, 0.77]} material={mats.frosted}>
        <boxGeometry args={[2.9, 0.72, 0.06]} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, 2.2 + i * 0.075, 0.81]} material={mats.white}>
          <boxGeometry args={[2.8, 0.012, 0.02]} />
        </mesh>
      ))}
      {/* the xenon tube, glowing faintly behind the lens */}
      <mesh position={[0, 2.5, 0.6]} rotation={[0, 0, Math.PI / 2]} material={mats.chrome}>
        <cylinderGeometry args={[0.07, 0.07, 2.6, 12]} />
      </mesh>
    </group>
  );
}

function Controls() {
  const { mats } = useScene();
  const knurl = useOnce(() => ridgedRing(1.02, 0.5, 42, 0.1, 0.12, "y"));
  const small = useOnce(() => ridgedRing(0.44, 0.34, 20, 0.07, 0.07, "y"));
  return (
    <>
      {/* mode dial: knurled edge, marked top */}
      <mesh position={[0, 0.3, -0.9]} material={mats.rubberDark}>
        <cylinderGeometry args={[0.98, 0.98, 0.6, 48]} />
      </mesh>
      <mesh geometry={knurl} position={[0, 0.3, -0.9]} material={mats.metalDark} />
      <mesh position={[0, 0.62, -0.9]} material={mats.metalDark}>
        <cylinderGeometry args={[0.8, 0.8, 0.06, 48]} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * TAU;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.58, 0.66, -0.9 + Math.sin(a) * 0.58]} rotation={[0, -a, 0]} material={mats.white}>
            <boxGeometry args={[0.2, 0.02, 0.05]} />
          </mesh>
        );
      })}
      <mesh position={[0.56, 0.68, -0.9]} material={mats.metal}>
        <boxGeometry args={[0.28, 0.04, 0.1]} />
      </mesh>
      {/* shutter release with its power-switch collar */}
      <mesh position={[-0.3, 0.1, 1.3]} material={mats.metalDark}>
        <cylinderGeometry args={[0.62, 0.66, 0.2, 40]} />
      </mesh>
      <mesh position={[-0.3, 0.3, 1.3]} material={mats.metal}>
        <cylinderGeometry args={[0.38, 0.42, 0.28, 32]} />
      </mesh>
      <mesh position={[-0.3, 0.44, 1.3]} material={mats.chrome}>
        <cylinderGeometry args={[0.28, 0.3, 0.04, 32]} />
      </mesh>
      {/* main command dial, set into the grip */}
      <mesh geometry={small} position={[0.2, 0.18, 0.55]} rotation={[0, 0, Math.PI / 2]} material={mats.metalDark} />
      <mesh position={[0.2, 0.18, 0.55]} rotation={[0, 0, Math.PI / 2]} material={mats.rubberDark}>
        <cylinderGeometry args={[0.43, 0.43, 0.3, 24]} />
      </mesh>
    </>
  );
}

function MirrorBox() {
  const { mats } = useScene();
  const g = useOnce(() => plateGeometry(8.2, 5.0, 0.3, 3.0, { w: 7.6, h: 4.4, r: 0.2 }));
  return <mesh geometry={g} material={mats.rubberDark} />;
}

function Mirror() {
  const { mats } = useScene();
  return (
    <group rotation={[Math.PI / 4, 0, 0]}>
      <mesh material={mats.chrome}>
        <boxGeometry args={[5.2, 0.05, 3.2]} />
      </mesh>
      <mesh position={[0, -0.09, 0]} material={mats.rubberDark}>
        <boxGeometry args={[5.5, 0.1, 3.45]} />
      </mesh>
      <mesh position={[0, 0.0, -1.7]} material={mats.metalDark}>
        <boxGeometry args={[5.5, 0.28, 0.18]} />
      </mesh>
    </group>
  );
}

function FocusingScreen() {
  const { mats } = useScene();
  const rim = useOnce(() => plateGeometry(3.9, 2.9, 0.1, 0.1, { w: 3.5, h: 2.5, r: 0.05 }));
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh geometry={rim} material={mats.metal} />
      <mesh material={mats.frosted}>
        <boxGeometry args={[3.5, 2.5, 0.04]} />
      </mesh>
    </group>
  );
}

function Pentamirror() {
  const { mats } = useScene();
  const g = useOnce(() => pentamirrorGeometry(3.6));
  return <mesh geometry={g} material={mats.chrome} />;
}

function Shutter() {
  const { mats } = useScene();
  const frame = useOnce(() => plateGeometry(5.6, 4.0, 0.3, 0.35, { w: 4.0, h: 2.6, r: 0.15 }));
  return (
    <>
      <mesh geometry={frame} material={mats.metalDark} />
      <mesh position={[0, 1.05, 0.02]} material={mats.chip}>
        <boxGeometry args={[4.0, 1.0, 0.04]} />
      </mesh>
      <mesh position={[0, -1.05, -0.02]} material={mats.chip}>
        <boxGeometry args={[4.0, 1.0, 0.04]} />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0, 0.7 + i * 0.13, 0.05]} material={mats.metal}>
          <boxGeometry args={[4.0, 0.02, 0.01]} />
        </mesh>
      ))}
    </>
  );
}

function Filter() {
  const { mats } = useScene();
  const frame = useOnce(() => plateGeometry(3.6, 2.8, 0.1, 0.18, { w: 3.1, h: 2.3, r: 0.05 }));
  return (
    <>
      <mesh geometry={frame} material={mats.metal} />
      <mesh material={mats.glass}>
        <boxGeometry args={[3.2, 2.4, 0.1]} />
      </mesh>
    </>
  );
}

function Sensor() {
  const { mats } = useScene();
  return (
    <>
      <mesh material={mats.pcb}>
        <boxGeometry args={[5.0, 3.6, 0.12]} />
      </mesh>
      <mesh position={[0, 0, 0.09]} material={mats.die}>
        <boxGeometry args={[2.23, 1.49, 0.06]} />
      </mesh>
      <mesh position={[0, 0, 0.075]} material={mats.metal}>
        <boxGeometry args={[2.7, 1.9, 0.03]} />
      </mesh>
      {[
        [-2.0, 1.4],
        [2.0, 1.4],
        [-2.0, -1.4],
        [2.0, -1.4],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.09]} material={mats.chip}>
          <boxGeometry args={[0.5, 0.35, 0.07]} />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-1.9 + i * 0.42, -1.74, 0]} material={mats.gold}>
          <boxGeometry args={[0.2, 0.12, 0.13]} />
        </mesh>
      ))}
    </>
  );
}

function MainBoard() {
  const { mats } = useScene();
  return (
    <>
      <mesh material={mats.pcb}>
        <boxGeometry args={[8.0, 5.0, 0.12]} />
      </mesh>
      <mesh position={[1.6, 0.6, 0.13]} material={mats.chip}>
        <boxGeometry args={[1.7, 1.7, 0.15]} />
      </mesh>
      <mesh position={[-2.2, -0.7, 0.2]} material={mats.metal}>
        <boxGeometry args={[2.5, 1.9, 0.3]} />
      </mesh>
      {[
        [-3.0, 1.8, 0.8, 0.5],
        [-1.7, 1.9, 0.6, 0.6],
        [0.0, -1.7, 1.1, 0.6],
        [2.9, -1.4, 0.7, 0.7],
        [3.2, 1.7, 0.9, 0.4],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.1]} material={mats.chip}>
          <boxGeometry args={[w, h, 0.1]} />
        </mesh>
      ))}
      <mesh position={[-3.6, 0.2, 0.12]} material={mats.gold}>
        <boxGeometry args={[0.3, 2.6, 0.12]} />
      </mesh>
    </>
  );
}

function Battery() {
  const { mats } = useScene();
  return (
    <>
      <RoundedBox args={[1.7, 5.5, 3.6]} radius={0.18} smoothness={smooth(4)} material={mats.battery} />
      <mesh position={[0.86, 0.3, 0]} material={mats.label}>
        <boxGeometry args={[0.02, 3.4, 2.8]} />
      </mesh>
      {[-0.9, 0, 0.9].map((z) => (
        <mesh key={z} position={[0, -2.78, z]} material={mats.gold}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
        </mesh>
      ))}
    </>
  );
}

function RearPlate() {
  const { mats } = useScene();
  const g = useOnce(() => plateGeometry(12.7, 7.3, 1.3, 0.5, undefined, 0.1));
  return (
    <>
      <mesh geometry={g} material={mats.rubber} />
      {/* thumb rest */}
      <RoundedBox args={[2.6, 2.4, 0.18]} radius={0.12} smoothness={smooth(3)} position={[-4.4, 2.4, -0.4]} material={mats.rubberSoft} />
      {/* four-way pad and its set button */}
      <mesh position={[-4.5, -0.9, -0.4]} rotation={[Math.PI / 2, 0, 0]} material={mats.metalDark}>
        <cylinderGeometry args={[1.0, 1.0, 0.1, 40]} />
      </mesh>
      <mesh position={[-4.5, -0.9, -0.46]} rotation={[Math.PI / 2, 0, 0]} material={mats.rubberDark}>
        <cylinderGeometry args={[0.38, 0.38, 0.06, 28]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return (
          <mesh key={i} position={[-4.5 + Math.cos(a) * 0.72, -0.9 + Math.sin(a) * 0.72, -0.46]} material={mats.chip}>
            <boxGeometry args={[0.28, 0.28, 0.04]} />
          </mesh>
        );
      })}
      {/* the row above: menu, info, live view */}
      {[-5.5, -4.5, -3.5].map((x, i) => (
        <mesh key={x} position={[x, 1.0, -0.38]} rotation={[Math.PI / 2, 0, 0]} material={i === 2 ? mats.metal : mats.metalDark}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
        </mesh>
      ))}
      <mesh position={[-3.5, 1.0, -0.43]} rotation={[Math.PI / 2, 0, 0]} material={mats.chip}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 12]} />
      </mesh>
      {/* the row below: playback, erase */}
      {[-5.6, -3.4].map((x) => (
        <mesh key={x} position={[x, -2.6, -0.38]} rotation={[Math.PI / 2, 0, 0]} material={mats.metalDark}>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 24]} />
        </mesh>
      ))}
      {/* card-access lamp */}
      <mesh position={[-2.2, -3.0, -0.36]} material={mats.chip}>
        <boxGeometry args={[0.2, 0.08, 0.04]} />
      </mesh>
    </>
  );
}

function Lcd() {
  const { mats } = useScene();
  return (
    <>
      <RoundedBox args={[6.9, 4.8, 0.32]} radius={0.22} smoothness={smooth(4)} material={mats.plastic} />
      <mesh position={[0, 0, -0.17]} rotation={[0, Math.PI, 0]} material={mats.chip}>
        <planeGeometry args={[6.4, 4.35]} />
      </mesh>
      <mesh position={[0, 0, -0.172]} rotation={[0, Math.PI, 0]} material={mats.lcd}>
        <planeGeometry args={[6.05, 4.0]} />
      </mesh>
    </>
  );
}

export const PART_MODELS: Record<string, () => ReactElement> = {
  "front-ring": () => <FrontRing />,
  "zoom-ring": () => <ZoomRing />,
  "outer-barrel": () => <OuterBarrel />,
  "inner-tube": () => <InnerTube />,
  "front-element": () => <Element R={2.4} edge={0.28} cf={0.62} cb={0.1} />,
  "element-2": () => <Element R={2.25} edge={0.22} cf={0.45} cb={-0.3} />,
  "element-3": () => <Element R={2.1} edge={0.26} cf={0.5} cb={0.55} />,
  diaphragm: () => <Diaphragm />,
  doublet: () => <Doublet />,
  "element-5": () => <Element R={1.65} edge={0.25} cf={0.42} cb={0.25} />,
  "rear-element": () => <Element R={1.4} edge={0.24} cf={-0.12} cb={0.32} />,
  mount: () => <Mount />,
  "front-plate": () => <FrontPlate />,
  grip: () => <Grip />,
  frame: () => <Frame />,
  hump: () => <Hump />,
  flash: () => <Flash />,
  controls: () => <Controls />,
  "mirror-box": () => <MirrorBox />,
  mirror: () => <Mirror />,
  "focusing-screen": () => <FocusingScreen />,
  pentamirror: () => <Pentamirror />,
  shutter: () => <Shutter />,
  filter: () => <Filter />,
  sensor: () => <Sensor />,
  "main-board": () => <MainBoard />,
  battery: () => <Battery />,
  "rear-plate": () => <RearPlate />,
  lcd: () => <Lcd />,
};

