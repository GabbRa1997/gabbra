import data from "@/content/admin/prints.json";

/**
 * The print price list. Every photograph is offered in the same sizes, measured along
 * the long edge, so photographs of any shape work. Prices and payment links are set
 * from /admin; until they are, a size shows no price and the buy button waits.
 */
export interface PrintSize {
  id: string;
  label: string;
  /** length of the long edge, in cm */
  long: number;
  /** shown as typed, e.g. "€120" */
  price: string;
  /** a Stripe Payment Link for this size */
  link: string;
}

export interface PrintsConfig {
  paper: string;
  note: string;
  sizes: PrintSize[];
}

export const PRINTS_CFG = data as PrintsConfig;

/** only Stripe's own payment pages are ever linked to */
export function isStripeLink(u?: string) {
  try {
    const x = new URL(u ?? "");
    return x.protocol === "https:" && (x.hostname === "stripe.com" || x.hostname.endsWith(".stripe.com"));
  } catch {
    return false;
  }
}

/** the payment link, tagged with which photograph was chosen so every order says what to print */
export function buyUrl(link: string, ref: string) {
  const u = new URL(link);
  u.searchParams.set("client_reference_id", ref.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 190));
  return u.toString();
}

/** printed size of a photograph whose long edge is `long` cm */
export function printDims(w: number, h: number, long: number) {
  const short = Math.round(((long * Math.min(w, h)) / Math.max(w, h)) * 10) / 10;
  return w >= h ? { w: long, h: short } : { w: short, h: long };
}

export const cm = (n: number) => String(Math.round(n * 10) / 10).replace(/\.0$/, "");
