#!/usr/bin/env node
/**
 * Turns the originals in /media-source into web-ready media.
 *
 *   photos  → /public/media/photo/<project>/<photo>-<width>.webp  (4 sizes, EXIF-rotated)
 *   clips   → /public/media/film/<section>/<clip>/video.mp4 (+ poster)
 *   data    → /src/content/generated/{photos,film}.json
 *
 * Photographs are now managed from gabbra.net/admin, so this script leaves them alone
 * unless you run it with --photos (which REPLACES whatever the admin has published).
 *
 * Run:  npm run media
 * The originals never leave the computer; only the optimised copies are published.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "media-source");
const OUT = path.join(ROOT, "public", "media");
const GEN = path.join(ROOT, "src", "content", "generated");
const WIDTHS = [480, 960, 1600, 2400];
const IMAGE = /\.(jpe?g|png|webp|tiff?|avif|heic)$/i;
const VIDEO = /\.(mp4|webm|m4v|mov)$/i;
const SECTIONS = ["short-films", "commercial-creative", "visual-stories", "collaborations"];

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const humanise = (s) =>
  s
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[-_ ]+/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
const visible = (name) => !name.startsWith("_") && !name.startsWith(".");

const exists = (p) => fs.access(p).then(() => true, () => false);
const readJson = async (p) => ((await exists(p)) ? JSON.parse(await fs.readFile(p, "utf8")) : {});
const list = async (dir) => ((await exists(dir)) ? (await fs.readdir(dir, { withFileTypes: true })).filter((d) => visible(d.name)) : []);
const rel = (p) => "/" + path.relative(path.join(ROOT, "public"), p).split(path.sep).join("/");
const mb = (n) => (n / 1048576).toFixed(1) + " MB";
const hex = ({ r, g, b }) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

async function processPhoto(file, outDir, projectTitle, alt) {
  const base = slug(path.basename(file, path.extname(file)));
  const meta = await sharp(file, { failOn: "none" }).metadata();
  const turned = (meta.orientation ?? 1) >= 5;
  const w = turned ? meta.height : meta.width;
  const h = turned ? meta.width : meta.height;
  const sizes = WIDTHS.filter((x) => x <= w);
  if (sizes.length === 0 || sizes[sizes.length - 1] < Math.min(w, WIDTHS.at(-1)) * 0.8) sizes.push(Math.min(w, WIDTHS.at(-1)));

  const srcset = [];
  for (const width of [...new Set(sizes)]) {
    const target = path.join(outDir, `${base}-${width}.webp`);
    await sharp(file, { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: width >= 1600 ? 80 : 76, effort: 4 })
      .toFile(target);
    srcset.push({ w: width, url: rel(target) });
  }
  const blurBuf = await sharp(file, { failOn: "none" }).rotate().resize(24).blur(0.8).webp({ quality: 30 }).toBuffer();
  const stats = await sharp(file, { failOn: "none" }).rotate().resize(32).stats();

  return {
    id: base,
    file: path.basename(file),
    alt: alt || `Photograph from ${projectTitle}`,
    w,
    h,
    blur: `data:image/webp;base64,${blurBuf.toString("base64")}`,
    color: hex(stats.dominant),
    srcset,
    src: srcset[srcset.length - 1].url,
  };
}

async function photos() {
  const root = path.join(SRC, "photo");
  await fs.rm(path.join(OUT, "photo"), { recursive: true, force: true });
  const projects = [];

  const entries = await list(root);
  const folders = entries.filter((d) => d.isDirectory());
  const loose = entries.filter((d) => d.isFile() && IMAGE.test(d.name));
  const groups = folders.map((d) => ({ name: d.name, dir: path.join(root, d.name) }));
  if (loose.length) groups.push({ name: "Selected", dir: root, onlyFiles: true });

  for (const g of groups) {
    const cfg = await readJson(path.join(g.dir, "project.json"));
    const files = (await fs.readdir(g.dir, { withFileTypes: true }))
      .filter((d) => d.isFile() && IMAGE.test(d.name) && visible(d.name))
      .map((d) => d.name);
    if (!files.length) continue;
    const order = Array.isArray(cfg.order) ? cfg.order : [];
    files.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 1e6 : ia) - (ib === -1 ? 1e6 : ib);
      return natural(a, b);
    });

    const title = cfg.title || humanise(g.name);
    const pslug = slug(g.name);
    const outDir = path.join(OUT, "photo", pslug);
    await fs.mkdir(outDir, { recursive: true });

    const done = [];
    for (const f of files) {
      process.stdout.write(`  ${pslug}/${f}\n`);
      try {
        done.push(await processPhoto(path.join(g.dir, f), outDir, title, cfg.alts?.[f]));
      } catch (e) {
        console.warn(`  ! skipped ${f}: ${e.message}`);
      }
    }
    if (!done.length) continue;

    for (const p of cfg.prints ?? []) {
      const hit = done.find((d) => d.file === p.file);
      if (hit) hit.print = { sizes: p.sizes, paper: p.paper, edition: p.edition, price: p.price };
    }
    const cover = done.find((d) => d.file === cfg.cover) ?? done[0];
    projects.push({
      slug: pslug,
      title,
      subject: cfg.subject || "Photography",
      year: cfg.year,
      description: cfg.description,
      order: cfg.position ?? projects.length,
      cover: cover.id,
      photos: done,
    });
  }
  projects.sort((a, b) => a.order - b.order);
  await fs.writeFile(path.join(GEN, "photos.json"), JSON.stringify({ projects }, null, 2) + "\n");
  return projects;
}

async function clips() {
  await fs.rm(path.join(OUT, "film"), { recursive: true, force: true });
  const out = [];
  for (const section of SECTIONS) {
    const dir = path.join(SRC, "film", section);
    const entries = await list(dir);
    const units = [];
    for (const e of entries) {
      if (e.isFile() && VIDEO.test(e.name)) units.push({ name: e.name, dir, video: e.name, loose: true });
      if (e.isDirectory()) {
        const inner = await fs.readdir(path.join(dir, e.name));
        const video = inner.filter((n) => VIDEO.test(n) && visible(n)).sort(natural)[0];
        if (video) units.push({ name: e.name, dir: path.join(dir, e.name), video });
      }
    }
    units.sort((a, b) => natural(a.name, b.name));

    for (const u of units) {
      const cfg = await readJson(path.join(u.dir, u.loose ? `${path.basename(u.video, path.extname(u.video))}.json` : "project.json"));
      const rawTitle = cfg.title || humanise(u.name);
      const cslug = slug(rawTitle) || slug(u.name);
      const outDir = path.join(OUT, "film", section, cslug);
      await fs.mkdir(outDir, { recursive: true });

      const source = path.join(u.dir, u.video);
      const ext = path.extname(u.video).toLowerCase();
      const target = path.join(outDir, `video${ext}`);
      await fs.copyFile(source, target);
      const size = (await fs.stat(target)).size;
      if (size > 40 * 1048576) console.warn(`  ! ${u.video} is ${mb(size)}; consider exporting a smaller H.264 file`);
      if (ext === ".mov") console.warn(`  ! ${u.video} is .mov, which some browsers will not play; export as .mp4 (H.264)`);

      let poster;
      const posterFile = u.loose ? null : (await fs.readdir(u.dir)).find((n) => /^poster\.(jpe?g|png|webp)$/i.test(n));
      if (posterFile) {
        const p = path.join(outDir, "poster.webp");
        await sharp(path.join(u.dir, posterFile)).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toFile(p);
        poster = rel(p);
      }
      process.stdout.write(`  film/${section}/${cslug} (${mb(size)})\n`);
      out.push({
        section,
        slug: cslug,
        title: rawTitle,
        src: rel(target),
        poster,
        year: cfg.year,
        runtime: cfg.runtime,
        format: cfg.format,
        synopsis: cfg.synopsis,
        credits: cfg.credits,
      });
    }
  }
  await fs.writeFile(path.join(GEN, "film.json"), JSON.stringify({ clips: out }, null, 2) + "\n");
  return out;
}

await fs.mkdir(GEN, { recursive: true });
console.log("Photographs");
const p = process.argv.includes("--photos") ? await photos() : [];
console.log("Clips");
const c = await clips();
console.log(
  `\nDone: ${p.length} photo project(s), ${p.reduce((n, x) => n + x.photos.length, 0)} photograph(s), ${c.length} clip(s).`,
);
