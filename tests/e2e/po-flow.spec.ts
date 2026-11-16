import { expect, test } from "@playwright/test";

test("draft autosaves and a PO can be created and printed", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  if (process.env.E2E_AUTH === "1") {
    await page.goto("/sign-in");
    await page.locator("#email").fill("demo@weft.local");
    await page.locator("#password").fill("demo1234");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(/\/$/, { timeout: 15000 });
  }

  await page.goto("/orders/new");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Style line 1")).toBeVisible();

  await page.locator("#line-quantity-0").fill("2400");
  await page.locator("#line-price-0").fill("12.5");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("weft-order-draft") !== null), {
      timeout: 5000,
    })
    .toBe(true);

  await page.reload();
  await expect(page.getByText("Restored an unsent draft saved", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#line-quantity-0")).toHaveValue("2400");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Review purchase order" })).toBeVisible();
  await page.getByRole("button", { name: "Create purchase order" }).click();

  await expect(page).toHaveURL(/\/orders\/PO-26-L[0-9A-F]{8}$/, { timeout: 20000 });
  const id = page.url().split("/").pop()!;

  await page.reload();
  await expect(page.getByRole("heading", { name: id })).toBeVisible();

  await page.goto(`/orders/${id}/invoice`);
  await expect(page.getByRole("article", { name: /Commercial invoice INV-/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("materials replenishment prefills the PO form", async ({ page }) => {
  await page.goto("/materials");
  await page.getByRole("link", { name: "Raise PO" }).first().click();
  await expect(page).toHaveURL(/\/orders\/new\?style=/);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Style line 1")).toBeVisible();
  await expect(page.locator("#line-quantity-0")).not.toHaveValue("2400");
});
