import { expect, test, type Page } from "@playwright/test";
import photos from "../src/content/generated/photos.json";
import film from "../src/content/generated/film.json";

const projects = photos.projects as { slug: string; title: string; photos: { print?: object }[] }[];
const hasPhotos = projects.length > 0;
const hasPrints = projects.some((p) => p.photos.some((x) => x.print));
const clips = film.clips as { section: string; slug: string }[];
const hasClips = clips.length > 0;
const shortFilmsReal = clips.some((c) => c.section === "short-films");

const enterSilent = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: /enter silent/i }).click();
  await expect(page.getByRole("link", { name: /PHOTO/ })).toBeVisible({ timeout: 15_000 });
};

test.describe("Landing", () => {
  test("gate → logo reveal → four destinations", async ({ page }) => {
    await enterSilent(page);
    for (const label of ["PHOTO", "FPV", "FILM", "BLOG"]) {
      await expect(page.getByRole("link", { name: new RegExp(label) }).first()).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /turn sound on|mute sound/i })).toBeVisible(); // the mute control
  });

  test("Photo opens the camera experience through the transition", async ({ page }) => {
    await enterSilent(page);
    await page.getByRole("link", { name: /PHOTO/ }).first().click();
    await expect(page).toHaveURL(/\/photo$/);
    await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /open the camera/i })).toBeVisible();
  });

  test("returning to the main experience is always one click", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("link", { name: /return to the main experience/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("Photography — 550D", () => {
  test("disassemble, inspect a part, follow its destination", async ({ page }) => {
    await page.goto("/photo");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });

    const toggle = page.getByRole("button", { name: /^disassemble$/i });
    await toggle.click();
    await expect(page.getByRole("button", { name: /^assemble$/i })).toHaveAttribute("aria-pressed", "true");

    // select the sensor from the components list
    await page.getByRole("button", { name: /CMOS sensor/ }).click();
    const panel = page.locator("aside");
    await expect(panel).toContainText("CMOS sensor");
    await expect(panel).toContainText("22.3 × 14.9 mm");

    // Escape releases the inspection
    await page.keyboard.press("Escape");
    await expect(panel).not.toContainText("CMOS sensor");

    // the sensor opens Prints
    await page.getByRole("button", { name: /CMOS sensor/ }).click();
    await page.getByRole("link", { name: /Enter Selected Prints/ }).click();
    await expect(page).toHaveURL(/\/photo\/prints$/);
    await expect(page.getByRole("heading", { name: "Selected Prints" })).toBeVisible();
  });

  test("explosion slider is keyboard operable", async ({ page }) => {
    await page.goto("/photo");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
    const slider = page.getByRole("slider", { name: /explosion amount/i });
    await slider.focus();
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("1");
    await expect(page.getByRole("button", { name: /^assemble$/i })).toBeVisible();
  });

  test("all three destinations exist with placeholders, not invented work", async ({ page }) => {
    for (const slug of ["selected-works", "prints", "experiments"]) {
      await page.goto(`/photo/${slug}`);
      await expect(page.locator("h1")).toBeVisible();
      const real = (slug === "selected-works" && hasPhotos) || (slug === "prints" && hasPrints);
      if (!real) await expect(page.getByText(/placeholder|to be supplied|TBC/i).first()).toBeVisible();
    }
  });

  test("WebGL unavailable → readable technical sheet instead of a blank page", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
        if (/webgl/i.test(type)) return null;
        // @ts-expect-error passthrough
        return orig.call(this, type, ...rest);
      } as typeof orig;
    });
    await page.goto("/photo");
    await expect(page.getByText(/3D view unavailable/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("dt", { hasText: "CMOS sensor" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Selected Works/ })).toBeVisible();
  });
});

test.describe("Responsive + accessibility", () => {
  test("phone: no sideways scroll on any page", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    for (const path of ["/", "/photo", "/photo/prints", "/about", "/contact", "/fpv", "/fpv/projects", "/film", "/film/short-films", "/film/short-films/project-01"]) {
      await page.goto(path);
      if (path === "/") await page.getByRole("button", { name: /enter silent/i }).click();
      await page.waitForTimeout(path === "/photo" ? 2500 : 600);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
    await ctx.close();
  });

  test("reduced motion: experience still fully usable", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: /enter silent/i }).click();
    await expect(page.getByRole("link", { name: /FILM/ }).first()).toBeVisible({ timeout: 10_000 });
    await page.goto("/photo");
    await page.getByRole("button", { name: /^disassemble$/i }).click();
    await expect(page.getByRole("button", { name: /^assemble$/i })).toBeVisible();
    await ctx.close();
  });

  test("every step of the breadcrumb is a link back", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("gabbra:consent", "denied"));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/film/short-films/project-01");
    const nav = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(nav.getByRole("link")).toHaveCount(3);
    await nav.getByRole("link", { name: "SHORT FILMS" }).click();
    await expect(page).toHaveURL(/\/film\/short-films\/?$/);
    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "FILM", exact: true }).click();
    await expect(page).toHaveURL(/\/film\/?$/);
  });

  test("menu opens, traps nothing, closes with Escape", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("gabbra:consent", "denied")); // the cookie notice is a dialog too
    await page.goto("/about");
    await page.getByRole("button", { name: /^menu$/i }).click();
    await expect(page.getByRole("dialog", { name: /site menu/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("FPV — 5-inch quad", () => {
  test("the quad loads, explodes, and a part opens its destination", async ({ page }) => {
    await page.goto("/fpv");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /built for flight/i })).toBeVisible();

    await page.getByRole("button", { name: /^disassemble$/i }).click();
    await expect(page.getByRole("button", { name: /^assemble$/i })).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: /Flight controller/ }).click();
    const panel = page.locator("aside");
    await expect(panel).toContainText("Flight controller");
    await expect(panel).toContainText(/Betaflight/);
    await page.getByRole("button", { name: /FPV camera/ }).click();
    await page.getByRole("link", { name: /Enter Flight Reels/ }).click();
    await expect(page).toHaveURL(/\/fpv\/flight-reels$/);
  });

  test("the goggles are part of the scene and can be inspected", async ({ page }) => {
    await page.goto("/fpv");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /FPV goggles/ }).click();
    await expect(page.locator("aside")).toContainText("The pilot's window");
    await expect(page.getByRole("link", { name: /Enter (Flight Reels|Drones Owned)/ })).toHaveCount(0);
  });

  test("both FPV destinations exist with placeholders", async ({ page }) => {
    for (const slug of ["flight-reels", "drones-owned"]) {
      await page.goto(`/fpv/${slug}`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText(/placeholder|to be supplied/i).first()).toBeVisible();
    }
  });

  test("WebGL unavailable → readable technical sheet", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
        if (/webgl/i.test(type)) return null;
        // @ts-expect-error passthrough
        return orig.call(this, type, ...rest);
      } as typeof orig;
    });
    await page.goto("/fpv");
    await expect(page.getByText(/3D view unavailable/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("dt", { hasText: "Flight controller" })).toBeVisible();
  });
});

test.describe("Film — frames in sequence", () => {
  test("the hub offers three reels and a scrubbable timeline", async ({ page }) => {
    await page.goto("/film");
    await expect(page.getByRole("heading", { name: /frames, in sequence/i })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Film" });
    for (const t of ["Short Films", "Commercial & Creative Work", "Collaborations"]) {
      await expect(nav.getByRole("link", { name: new RegExp(t.replace("&", "&")) })).toBeVisible();
    }
    // choosing a chapter jumps the strip, and the timeline follows
    const timeline = page.getByRole("slider", { name: /scrub the film strip/i });
    await page.getByRole("button", { name: /CO · Collaborations/ }).click();
    await expect.poll(async () => parseFloat(await timeline.inputValue())).toBeGreaterThan(0.4);
  });

  test("reel → project → the player plays, seeks and goes full screen", async ({ page }) => {
    await page.goto("/film");
    await page.getByRole("navigation", { name: "Film" }).getByRole("link", { name: /Short Films/ }).click();
    await expect(page).toHaveURL(/\/film\/short-films$/);
    await page.locator("main ul a").first().click();
    await expect(page).toHaveURL(/\/film\/short-films\/[^/]+$/);

    const player = page.getByRole("group", { name: /video player/i });
    await player.getByRole("button", { name: /^Play / }).click();
    await expect(player.getByRole("button", { name: "Pause" }).first()).toBeVisible();

    const seek = player.getByRole("slider", { name: "Seek" });
    await seek.focus();
    await page.keyboard.press("Home");
    await expect.poll(async () => parseFloat(await seek.inputValue())).toBeLessThan(5);

    await player.getByRole("button", { name: /^Full screen$/ }).click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await page.keyboard.press("Escape");
  });

  test("projects carry credits and production details, none invented", async ({ page }) => {
    test.skip(shortFilmsReal, "short films now hold real work");
    await page.goto("/film/short-films/project-02");
    await expect(page.getByRole("heading", { name: "Production details" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible();
    const filled = await page.locator("dd").allTextContents();
    expect(filled.length).toBeGreaterThan(5);
    for (const v of filled) expect(v).toMatch(/to be supplied/i);
  });

  test("every section and project page exists", async ({ page }) => {
    for (const s of ["short-films", "commercial-creative", "collaborations"]) {
      await page.goto(`/film/${s}`);
      await expect(page.locator("h1")).toBeVisible();
      await page.locator("main ul a").last().click();
      await expect(page.getByRole("group", { name: /video player/i })).toBeVisible();
    }
  });

  test("reduced motion: strips hold still but the hub stays usable", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/film");
    await expect(page.getByRole("heading", { name: /frames, in sequence/i })).toBeVisible();
    const timeline = page.getByRole("slider", { name: /scrub the film strip/i });
    await page.waitForTimeout(600); // let the strip settle on its starting frame
    const a = await timeline.inputValue();
    await page.waitForTimeout(800);
    expect(await timeline.inputValue()).toBe(a);
    await ctx.close();
  });
});

test.describe("Portfolio — real content", () => {
  test("selected works lists projects; one opens, the viewer works with the keyboard", async ({ page }) => {
    test.skip(!hasPhotos, "no photographs supplied yet");
    await page.addInitScript(() => localStorage.setItem("gabbra:consent", "denied"));
    await page.goto("/photo/selected-works");
    await page.getByRole("link", { name: new RegExp(projects[0].title) }).first().click();
    await expect(page).toHaveURL(new RegExp(`/photo/selected-works/${projects[0].slug}$`));
    await expect(page.locator("main img").first()).toBeVisible();

    await page.getByRole("button", { name: /Open photograph 1 of/ }).click();
    const viewer = page.getByRole("dialog");
    await expect(viewer).toBeVisible();
    const count = projects[0].photos.length;
    if (count > 1) {
      await page.keyboard.press("ArrowRight");
      await expect(viewer).toHaveAttribute("aria-label", new RegExp(`photograph 2 of ${count}`));
    }
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
  });

  test("a print page shows the photograph to scale and the size changes the preview", async ({ page }) => {
    test.skip(!hasPhotos, "no photographs supplied yet");
    await page.addInitScript(() => localStorage.setItem("gabbra:consent", "denied"));
    await page.goto(`/photo/print?photo=${projects[0].slug}/${(projects[0].photos[0] as { id: string }).id}`);
    await expect(page.getByRole("heading", { name: "Request a print" })).toBeVisible();
    const sizes = page.getByRole("radio");
    await expect(sizes).toHaveCount(4);
    const label = page.locator("figure p").first();
    const small = await label.textContent();
    await sizes.nth(3).click();
    await expect(label).not.toHaveText(small ?? "");
    // no payment link yet, so the buy button waits and nothing sends the visitor anywhere
    await expect(page.getByText("Checkout opens soon")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("the full-screen viewer offers Request print for the photograph on show", async ({ page }) => {
    test.skip(!hasPhotos, "no photographs supplied yet");
    await page.addInitScript(() => localStorage.setItem("gabbra:consent", "denied"));
    await page.goto(`/photo/selected-works/${projects[0].slug}`);
    await page.getByRole("button", { name: /Open photograph 1 of/ }).click();
    await page.getByRole("link", { name: /Request print/ }).click();
    await expect(page).toHaveURL(/\/photo\/print\?photo=/);
    await expect(page.getByRole("heading", { name: "Request a print" })).toBeVisible();
  });

  test("real clips play from their own file", async ({ page }) => {
    test.skip(!hasClips, "no clips supplied yet");
    const c = clips[0];
    await page.goto(`/film/${c.section}/${c.slug}`);
    await expect(page.locator("video")).toHaveAttribute("src", /\/media\/film\//);
  });
});

test.describe("Contact", () => {
  test("email and the enquiry form are there", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("link", { name: "gabbra.net@outlook.com" })).toBeVisible();
    await page.getByLabel("Your name").fill("Test Visitor");
    await page.getByLabel("Your email").fill("visitor@example.com");
    await page.getByLabel("Tell me about it").fill("A test enquiry.");
    await page.getByRole("button", { name: /write the email/i }).click();
    await expect(page.getByRole("status")).toContainText(/email app/i);
  });
});

test.describe("Phone — descriptions pop up on the 3D view", () => {
  for (const [path, part, spec] of [
    ["/photo", /CMOS sensor/, "22.3 × 14.9 mm"],
    ["/fpv", /Flight controller/, "Betaflight"],
  ] as const) {
    test(`${path}: hint first, then a card over the stage`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      await ctx.addInitScript(() => localStorage.setItem("gabbra:consent", "denied")); // no cookie notice in the way
      const page = await ctx.newPage();
      await page.goto(path);
      await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });

      // before anything is pressed: a clue
      await expect(page.getByText("Disassemble, then tap a part")).toBeVisible();
      await page.getByRole("button", { name: /^disassemble$/i }).first().click();
      await expect(page.getByText("Tap any part to inspect it")).toBeVisible();

      // choose a part (the list is collapsed on phones, so open it): the card appears on the stage, in view
      await page.getByText(/Components · \d+/).click();
      await page.getByRole("button", { name: part }).click();
      const card = page.locator("h2", { hasText: part }).first();
      await expect(card).toBeVisible();
      await expect(card.locator("xpath=..")).toContainText(spec);
      const box = await card.boundingBox();
      expect(box && box.y >= 0 && box.y < 844, "card is on screen").toBeTruthy();

      // closing it brings the hint back
      await page.getByRole("button", { name: "Close description" }).click();
      await expect(page.getByText("Tap any part to inspect it")).toBeVisible();
      await ctx.close();
    });
  }
});

test.describe("Artist", () => {
  test("a Who am I card under the logo leads to the artist page, separate from the four destinations", async ({ page }) => {
    await enterSilent(page);
    const card = page.getByRole("link", { name: /who am i/i });
    await expect(card).toBeVisible();
    // it is not one of the four destinations
    await expect(page.getByRole("navigation", { name: /enter a section/i }).getByRole("link", { name: /artist/i })).toHaveCount(0);
    await card.click();
    await expect(page).toHaveURL(/\/artist$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/who am i/i);
    await expect(page.getByText("Behind the lens, beyond the frame.").first()).toBeVisible();
  });

  test("the story page holds the portrait, the full text and a space for the Canon 550D photo", async ({ page }) => {
    await page.goto("/artist");
    await expect(page.getByRole("img", { name: /portrait of the artist/i })).toBeVisible();
    await expect(page.getByText(/photography competition/i)).toBeVisible();
    await expect(page.getByText(/Canon 550D/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Now" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "GabbRa" })).toBeVisible();
    await expect(page.getByText(/Welcome to GabbRa/)).toBeVisible();
  });

  test("About speaks about GabbRa and points to Who am I", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /reality, reframed/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /who am i/i })).toBeVisible();
  });
});

test.describe("Back arrow", () => {
  test("every inner page has a back arrow that goes one level up", async ({ page }) => {
    // a path through pages without a 3D scene, so the test measures the arrow and not the GPU
    await page.goto("/film/collaborations/project-01");
    await page.getByRole("link", { name: /back one level/i }).click();
    await expect(page).toHaveURL(/\/film\/collaborations$/);
    await page.getByRole("link", { name: /back one level/i }).click();
    await expect(page).toHaveURL(/\/film$/);
    await page.getByRole("link", { name: /back to the main experience/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("removed sections are gone", async ({ page }) => {
    for (const u of ["/photo/behind-the-lens", "/film/visual-stories", "/fpv/perspectives"]) {
      const r = await page.goto(u);
      expect(r?.status()).toBe(404);
    }
  });
});

test.describe("Blog", () => {
  test("a fourth Blog button opens the blog, which lists the welcome post", async ({ page }) => {
    await enterSilent(page);
    await page.getByRole("link", { name: /BLOG/ }).first().click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");
    await page.getByRole("link", { name: /Welcome to GabbRa/ }).click();
    await expect(page).toHaveURL(/\/blog\/welcome-to-gabbra$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to GabbRa");
    expect(await page.locator('script[type="application/ld+json"]').last().textContent()).toContain("BlogPosting");
  });

  test("the menu lists Blog and the back arrow returns to the blog", async ({ page }) => {
    await page.goto("/blog/welcome-to-gabbra");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: /Blog/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Back one level" }).click();
    await expect(page).toHaveURL(/\/blog$/);
  });

  test("the privacy page explains cookies", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/privacy/i);
    await expect(page.getByText(/Google Analytics/).first()).toBeVisible();
  });
});
