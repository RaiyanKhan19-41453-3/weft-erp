import { expect, test } from "@playwright/test";

test.skip(!process.env.E2E_SERVER_QUERY, "requires a seeded DATABASE_URL");

const base = "http://127.0.0.1:3100";

test("documents, import preview and idempotency work", async ({ page }) => {
  await page.goto("/sign-in");
  await page.locator("#email").fill("demo@weft.local");
  await page.locator("#password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

  const spec = await (await page.request.get(`${base}/api/openapi`)).json();
  expect(spec.openapi).toBe("3.1.0");
  expect(spec.paths["/api/orders/{id}/status"]).toBeTruthy();

  const barcode = await page.request.get(`${base}/api/barcode?bcid=code128&value=123456789012345678`);
  expect(barcode.status()).toBe(200);

  const invoice = await page.request.post(`${base}/api/orders/PO-26-4004/invoices`);
  expect(invoice.status()).toBe(201);
  expect((await invoice.json()).invoice.version).toBeGreaterThan(0);

  const pdf = await page.request.get(`${base}/api/orders/PO-26-4004/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");

  const csv = "buyerName,factory,priority,dueDate,incoterm,style,colour,quantity,unitPrice\nNorth & Pine,Unit 01 — Gazipur,normal,2027-08-01,FOB,Relaxed tee,Ecru,100,12.5";
  const preview = await page.request.post(`${base}/api/orders/import`, {
    headers: { "Content-Type": "text/csv" },
    data: csv,
  });
  expect((await preview.json()).validCount).toBe(1);

  const body = {
    buyerName: "North & Pine",
    factory: "Unit 01 — Gazipur",
    priority: "normal",
    dueDate: "2027-09-01",
    incoterm: "FOB",
    lineItems: [{ style: "Relaxed tee", colour: "Ecru", quantity: 100, unitPrice: 12.5 }],
  };
  const key = `e2e-${Date.now()}`;
  const first = await page.request.post(`${base}/api/orders`, {
    headers: { "Idempotency-Key": key },
    data: body,
  });
  const replay = await page.request.post(`${base}/api/orders`, {
    headers: { "Idempotency-Key": key },
    data: body,
  });
  expect(first.status()).toBe(201);
  expect(replay.status()).toBe(201);
  expect((await first.json()).order.id).toBe((await replay.json()).order.id);
});

test("API keys authenticate the query endpoint", async ({ page }) => {
  await page.goto("/sign-in");
  await page.locator("#email").fill("demo@weft.local");
  await page.locator("#password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

  const created = await page.request.post(`${base}/api/settings/api-keys`, {
    data: { name: "E2E key" },
  });
  expect(created.status()).toBe(201);
  const token = (await created.json()).token;

  const publicRead = await fetch(`${base}/api/orders/query?page=1&pageSize=10`);
  expect(publicRead.status).toBe(200);
  expect((await publicRead.json()).orders).toHaveLength(10);

  const withKey = await fetch(`${base}/api/orders/query?page=1&pageSize=10`, {
    headers: { "x-api-key": token },
  });
  expect(withKey.status).toBe(200);
  expect((await withKey.json()).orders).toHaveLength(10);
});
