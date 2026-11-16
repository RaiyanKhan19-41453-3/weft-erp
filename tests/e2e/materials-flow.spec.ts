import { expect, test } from "@playwright/test";

test.skip(!process.env.E2E_SERVER_QUERY, "requires a seeded DATABASE_URL");

const SKU = "FAB-DN-340-IND";
const base = "http://127.0.0.1:3100";

async function numberFrom(page: import("@playwright/test").Page, testId: string) {
  const text = await page.getByTestId(testId).innerText();
  return Number(text.replace(/[^0-9.-]/g, ""));
}

test("PO reservations and goods receipts move material stock", async ({ page }) => {
  await page.goto("/sign-in");
  await page.locator("#email").fill("demo@weft.local");
  await page.locator("#password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

  await page.goto("/materials");
  const reservedBefore = await numberFrom(page, `reserved-${SKU}`);
  const onHandBefore = await numberFrom(page, `onhand-${SKU}`);

  const created = await page.request.post(`${base}/api/orders`, {
    data: {
      buyerName: "North & Pine",
      factory: "Unit 01 — Gazipur",
      priority: "normal",
      dueDate: "2027-05-01",
      incoterm: "FOB",
      notes: "Material flow E2E",
      lineItems: [{ style: "Denim jacket", colour: "Indigo", quantity: 100, unitPrice: 12.5 }],
    },
  });
  expect(created.status()).toBe(201);

  await expect
    .poll(
      async () => {
        await page.reload();
        return numberFrom(page, `reserved-${SKU}`);
      },
      { timeout: 10000 },
    )
    .toBe(reservedBefore + 115);
  expect(await numberFrom(page, `onhand-${SKU}`)).toBe(onHandBefore - 115);

  const receipt = await page.request.post(`${base}/api/materials/${SKU}/receipts`, {
    data: { quantity: 50, supplier: "Meghna Knits", note: "E2E receipt" },
  });
  expect(receipt.status()).toBe(201);

  const expectedOnHand = onHandBefore - 115 + 50;
  await expect
    .poll(
      async () => {
        await page.reload();
        return numberFrom(page, `onhand-${SKU}`);
      },
      { timeout: 10000 },
    )
    .toBe(expectedOnHand);
});
