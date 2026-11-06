/** Prepares a photograph for the web in the browser: right way up, several sizes, a blur and a colour. */

export interface Variant {
  w: number;
  ext: "webp" | "jpg";
  blob: Blob;
}

export interface Processed {
  w: number;
  h: number;
  blur: string;
  color: string;
  variants: Variant[];
}

export const PHOTO_WIDTHS = [480, 960, 1600, 2400];

function draw(bmp: ImageBitmap, width: number) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = Math.max(1, Math.round((bmp.height * width) / bmp.width));
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("This browser cannot prepare images.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}

const toBlob = (c: HTMLCanvasElement, type: string, q: number) =>
  new Promise<Blob | null>((res) => c.toBlob(res, type, q));

/** WebP where the browser can make it, otherwise JPEG. */
async function encode(c: HTMLCanvasElement, q: number): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  const w = await toBlob(c, "image/webp", q);
  if (w && w.type === "image/webp") return { blob: w, ext: "webp" };
  const j = await toBlob(c, "image/jpeg", Math.min(0.9, q + 0.06));
  if (!j) throw new Error("Could not prepare this image.");
  return { blob: j, ext: "jpg" };
}

export async function processImage(file: File, widths = PHOTO_WIDTHS): Promise<Processed> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      // some browsers do not accept the options; the picture is still right way up in most of them
      bmp = await createImageBitmap(file);
    } catch {
      throw new Error(`${file.name}: this file cannot be read here. Use JPG, PNG or WebP (iPhone HEIC photos: share or export them as JPG first).`);
    }
  }
  const max = widths[widths.length - 1];
  let sizes = widths.filter((x) => x <= bmp.width);
  if (sizes.length === 0 || sizes[sizes.length - 1] < Math.min(bmp.width, max) * 0.8) sizes.push(Math.min(bmp.width, max));
  sizes = [...new Set(sizes)];

  const variants: Variant[] = [];
  for (const w of sizes) {
    const { blob, ext } = await encode(draw(bmp, w), w >= 1600 ? 0.8 : 0.76);
    variants.push({ w, ext, blob });
  }

  const tiny = draw(bmp, 24);
  const blur = tiny.toDataURL("image/webp", 0.3);
  const small = draw(bmp, 32);
  const px = small.getContext("2d")!.getImageData(0, 0, small.width, small.height).data;
  let r = 0;
  let g = 0;
  let b = 0;
  const n = px.length / 4;
  for (let i = 0; i < px.length; i += 4) {
    r += px[i];
    g += px[i + 1];
    b += px[i + 2];
  }
  const hex = [r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("");
  const out = { w: bmp.width, h: bmp.height, blur, color: `#${hex}`, variants };
  bmp.close();
  return out;
}
