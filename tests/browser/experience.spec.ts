import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home guidance and catalog journeys remain usable with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("summary", { hasText: "Convert or compress?" }).click();
  await expect(page.locator(".questions details").first()).toHaveAttribute(
    "open",
    "",
  );
  expect(
    await page
      .locator(".page-enter")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.goto("/tools/converters");
  await expect(page.locator(".tool-card")).toHaveCount(4);
  await page.getByRole("link", { name: "Compress files 2 tools" }).click();
  await expect(page).toHaveURL(/tools\/compression/);
  await expect(page.locator(".tool-card")).toHaveCount(2);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("status distinguishes unavailable telemetry and supports recovery", async ({
  page,
}) => {
  let failing = false;
  await page.route("**/api/health", (route) =>
    route.fulfill(
      failing
        ? { status: 503, json: { error: "Unavailable" } }
        : {
            json: {
              status: "healthy",
              system: { uptime: "12m" },
              localstack: { status: "down", services: {} },
            },
          },
    ),
  );
  await page.goto("/status");
  await expect(
    page.getByRole("heading", { name: "Some services aren’t verified." }),
  ).toBeVisible();
  await expect(page.locator(".service-state.unknown")).toHaveCount(3);
  await expect(page.locator(".service-state.available")).toHaveCount(1);
  await page.getByLabel("Refresh every 30 seconds").uncheck();
  failing = true;
  await page.getByRole("button", { name: "Check again" }).click();
  await expect(
    page.getByRole("heading", { name: "We couldn’t complete the check." }),
  ).toBeVisible();
  await expect(page.locator(".status-toolbar")).toContainText(
    "results are stale",
  );
  await expect(page.locator(".service-state.available")).toHaveCount(0);
  failing = false;
  await page.getByRole("button", { name: "Check again" }).click();
  await expect(
    page.getByRole("heading", { name: "Some services aren’t verified." }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("policy navigation reaches readable sections and related policies", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/privacy-policy");
  await page
    .getByRole("navigation", { name: "Privacy sections" })
    .getByRole("link", { name: /Retention and access/ })
    .click();
  await expect(page).toHaveURL(/#section-3/);
  await expect(
    page.getByRole("heading", { name: "Retention and access" }),
  ).toBeInViewport();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "Terms of use", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Read the full license" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/smeltery/cloud-tools/blob/master/LICENSE",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
