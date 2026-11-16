import { expect, test } from "@playwright/test";

test("dashboard renders and command palette opens", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Operations overview" })).toBeVisible();
  await expect(page.getByText("5,000 synthetic POs")).toBeVisible();

  await page.getByRole("button", { name: "Search orders, pages…" }).click();
  await expect(page.getByPlaceholder("Search orders, pages and actions…")).toBeVisible();
  await page.keyboard.press("Escape");

  expect(errors).toEqual([]);
});

test("architecture page shows browser vitals", async ({ page }) => {
  await page.goto("/architecture");
  await expect(page.getByText("Measured in this browser")).toBeVisible();
  await expect(page.getByText("LCP", { exact: true })).toBeVisible();
  await expect(page.getByText("INP", { exact: true })).toBeVisible();
});
