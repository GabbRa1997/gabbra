import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import sharp from "sharp";

/** A tiny fake GitHub, so the admin can be tested end to end without touching the real repository. */
async function fakeGithub(page: Page, files: Record<string, string> = {}) {
  const trees: { path: string; sha: string | null }[][] = [];
  const blobs: Record<string, string> = {};
  const commits: string[] = [];
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };

  await page.route("https://api.github.com/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname.replace("/repos/GabbRa1997/gabbra", "");
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });

    if (req.headers()["authorization"] === "Bearer bad") return json({ message: "Bad credentials" }, 401);
    if (p === "") return json({ permissions: { push: true } });
    if (p.startsWith("/contents/")) {
      const path = decodeURIComponent(p.replace("/contents/", ""));
      if (path in files) return route.fulfill({ status: 200, headers: { ...cors, "content-type": "text/plain" }, body: files[path] });
      const dir = Object.keys(files).filter((f) => f.startsWith(`${path}/`));
      if (dir.length) return json(dir.map((f) => ({ name: f.split("/").pop(), path: f, type: "file" })));
      return json({ message: "Not Found" }, 404);
    }
    if (p === "/git/ref/heads/main") return json({ object: { sha: "head1" } });
    if (p === "/git/commits/head1") return json({ tree: { sha: "tree1" } });
    if (p === "/git/blobs") {
      const b = req.postDataJSON();
      const sha = `blob${Object.keys(blobs).length}`;
      blobs[sha] = b.encoding === "base64" ? `base64:${b.content.length}` : b.content;
      return json({ sha });
    }
    if (p === "/git/trees") {
      trees.push(req.postDataJSON().tree);
      return json({ sha: "tree2" });
    }
    if (p === "/git/commits") {
      commits.push(req.postDataJSON().message);
      return json({ sha: "head2" });
    }
    if (p === "/git/refs/heads/main") return json({});
    return json({ message: `unmocked ${p}` }, 500);
  });
  return { trees, blobs, commits };
}

const signedIn = async (page: Page) => {
  await page.addInitScript(() => localStorage.setItem("gabbra:admin-token", "good"));
};

test.describe("Admin", () => {
  test("sign-in rejects a bad key and accepts a good one", async ({ page }) => {
    await fakeGithub(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /sign in with your github key/i })).toBeVisible();
    await page.getByLabel("Your key").fill("bad");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("p[role=alert]")).toContainText(/did not recognise/i);
    await page.getByLabel("Your key").fill("good");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("navigation", { name: "Admin sections" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByLabel("Your key")).toBeVisible();
  });

  test("the admin is kept out of search results", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const robots = await (await page.request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin\//);
  });

  test("Blog: a new post is saved as one commit with its text file", async ({ page }) => {
    await signedIn(page);
    const gh = await fakeGithub(page, {
      "src/content/blog/old-post.md": "---\ntitle: Old post\ndate: 2026-01-02\ndescription: Hello\n---\nBody",
    });
    await page.goto("/admin");
    await expect(page.getByText("Old post")).toBeVisible();
    await page.getByRole("button", { name: "New post" }).click();
    await page.getByLabel("Title", { exact: true }).fill("My First Night Flight");
    await page.getByLabel(/^Description/).fill("A short flight at night.");
    // typed key by key, the way a person does: the comma and space must survive each keystroke
    await page.getByLabel(/^Tags/).pressSequentially("fpv, night,");
    await expect(page.getByLabel(/^Tags/)).toHaveValue("fpv, night,");
    await page.getByLabel(/^Tags/).pressSequentially(" drone");
    const jpg = await sharp({ create: { width: 900, height: 1200, channels: 3, background: "#335577" } }).jpeg().toBuffer();
    await page.locator('input[type="file"]').first().setInputFiles({ name: "cover.jpg", mimeType: "image/jpeg", buffer: jpg });
    await expect(page.getByRole("button", { name: "Remove picture" })).toBeVisible({ timeout: 30_000 });
    await page.getByLabel(/^The post/).fill("It was **dark**.");
    await page.getByRole("button", { name: "Publish post" }).click();
    await expect(page.getByRole("status")).toContainText(/Saved/);
    expect(gh.commits[0]).toBe("Blog: My First Night Flight");
    const paths = gh.trees[0].map((t) => t.path).sort();
    expect(paths).toHaveLength(2);
    expect(paths[0]).toMatch(/^public\/uploads\/blog\/my-first-night-flight-cover-\d+\.(webp|jpg)$/);
    expect(paths[1]).toBe("src/content/blog/my-first-night-flight.md");
    const text = Object.values(gh.blobs).find((b) => b.includes("title: My First Night Flight"))!;
    expect(text).toMatch(/cover: \/uploads\/blog\/my-first-night-flight-cover-\d+\.(webp|jpg)/);
    expect(text).toContain("tags: fpv, night, drone");
    expect(text).toContain("It was **dark**.");
  });

  test("Film: a YouTube link is checked and saved in order", async ({ page }) => {
    await signedIn(page);
    const gh = await fakeGithub(page);
    await page.goto("/admin");
    await page.getByRole("button", { name: "Film", exact: true }).click();
    await page.getByRole("button", { name: "Add a film" }).click();
    await page.getByLabel("Title", { exact: true }).fill("Night Run");
    await page.getByLabel(/^YouTube or Vimeo link/).fill("https://example.com/nope");
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.locator("p[role=alert]")).toContainText(/not a YouTube or Vimeo/);
    await page.getByLabel(/^YouTube or Vimeo link/).fill("https://youtu.be/dQw4w9WgXcQ");
    await page.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText(/Saved/);
    const saved = JSON.parse(Object.values(gh.blobs)[0]);
    expect(saved.items[0]).toMatchObject({ section: "short-films", slug: "night-run", title: "Night Run", url: "https://youtu.be/dQw4w9WgXcQ" });
  });

  test("FPV: a reel and a drone with its sheet are saved", async ({ page }) => {
    await signedIn(page);
    const gh = await fakeGithub(page);
    await page.goto("/admin");
    await page.getByRole("button", { name: "FPV", exact: true }).click();
    await page.getByRole("button", { name: "Add a reel" }).click();
    await page.getByLabel("Reel title").fill("Dive");
    await page.getByLabel("Video link").fill("https://vimeo.com/123456789");
    await page.getByRole("button", { name: "Add a drone" }).click();
    await page.getByLabel("Name", { exact: true }).fill("Cinewhoop");
    await page.getByLabel("Motors").fill("1404 3850KV");
    await page.getByRole("button", { name: "← All drones" }).click();
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText(/Saved/);
    const saved = JSON.parse(Object.values(gh.blobs)[0]);
    expect(saved.reels[0]).toMatchObject({ title: "Dive", url: "https://vimeo.com/123456789" });
    expect(saved.drones[0]).toMatchObject({ name: "Cinewhoop", specs: { Motors: "1404 3850KV" } });
  });

  test("Photography: a new project is resized in the browser and saved with its sizes", async ({ page }) => {
    await signedIn(page);
    const gh = await fakeGithub(page);
    await page.goto("/admin");
    await page.getByRole("button", { name: "Photography", exact: true }).click();
    const jpg = await sharp({ create: { width: 1800, height: 1200, channels: 3, background: "#884422" } }).jpeg().toBuffer();
    await page.getByLabel("Project title").fill("Lisbon Nights");
    await page.locator('input[type="file"]').first().setInputFiles({ name: "IMG 0001.jpg", mimeType: "image/jpeg", buffer: jpg });
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByRole("heading", { name: "Lisbon Nights" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText(/Saved/, { timeout: 30_000 });
    const paths = gh.trees[0].map((t) => t.path);
    expect(paths).toContain("src/content/generated/photos.json");
    // 1800px wide: 480, 960 and 1600 are made
    expect(paths.filter((p) => p.startsWith("public/media/photo/lisbon-nights/img-0001-")).length).toBe(3);
    const json = JSON.parse(Object.values(gh.blobs).find((b) => b.startsWith("{"))!);
    expect(json.projects[0]).toMatchObject({ slug: "lisbon-nights", title: "Lisbon Nights", cover: "img-0001" });
    expect(json.projects[0].photos[0].w).toBe(1800);
  });

  test("Photography: several photographs are added to an existing album and published", async ({ page }) => {
    await signedIn(page);
    const photosJson = readFileSync("src/content/generated/photos.json", "utf8");
    const gh = await fakeGithub(page, { "src/content/generated/photos.json": photosJson });
    await page.goto("/admin");
    await page.getByRole("button", { name: "Photography", exact: true }).click();
    await page.getByRole("button", { name: "Open", exact: true }).first().click();
    const before = await page.getByRole("button", { name: "Make cover" }).count();
    const big = await sharp({ create: { width: 5184, height: 3456, channels: 3, background: "#446688" } }).jpeg().toBuffer();
    const png = await sharp({ create: { width: 1200, height: 1800, channels: 3, background: "#884444" } }).png().toBuffer();
    await page.locator('input[type="file"]').first().setInputFiles([
      { name: "IMG_0001.JPG", mimeType: "image/jpeg", buffer: big },
      { name: "Edit 2.png", mimeType: "image/png", buffer: png },
      { name: "IMG_0003.jpeg", mimeType: "image/jpeg", buffer: big },
    ]);
    await expect(page.getByText(/Added 3 photographs/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: "Make cover" })).toHaveCount(before + 3);
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status").last()).toContainText(/Saved/, { timeout: 60_000 });
    const paths = gh.trees[0].map((t) => t.path);
    expect(paths.filter((x) => x.includes("/img-0001-")).length).toBeGreaterThanOrEqual(3);
    expect(paths).toContain("src/content/generated/photos.json");
  });

  test("Photography: a file that cannot be read is named, and the others are still added", async ({ page }) => {
    await signedIn(page);
    const gh = await fakeGithub(page, { "src/content/generated/photos.json": readFileSync("src/content/generated/photos.json", "utf8") });
    await page.goto("/admin");
    await page.getByRole("button", { name: "Photography", exact: true }).click();
    await page.getByRole("button", { name: "Open", exact: true }).first().click();
    const jpg = await sharp({ create: { width: 1000, height: 700, channels: 3, background: "#337744" } }).jpeg().toBuffer();
    await page.locator('input[type="file"]').first().setInputFiles([
      { name: "holiday.heic", mimeType: "image/heic", buffer: Buffer.from("not really an image") },
      { name: "good.jpg", mimeType: "image/jpeg", buffer: jpg },
    ]);
    await expect(page.getByText(/Added 1 photograph/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/holiday\.heic/)).toBeVisible();
    expect(gh.commits).toHaveLength(0);
  });

  test("Prints: sizes and prices are saved, and only a Stripe link is accepted", async ({ page }) => {
    await signedIn(page);
    const gh = await fakeGithub(page, { "src/content/admin/prints.json": readFileSync("src/content/admin/prints.json", "utf8") });
    await page.goto("/admin");
    await page.getByRole("button", { name: "Prints", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Print sizes and prices" })).toBeVisible();
    await page.getByLabel("Price").first().fill("€90");
    await page.getByLabel(/^Stripe payment link/).first().fill("https://example.com/pay");
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.locator("p[role=status], p").filter({ hasText: /must be a Stripe link/ }).first()).toBeVisible();
    expect(gh.commits).toHaveLength(0);
    await page.getByLabel(/^Stripe payment link/).first().fill("https://buy.stripe.com/test_abc123");
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText(/Saved/);
    expect(gh.commits[0]).toBe("Prints: update sizes and prices");
    const json = JSON.parse(Object.values(gh.blobs).find((b) => b.startsWith("{"))!);
    expect(json.sizes[0]).toMatchObject({ price: "€90", link: "https://buy.stripe.com/test_abc123" });
  });

  test("Google SEO: titles and descriptions are previewed, checked and saved; missing text is flagged", async ({ page }) => {
    await signedIn(page);
    const gh = await fakeGithub(page, {
      "src/content/blog/no-desc.md": "---\ntitle: A post without text\ndate: 2026-02-02\ndescription:\n---\nBody",
    });
    await page.goto("/admin");
    await page.getByRole("button", { name: "Google SEO" }).click();
    await expect(page.getByText(/A post without text/).first()).toBeVisible();
    await expect(page.getByText(/has no description/).first()).toBeVisible();

    await page.getByRole("navigation", { name: "Pages" }).getByRole("button", { name: "Film" }).click();
    await page.getByLabel(/^Page title/).fill("FPV & cinematic film by GabbRa");
    await page.getByLabel(/^Description/).fill("Short films, commercial work and collaborations shot on FPV drones and cinema cameras.");
    await page.getByLabel(/^Focus phrases/).fill("FPV film, ghost phrase");
    await expect(page.getByLabel("Google preview")).toContainText("FPV & cinematic film by GabbRa — GabbRa");
    await expect(page.getByText(/Not yet in the title or description:.*“ghost phrase”/)).toBeVisible();
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText(/Saved/);
    const saved = JSON.parse(Object.values(gh.blobs)[0]);
    expect(saved.pages["/film"]).toMatchObject({
      title: "FPV & cinematic film by GabbRa",
      focus: ["FPV film", "ghost phrase"],
    });
  });
});
