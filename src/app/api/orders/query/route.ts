import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { getViewer, resolveApiViewer } from "@/lib/auth-guards";
import { getDb, hasDatabase } from "@/lib/db";
import { allowRequest } from "@/lib/rate-limit";
import { rowToOrder } from "@/lib/db/mappers";
import { purchaseOrders } from "@/lib/db/schema";

const SORTABLE = {
  id: purchaseOrders.id,
  buyer: purchaseOrders.buyer,
  factory: purchaseOrders.factory,
  dueDate: purchaseOrders.dueDate,
  status: purchaseOrders.status,
  value: purchaseOrders.value,
  quantity: purchaseOrders.quantity,
} as const;

export async function GET(request: Request) {
  if (!(await allowRequest(request, "orders-query", 120))) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }
  const sessionViewer = await getViewer();
  const viewer = sessionViewer.authenticated ? sessionViewer : await resolveApiViewer(request);
  if (!viewer) return Response.json({ error: "Sign in or provide an API key." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize")) || 50));
  const q = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "";
  const buyer = searchParams.get("buyer") ?? "";
  const factory = searchParams.get("factory") ?? "";
  const sortKey = (searchParams.get("sort") ?? "dueDate") as keyof typeof SORTABLE;
  const direction = searchParams.get("dir") === "desc" ? desc : asc;
  const sortColumn = SORTABLE[sortKey] ?? purchaseOrders.dueDate;

  if (!hasDatabase()) {
    return Response.json({ error: "Server query needs a configured database." }, { status: 503 });
  }

  const conditions = [eq(purchaseOrders.organizationId, viewer.orgId)];
  if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
    conditions.push(eq(purchaseOrders.status, status as OrderStatus));
  }
  if (buyer) conditions.push(ilike(purchaseOrders.buyer, `%${buyer}%`));
  if (factory) conditions.push(ilike(purchaseOrders.factory, `%${factory}%`));
  if (q) {
    conditions.push(
      sql`to_tsvector('english', coalesce(${purchaseOrders.id}, '') || ' ' || coalesce(${purchaseOrders.buyer}, '') || ' ' || coalesce(${purchaseOrders.style}, '')) @@ plainto_tsquery('english', ${q})`,
    );
  }

  const where = and(...conditions);
  const db = getDb();
  const [[countRow], rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(purchaseOrders).where(where),
    db
      .select()
      .from(purchaseOrders)
      .where(where)
      .orderBy(direction(sortColumn))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return Response.json({
    orders: rows.map(rowToOrder),
    total: countRow?.count ?? 0,
    page,
    pageSize,
  });
}
