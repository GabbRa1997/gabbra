"use client";

import { RoundedBox } from "@react-three/drei";
import { useMemo, type ReactElement } from "react";
import * as THREE from "three";
import { useScene } from "../shared/sceneContext";
import { bladeGeometry, slabGeometry, tubeGeometry } from "./geometry";
import type { DroneMats } from "./materials";
import { MOTOR_XZ } from "./partData";

const useD = () => useScene<DroneMats>();
/** Geometry is built once per part and kept; never rebuilt per frame. */
const useOnce = <T,>(f: () => T): T => useMemo(f, []); // eslint-disable-line react-hooks/exhaustive-deps

const TAU = Math.PI * 2;
const CORNERS: [number, number][] = [
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
];
/** rotation about Y that points a part's local +X out along a corner's diagonal */
const cornerAngle = (sx: number, sz: number) => -Math.atan2(sz, sx);
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0]; // lay an XY slab flat in XZ

// ───────────────────────── Frame ─────────────────────────

const ARM_LEN = 12.4;
const MOTOR_R = MOTOR_XZ * Math.SQRT2;
const ARM_MID = ARM_LEN / 2;
const MOTOR_ON_ARM = MOTOR_R - ARM_MID;

function FrameBottom() {
  const { mats } = useD();
  const body = useOnce(() =>
    slabGeometry(6.4, 11.4, 1.0, 0.5, [
      ...[1.525, -1.525].flatMap((x) =>
        [1.525, -1.525].map((y) => ({ kind: "circle" as const, x, y, r: 0.17 })),
      ),
      ...[2.15, -2.15].flatMap((x) =>
        [3.2, -3.2].map((y) => ({ kind: "circle" as const, x, y, r: 0.17 })),
      ),
      { kind: "rect" as const, x: 0, y: 4.5, w: 1.4, h: 0.5, r: 0.2 },
      { kind: "rect" as const, x: 0, y: -4.6, w: 2.8, h: 0.45, r: 0.2 },
    ]),
  );
  const arm = useOnce(() =>
    slabGeometry(ARM_LEN, 2.0, 0.95, 0.5, [
      { kind: "circle", x: MOTOR_ON_ARM, y: 0, r: 0.32 },
      ...[0, 1, 2, 3].map((i) => {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        return { kind: "circle" as const, x: MOTOR_ON_ARM + Math.cos(a) * 0.8, y: Math.sin(a) * 0.8, r: 0.13 };
      }),
    ]),
  );
  return (
    <>
      <mesh geometry={body} material={mats.carbon} rotation={FLAT} />
      {CORNERS.map(([sx, sz]) => (
        <group key={`${sx}${sz}`} rotation={[0, cornerAngle(sx, sz), 0]}>
          <mesh geometry={arm} material={mats.carbon} rotation={FLAT} position={[ARM_MID, 0, 0]} />
          {/* arm bolts into the body plate */}
          {[1.4, 2.6].map((x) => (
            <mesh key={x} position={[x, 0.29, 0]} material={mats.aluDark}>
              <cylinderGeometry args={[0.18, 0.18, 0.1, 6]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function Standoffs() {
  const { mats } = useD();
  return (
    <>
      {[2.15, -2.15].flatMap((x) =>
        [3.2, -3.2].map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh material={mats.aluBlue}>
              <cylinderGeometry args={[0.3, 0.3, 2.8, 6]} />
            </mesh>
            {[1.45, -1.45].map((y) => (
              <mesh key={y} position={[0, y, 0]} material={mats.aluDark}>
                <cylinderGeometry args={[0.23, 0.23, 0.14, 6]} />
              </mesh>
            ))}
          </group>
        )),
      )}
    </>
  );
}

function FrameTop() {
  const { mats } = useD();
  const g = useOnce(() =>
    slabGeometry(5.6, 10.4, 1.0, 0.25, [
      ...[2.15, -2.15].flatMap((x) =>
        [3.2, -3.2].map((y) => ({ kind: "circle" as const, x, y, r: 0.17 })),
      ),
      ...[1.85, -1.85].flatMap((x) =>
        [2.2, -2.2].map((y) => ({ kind: "rect" as const, x, y, w: 0.35, h: 1.8, r: 0.1 })),
      ),
      { kind: "rect" as const, x: 0, y: -4.4, w: 2.6, h: 0.9, r: 0.35 },
      { kind: "rect" as const, x: 0, y: 4.2, w: 1.4, h: 1.1, r: 0.35 },
    ]),
  );
  return (
    <>
      <mesh geometry={g} material={mats.carbon} rotation={FLAT} />
      {[2.15, -2.15].flatMap((x) =>
        [3.2, -3.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.18, z]} material={mats.aluDark}>
            <cylinderGeometry args={[0.28, 0.28, 0.12, 6]} />
          </mesh>
        )),
      )}
    </>
  );
}

// ───────────────────────── Propulsion ─────────────────────────

function Motors() {
  const { mats } = useD();
  return (
    <>
      {CORNERS.map(([sx, sz]) => (
        <group key={`${sx}${sz}`} position={[sx * MOTOR_XZ, 0, sz * MOTOR_XZ]} rotation={[0, cornerAngle(sx, sz), 0]}>
          <mesh position={[0, 0.2, 0]} material={mats.aluDark}>
            <cylinderGeometry args={[1.55, 1.55, 0.4, 40]} />
          </mesh>
          {[0, 1, 2, 3].map((i) => {
            const a = Math.PI / 4 + (i * Math.PI) / 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.8, 0.44, Math.sin(a) * 0.8]} material={mats.alu}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 6]} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.65, 0]} material={mats.aluDark}>
            <cylinderGeometry args={[1.15, 1.15, 0.5, 32]} />
          </mesh>
          <mesh position={[0, 1.85, 0]} material={mats.motorBell}>
            <cylinderGeometry args={[1.45, 1.45, 1.9, 48]} />
          </mesh>
          <mesh position={[0, 2.84, 0]} material={mats.aluDark}>
            <cylinderGeometry args={[1.45, 1.45, 0.08, 48]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * TAU;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.95, 2.89, Math.sin(a) * 0.95]} rotation={[0, -a, 0]} material={mats.chip}>
                <boxGeometry args={[0.55, 0.04, 0.22]} />
              </mesh>
            );
          })}
          <mesh position={[0, 3.12, 0]} material={mats.alu}>
            <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
          </mesh>
          {[-0.25, 0, 0.25].map((z) => (
            <mesh key={z} position={[-2.85, 0.12, z]} rotation={[0, 0, Math.PI / 2]} material={mats.wireBlack}>
              <cylinderGeometry args={[0.06, 0.06, 3.3, 8]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function Props() {
  const { mats } = useD();
  const blade = useOnce(() => bladeGeometry());
  return (
    <>
      {CORNERS.map(([sx, sz]) => (
        <group
          key={`${sx}${sz}`}
          position={[sx * MOTOR_XZ, 0, sz * MOTOR_XZ]}
          rotation={[0, cornerAngle(sx, sz), 0]}
          scale={[sx * sz > 0 ? -1 : 1, 1, 1]} // two spin each way
        >
          <mesh position={[0, 0.22, 0]} material={mats.aluDark}>
            <cylinderGeometry args={[0.58, 0.62, 0.45, 32]} />
          </mesh>
          <mesh position={[0, 0.62, 0]} material={mats.aluBlue}>
            <cylinderGeometry args={[0.36, 0.36, 0.4, 6]} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} geometry={blade} material={mats.prop} rotation={[0, (i * TAU) / 3, 0]} position={[0, 0.2, 0]} />
          ))}
        </group>
      ))}
    </>
  );
}

// ───────────────────────── Flight electronics ─────────────────────────

function Grommets({ y = 0 }: { y?: number }) {
  const { mats } = useD();
  return (
    <>
      {[1.525, -1.525].flatMap((x) =>
        [1.525, -1.525].map((z) => (
          <mesh key={`${x}${z}`} position={[x, y, z]} material={mats.rubber}>
            <cylinderGeometry args={[0.3, 0.3, 0.32, 16]} />
          </mesh>
        )),
      )}
    </>
  );
}

function Esc() {
  const { mats } = useD();
  return (
    <>
      <mesh material={mats.pcbBlack}>
        <boxGeometry args={[3.6, 0.15, 3.6]} />
      </mesh>
      <Grommets />
      {[-1.2, -0.4, 0.4, 1.2].flatMap((x) =>
        [-1.25, -0.45, 0.45, 1.25].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.12, z]} material={mats.chip}>
            <boxGeometry args={[0.55, 0.1, 0.34]} />
          </mesh>
        )),
      )}
      {[1.62, -1.62].flatMap((x) =>
        [-1.05, 1.05].flatMap((z) =>
          [-0.35, 0, 0.35].map((o) => (
            <mesh key={`${x}${z}${o}`} position={[x, 0.1, z + o]} material={mats.gold}>
              <boxGeometry args={[0.22, 0.05, 0.26]} />
            </mesh>
          )),
        ),
      )}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.1, -1.55]} material={mats.gold}>
          <boxGeometry args={[0.7, 0.06, 0.45]} />
        </mesh>
      ))}
      <mesh position={[0, 0.13, 0]} material={mats.chip}>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
      </mesh>
    </>
  );
}

function Fc() {
  const { mats } = useD();
  return (
    <>
      <mesh material={mats.pcbGreen}>
        <boxGeometry args={[3.6, 0.15, 3.6]} />
      </mesh>
      <Grommets />
      <mesh position={[-0.5, 0.13, -0.3]} material={mats.chip}>
        <boxGeometry args={[1.0, 0.12, 1.0]} />
      </mesh>
      <mesh position={[0.7, 0.11, 0.5]} material={mats.chip}>
        <boxGeometry args={[0.35, 0.09, 0.35]} />
      </mesh>
      <mesh position={[0.8, 0.11, -0.7]} material={mats.chip}>
        <boxGeometry args={[0.8, 0.09, 0.5]} />
      </mesh>
      {/* USB-C port, sticking out of the front edge */}
      <mesh position={[0, 0.2, 1.6]} material={mats.alu}>
        <boxGeometry args={[0.95, 0.32, 0.75]} />
      </mesh>
      {[-1.45, 1.45].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.2]} material={mats.white}>
          <boxGeometry args={[0.3, 0.25, 0.9]} />
        </mesh>
      ))}
      {[1.62, -1.62].flatMap((x) =>
        [-0.9, -0.5, -0.1, 0.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.1, z - 0.5]} material={mats.gold}>
            <boxGeometry args={[0.2, 0.05, 0.24]} />
          </mesh>
        )),
      )}
      {[-1.1, -0.7, -0.3, 0.1, 0.5, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.1, -1.65]} material={mats.gold}>
          <boxGeometry args={[0.24, 0.05, 0.2]} />
        </mesh>
      ))}
      <mesh position={[1.1, 0.12, 1.2]} material={mats.led}>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
      </mesh>
      {[1.525, -1.525].flatMap((x) =>
        [1.525, -1.525].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.14, z]} material={mats.alu}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 6]} />
          </mesh>
        )),
      )}
    </>
  );
}

function Receiver() {
  const { mats } = useD();
  return (
    <>
      <mesh material={mats.pcbGreen}>
        <boxGeometry args={[1.0, 0.1, 1.6]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={mats.rubber}>
        <boxGeometry args={[1.1, 0.34, 1.8]} />
      </mesh>
      <group position={[0, 0.1, -0.9]} rotation={[0.12, 0, 0]}>
        <mesh position={[0, 0, -1.0]} rotation={[Math.PI / 2, 0, 0]} material={mats.white}>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
        </mesh>
        <mesh position={[0, 0, -4.1]} rotation={[Math.PI / 2, 0, 0]} material={mats.wireBlack}>
          <cylinderGeometry args={[0.13, 0.13, 4.2, 12]} />
        </mesh>
      </group>
    </>
  );
}

// ───────────────────────── Video ─────────────────────────

function Vtx() {
  const { mats } = useD();
  return (
    <>
      <mesh material={mats.pcbBlack}>
        <boxGeometry args={[2.6, 0.15, 2.6]} />
      </mesh>
      <mesh position={[0, 0.3, 0.1]} material={mats.alu}>
        <boxGeometry args={[1.5, 0.45, 1.5]} />
      </mesh>
      <mesh position={[0, 0.2, -1.45]} rotation={[Math.PI / 2, 0, 0]} material={mats.gold}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 12]} />
      </mesh>
      <mesh position={[1.0, 0.12, 1.0]} material={mats.led}>
        <boxGeometry args={[0.16, 0.06, 0.16]} />
      </mesh>
      <mesh position={[-0.9, 0.14, 1.0]} material={mats.chip}>
        <boxGeometry args={[0.4, 0.14, 0.3]} />
      </mesh>
      {[1.525, -1.525].map((x) => (
        <mesh key={x} position={[x * 0.8, 0.14, 1.0]} material={mats.alu}>
          <cylinderGeometry args={[0.2, 0.2, 0.12, 6]} />
        </mesh>
      ))}
    </>
  );
}

function VtxAntenna() {
  const { mats } = useD();
  return (
    <>
      <mesh position={[0, 0, -1.75]} rotation={[Math.PI / 2, 0, 0]} material={mats.white}>
        <cylinderGeometry args={[0.07, 0.07, 3.5, 8]} />
      </mesh>
      <mesh position={[0, 0, -3.6]} rotation={[Math.PI / 2, 0, 0]} material={mats.tpu}>
        <cylinderGeometry args={[0.3, 0.3, 0.9, 16]} />
      </mesh>
      <mesh position={[0, 0, -5.9]} rotation={[Math.PI / 2, 0, 0]} material={mats.wireBlack}>
        <cylinderGeometry args={[0.17, 0.17, 3.6, 12]} />
      </mesh>
      {/* the pagoda */}
      {[-7.7, -8.2].map((z, i) => (
        <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} material={mats.wireBlack}>
          <cylinderGeometry args={[0.5 - i * 0.12, 0.1 + i * 0.1, 0.55, 20]} />
        </mesh>
      ))}
    </>
  );
}

function Camera() {
  const { mats } = useD();
  return (
    <group rotation={[-0.5, 0, 0]}>
      <RoundedBox args={[2.0, 2.0, 1.9]} radius={0.15} smoothness={3} material={mats.aluDark} />
      <mesh position={[0, 0, 1.45]} rotation={[Math.PI / 2, 0, 0]} material={mats.aluDark}>
        <cylinderGeometry args={[0.66, 0.66, 1.1, 32]} />
      </mesh>
      <mesh position={[0, 0, 1.05]} rotation={[Math.PI / 2, 0, 0]} material={mats.alu}>
        <cylinderGeometry args={[0.74, 0.74, 0.14, 32]} />
      </mesh>
      <mesh position={[0, 0, 2.02]} rotation={[Math.PI / 2, 0, 0]} material={mats.lens}>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
      </mesh>
      <mesh position={[0, 0, -1.0]} material={mats.pcbGreen}>
        <boxGeometry args={[2.0, 2.0, 0.1]} />
      </mesh>
      {[
        [-0.25, mats.wireRed],
        [0, mats.wireBlack],
        [0.25, mats.white],
      ].map(([x, m], i) => (
        <mesh key={i} position={[x as number, -0.2, -1.8]} rotation={[Math.PI / 2, 0, 0]} material={m as THREE.Material}>
          <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function CameraMount() {
  const { mats } = useD();
  return (
    <>
      {[1.4, -1.4].map((x) => (
        <RoundedBox key={x} args={[0.42, 2.7, 2.7]} radius={0.14} smoothness={3} position={[x, 0.3, 0]} material={mats.tpu} />
      ))}
      <RoundedBox args={[3.2, 0.42, 2.8]} radius={0.14} smoothness={3} position={[0, -1.0, 0]} material={mats.tpu} />
      {[1.4, -1.4].map((x) => (
        <mesh key={x} position={[x, -0.8, 1.2]} rotation={[0, 0, Math.PI / 2]} material={mats.alu}>
          <cylinderGeometry args={[0.16, 0.16, 0.7, 6]} />
        </mesh>
      ))}
    </>
  );
}

// ───────────────────────── Power ─────────────────────────

function Battery() {
  const { mats } = useD();
  return (
    <>
      <RoundedBox args={[3.4, 3.6, 7.6]} radius={0.3} smoothness={4} material={mats.battery} />
      <mesh position={[0, 0.3, 0]} material={mats.label}>
        <boxGeometry args={[3.44, 1.5, 5.2]} />
      </mesh>
      {[-1.8, 0.2, 1.6].map((z) => (
        <mesh key={z} position={[0, 0.3, z]} material={mats.chip}>
          <boxGeometry args={[3.46, 0.18, 0.6]} />
        </mesh>
      ))}
      {[0.4, -0.4].map((x, i) => (
        <mesh key={x} position={[x, -1.0, -4.7]} rotation={[Math.PI / 2, 0, 0]} material={i ? mats.wireBlack : mats.wireRed}>
          <cylinderGeometry args={[0.13, 0.13, 1.9, 10]} />
        </mesh>
      ))}
      <mesh position={[0, -1.0, -5.9]} material={mats.xt60}>
        <boxGeometry args={[1.6, 0.9, 1.1]} />
      </mesh>
      <mesh position={[1.1, -1.4, -4.3]} material={mats.white}>
        <boxGeometry args={[0.9, 0.12, 0.55]} />
      </mesh>
    </>
  );
}

function Strap() {
  const { mats } = useD();
  const ring = useOnce(() => slabGeometry(3.95, 4.5, 0.3, 1.7, [{ kind: "rect", x: 0, y: 0, w: 3.7, h: 4.25, r: 0.18 }]));
  return (
    <>
      {[2.2, -2.2].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh geometry={ring} material={mats.strap} />
          <mesh position={[0, 2.25, 0]} material={mats.alu}>
            <boxGeometry args={[1.0, 0.1, 1.2]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function PowerLead() {
  const { mats } = useD();
  return (
    <>
      <mesh position={[0, 0, -1.2]} material={mats.xt60}>
        <boxGeometry args={[1.6, 0.9, 1.1]} />
      </mesh>
      {[0.35, -0.35].map((x, i) => (
        <mesh key={x} position={[x, 0, 1.0]} rotation={[Math.PI / 2, 0, 0]} material={i ? mats.wireBlack : mats.wireRed}>
          <cylinderGeometry args={[0.13, 0.13, 3.4, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, 1.6]} rotation={[0, 0, Math.PI / 2]} material={mats.rubber}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 24]} />
      </mesh>
      <mesh position={[0.62, 0.55, 1.6]} rotation={[0, 0, Math.PI / 2]} material={mats.alu}>
        <cylinderGeometry args={[0.51, 0.51, 0.18, 24]} />
      </mesh>
    </>
  );
}

// ───────────────────────── The pilot's side ─────────────────────────

function Goggles() {
  const { mats } = useD();
  const barrel = useOnce(() => tubeGeometry(2.45, 2.0, 1.7, { seg: 48 }));
  const strapGeo = useOnce(() => {
    const g = new THREE.TorusGeometry(8.8, 0.4, 8, 56, Math.PI);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  return (
    <group rotation={[0.04, -0.62, 0]} scale={1.05}>
      <RoundedBox args={[17, 6.2, 7.4]} radius={0.7} smoothness={4} material={mats.goggleBody} />
      <RoundedBox args={[15.4, 0.35, 5.8]} radius={0.15} smoothness={3} position={[0, 3.2, -0.2]} material={mats.goggleTrim} />
      <RoundedBox args={[15.4, 5.6, 1.2]} radius={0.5} smoothness={4} position={[0, 0, 4.2]} material={mats.foam} />
      {[3.5, -3.5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh geometry={barrel} position={[0, 0, 4.9]} material={mats.goggleTrim} />
          <mesh position={[0, 0, 3.9]} rotation={[Math.PI / 2, 0, 0]} material={mats.screen}>
            <cylinderGeometry args={[1.95, 1.95, 0.06, 40]} />
          </mesh>
        </group>
      ))}
      {[6.5, -6.5].map((x) => (
        <group key={x} position={[x, 3.35, -1.5]} rotation={[0, 0, x > 0 ? -0.2 : 0.2]}>
          <mesh position={[0, 0.2, 0]} material={mats.goggleTrim}>
            <cylinderGeometry args={[0.45, 0.45, 0.6, 16]} />
          </mesh>
          <mesh position={[0, 3.5, 0]} material={mats.wireBlack}>
            <cylinderGeometry args={[0.22, 0.22, 6.4, 12]} />
          </mesh>
          <mesh position={[0, 6.8, 0]} material={mats.wireBlack}>
            <sphereGeometry args={[0.3, 12, 12]} />
          </mesh>
        </group>
      ))}
      {[8.8, -8.8].map((x) => (
        <mesh key={x} position={[x, 0, -0.6]} material={mats.goggleTrim}>
          <boxGeometry args={[0.7, 1.6, 1.4]} />
        </mesh>
      ))}
      <mesh geometry={strapGeo} scale={[1, 2.4, 1]} position={[0, 0, -0.6]} material={mats.rubber} />
      <mesh position={[0, -3.3, 1.5]} rotation={[Math.PI / 2, 0, 0]} material={mats.goggleTrim}>
        <cylinderGeometry args={[0.7, 0.7, 0.5, 20]} />
      </mesh>
      <mesh position={[8.52, 0.9, 2.2]} material={mats.chip}>
        <boxGeometry args={[0.1, 0.5, 1.5]} />
      </mesh>
    </group>
  );
}

export const PART_MODELS: Record<string, () => ReactElement> = {
  "frame-bottom": () => <FrameBottom />,
  standoffs: () => <Standoffs />,
  motors: () => <Motors />,
  esc: () => <Esc />,
  fc: () => <Fc />,
  vtx: () => <Vtx />,
  "vtx-antenna": () => <VtxAntenna />,
  "frame-top": () => <FrameTop />,
  receiver: () => <Receiver />,
  battery: () => <Battery />,
  strap: () => <Strap />,
  camera: () => <Camera />,
  "camera-mount": () => <CameraMount />,
  "power-lead": () => <PowerLead />,
  props: () => <Props />,
  goggles: () => <Goggles />,
};
