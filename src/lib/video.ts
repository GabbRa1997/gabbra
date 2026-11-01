/**
 * Turns a YouTube or Vimeo address into the address of its embeddable player,
 * or null when the link is not one we recognise.
 */
export function embedUrl(input: string): string | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = u.searchParams.get("v");
    const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{6,})/);
    if (!id && m) id = m[2];
  }
  if (id && /^[\w-]{6,}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(\d{5,})/);
    if (m) {
      const h = u.searchParams.get("h") ?? u.pathname.match(/\/\d+\/([0-9a-f]{8,})/)?.[1];
      return `https://player.vimeo.com/video/${m[1]}${h ? `?h=${h}` : ""}`;
    }
  }
  return null;
}
