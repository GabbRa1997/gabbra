import { expect, test, type Page } from "@playwright/test";
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
    await page.getByLabel(/^Tags/).fill("fpv, night");
    await page.getByLabel(/^The post/).fill("It was **dark**.");
    await page.getByRole("button", { name: "Publish post" }).click();
    await expect(page.getByRole("status")).toContainText(/Saved/);
    expect(gh.commits[0]).toBe("Blog: My First Night Flight");
    expect(gh.trees[0].map((t) => t.path)).toEqual(["src/content/blog/my-first-night-flight.md"]);
    const text = Object.values(gh.blobs)[0];
    expect(text).toContain("title: My First Night Flight");
    expect(text).toContain("tags: fpv, night");
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
});
