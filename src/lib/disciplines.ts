export type DisciplineId = "photo" | "fpv" | "film";

export interface Discipline {
  id: DisciplineId;
  n: string;
  label: string;
  long: string;
  href: string;
  tint: string;
  kicker: string;
  line: string;
}

export const DISCIPLINES: Discipline[] = [
  {
    id: "photo",
    n: "01",
    label: "PHOTO",
    long: "Photography",
    href: "/photo",
    tint: "#e6b980",
    kicker: "Still",
    line: "One frame, held.",
  },
  {
    id: "fpv",
    n: "02",
    label: "FPV",
    long: "FPV",
    href: "/fpv",
    tint: "#e6b980",
    kicker: "Motion",
    line: "The frame, in flight.",
  },
  {
    id: "film",
    n: "03",
    label: "FILM",
    long: "Film",
    href: "/film",
    tint: "#e6b980",
    kicker: "Time",
    line: "Frames, in sequence.",
  },
];

export function disciplineFromPath(pathname: string): Discipline | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  return DISCIPLINES.find((d) => d.id === seg) ?? null;
}

const LABELS: Record<string, string> = {
  photo: "PHOTO",
  fpv: "FPV",
  film: "FILM",
  about: "ABOUT",
  artist: "ABOUT THE ARTIST",
  contact: "CONTACT",
  "selected-works": "SELECTED WORKS",
  prints: "PRINTS",
  "behind-the-lens": "BEHIND THE LENS",
  experiments: "EXPERIMENTS",
};

export function breadcrumbFromPath(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  return [
    "GABBRA",
    ...parts.map((p) => LABELS[p] ?? p.replace(/-/g, " ").toUpperCase()),
  ];
}
