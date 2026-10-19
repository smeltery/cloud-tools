import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("navigation, search recovery and responsive layout", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Convert files.",
  );
  const launcher = page.locator(".hero-launcher");
  await expect(launcher.locator(".hero-tool")).toHaveCount(6);
  await expect(
    launcher.getByRole("link", { name: "PDF compression", exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await launcher
    .getByRole("link", { name: "Image converter", exact: true })
    .click();
  await expect(page).toHaveURL(/tools\/converters\/image/);
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "What’s next?" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await menu.getByRole("link", { name: "Getting started" }).click();
    await expect(page).toHaveURL(/docs\/quick-start/);
  }
  await page
    .getByRole("button", {
      name: "Search tools and documentation",
      exact: true,
    })
    .first()
    .click();
  const search = page.getByRole("dialog", {
    name: "Search tools and documentation",
  });
  await search.getByRole("textbox").fill("no-such-tool");
  await expect(search).toContainText("No matches");
  await search.getByRole("textbox").fill("Image converter");
  await search.getByRole("link", { name: "Image converter" }).click();
  await expect(page).toHaveURL(/tools\/converters\/image/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("docs render diagrams and accessible navigation", async ({
  page,
  isMobile,
  context,
}) => {
  await page.goto("/docs");
  await expect(
    page.getByRole("heading", { level: 1, name: "Overview" }),
  ).toBeVisible();
  await expect(page.locator(".docs-diagram svg")).toBeVisible();
  if (!isMobile) {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page
      .getByRole("button", { name: "Copy as Markdown", exact: true })
      .click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      "# Overview",
    );
  }
  await expect(
    page.locator(".docs-article a", { hasText: "quick start" }).first(),
  ).toHaveAttribute("href", "/docs/quick-start");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("upload reports failure and preserves file for retry", async ({
  page,
}) => {
  await page.route("**/api/upload", (route) =>
    route.fulfill({ status: 503, json: { error: "Storage unavailable" } }),
  );
  await page.goto("/tools/converters/image");
  await expect(
    page.getByRole("button", { name: "Convert image", exact: true }),
  ).toBeDisabled();
  await page.locator('input[type="file"]').setInputFiles({
    name: "example.png",
    mimeType: "image/png",
    buffer: Buffer.from("fixture"),
  });
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "WEBP", exact: true }).click();
  await page
    .getByRole("button", { name: "Convert image", exact: true })
    .click();
  await expect(
    page.getByText("Storage unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('input[type="file"]')).not.toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Convert image", exact: true }),
  ).toBeEnabled();
});

test("homepage is accessible and unknown routes return 404", async ({
  page,
  request,
}) => {
  await page.goto("/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const response = await request.get("/does-not-exist");
  expect(response.status()).toBe(404);
  expect((await request.get("/og.png")).status()).toBe(200);
});

test("command search supports filters, keyboard selection, and reset", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile)
    await page
      .getByRole("button", {
        name: "Search tools and documentation",
        exact: true,
      })
      .first()
      .click();
  else await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", {
    name: "Search tools and documentation",
  });
  await expect(search.getByRole("textbox")).toBeFocused();
  await search.getByRole("button", { name: "Pages", exact: true }).click();
  await expect(
    search.getByRole("link", { name: /Brand & assets/ }),
  ).toBeVisible();
  await expect(
    search.getByRole("link", { name: /Image converter/ }),
  ).toHaveCount(0);
  await search.getByRole("textbox").fill("brand");
  await page.keyboard.press("ArrowDown");
  await expect(
    search.getByRole("link", { name: /Brand & assets/ }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/brand/);
  await page
    .getByRole("button", {
      name: "Search tools and documentation",
      exact: true,
    })
    .first()
    .click();
  await expect(search.getByRole("textbox")).toHaveValue("");
  await expect(
    search.getByRole("button", { name: "Everything" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(search).not.toBeVisible();
});

test("API documentation highlights code and copies only source", async ({
  page,
  context,
  isMobile,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/api");
  const block = page.locator(".docs-code").first();
  await expect(block.locator(".hljs-string").first()).toBeVisible();
  const source = await block.locator("code").textContent();
  await block.getByRole("button", { name: "Copy code" }).click();
  await expect(block.getByRole("button", { name: "Copy code" })).toHaveText(
    "Copied",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    source,
  );
  if (!isMobile) {
    await page.locator(".docs-chat summary").click();
    await expect(page.locator(".chat-providers a")).toHaveCount(6);
    await expect(
      page.getByRole("link", { name: "Claude", exact: true }),
    ).toHaveAttribute("href", /^https:\/\/claude.ai\/new\?q=/);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("brand palette copies colors and all assets download", async ({
  page,
  context,
  request,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/brand");
  await page
    .getByRole("button", { name: "Copy Blue hex #2767c7", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Copied Blue: #2767c7");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "#2767c7",
  );
  for (const link of await page.locator(".downloads a").all()) {
    const response = await request.get((await link.getAttribute("href"))!);
    expect(response.status()).toBe(200);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
