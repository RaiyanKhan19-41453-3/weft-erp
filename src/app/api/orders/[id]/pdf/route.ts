import { and, eq } from "drizzle-orm";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { getViewer, resolveApiViewer } from "@/lib/auth-guards";
import { buildOrderDetail } from "@/lib/data/orders";
import { getDb, hasDatabase } from "@/lib/db";
import { rowToOrder } from "@/lib/db/mappers";
import { purchaseOrders } from "@/lib/db/schema";
import { ssccForOrder } from "@/lib/gtin";

type Context = { params: Promise<{ id: string }> };

function textPage(
  page: PDFPage,
  font: PDFFont,
  title: string,
  lines: string[],
) {
  page.drawText("WEFT APPAREL MANUFACTURING LTD.", { x: 40, y: 800, size: 12, font, color: rgb(0.05, 0.35, 0.28) });
  page.drawText(title, { x: 40, y: 770, size: 20, font });
  let y = 735;
  for (const line of lines) {
    if (y < 50) break;
    const wrapped = line.length > 95 ? `${line.slice(0, 92)}...` : line;
    page.drawText(wrapped, { x: 40, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    y -= 16;
  }
}

export async function GET(request: Request, { params }: Context) {
  const viewer = (await getViewer()) ?? (await resolveApiViewer(request));
  if (!viewer) return Response.json({ error: "Sign in or provide an API key." }, { status: 401 });
  if (!hasDatabase()) return Response.json({ error: "PDF needs a database." }, { status: 503 });

  const { id } = await params;
  const db = getDb();
  const [row] = await db
    .select()
    .from(purchaseOrders)
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, viewer.orgId)))
    .limit(1);
  if (!row) return Response.json({ error: "Purchase order not found." }, { status: 404 });

  const order = buildOrderDetail(rowToOrder(row));
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const invoice = pdf.addPage([595, 842]);
  textPage(invoice, font, `Commercial invoice ${order.id.replace("PO-", "INV-")}`, [
    `Buyer: ${order.buyer}, ${order.buyerCountry}`,
    `Destination: ${order.destination} · Incoterm: ${order.shipping.incoterm}`,
    `PO reference: ${order.id} · Season: ${order.season}`,
    `Style: ${order.style} (${order.styleCode}) · Colour: ${order.colour}`,
    "",
    ...order.lines.map(
      (line) =>
        `${line.styleCode} ${line.style} / ${line.colour}: ${line.quantity} pcs @ ${line.unitPrice} = ${line.quantity * line.unitPrice}`,
    ),
    "",
    `Total quantity: ${order.quantity} pcs`,
    `Total value: USD ${order.value.toFixed(2)}`,
    `Landed cost estimate: USD ${(order.value * 1.08).toFixed(2)}`,
    "Synthetic demo document · not a negotiable invoice",
  ]);

  const packing = pdf.addPage([595, 842]);
  textPage(
    packing,
    font,
    `Packing list ${order.id.replace("PO-", "PL-")}`,
    [
      `Ship to: ${order.buyer}, ${order.destination}`,
      `PO: ${order.id} · Cartons: ${Math.ceil(order.quantity / 40)}`,
      `SSCC: ${ssccForOrder(order.id)}`,
      `Container: ${order.shipping.container} · ETD: ${order.shipping.etd}`,
      "",
      ...order.sizes.map((size) => `${size.size}: ${size.quantity} pcs · ${Math.ceil(size.quantity / 40)} cartons`),
      "",
      "Weights estimated at 0.42 kg per piece plus 0.85 kg per carton.",
      "Solid colour and solid size per carton. Made in Bangladesh.",
    ],
  );

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.id.replace("PO-", "INV-")}.pdf"`,
    },
  });
}
