import { expect, test } from "@playwright/test";

test.describe("auth and tenant scoping", () => {
  test.skip(process.env.E2E_AUTH !== "1", "requires a seeded DATABASE_URL and E2E_AUTH=1");

  test("blocks anonymous mutations and scopes tenants", async ({ page }) => {
    const base = "http://127.0.0.1:3100";

    const anonymous = await page.request.post(`${base}/api/orders/PO-26-4003/status`, {
      data: { status: "qc" },
    });
    expect(anonymous.status()).toBe(401);

    await page.goto("/sign-in");
    await page.locator("#email").fill("demo@weft.local");
    await page.locator("#password").fill("demo1234");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

    const response = await page.request.get(`${base}/api/orders`);
    const payload = await response.json();
    expect(payload.count).toBeGreaterThanOrEqual(5000);

    await page.goto("/orders/PO-26-4003");
    await expect(page.getByLabel("Update order status")).toBeVisible();
  });

  test("workflow rejects illegal transitions", async ({ page }) => {
    const base = "http://127.0.0.1:3100";
    await page.goto("/sign-in");
    await page.locator("#email").fill("demo@weft.local");
    await page.locator("#password").fill("demo1234");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

    const list = await (await page.request.get(`${base}/api/orders`)).json();
    const ready = list.orders.find((order: { status: string }) => order.status === "ready");
    expect(ready).toBeTruthy();

    const legal = await page.request.post(`${base}/api/orders/${ready.id}/status`, {
      data: { status: "shipped", note: "E2E legal transition" },
    });
    expect(legal.status()).toBe(200);

    const illegal = await page.request.post(`${base}/api/orders/${ready.id}/status`, {
      data: { status: "draft" },
    });
    expect(illegal.status()).toBe(422);
  });

  test("a new workspace cannot see demo orders", async ({ page }) => {
    const base = "http://127.0.0.1:3100";
    const email = `tenant${Date.now()}@example.test`;

    await page.goto("/sign-up");
    await page.locator("#name").fill("Tenant Owner");
    await page.locator("#organization").fill("Acme Test");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("tenant1234");
    await page.getByRole("button", { name: "Create workspace" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 20000 });

    const api = await page.request.get(`${base}/api/orders`);
    expect((await api.json()).count).toBe(0);

    const cross = await page.request.post(`${base}/api/orders/PO-26-4003/status`, {
      data: { status: "qc" },
    });
    expect(cross.status()).toBe(404);
  });
});
