import { buildLocalDetail, buildLocalOrder, type LocalOrderInput } from "@/lib/data/orders";
import { getOrders } from "@/lib/data/server";
import { newOrderSchema } from "@/lib/validation/new-order";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET() {
  const orders = await getOrders();
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
