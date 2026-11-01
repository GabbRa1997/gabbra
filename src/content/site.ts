/** Site-wide facts. Change them here and they change everywhere. */
export const SITE = {
  name: "GabbRa",
  tagline: "Reality, Reframed.",
  /** where enquiries go */
  email: "tudosie3@gmail.com",
  /** Instagram handle without the @; null hides the link until it is supplied */
  instagram: null as string | null,
  /** Google Analytics 4 measurement ID (G-XXXXXXXXXX); null keeps analytics and the cookie notice off */
  gaId: "G-FVCJ479CJB" as string | null,
  /** Search Console "HTML tag" verification code (the content="..." value); null leaves the tag out */
  googleVerification: null as string | null,
};

export const instagramUrl = SITE.instagram ? `https://instagram.com/${SITE.instagram}` : null;
