/** Site-wide facts. Change them here and they change everywhere. */
export const SITE = {
  name: "GabbRa",
  tagline: "Reality, Reframed.",
  /** where enquiries go */
  email: "tudosie3@gmail.com",
  /** Instagram handle without the @; null hides the link until it is supplied */
  instagram: null as string | null,
};

export const instagramUrl = SITE.instagram ? `https://instagram.com/${SITE.instagram}` : null;
