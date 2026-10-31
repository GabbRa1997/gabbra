/**
 * Photography content. Everything marked `placeholder: true` is a stand-in
 * until real work is supplied (Stage 6). Nothing here is invented portfolio
 * material: no projects, awards, clients or testimonials.
 */

export type PhotoSectionSlug =
  | "selected-works"
  | "prints"
  | "behind-the-lens"
  | "experiments";

export interface PhotoSection {
  slug: PhotoSectionSlug;
  n: string;
  title: string;
  /** which part of the camera opens this section */
  part: string;
  blurb: string;
  lead: string;
}

export const PHOTO_SECTIONS: PhotoSection[] = [
  {
    slug: "selected-works",
    n: "01",
    title: "Selected Works",
    part: "front-element",
    blurb: "The portfolio, by subject and project.",
    lead: "Large imagery first. Each project opens as its own immersive presentation.",
  },
  {
    slug: "prints",
    n: "02",
    title: "Prints",
    part: "sensor",
    blurb: "Selected photographs as art editions.",
    lead: "Where the image leaves the sensor and becomes an object.",
  },
  {
    slug: "behind-the-lens",
    n: "03",
    title: "Behind the Lens",
    part: "pentamirror",
    blurb: "Story, approach and equipment.",
    lead: "The view from the viewfinder: how and why the pictures get made.",
  },
  {
    slug: "experiments",
    n: "04",
    title: "Experiments",
    part: "shutter",
    blurb: "Challenges, ongoing projects, visual exploration.",
    lead: "Time, opened and closed. Unfinished work lives here on purpose.",
  },
];

export const PLACEHOLDER_SUBJECTS = [
  "Subject 01",
  "Subject 02",
  "Subject 03",
  "Subject 04",
  "Subject 05",
  "Subject 06",
];

export const EQUIPMENT = [
  { label: "Camera", value: "Canon EOS 550D", placeholder: false },
  { label: "Lenses", value: "To be supplied", placeholder: true },
  { label: "Accessories", value: "To be supplied", placeholder: true },
  { label: "Software", value: "To be supplied", placeholder: true },
];
