/**
 * FPV content. Everything is a stand-in until real work is supplied (Stage 6).
 * No projects, clients, awards or testimonials are invented here.
 */

export type FpvSectionSlug = "flight-reels" | "drones-owned";

export interface FpvSection {
  slug: FpvSectionSlug;
  n: string;
  title: string;
  /** which part of the quad opens this section */
  part: string;
  blurb: string;
  lead: string;
}

export const FPV_SECTIONS: FpvSection[] = [
  {
    slug: "flight-reels",
    n: "01",
    title: "Flight Reels",
    part: "camera",
    blurb: "The FPV video portfolio.",
    lead: "What the camera saw, played back at full screen, at full speed.",
  },
  {
    slug: "drones-owned",
    n: "02",
    title: "Drones Owned",
    part: "frame-bottom",
    blurb: "A technical sheet for every drone in the hangar.",
    lead: "Each machine, with its build and specification.",
  },
];

/** the fields every drone's technical sheet will carry */
export const DRONE_SHEET_FIELDS = [
  "Class",
  "Frame",
  "Motors",
  "Flight controller / ESC",
  "Video system",
  "Control link",
  "Battery",
  "All-up weight",
];
