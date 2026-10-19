import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("navigation, search recovery and responsive layout", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A new format.",
  );
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
