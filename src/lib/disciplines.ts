export type DisciplineId = "photo" | "fpv" | "film" | "blog";

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
  {
    id: "blog",
    n: "04",
    label: "BLOG",
    long: "Blog",
    href: "/blog",
    tint: "#e6b980",
    kicker: "Words",
    line: "Notes from behind the lens.",
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
  blog: "BLOG",
  privacy: "PRIVACY",
  admin: "ADMIN",
  about: "ABOUT",
  artist: "WHO AM I?",
  contact: "CONTACT",
  "selected-works": "SELECTED WORKS",
  prints: "SELECTED PRINTS",
  print: "REQUEST A PRINT",
  experiments: "EXPERIMENTS",
  "drones-owned": "DRONES OWNED",
  "flight-reels": "FLIGHT REELS",
};

export function breadcrumbFromPath(pathname: string): { label: string; href: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  return [
    { label: "GABBRA", href: "/" },
    ...parts.map((p, i) => ({
      label: LABELS[p] ?? p.replace(/-/g, " ").toUpperCase(),
      href: `/${parts.slice(0, i + 1).join("/")}`,
    })),
  ];
}
