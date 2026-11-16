import { and, eq } from "drizzle-orm";
import { getViewer, hasPermission } from "@/lib/auth-guards";
import { getDb, hasDatabase } from "@/lib/db";
import { rowToOrder } from "@/lib/db/mappers";
import { buildOrderDetail } from "@/lib/data/orders";
import { purchaseOrders } from "@/lib/db/schema";
import { createInvoiceSnapshot } from "@/lib/invoices";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!hasPermission(viewer, "invoice", "read")) {
    return Response.json({ error: "Your role cannot issue invoices." }, { status: 403 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "Invoices need a configured database." }, { status: 503 });
  }

  const { id } = await params;
  const db = getDb();
  const [row] = await db
    .select()
    .from(purchaseOrders)
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, viewer.orgId)))
    .limit(1);
  if (!row) return Response.json({ error: "Purchase order not found." }, { status: 404 });

  const snapshot = await createInvoiceSnapshot(buildOrderDetail(rowToOrder(row)), viewer.orgId);
  return Response.json({ invoice: snapshot }, { status: 201 });
}
