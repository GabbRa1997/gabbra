/**
 * FPV content. Everything is a stand-in until real work is supplied (Stage 6).
 * No projects, clients, awards or testimonials are invented here.
 */

export type FpvSectionSlug = "flight-reels" | "perspectives" | "technical-experiments" | "projects";

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
    slug: "perspectives",
    n: "02",
    title: "Perspectives",
    part: "goggles",
    blurb: "Aerial and environmental visual projects.",
    lead: "The view from the pilot's seat, which is no seat at all.",
  },
  {
    slug: "technical-experiments",
    n: "03",
    title: "Technical Experiments",
    part: "fc",
    blurb: "Configurations, flight development, experiments.",
    lead: "Builds, tunes and tests: the engineering behind the footage.",
  },
  {
    slug: "projects",
    n: "04",
    title: "Projects",
    part: "frame-bottom",
    blurb: "Completed and ongoing FPV commissions.",
    lead: "The work the frame was built to carry.",
  },
];

export const BUILD_SHEET = [
  { label: "Class", value: "5 inch freestyle", placeholder: false },
  { label: "Video", value: "Analog 5.8 GHz", placeholder: false },
  { label: "Control link", value: "ExpressLRS 2.4 GHz", placeholder: false },
  { label: "Power", value: "6S LiPo", placeholder: false },
  { label: "All-up weight", value: "To be supplied", placeholder: true },
  { label: "Flight time", value: "To be supplied", placeholder: true },
];
