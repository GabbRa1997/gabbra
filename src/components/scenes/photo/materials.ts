import * as THREE from "three";

export type Quality = "full" | "lite";

/** Fine leatherette dimples, drawn once. Used as a bump map so the grip reads as rubber, not plastic. */
function leatherette(repeat: number) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8a8a8a";
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 520; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1.2 + Math.random() * 2.6;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const v = 40 + Math.floor(Math.random() * 60);
    grad.addColorStop(0, `rgb(${v},${v},${v})`);
    grad.addColorStop(1, "rgba(138,138,138,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

/**
 * Material palette. Restrained: textured rubber, satin plastic, brushed
 * silver, a little glass. On weaker devices glass drops from true
 * transmission to a cheap transparent shader, which looks close and costs
 * a fraction.
 */
export function makeMaterials(q: Quality) {
  const glass =
    q === "full"
      ? new THREE.MeshPhysicalMaterial({
          color: "#e9f0f2",
          transmission: 1,
          thickness: 0.8,
          ior: 1.5,
          roughness: 0.03,
          metalness: 0,
          attenuationColor: new THREE.Color("#cfe8e2"),
          attenuationDistance: 7,
          iridescence: 0.55,
          iridescenceIOR: 1.3,
          iridescenceThicknessRange: [180, 480],
          envMapIntensity: 1.6,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshPhysicalMaterial({
          color: "#a9bcc4",
          roughness: 0.06,
          metalness: 0.25,
          transparent: true,
          opacity: 0.55,
          clearcoat: 1,
          envMapIntensity: 2,
          side: THREE.DoubleSide,
        });

  return {
    glass,
    // UVs on extruded shells are in centimetres; on rounded boxes they run 0..1
    rubber: new THREE.MeshStandardMaterial({ color: "#1c1c20", roughness: 0.68, metalness: 0.04, bumpMap: leatherette(1.6), bumpScale: 1.1 }),
    rubberSoft: new THREE.MeshStandardMaterial({ color: "#1c1c20", roughness: 0.68, metalness: 0.04, bumpMap: leatherette(9), bumpScale: 1.1 }),
    rubberDark: new THREE.MeshStandardMaterial({ color: "#0c0c0e", roughness: 0.85, metalness: 0.02, side: THREE.DoubleSide }),
    plastic: new THREE.MeshPhysicalMaterial({ color: "#202125", roughness: 0.36, metalness: 0.1, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    metal: new THREE.MeshStandardMaterial({ color: "#b9bdc3", roughness: 0.28, metalness: 1, side: THREE.DoubleSide }),
    metalDark: new THREE.MeshStandardMaterial({ color: "#2b2d32", roughness: 0.38, metalness: 0.9, side: THREE.DoubleSide }),
    chrome: new THREE.MeshStandardMaterial({ color: "#dfe3e8", roughness: 0.04, metalness: 1, side: THREE.DoubleSide, envMapIntensity: 1.6 }),
    frosted: new THREE.MeshStandardMaterial({ color: "#c9d0d1", roughness: 0.85, metalness: 0, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
    pcb: new THREE.MeshStandardMaterial({ color: "#10281f", roughness: 0.55, metalness: 0.25 }),
    chip: new THREE.MeshStandardMaterial({ color: "#0a0a0c", roughness: 0.4, metalness: 0.3 }),
    gold: new THREE.MeshStandardMaterial({ color: "#c9a24a", roughness: 0.3, metalness: 1 }),
    white: new THREE.MeshStandardMaterial({ color: "#e4e4df", roughness: 0.5, metalness: 0 }),
    die: new THREE.MeshPhysicalMaterial({
      color: "#27305a",
      roughness: 0.18,
      metalness: 0.7,
      iridescence: 1,
      iridescenceIOR: 1.8,
      iridescenceThicknessRange: [250, 700],
      clearcoat: 1,
    }),
    lcd: new THREE.MeshStandardMaterial({
      color: "#05080a",
      roughness: 0.1,
      metalness: 0.4,
      emissive: new THREE.Color("#0f3447"),
      emissiveIntensity: 0.55,
    }),
    battery: new THREE.MeshStandardMaterial({ color: "#1f2227", roughness: 0.55, metalness: 0.2 }),
    label: new THREE.MeshStandardMaterial({ color: "#3b4a5c", roughness: 0.6, metalness: 0.1 }),
  };
}

export type Mats = ReturnType<typeof makeMaterials>;
