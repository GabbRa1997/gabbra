import * as THREE from "three";

export { slabGeometry, tubeGeometry } from "../shared/geometry";

/**
 * One propeller blade, lying in the XZ plane, root at the hub and tip along +X.
 * The twist is real: steep near the hub, shallow at the tip, as on a true prop.
 */
export function bladeGeometry(R = 6.35, hub = 0.5) {
  const s = new THREE.Shape();
  s.moveTo(hub, 0.32);
  s.quadraticCurveTo(R * 0.45, 1.0, R - 0.4, 0.38);
  s.quadraticCurveTo(R + 0.05, 0.12, R - 0.35, -0.12);
  s.bezierCurveTo(R * 0.7, -0.75, R * 0.3, -1.05, hub, -0.55);
  s.closePath();

  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false, curveSegments: 28 });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const u = THREE.MathUtils.clamp((x - hub) / (R - hub), 0, 1);
    const a = THREE.MathUtils.lerp(0.6, 0.16, u);
    p.setY(i, y * Math.cos(a) - z * Math.sin(a));
    p.setZ(i, y * Math.sin(a) + z * Math.cos(a));
  }
  g.rotateX(-Math.PI / 2); // plane XY → XZ, thickness becomes height
  g.computeVertexNormals();
  return g;
}
