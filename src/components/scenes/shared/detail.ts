/**
 * How finely curved parts are tessellated. A phone cannot draw the camera's
 * hundred-segment lenses at a steady frame rate, and at that size nobody can see
 * the difference, so the scene sets this before its parts are built.
 */
export const detail = { k: 1 };

/** round-profile segments (lathes, cylinders) */
export const seg = (n: number) => Math.max(16, Math.round(n * detail.k));

/** corner smoothness of rounded boxes */
export const smooth = (n: number) => Math.max(2, Math.round(n * detail.k));
