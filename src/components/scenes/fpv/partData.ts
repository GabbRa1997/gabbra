import type { PartInfo, Vec3 } from "../shared/sceneContext";

/**
 * A classic self-built 5-inch freestyle quad: analog video, ExpressLRS control,
 * 6S power. Units are centimetres, Y is up, the camera looks along +Z.
 *
 * Motors sit at (±7.95, ±7.95): a 225 mm diagonal wheelbase. Home Y values
 * stack the real build bottom to top; the exploded view lifts each layer on
 * the same vertical axis, so every part sits directly above what it bolts to.
 *
 * Simplified, representative model; no brand marks.
 */

export const MOTOR_XZ = 7.95;

export const PARTS: PartInfo[] = [
  {
    id: "frame-bottom",
    name: "Carbon main frame",
    group: "Frame",
    role: "Bottom plate and arms",
    function:
      "The floor of the quad. Four thick carbon-fibre arms carry the motors out to the corners, and the bottom plate carries the stack, the battery and the pilot's crashes.",
    spec: "5 in true-X · 225 mm wheelbase · 5 mm arms",
    home: [0, 0.25, 0],
    exploded: [0, 0.25, 0],
    delay: 0,
    focus: 20,
    section: "projects",
  },
  {
    id: "standoffs",
    name: "Standoffs",
    group: "Frame",
    role: "Aluminium pillars",
    function:
      "Four anodised pillars that hold the top plate at exactly the right height and keep the stack clear of the plates above and below.",
    spec: "M3 aluminium · 28 mm",
    home: [0, 1.9, 0],
    exploded: [0, 4.4, 0],
    delay: 0.1,
    focus: 16,
  },
  {
    id: "motors",
    name: "Motors",
    group: "Propulsion",
    role: "Four brushless motors",
    function:
      "Each motor spins its propeller up to tens of thousands of times a minute. Changing their speeds, hundreds of times a second, is how the quad climbs, turns and flips.",
    spec: "2306 stator · about 1750 KV (6S)",
    home: [0, 0.5, 0],
    exploded: [0, 5.4, 0],
    delay: 0.2,
    focus: 24,
  },
  {
    id: "esc",
    name: "4-in-1 ESC",
    group: "Flight electronics",
    role: "Motor drivers",
    function:
      "Turns the battery's direct current into the three precisely timed pulses each motor needs. One board drives all four motors and takes the full current of the quad.",
    spec: "4-in-1 · 30.5 × 30.5 mm mount",
    home: [0, 0.9, 0],
    exploded: [0, 5.2, 0],
    delay: 0.3,
    focus: 9,
  },
  {
    id: "fc",
    name: "Flight controller",
    group: "Flight electronics",
    role: "The brain",
    function:
      "Reads the gyroscope thousands of times a second and decides how fast each motor should turn. Stable flight is entirely this board's job; the pilot only asks for what they want.",
    spec: "STM32 processor · gyro · runs Betaflight",
    home: [0, 1.65, 0],
    exploded: [0, 8.4, 0],
    delay: 0.4,
    focus: 9,
    section: "technical-experiments",
  },
  {
    id: "vtx",
    name: "Video transmitter",
    group: "Video",
    role: "5.8 GHz analog",
    function:
      "Takes the camera's picture and broadcasts it by radio to the goggles, with almost no delay. It is the pilot's connection to what the quad sees.",
    spec: "5.8 GHz analog · power switchable",
    home: [0, 2.4, 0],
    exploded: [0, 11.6, 0],
    delay: 0.5,
    focus: 8,
  },
  {
    id: "vtx-antenna",
    name: "VTX antenna",
    group: "Video",
    role: "Pagoda antenna",
    function:
      "Radiates the video signal in a circular pattern so it stays clean however the quad rolls and banks. It trails behind the quad on a thin cable.",
    spec: "5.8 GHz · circular polarisation",
    home: [0, 2.4, -1.4],
    exploded: [0, 11.6, -8],
    delay: 0.55,
    focus: 14,
  },
  {
    id: "frame-top",
    name: "Carbon top plate",
    group: "Frame",
    role: "Top plate",
    function:
      "Closes the frame, stiffens the whole body and gives the battery strap something to bite on. Lightening slots keep it as light as the strength allows.",
    spec: "Carbon fibre · 2.5 mm",
    home: [0, 3.4, 0],
    exploded: [0, 16, 0],
    delay: 0.7,
    focus: 18,
  },
  {
    id: "receiver",
    name: "Radio receiver",
    group: "Flight electronics",
    role: "Control link",
    function:
      "Listens to the pilot's radio and hands the flight controller the stick positions. A long-range link means control is rarely the limit; the nerve of the pilot is.",
    spec: "ExpressLRS · 2.4 GHz",
    home: [0, 3.8, -4.4],
    exploded: [0, 19, -4.4],
    delay: 0.8,
    focus: 10,
  },
  {
    id: "battery",
    name: "LiPo battery",
    group: "Power",
    role: "Six-cell pack",
    function:
      "All the energy for a flight, in about 4 minutes of freestyle. It sits on top so the pilot can swap it quickly and so the weight stays close to the quad's centre.",
    spec: "6S · 22.2 V nominal · about 1100 mAh",
    home: [0, 5.35, 0],
    exploded: [0, 22.5, 0],
    delay: 0.9,
    focus: 16,
  },
  {
    id: "strap",
    name: "Battery strap",
    group: "Power",
    role: "Hook-and-loop straps",
    function:
      "Two rubber-backed straps pass through the top plate and cinch the battery down. A loose battery in a flip is a lost quad.",
    spec: "20 mm straps",
    home: [0, 5.3, 0],
    exploded: [0, 22.4, -13],
    delay: 1,
    focus: 12,
  },
  {
    id: "camera",
    name: "FPV camera",
    group: "Video",
    role: "Analog micro camera",
    function:
      "The quad's eye. A small, fast, wide-angle sensor tilted up so the view stays level when the quad flies forward at speed.",
    spec: "Analog · tilted 25–35° up",
    home: [0, 1.7, 4.9],
    exploded: [0, 5.0, 13.5],
    delay: 0.35,
    focus: 8,
    section: "flight-reels",
  },
  {
    id: "camera-mount",
    name: "TPU camera mount",
    group: "Video",
    role: "3D-printed cage",
    function:
      "A flexible printed cage that holds the camera at its tilt angle and takes the shock of a crash instead of the lens.",
    spec: "3D-printed TPU",
    home: [0, 1.6, 4.5],
    exploded: [0, 3.2, 9],
    delay: 0.3,
    focus: 9,
  },
  {
    id: "power-lead",
    name: "Power lead & capacitor",
    group: "Power",
    role: "XT60 and low-ESR cap",
    function:
      "The connector the battery plugs into, with a capacitor soldered across it to soak up the voltage spikes that motors throw back at the electronics.",
    spec: "XT60 · low-ESR capacitor",
    home: [0, 1.0, -5.0],
    exploded: [0, 3.0, -9.5],
    delay: 0.45,
    focus: 10,
  },
  {
    id: "props",
    name: "Propellers",
    group: "Propulsion",
    role: "Four tri-blade props",
    function:
      "Two spin clockwise, two counter-clockwise, so the twisting forces cancel out. The blade's twist and shape turn the motor's spin into lift.",
    spec: "5 in · three blades · CW / CCW pairs",
    home: [0, 3.6, 0],
    exploded: [0, 12.6, 0],
    delay: 0.6,
    focus: 28,
  },
  {
    id: "goggles",
    name: "FPV goggles",
    group: "Pilot",
    role: "The pilot's window",
    function:
      "Two small screens in front of the pilot's eyes show the quad's live view, so the pilot flies from inside the camera. Diversity antennas pick the strongest of two signals.",
    spec: "Analog · 5.8 GHz · diversity",
    home: [14, 5, -34],
    exploded: [14, 5, -34],
    delay: 0,
    focus: 18,
    section: "perspectives",
  },
];

/** The goggles never explode: they sit in the background. */
export const FIXED_IDS = new Set(["goggles"]);
export const MOVING: PartInfo[] = PARTS.filter((p) => !FIXED_IDS.has(p.id));
export const FIXED: PartInfo[] = PARTS.filter((p) => FIXED_IDS.has(p.id));

export const GROUPS = ["Frame", "Propulsion", "Flight electronics", "Video", "Power", "Pilot"] as const;

/** Middle of the quad (height), so it stays centred in frame. */
export const CENTER = { assembled: 3.4, exploded: 12.2 };

export type { Vec3 };
