/** The search title and description each main page uses until /admin overrides them. */

export interface SeoPage {
  path: string;
  label: string;
  title: string;
  description: string;
}

export const SEO_PAGES: SeoPage[] = [
  {
    path: "/",
    label: "Home",
    title: "GabbRa — Photo / FPV / Film",
    description:
      "GabbRa is an independent creative practice across photography, FPV drone flying and film. Reality, reframed.",
  },
  {
    path: "/photo",
    label: "Photography",
    title: "Photography",
    description: "Open the camera: an interactive exploded view of a Canon EOS 550D, and the way into the photography.",
  },
  {
    path: "/fpv",
    label: "FPV",
    title: "FPV",
    description: "Built for flight: an interactive exploded view of a five-inch FPV quad, and the way into the FPV work.",
  },
  {
    path: "/film",
    label: "Film",
    title: "Film",
    description: "Frames, in sequence: short films, commercial and creative work, and collaborations.",
  },
  {
    path: "/blog",
    label: "Blog",
    title: "Blog",
    description: "Notes from behind the lens: photography, FPV drone flying and filmmaking, and how the work is made.",
  },
  {
    path: "/artist",
    label: "Who am I?",
    title: "Who am I?",
    description: "Behind the lens, beyond the frame: the story of the person behind GabbRa.",
  },
  {
    path: "/about",
    label: "About GabbRa",
    title: "About GabbRa",
    description: "GabbRa is an independent creative practice working across photography, FPV and film.",
  },
  {
    path: "/contact",
    label: "Contact & Commissions",
    title: "Contact & Commissions",
    description: "Commission enquiries for photography, FPV drone footage and film, plus prints and collaborations.",
  },
];

/** what /admin saves into src/content/admin/seo.json */
export interface SeoOverride {
  title?: string;
  description?: string;
  /** phrases the page should be found for, e.g. "FPV drone filmmaker" */
  focus?: string[];
}
export interface SeoFile {
  pages: Record<string, SeoOverride>;
}

export const TITLE_MAX = 60;
export const DESC_MAX = 155;
