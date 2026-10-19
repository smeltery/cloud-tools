import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const job = {
  jobId: "job-one",
  fileName: "holiday-photo.png",
  fileSize: 2097152,
  operation: "convert",
  targetFormat: "webp",
  status: "processing",
  progress: 0,
  createdAt: "2026-10-19T12:00:00Z",
};
test("job lookup handles empty history, keyboard submission and missing jobs", async ({
  page,
}) => {
  await page.route("**/api/jobs?**", (route) =>
    route.fulfill({ status: 404, json: { error: "Job not found" } }),
  );
  await page.goto("/jobs");
  await expect(
    page.getByRole("heading", { name: "No saved jobs yet" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Find job", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Job ID", { exact: true }).fill("missing-job");
  await page.getByLabel("Job ID", { exact: true }).press("Enter");
  await expect(page.locator(".jobs-error[role=alert]")).toContainText(
    "We couldn’t find that job",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(
    page.getByRole("link", { name: "Read about jobs and downloads" }),
  ).toHaveAttribute("href", "/docs/jobs");
});
test("recent jobs show real progress, stale recovery and completed downloads", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "imageConversionHistory",
      JSON.stringify([
        {
          jobId: "job-one",
          originalName: "holiday-photo.png",
          date: "2026-10-19T12:00:00Z",
        },
      ]),
    );
    localStorage.setItem("audioConversionHistory", "broken-json");
  });
  let failing = false;
  let complete = false;
  await page.route("**/api/jobs?**", (route) =>
    route.fulfill(
      failing
        ? { status: 503, json: { error: "Unavailable" } }
        : {
            json: {
              data: {
                ...job,
                ...(complete
                  ? {
                      status: "completed",
                      progress: 100,
                      downloadUrl: "https://example.com/result.webp",
                    }
                  : {}),
              },
            },
          },
    ),
  );
  await page.goto("/jobs");
  await expect(
    page.getByText("Some browser history couldn’t be read.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: /holiday-photo.png/ }).click();
  await expect(
    page.getByRole("heading", { name: "Working on your file" }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "0");
  await page.getByLabel("Refresh every 10 seconds").uncheck();
  failing = true;
  await page.getByRole("button", { name: "Check again", exact: true }).click();
  await expect(page.locator(".jobs-error[role=alert]")).toContainText(
    "last successful check",
  );
  await expect(page.locator(".jobs-refresh")).toContainText(
    "results are stale",
  );
  failing = false;
  complete = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your file is ready" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Download file/ }),
  ).toHaveAttribute("href", "https://example.com/result.webp");
  await expect(page.getByLabel("Refresh every 10 seconds")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("active jobs refresh, preserve a draft lookup and stop at completion", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/jobs?**", (route) => {
    calls++;
    return route.fulfill({
      json: { data: { ...job, ...(calls > 1 ? { status: "completed" } : {}) } },
    });
  });
  await page.clock.install();
  await page.goto("/jobs");
  await page.getByLabel("Job ID", { exact: true }).fill("job-one");
  await page.getByRole("button", { name: "Find job", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Working on your file" }),
  ).toBeVisible();
  await page.getByLabel("Job ID", { exact: true }).fill("another-job");
  await page.clock.fastForward(10000);
  await expect(
    page.getByRole("heading", { name: "Your file is ready" }),
  ).toBeVisible();
  await expect(page.getByLabel("Job ID", { exact: true })).toHaveValue(
    "another-job",
  );
  await expect(
    page.getByText(
      "The job is complete, but a download link isn’t available.",
      { exact: false },
    ),
  ).toBeVisible();
  await page.clock.fastForward(30000);
  expect(calls).toBe(2);
});

test("a new lookup clears the previous download and explains failed processing", async ({
  page,
}) => {
  await page.route("**/api/jobs?**", (route) => {
    const id = new URL(route.request().url()).searchParams.get("jobId");
    return route.fulfill({
      json: {
        data: {
          ...job,
          jobId: id,
          status: id === "job-one" ? "completed" : "failed",
          downloadUrl: "https://example.com/result.webp",
          errorMessage:
            id === "job-one" ? undefined : "Unsupported file encoding",
        },
      },
    });
  });
  await page.goto("/jobs");
  const input = page.getByLabel("Job ID", { exact: true });
  await input.fill("job-one");
  await input.press("Enter");
  await expect(page.getByRole("link", { name: /Download file/ })).toBeVisible();
  await input.fill("job-two");
  await input.press("Enter");
  await expect(
    page.getByRole("heading", { name: "This job needs attention" }),
  ).toBeVisible();
  await expect(page.getByText("Unsupported file encoding")).toBeVisible();
  await expect(page.getByRole("link", { name: /Download file/ })).toHaveCount(
    0,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
