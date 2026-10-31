import photosJson from "@/content/generated/photos.json";
import filmJson from "@/content/generated/film.json";

/**
 * The real portfolio, produced by `npm run media` from /media-source.
 * Empty until content is supplied; pages fall back to labelled placeholders.
 */

export interface PhotoSrc {
  w: number;
  url: string;
}

export interface PrintInfo {
  sizes?: string;
  paper?: string;
  edition?: string;
  price?: string;
}

export interface Photo {
  id: string;
  file: string;
  alt: string;
  w: number;
  h: number;
  /** tiny blurred preview, shown while the real image loads */
  blur: string;
  /** dominant colour, painted behind the image */
  color: string;
  srcset: PhotoSrc[];
  src: string;
  print?: PrintInfo;
}

export interface PhotoProject {
  slug: string;
  title: string;
  subject: string;
  year?: number;
  description?: string;
  order: number;
  cover: string;
  photos: Photo[];
}

export interface FilmClip {
  section: string;
  slug: string;
  title: string;
  src: string;
  poster?: string;
  year?: number;
  runtime?: string;
  format?: string;
  synopsis?: string;
  credits?: { role: string; name: string }[];
}

export const PHOTO_PROJECTS = (photosJson as unknown as { projects: PhotoProject[] }).projects;
export const FILM_CLIPS = (filmJson as unknown as { clips: FilmClip[] }).clips;

export const projectBySlug = (slug: string) => PHOTO_PROJECTS.find((p) => p.slug === slug);
export const coverOf = (p: PhotoProject) => p.photos.find((x) => x.id === p.cover) ?? p.photos[0];
export const subjects = () => [...new Set(PHOTO_PROJECTS.map((p) => p.subject))];

/** every photograph offered as a print, with the project it belongs to */
export const PRINTS = PHOTO_PROJECTS.flatMap((p) =>
  p.photos.filter((x) => x.print).map((photo) => ({ photo, project: p })),
);

/** the largest image that fits `width` CSS pixels, for places that need a single URL */
export const pickSrc = (photo: Photo, width: number) =>
  (photo.srcset.find((s) => s.w >= width) ?? photo.srcset[photo.srcset.length - 1]).url;
