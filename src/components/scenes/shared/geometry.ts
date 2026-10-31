import * as THREE from "three";

/** Geometry helpers shared by every exploded scene. */

export function rrPath(p: THREE.Path, w: number, h: number, r: number, cx = 0, cy = 0) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  return p;
}

export function roundedRectShape(w: number, h: number, r: number) {
  return rrPath(new THREE.Shape() as unknown as THREE.Path, w, h, r) as unknown as THREE.Shape;
}

export function tubeGeometry(
  rOut: number,
  rIn: number,
  len: number,
  opts: { ribs?: number; depth?: number; seg?: number } = {},
) {
  const { ribs = 0, depth = 0.1, seg = 72 } = opts;
  const h = len / 2;
  const pts: THREE.Vector2[] = [new THREE.Vector2(rIn, -h), new THREE.Vector2(rOut, -h)];
  if (ribs > 0) {
    const pad = len * 0.08;
    const span = len - pad * 2;
    for (let i = 0; i < ribs; i++) {
      const y0 = -h + pad + (i / ribs) * span;
      const y1 = -h + pad + ((i + 0.5) / ribs) * span;
      const y2 = -h + pad + ((i + 1) / ribs) * span;
      pts.push(
        new THREE.Vector2(rOut, y0),
        new THREE.Vector2(rOut + depth, y0 + 0.01),
        new THREE.Vector2(rOut + depth, y1),
        new THREE.Vector2(rOut, y1 + 0.01),
        new THREE.Vector2(rOut, y2),
      );
    }
  }
  pts.push(new THREE.Vector2(rOut, h), new THREE.Vector2(rIn, h), new THREE.Vector2(rIn, -h));
  const g = new THREE.LatheGeometry(pts, seg);
  g.rotateX(Math.PI / 2); // axis becomes +Z
  return g;
}

/** Rounded plate, optionally with one rectangular or circular opening. Centred; thickness along Z. */
export function plateGeometry(
  w: number,
  h: number,
  r: number,
  depth: number,
  hole?: { w: number; h: number; r: number } | { circle: number; x?: number; y?: number },
  bevel = 0,
) {
  const shape = roundedRectShape(w, h, r);
  if (hole) {
    if ("circle" in hole) {
      const path = new THREE.Path();
      path.absarc(hole.x ?? 0, hole.y ?? 0, hole.circle, 0, Math.PI * 2, true);
      shape.holes.push(path);
    } else {
      shape.holes.push(rrPath(new THREE.Path(), hole.w, hole.h, hole.r));
    }
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 14,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

export type Hole =
  | { kind: "circle"; x: number; y: number; r: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; r?: number };

/**
 * A flat rounded slab with any number of holes, like a cut carbon plate.
 * Drawn in XY, thickness along Z, centred. Rotate it to lie flat.
 */
export function slabGeometry(w: number, h: number, r: number, depth: number, holes: Hole[] = []) {
  const shape = roundedRectShape(w, h, r);
  for (const hole of holes) {
    if (hole.kind === "circle") {
      const p = new THREE.Path();
      p.absarc(hole.x, hole.y, hole.r, 0, Math.PI * 2, true);
      shape.holes.push(p);
    } else {
      shape.holes.push(rrPath(new THREE.Path(), hole.w, hole.h, hole.r ?? 0.05, hole.x, hole.y));
    }
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** Polygon extruded along Z, centred. Points in the XY plane. */
export function polyGeometry(points: [number, number][], depth: number, bevel = 0) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}
