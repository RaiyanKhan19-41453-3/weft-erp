import { expect, test } from "@playwright/test";

test("order explorer filters 5,000 rows without a round trip", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/orders");
  const count = page.getByTestId("result-count");
  await expect(count).not.toHaveText("");
  const initial = (await count.textContent())?.trim() ?? "";
  expect(Number(initial.replaceAll(",", ""))).toBeGreaterThanOrEqual(5000);

  const search = page.getByPlaceholder("Search PO, buyer, style…");
  await search.fill("Wren");
  await expect(count).not.toHaveText(initial);
  await expect(page.locator('[role="row"][aria-rowindex]').first()).toBeVisible();

  await search.fill("");
  await expect(count).toHaveText(initial);
  expect(errors).toEqual([]);
});
