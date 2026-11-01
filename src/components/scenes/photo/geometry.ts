import * as THREE from "three";
import { detail, seg as segs } from "../shared/detail";

export { plateGeometry, polyGeometry, tubeGeometry } from "../shared/geometry";

/** Camera-specific geometry. Everything is modelled with the optical axis on +Z. */

export function lensGeometry(R: number, edge: number, cf: number, cb: number, seg = 64) {
  seg = segs(seg);
  // cf > 0: front surface bulges forward. cb > 0: back surface bulges backward.
  const pts: THREE.Vector2[] = [];
  const n = Math.max(8, Math.round(20 * detail.k));
  for (let i = 0; i <= n; i++) {
    const r = (i / n) * R;
    pts.push(new THREE.Vector2(r, edge / 2 + cf * (1 - (r / R) ** 2)));
  }
  for (let i = n; i >= 0; i--) {
    const r = (i / n) * R;
    pts.push(new THREE.Vector2(r, -edge / 2 - cb * (1 - (r / R) ** 2)));
  }
  const g = new THREE.LatheGeometry(pts, seg);
  g.rotateX(Math.PI / 2);
  return g;
}

/**
 * Hollow pentamirror: a pentagon in side view (Z = forward, Y = up),
 * with the inside cut away, extruded across the camera's width (X).
 */
export function pentamirrorGeometry(width: number) {
  // side profile in (z, y); front of camera is +z
  const outer: [number, number][] = [
    [1.9, -0.85],
    [-1.9, -0.85],
    [-1.9, 0.35],
    [-0.5, 0.9],
    [1.3, 0.5],
  ];
  const cx = outer.reduce((a, p) => a + p[0], 0) / outer.length;
  const cy = outer.reduce((a, p) => a + p[1], 0) / outer.length;
  const inner = outer.map(([z, y]) => [cx + (z - cx) * 0.9, cy + (y - cy) * 0.82] as [number, number]);
  // extrude draws in XY; map profile (z, y) → (-x', y) so +z lands on +x' before rotation
  const shape = new THREE.Shape(outer.map(([z, y]) => new THREE.Vector2(-z, y)));
  shape.holes.push(new THREE.Path(inner.map(([z, y]) => new THREE.Vector2(-z, y))));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  g.translate(0, 0, -width / 2);
  g.rotateY(Math.PI / 2); // extrusion Z → X, profile X → -Z
  g.computeVertexNormals();
  return g;
}
