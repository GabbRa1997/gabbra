/**
 * The 550D, part by part. Units are centimetres; the optical axis is +Z
 * (front of the camera) and the sensor sits at roughly z = -4.8.
 *
 * `home` is the assembled position, `exploded` the separated one. Every
 * exploded position keeps its part on the optical axis (or moves it straight
 * out along a single axis), so the result reads as a real assembly sequence,
 * not as floating pieces.
 *
 * The model is a simplified, representative reconstruction: not a
 * manufacturer-accurate drawing, and it carries no brand marks.
 */

export type Vec3 = [number, number, number];
export type Group = "Lens" | "Optics" | "Body" | "Electronics";

export interface PartDef {
  id: string;
  name: string;
  group: Group;
  /** one line, shown under the name */
  role: string;
  /** what it does, in plain words */
  function: string;
  spec?: string;
  home: Vec3;
  exploded: Vec3;
  /** 0 = moves first, 1 = moves last */
  delay: number;
  /** camera distance when inspecting this part */
  focus: number;
  /** photo section this part opens */
  section?: string;
  /** fades to a ghost outline when exploded so internals show */
  ghost?: boolean;
}

export const PARTS: PartDef[] = [
  // ───────────── Lens (front to back) ─────────────
  {
    id: "front-ring",
    name: "Front filter ring",
    group: "Lens",
    role: "Threaded collar",
    function:
      "Carries filters and hoods and protects the front of the lens. It is the first thing the light meets.",
    home: [0, 0, 6.6],
    exploded: [0, 0, 39],
    delay: 0,
    focus: 12,
  },
  {
    id: "zoom-ring",
    name: "Zoom ring",
    group: "Lens",
    role: "Rubber grip ring",
    function:
      "Turned by hand to change focal length. It drives a cam inside the barrel that slides lens groups along the axis.",
    home: [0, 0, 4.3],
    exploded: [0, 0, 34.5],
    delay: 0.1,
    focus: 13,
  },
  {
    id: "outer-barrel",
    name: "Outer barrel",
    group: "Lens",
    role: "Housing",
    function:
      "The lens's skin. It holds everything in alignment and keeps dust and stray light out.",
    home: [0, 0, 3.5],
    exploded: [0, 0, 30],
    delay: 0.2,
    focus: 15,
  },
  {
    id: "inner-tube",
    name: "Inner cam tube",
    group: "Lens",
    role: "Mechanical guide",
    function:
      "A precision tube that guides the moving lens groups. Slots cut in its wall translate the zoom and focus rings into straight-line motion.",
    home: [0, 0, 3.3],
    exploded: [0, 0, 25],
    delay: 0.3,
    focus: 12,
  },
  {
    id: "front-element",
    name: "Front element",
    group: "Optics",
    role: "Convex glass",
    function:
      "Gathers light from the scene and starts bending it towards focus. Its coating gives the lens its familiar purple-green reflections.",
    spec: "Multi-coated glass",
    home: [0, 0, 5.9],
    exploded: [0, 0, 21],
    delay: 0.4,
    focus: 9,
    section: "selected-works",
  },
  {
    id: "element-2",
    name: "Meniscus element",
    group: "Optics",
    role: "Corrective glass",
    function:
      "A curved corrective element that cancels some of the colour fringing and distortion introduced by the front group.",
    home: [0, 0, 5.0],
    exploded: [0, 0, 18],
    delay: 0.5,
    focus: 9,
  },
  {
    id: "element-3",
    name: "Biconvex element",
    group: "Optics",
    role: "Converging glass",
    function:
      "Pulls the spreading light back together before it passes through the aperture.",
    home: [0, 0, 4.1],
    exploded: [0, 0, 15],
    delay: 0.55,
    focus: 9,
  },
  {
    id: "diaphragm",
    name: "Aperture diaphragm",
    group: "Lens",
    role: "Seven blades",
    function:
      "A ring of thin blades that opens and closes to set the aperture. It controls how much light gets through and how deep the focus runs.",
    home: [0, 0, 3.2],
    exploded: [0, 0, 12],
    delay: 0.6,
    focus: 8,
  },
  {
    id: "doublet",
    name: "Cemented doublet",
    group: "Optics",
    role: "Two glasses, one unit",
    function:
      "Two glass types bonded together. Each bends colours differently, so the pair brings red and blue back to the same point.",
    home: [0, 0, 2.4],
    exploded: [0, 0, 9],
    delay: 0.65,
    focus: 8,
  },
  {
    id: "element-5",
    name: "Rear group element",
    group: "Optics",
    role: "Converging glass",
    function:
      "Part of the rear group. It shapes the final cone of light that lands on the sensor.",
    home: [0, 0, 1.7],
    exploded: [0, 0, 6.2],
    delay: 0.7,
    focus: 8,
  },
  {
    id: "rear-element",
    name: "Rear element",
    group: "Optics",
    role: "Last glass",
    function:
      "The final piece of glass, sitting just in front of the mount. Small, but it determines how cleanly the image reaches the sensor.",
    home: [0, 0, 1.1],
    exploded: [0, 0, 3.7],
    delay: 0.75,
    focus: 8,
  },

  // ───────────── Body, front to back ─────────────
  {
    id: "mount",
    name: "Lens mount",
    group: "Body",
    role: "Bayonet ring",
    function:
      "The metal bayonet that locks the lens to the body with a quarter turn and holds it in exact alignment with the sensor.",
    spec: "EF-S bayonet",
    home: [0, 0, 0.3],
    exploded: [0, 0, 2.2],
    delay: 0.8,
    focus: 10,
  },
  {
    id: "front-plate",
    name: "Front plate",
    group: "Body",
    role: "Face of the body",
    function:
      "The front cover of the body, with the opening for the mount and the lens-release button.",
    home: [0, -0.25, -0.25],
    exploded: [0, -0.25, 0.9],
    delay: 0.85,
    focus: 18,
  },
  {
    id: "grip",
    name: "Hand grip",
    group: "Body",
    role: "Rubberised grip",
    function:
      "Gives the right hand something to hold and houses the battery chamber behind it.",
    home: [-5.0, -0.25, 1.0],
    exploded: [-14, -0.25, 1.0],
    delay: 0.2,
    focus: 14,
  },
  {
    id: "frame",
    name: "Body frame",
    group: "Body",
    role: "Chassis shell",
    function:
      "The structural shell that everything else bolts to. In this view it is drawn as a ghost so the parts inside stay visible.",
    home: [0, -0.25, -3.0],
    exploded: [0, -0.25, -3.0],
    delay: 0,
    focus: 26,
    ghost: true,
  },
  {
    id: "hump",
    name: "Viewfinder housing",
    group: "Body",
    role: "Top cover",
    function:
      "The raised hump on top of the camera. It covers the viewfinder optics and carries the hot-shoe and eyecup.",
    home: [0, 4.65, -2.4],
    exploded: [0, 13, -2.4],
    delay: 0.1,
    focus: 14,
  },
  {
    id: "flash",
    name: "Built-in flash",
    group: "Body",
    role: "Pop-up flash",
    function:
      "Rises on two arms above the viewfinder housing when the light is poor. A xenon tube behind a ribbed lens throws a very short, very bright burst, fired in step with the shutter.",
    spec: "Guide number about 13 (ISO 100, metres)",
    home: [0, 5.2, -0.9],
    exploded: [0, 15.3, -0.9],
    delay: 0.05,
    focus: 8,
  },
  {
    id: "controls",
    name: "Mode dial & shutter release",
    group: "Body",
    role: "Top controls",
    function:
      "The mode dial chooses how the camera exposes; the shutter release starts the sequence: meter, focus, mirror up, shutter open.",
    home: [-5.0, 3.5, -2.0],
    exploded: [-5.0, 8.2, -2.0],
    delay: 0.15,
    focus: 8,
  },
  {
    id: "mirror-box",
    name: "Mirror box",
    group: "Body",
    role: "Optical chamber",
    function:
      "A blackened, rigid chamber between the mount and the sensor. It keeps the optical path light-tight and exactly spaced.",
    home: [0, 0.1, -2.2],
    exploded: [0, 0.1, -3.4],
    delay: 0.3,
    focus: 12,
  },
  {
    id: "mirror",
    name: "Reflex mirror",
    group: "Optics",
    role: "Tilting mirror",
    function:
      "Sits at 45°, bouncing the lens's image up to the viewfinder. At the moment of exposure it flips out of the way.",
    spec: "Swings up on every shot",
    home: [0, 0, -2.2],
    exploded: [0, 0, -7.0],
    delay: 0.4,
    focus: 10,
  },
  {
    id: "focusing-screen",
    name: "Focusing screen",
    group: "Optics",
    role: "Ground glass",
    function:
      "The mirror projects the image onto this matte glass, which is what you actually compose and focus on through the eyepiece.",
    home: [0, 2.4, -2.4],
    exploded: [0, 4.9, -2.4],
    delay: 0.45,
    focus: 9,
  },
  {
    id: "pentamirror",
    name: "Pentamirror",
    group: "Optics",
    role: "Viewfinder optics",
    function:
      "A hollow arrangement of three mirrors that turns the upside-down, reversed image right way round for the eyepiece. Lighter and cheaper than a solid glass prism.",
    spec: "Viewfinder coverage about 95%",
    home: [0, 3.9, -3.2],
    exploded: [0, 8.6, -3.2],
    delay: 0.5,
    focus: 10,
  },
  {
    id: "shutter",
    name: "Shutter unit",
    group: "Body",
    role: "Focal-plane curtains",
    function:
      "Two curtains that slide across in front of the sensor. The gap between them sets the exposure time.",
    spec: "30 s to 1/4000 s",
    home: [0, 0.1, -4.0],
    exploded: [0, 0.1, -10.5],
    delay: 0.55,
    focus: 10,
    section: "experiments",
  },
  {
    id: "filter",
    name: "Low-pass filter",
    group: "Optics",
    role: "Sensor stack glass",
    function:
      "A thin glass stack in front of the sensor. It filters infrared light and softens detail very slightly to prevent moiré patterns.",
    home: [0, 0.1, -4.45],
    exploded: [0, 0.1, -13.5],
    delay: 0.6,
    focus: 8,
  },
  {
    id: "sensor",
    name: "CMOS sensor",
    group: "Electronics",
    role: "Image sensor",
    function:
      "Millions of light-sensitive cells turn the focused image into electrical signals. This is where the picture actually exists.",
    spec: "APS-C, 22.3 × 14.9 mm, 18 MP",
    home: [0, 0.1, -4.85],
    exploded: [0, 0.1, -16.8],
    delay: 0.65,
    focus: 8,
    section: "prints",
  },
  {
    id: "main-board",
    name: "Main logic board",
    group: "Electronics",
    role: "Processor board",
    function:
      "Hosts the image processor that converts sensor data into a finished file, and runs the autofocus, metering and menus.",
    spec: "DIGIC 4 processor",
    home: [0, 0, -5.25],
    exploded: [0, 0, -20],
    delay: 0.7,
    focus: 12,
  },
  {
    id: "battery",
    name: "Battery",
    group: "Electronics",
    role: "Lithium-ion cell",
    function:
      "Powers everything. It lives inside the grip so the weight sits where the hand supports it.",
    spec: "LP-E8, 7.2 V",
    home: [-5.1, -0.65, -2.0],
    exploded: [-5.1, -12, -2.0],
    delay: 0.3,
    focus: 10,
  },
  {
    id: "rear-plate",
    name: "Rear plate",
    group: "Body",
    role: "Back cover",
    function:
      "Closes the body at the back. It carries the eyecup opening, the thumb rest and the control buttons.",
    home: [0, -0.25, -5.85],
    exploded: [0, -0.25, -23.5],
    delay: 0.8,
    focus: 18,
  },
  {
    id: "lcd",
    name: "LCD monitor",
    group: "Electronics",
    role: "3-inch screen",
    function:
      "Shows live view, menus and playback. It is the only part of the camera that looks back at you.",
    spec: "3.0 in, 1.04 M dots",
    home: [1.2, 0.4, -6.4],
    exploded: [1.2, 0.4, -27.5],
    delay: 0.9,
    focus: 11,
  },
];

export const PART_INDEX: Record<string, number> = Object.fromEntries(
  PARTS.map((p, i) => [p.id, i]),
);

export const PART_BY_ID: Record<string, PartDef> = Object.fromEntries(
  PARTS.map((p) => [p.id, p]),
);

/** Where the middle of the assembly sits, so it stays centred in frame. */
export const CENTER = { assembled: 0.45, exploded: 7.5 };
/** Length of the assembly along its axis, for framing. */
export const SPAN = { assembled: 26, exploded: 70 };
