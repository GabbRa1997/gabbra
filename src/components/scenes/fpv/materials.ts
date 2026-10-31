import * as THREE from "three";

/** A small twill weave, drawn once, so carbon fibre reads as carbon fibre. */
function carbonTexture() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0b0c0e";
  g.fillRect(0, 0, size, size);
  const n = 8;
  const s = size / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const warp = ((x + y) >> 1) % 2 === 0;
      g.fillStyle = warp ? "#1a1c20" : "#0e0f12";
      g.fillRect(x * s, y * s, s, s);
      const grad = warp
        ? g.createLinearGradient(x * s, y * s, x * s + s, y * s)
        : g.createLinearGradient(x * s, y * s, x * s, y * s + s);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.09)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(x * s, y * s, s, s);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export type Quality = "full" | "lite";

export function makeDroneMaterials(q: Quality) {
  void q; // the drone has no true transmission, so both qualities share one palette
  const std = (p: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...p });

  return {
    carbon: std({ map: carbonTexture(), color: "#ffffff", roughness: 0.38, metalness: 0.35 }),
    alu: std({ color: "#aeb4bb", roughness: 0.3, metalness: 1 }),
    aluBlue: std({ color: "#c29a5b", roughness: 0.28, metalness: 0.95 }),
    aluDark: std({ color: "#1a1d22", roughness: 0.34, metalness: 0.9 }),
    motorBell: std({ color: "#5b4630", roughness: 0.26, metalness: 0.95 }),
    copper: std({ color: "#b86f3a", roughness: 0.35, metalness: 0.9 }),
    gold: std({ color: "#c9a24a", roughness: 0.3, metalness: 1 }),
    pcbBlack: std({ color: "#0c0f12", roughness: 0.5, metalness: 0.25 }),
    pcbGreen: std({ color: "#14261f", roughness: 0.5, metalness: 0.2 }),
    chip: std({ color: "#08090b", roughness: 0.4, metalness: 0.3 }),
    white: std({ color: "#d9d9d4", roughness: 0.5, metalness: 0 }),
    rubber: std({ color: "#17171a", roughness: 0.7, metalness: 0.05 }),
    wireRed: std({ color: "#b3201a", roughness: 0.6, metalness: 0 }),
    wireBlack: std({ color: "#0a0a0b", roughness: 0.55, metalness: 0 }),
    tpu: std({ color: "#d9b36a", roughness: 0.55, metalness: 0 }),
    prop: new THREE.MeshStandardMaterial({
      color: "#8a6a45",
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    }),
    battery: std({ color: "#25262a", roughness: 0.5, metalness: 0.15 }),
    label: std({ color: "#c7ccd2", roughness: 0.6, metalness: 0 }),
    xt60: std({ color: "#e0b81c", roughness: 0.45, metalness: 0 }),
    strap: std({ color: "#202226", roughness: 0.95, metalness: 0 }),
    lens: new THREE.MeshPhysicalMaterial({
      color: "#241a4a",
      roughness: 0.05,
      metalness: 0.2,
      clearcoat: 1,
      iridescence: 0.8,
      iridescenceIOR: 1.6,
      envMapIntensity: 1.8,
    }),
    goggleBody: std({ color: "#15171a", roughness: 0.45, metalness: 0.2 }),
    goggleTrim: std({ color: "#25282d", roughness: 0.4, metalness: 0.5 }),
    foam: std({ color: "#08080a", roughness: 1, metalness: 0 }),
    screen: new THREE.MeshStandardMaterial({
      color: "#241a0e",
      roughness: 0.1,
      metalness: 0.3,
      emissive: new THREE.Color("#e6b980"),
      emissiveIntensity: 0.75,
    }),
    led: std({ color: "#2a1a08", roughness: 0.3, emissive: new THREE.Color("#ffcf91"), emissiveIntensity: 1.4 }),
  };
}

export type DroneMats = ReturnType<typeof makeDroneMaterials>;
