import adminFilm from "@/content/admin/film.json";
import { FILM_CLIPS } from "@/lib/media";

/**
 * Film content. A section shows its real clips (from /media-source via `npm run media`)
 * and falls back to three labelled stand-ins when it has none.
 * No titles, credits, clients, awards or festivals are invented: each field
 * that needs real information says so.
 */

export type FilmSectionSlug =
  | "short-films"
  | "commercial-creative"
  | "collaborations";

export interface Credit {
  role: string;
  name: string;
}

export interface FilmProject {
  slug: string;
  n: string;
  /** e.g. SF-01, used on the strip and as the timecode label */
  code: string;
  title: string;
  /** true until real work replaces it */
  placeholder: boolean;
  /** optional real video; when absent the player shows the leader placeholder */
  src?: string;
  poster?: string;
  /** a YouTube or Vimeo link, set from /admin */
  embed?: string;
  synopsis: string;
  details: { label: string; value: string }[];
  credits: Credit[];
}

export interface FilmSection {
  slug: FilmSectionSlug;
  n: string;
  code: string;
  title: string;
  blurb: string;
  lead: string;
  projects: FilmProject[];
}

const TBC = "To be supplied";

/** films added from /admin: a YouTube or Vimeo link plus the details */
interface AdminFilm {
  section: string;
  slug: string;
  title: string;
  url: string;
  year?: number;
  runtime?: string;
  format?: string;
  synopsis?: string;
  credits?: Credit[];
}
const ADMIN_FILMS = (adminFilm as { items: AdminFilm[] }).items;

const DEFS: {
  slug: FilmSectionSlug;
  code: string;
  title: string;
  singular: string;
  blurb: string;
  lead: string;
  roles: string[];
}[] = [
  {
    slug: "short-films",
    code: "SF",
    title: "Short Films",
    singular: "Short Film",
    blurb: "Stories told in minutes.",
    lead: "Narrative and experimental shorts, each presented as its own screening.",
    roles: ["Director", "Cinematography", "Editor", "Sound design", "Colour"],
  },
  {
    slug: "commercial-creative",
    code: "CC",
    title: "Commercial & Creative Work",
    singular: "Commercial Piece",
    blurb: "Work made for a brief.",
    lead: "Commissioned and self-initiated pieces, with the production context alongside.",
    roles: ["Client", "Producer", "Director", "Cinematography", "Edit & grade"],
  },
  {
    slug: "collaborations",
    code: "CO",
    title: "Collaborations",
    singular: "Collaboration",
    blurb: "Made with others.",
    lead: "Work shared with other artists, crews and studios, credited in full.",
    roles: ["Collaborator", "Role", "Production company", "Cinematography"],
  },
];

const detailsFor = (c?: { year?: number; runtime?: string; format?: string }) => [
  { label: "Year", value: c?.year ? String(c.year) : TBC },
  { label: "Runtime", value: c?.runtime ?? TBC },
  { label: "Format", value: c?.format ?? TBC },
  { label: "Camera", value: TBC },
  { label: "Location", value: TBC },
  { label: "Status", value: c ? "Complete" : TBC },
];

export const FILM_SECTIONS: FilmSection[] = DEFS.map((d, si) => {
  const clips = [
    ...FILM_CLIPS.filter((c) => c.section === d.slug).map((c) => ({ ...c, embed: undefined as string | undefined })),
    ...ADMIN_FILMS.filter((f) => f.section === d.slug).map((f) => ({
      ...f,
      src: undefined as string | undefined,
      poster: undefined as string | undefined,
      embed: f.url,
    })),
  ];
  const projects: FilmProject[] = clips.length
    ? clips.map((c, i) => ({
        slug: c.slug,
        n: String(i + 1).padStart(2, "0"),
        code: `${d.code}-${String(i + 1).padStart(2, "0")}`,
        title: c.title,
        placeholder: false,
        src: c.src,
        poster: c.poster,
        embed: c.embed,
        synopsis: c.synopsis ?? "Synopsis to be supplied.",
        details: detailsFor(c),
        credits: c.credits?.length ? c.credits : d.roles.map((role) => ({ role, name: TBC })),
      }))
    : [1, 2, 3].map((i) => {
        const n = String(i).padStart(2, "0");
        return {
          slug: `project-${n}`,
          n,
          code: `${d.code}-${n}`,
          title: `${d.singular} ${n}`,
          placeholder: true,
          synopsis:
            "Synopsis to be supplied. A few sentences on the idea, the story and what the piece set out to do will be set here.",
          details: detailsFor(),
          credits: d.roles.map((role) => ({ role, name: TBC })),
        };
      });
  return {
    slug: d.slug,
    n: String(si + 1).padStart(2, "0"),
    code: d.code,
    title: d.title,
    blurb: d.blurb,
    lead: d.lead,
    projects,
  };
});

export const sectionBySlug = (slug: string) => FILM_SECTIONS.find((s) => s.slug === slug);

/** every project, flattened, in order, tagged with its section */
export const ALL_FILM_PROJECTS = FILM_SECTIONS.flatMap((s) =>
  s.projects.map((p) => ({ ...p, section: s.slug, sectionTitle: s.title })),
);
