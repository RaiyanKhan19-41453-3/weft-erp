import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/constants";
import { getDb, hasDatabase } from "@/lib/db";
import { rowToOrder } from "@/lib/db/mappers";
import { orderDetails, orderEvents, purchaseOrders } from "@/lib/db/schema";

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(200).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  if (!hasDatabase()) {
    return Response.json(
      { error: "Status changes need a configured database." },
      { status: 503 },
    );
  }

  const { id } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid status update." }, { status: 422 });
  }

  try {
    const db = getDb();
    const [current] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!current) {
      return Response.json({ error: "Purchase order not found." }, { status: 404 });
    }

    if (current.status === parsed.data.status) {
      return Response.json({ order: rowToOrder(current), unchanged: true });
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set({ status: parsed.data.status })
      .where(eq(purchaseOrders.id, id))
      .returning();

    const [detail] = await db
      .select()
      .from(orderDetails)
      .where(eq(orderDetails.orderId, id))
      .limit(1);

    if (detail) {
      await db
        .update(orderDetails)
        .set({ detail: { ...detail.detail, status: parsed.data.status } })
        .where(eq(orderDetails.orderId, id));
    }

    await db.insert(orderEvents).values({
      id: crypto.randomUUID(),
      orderId: id,
      fromStatus: current.status,
      toStatus: parsed.data.status,
      note: parsed.data.note ?? null,
      actor: "demo-operator",
      createdAt: new Date().toISOString(),
    });

    revalidateTag("orders", "max");
    revalidateTag(`order-${id}`, "max");
    revalidateTag(`order-events-${id}`, "max");

    return Response.json({ order: rowToOrder(updated!) });
  } catch (error) {
    console.error("Status update failed.", error);
    return Response.json({ error: "The status could not be updated." }, { status: 503 });
  }
}
