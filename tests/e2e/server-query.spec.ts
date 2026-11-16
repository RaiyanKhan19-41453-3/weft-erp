import { expect, test } from "@playwright/test";

test.skip(!process.env.E2E_SERVER_QUERY, "requires a seeded DATABASE_URL");

test("server query pages, filters and sorts in Postgres", async ({ page }) => {
  const base = "http://127.0.0.1:3100";

  await page.goto("/sign-in");
  await page.locator("#email").fill("demo@weft.local");
  await page.locator("#password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

  const first = await page.request.get(`${base}/api/orders/query?page=1&pageSize=10&sort=dueDate&dir=asc`);
  const payload = await first.json();
  expect(payload.orders).toHaveLength(10);
  expect(payload.total).toBeGreaterThanOrEqual(5000);
  const firstDue = payload.orders[0].dueDate;

  const second = await page.request.get(`${base}/api/orders/query?page=2&pageSize=10&sort=dueDate&dir=asc`);
  const secondPayload = await second.json();
  expect(secondPayload.orders[0].id).not.toBe(payload.orders[0].id);

  const sorted = await page.request.get(`${base}/api/orders/query?page=1&pageSize=10&sort=dueDate&dir=desc`);
  const sortedPayload = await sorted.json();
  expect(sortedPayload.orders[0].dueDate).not.toBe(firstDue);

  const searched = await page.request.get(`${base}/api/orders/query?page=1&pageSize=10&q=Wren`);
  const searchedPayload = await searched.json();
  expect(searchedPayload.total).toBeLessThan(payload.total);

  await page.goto("/orders/server");
  await expect(page.getByText("Server-driven order query")).toBeVisible();
  await expect(page.locator('[data-testid="server-order-row"]').first()).toBeVisible();
});
