import { metric } from "@vercel/functions";
import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { bomForStyle } from "@/lib/bom";
import { getViewer, hasPermission } from "@/lib/auth-guards";
import { buildLocalDetail, buildLocalOrder, type LocalOrderInput } from "@/lib/data/orders";
import { getOrders } from "@/lib/data/server";
import { getDb, hasDatabase } from "@/lib/db";
import { orderToRow } from "@/lib/db/mappers";
import {
  idempotencyKeys,
  materialReservations,
  orderDetails,
  purchaseOrders,
} from "@/lib/db/schema";
import { newOrderSchema } from "@/lib/validation/new-order";
import { dispatchWebhook } from "@/lib/webhooks";
import { log, requestId } from "@/lib/log";
import { hasForbiddenOrigin } from "@/lib/csrf";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET() {
  const viewer = await getViewer();
  const orders = await getOrders(viewer.orgId);
  return Response.json(
    { orders, count: orders.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}

export async function POST(request: Request) {
  if (hasForbiddenOrigin(request)) {
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  }
  const viewer = await getViewer();
  if (hasDatabase()) {
    if (!viewer.authenticated) {
      return Response.json({ error: "Sign in required." }, { status: 401 });
    }
    if (!hasPermission(viewer, "order", "create")) {
      return Response.json({ error: "Your role cannot create orders." }, { status: 403 });
    }
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.slice(0, 200);
  if (hasDatabase() && viewer.authenticated && idempotencyKey) {
    const [existing] = await getDb()
      .select({ response: idempotencyKeys.response })
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.organizationId, viewer.orgId),
          eq(idempotencyKeys.key, idempotencyKey),
          eq(idempotencyKeys.endpoint, "/api/orders"),
        ),
      )
      .limit(1);
    if (existing) {
      const stored = existing.response as { status: number; body: unknown };
      return Response.json(stored.body, { status: stored.status });
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = newOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Some fields need attention.",
        issues: parsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const remember = async (status: number, body: unknown) => {
    if (!hasDatabase() || !viewer.authenticated || !idempotencyKey) return;
    await getDb()
      .insert(idempotencyKeys)
      .values({
        organizationId: viewer.orgId,
        key: idempotencyKey,
        endpoint: "/api/orders",
        response: { status, body },
        createdAt: new Date().toISOString(),
      })
      .onConflictDoNothing();
  };

  const input = parsed.data;
  const localInput: LocalOrderInput = {
    buyerName: input.buyerName,
    factory: input.factory,
    priority: input.priority,
    dueDate: input.dueDate,
    incoterm: input.incoterm,
    notes: input.notes,
    lines: input.lineItems,
  };
  const id = `PO-26-L${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const order = buildLocalOrder(localInput, id);
  const detail = buildLocalDetail(order, localInput);

  if (input.notes?.trim()) {
    detail.qcNote = `<p><strong>Handover note</strong></p><p>${escapeHtml(input.notes.trim())}</p>`;
  }

  if (hasDatabase()) {
    try {
      const db = getDb();
      const persistedOrder = { ...order, isLocal: false };
      const persistedDetail = { ...detail, isLocal: false };

      const inserted = await db
        .insert(purchaseOrders)
        .values({ ...orderToRow(persistedOrder), organizationId: viewer.orgId })
        .returning({ id: purchaseOrders.id });

      if (!inserted.length) {
        return Response.json({ error: "That purchase order already exists." }, { status: 409 });
      }

      await db.insert(orderDetails).values({
        organizationId: viewer.orgId,
        orderId: persistedOrder.id,
        detail: persistedDetail,
        colour: persistedDetail.colour,
        updatedAt: persistedDetail.poDate,
      });

      const requirements = new Map<string, number>();
      for (const line of input.lineItems) {
        for (const item of bomForStyle(line.style)) {
          const quantity = Math.round(line.quantity * item.perPiece * 100) / 100;
          requirements.set(item.sku, (requirements.get(item.sku) ?? 0) + quantity);
        }
      }
      await db.insert(materialReservations).values(
        [...requirements].map(([sku, quantity]) => ({
          id: crypto.randomUUID(),
          organizationId: viewer.orgId,
          orderId: persistedOrder.id,
          materialSku: sku,
          quantity: String(quantity),
          createdAt: new Date().toISOString(),
        })),
      );

      revalidateTag("orders", "max");
      revalidateTag(`orders-${viewer.orgId}`, "max");
      revalidateTag(`order-${id}`, "max");
      revalidateTag(`materials-${viewer.orgId}`, { expire: 0 });

      void dispatchWebhook(viewer.orgId, "order.created", persistedOrder);
      const body = {
        order: persistedOrder,
        detail: persistedDetail,
        meta: { persisted: true, message: "Stored in the database." },
      };
      await remember(201, body);
      metric("orders.created", 1, { outcome: "success", persisted: "true" });
      log("info", "order_created", {
        requestId: requestId(request),
        tenantId: viewer.orgId,
        orderId: persistedOrder.id,
      });
      return Response.json(body, { status: 201 });
    } catch (error) {
      console.error("Database write failed.", error);
      return Response.json(
        { error: "The order could not be saved to the database. Try again." },
        { status: 503 },
      );
    }
  }

  return Response.json(
    {
      order,
      detail,
      meta: {
        persisted: false,
        message: "Demo mode: the PO is stored in this browser only.",
      },
    },
    { status: 201 },
  );
}
