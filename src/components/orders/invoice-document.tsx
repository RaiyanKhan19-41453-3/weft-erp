import { WeftMark } from "@/components/brand";
import { Barcode } from "@/components/orders/barcode";
import type { OrderDetail } from "@/lib/constants";
import { formatDate, formatMoneyFull, formatNumber } from "@/lib/utils";
import { amountInWords } from "@/lib/words";

const SELLER = {
  name: "Weft Apparel Manufacturing Ltd.",
  address: "Plot 14, Chandra Industrial Area, Gazipur 1704, Bangladesh",
  registration: "BIN 0012 3456 7890 · EPB Reg. WFT-2026-014",
  contact: "exports@weft.example · +880 2 5555 0142",
};

const CARTON_CAPACITY = 40;

function buildPacking(order: OrderDetail) {
  const rows = order.sizes.map((size) => {
    const cartons = Math.ceil(size.quantity / CARTON_CAPACITY);
    const net = size.quantity * 0.42;
    const gross = net + cartons * 0.85;
    return {
      ...size,
      pcsPerCarton: Math.min(CARTON_CAPACITY, size.quantity),
      cartons,
      net: Math.round(net * 10) / 10,
      gross: Math.round(gross * 10) / 10,
    };
  });
  return {
    rows,
    cartons: rows.reduce((total, row) => total + row.cartons, 0),
    net: Math.round(rows.reduce((total, row) => total + row.net, 0) * 10) / 10,
    gross: Math.round(rows.reduce((total, row) => total + row.gross, 0) * 10) / 10,
  };
}

export function InvoiceDocument({ order }: { order: OrderDetail }) {
  const invoiceNo = order.id.replace("PO-", "INV-");
  const packing = buildPacking(order);
  const invoiceDate = order.shipping.etd;

  return (
    <article
      className="invoice-page print-sheet mx-auto w-full max-w-[210mm] bg-white text-[#141814] shadow-[0_10px_40px_-12px_rgba(10,15,11,0.28)] ring-1 ring-black/10 print:shadow-none print:ring-0"
      aria-label={`Commercial invoice ${invoiceNo}`}
    >
      <div className="invoice-sheet px-8 py-9 md:px-12 md:py-11">
        <header className="flex flex-col gap-6 border-b-2 border-[#141814] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-lg border border-[#0d604b]/25 bg-[#0d604b]/[0.06] text-[#0d604b]">
              <WeftMark className="size-7" />
            </span>
            <div>
              <p className="text-[19px] font-semibold leading-none tracking-[-0.03em]">Weft</p>
              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[#6b726b]">
                Apparel operations
              </p>
              <p className="mt-3 text-[10.5px] leading-4 text-[#4c544c]">
                {SELLER.name}
                <br />
                {SELLER.address}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0d604b]">
              Commercial invoice
            </p>
            <p className="mt-1.5 font-mono text-[19px] font-semibold tracking-[-0.02em]">
              {invoiceNo}
            </p>
            <dl className="mt-3 grid grid-cols-[auto_auto] justify-start gap-x-4 gap-y-1 text-[10.5px] sm:justify-end">
              <dt className="text-[#6b726b]">Invoice date</dt>
              <dd className="font-medium">{formatDate(invoiceDate)}</dd>
              <dt className="text-[#6b726b]">PO reference</dt>
              <dd className="font-mono font-medium">{order.id}</dd>
              <dt className="text-[#6b726b]">Currency</dt>
              <dd className="font-medium">USD</dd>
              <dt className="text-[#6b726b]">Page</dt>
              <dd className="font-medium">1 of 2</dd>
            </dl>
          </div>
        </header>

        <section className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6b726b]">
              Exporter / seller
            </p>
            <p className="mt-1.5 text-[11.5px] font-semibold">{SELLER.name}</p>
            <p className="mt-0.5 text-[10.5px] leading-4 text-[#4c544c]">
              {SELLER.address}
              <br />
              {SELLER.registration}
              <br />
              {SELLER.contact}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6b726b]">
              Buyer / consignee
            </p>
            <p className="mt-1.5 text-[11.5px] font-semibold">{order.buyer}</p>
            <p className="mt-0.5 text-[10.5px] leading-4 text-[#4c544c]">
              {order.destination}, {order.buyerCountry}
              <br />
              Attn: {order.buyerContact}
              <br />
              {order.buyerEmail}
            </p>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 rounded-md border border-[#d8d5cb] bg-[#faf9f5] px-4 py-3 text-[10.5px] sm:grid-cols-4">
          <DocumentField label="Incoterm" value={order.shipping.incoterm} />
          <DocumentField label="Mode" value={order.shipping.mode} />
          <DocumentField label="Port of loading" value={order.shipping.port} />
          <DocumentField label="Container" value={order.shipping.container} />
          <DocumentField label="ETD" value={formatDate(order.shipping.etd)} />
          <DocumentField label="Season" value={order.season} />
          <DocumentField label="Factory" value={order.factory} />
          <DocumentField label="Payment terms" value="30 days from B/L date" />
        </section>

        <section className="mt-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6b726b]">
            Goods description
          </p>
          <div className="mt-2 overflow-hidden border border-[#d8d5cb]">
            <table className="w-full border-collapse text-left text-[10.5px]">
              <thead>
                <tr className="bg-[#f1efe8] text-[8.5px] uppercase tracking-[0.1em] text-[#4c544c]">
                  <th className="w-7 border-b border-[#d8d5cb] px-2.5 py-2 font-semibold">#</th>
                  <th className="border-b border-[#d8d5cb] px-2.5 py-2 font-semibold">
                    Description
                  </th>
                  <th className="border-b border-[#d8d5cb] px-2.5 py-2 font-semibold">
                    Style / HS
                  </th>
                  <th className="border-b border-[#d8d5cb] px-2.5 py-2 text-right font-semibold">
                    Qty
                  </th>
                  <th className="border-b border-[#d8d5cb] px-2.5 py-2 text-right font-semibold">
                    Unit
                  </th>
                  <th className="border-b border-[#d8d5cb] px-2.5 py-2 text-right font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line, index) => (
                  <tr key={`${line.styleCode}-${line.colour}`}>
                    <td className="border-b border-[#e6e3da] px-2.5 py-2.5 align-top text-[#6b726b]">
                      {index + 1}
                    </td>
                    <td className="border-b border-[#e6e3da] px-2.5 py-2.5 align-top">
                      <p className="font-semibold">{line.style}</p>
                      <p className="mt-0.5 text-[9.5px] leading-3.5 text-[#6b726b]">
                        {order.fabric} · {order.gsm} gsm · {line.colour} · {order.wash}
                      </p>
                    </td>
                    <td className="border-b border-[#e6e3da] px-2.5 py-2.5 align-top font-mono text-[9.5px]">
                      {line.styleCode}
                      <span className="mt-0.5 block text-[#8b918b]">HS 6109.10</span>
                    </td>
                    <td className="border-b border-[#e6e3da] px-2.5 py-2.5 text-right align-top tabular-nums">
                      {formatNumber(line.quantity)}
                    </td>
                    <td className="border-b border-[#e6e3da] px-2.5 py-2.5 text-right align-top tabular-nums">
                      {formatMoneyFull(line.unitPrice)}
                    </td>
                    <td className="border-b border-[#e6e3da] px-2.5 py-2.5 text-right align-top font-semibold tabular-nums">
                      {formatMoneyFull(line.quantity * line.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[300px] text-[9.5px] leading-4 text-[#5c635c]">
            <p className="font-semibold uppercase tracking-[0.08em] text-[#4c544c]">Declaration</p>
            <p className="mt-1">
              We certify that the goods described above are of Bangladesh origin and that the
              information is true and correct. This document is issued for demo purposes and is not
              a negotiable instrument.
            </p>
            <p className="mt-2.5 font-medium text-[#4c544c]">{amountInWords(order.value)}</p>
          </div>
          <div className="w-full sm:w-[290px]">
            <div className="border border-[#d8d5cb]">
              <TotalRow label="Subtotal" value={order.value} />
              <TotalRow label="Freight" value={0} note={order.shipping.incoterm} />
              <TotalRow label="Discount" value={0} />
              <TotalRow label="Invoice total" value={order.value} strong />
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-5 border-t border-[#d8d5cb] pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-6">
            <Barcode value={order.id} moduleWidth={1.9} />
            <div className="text-[9px] leading-4 text-[#6b726b]">
              <p className="font-semibold uppercase tracking-[0.1em]">Authorised signature</p>
              <div className="mt-4 h-px w-40 bg-[#9a9f98]" />
              <p className="mt-1">For {SELLER.name}</p>
            </div>
          </div>
          <div className="text-right text-[8.5px] leading-4 text-[#8b918b]">
            <p>Weft demo workspace · synthetic order data</p>
            <p>Generated 16 Nov 2026 · {invoiceNo}</p>
          </div>
        </div>
      </div>

      <div
        id="packing"
        className="invoice-sheet scroll-mt-20 border-t-2 border-dashed border-[#d8d5cb] px-8 py-9 md:px-12 md:py-11 print:break-before-page"
      >
        <header className="flex flex-col gap-4 border-b-2 border-[#141814] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0d604b]">
              Packing list
            </p>
            <p className="mt-1 font-mono text-[19px] font-semibold tracking-[-0.02em]">
              {invoiceNo.replace("INV-", "PL-")}
            </p>
            <p className="mt-1 text-[10.5px] text-[#6b726b]">
              Against PO <span className="font-mono font-medium text-[#141814]">{order.id}</span> ·{" "}
              {order.buyer}
            </p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-[10.5px] sm:text-right">
            <dt className="text-[#6b726b]">Total cartons</dt>
            <dd className="font-semibold">{formatNumber(packing.cartons)}</dd>
            <dt className="text-[#6b726b]">Total pieces</dt>
            <dd className="font-semibold">{formatNumber(order.quantity)}</dd>
            <dt className="text-[#6b726b]">Page</dt>
            <dd className="font-semibold">2 of 2</dd>
          </dl>
        </header>

        <section className="mt-5 grid gap-5 sm:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6b726b]">
              Size and carton breakdown
            </p>
            <div className="mt-2 overflow-hidden border border-[#d8d5cb]">
              <table className="w-full border-collapse text-left text-[10.5px]">
                <thead>
                  <tr className="bg-[#f1efe8] text-[8.5px] uppercase tracking-[0.1em] text-[#4c544c]">
                    <th className="border-b border-[#d8d5cb] px-2.5 py-2 font-semibold">Size</th>
                    <th className="border-b border-[#d8d5cb] px-2.5 py-2 text-right font-semibold">
                      Pieces
                    </th>
                    <th className="border-b border-[#d8d5cb] px-2.5 py-2 text-right font-semibold">
                      Per carton
                    </th>
                    <th className="border-b border-[#d8d5cb] px-2.5 py-2 text-right font-semibold">
                      Cartons
                    </th>
                    <th className="border-b border-[#d8d5cb] px-2.5 py-2 text-right font-semibold">
                      Gross kg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {packing.rows.map((row) => (
                    <tr key={row.size}>
                      <td className="border-b border-[#e6e3da] px-2.5 py-1.5 font-medium">
                        {row.size}
                      </td>
                      <td className="border-b border-[#e6e3da] px-2.5 py-1.5 text-right tabular-nums">
                        {formatNumber(row.quantity)}
                      </td>
                      <td className="border-b border-[#e6e3da] px-2.5 py-1.5 text-right tabular-nums">
                        {row.pcsPerCarton}
                      </td>
                      <td className="border-b border-[#e6e3da] px-2.5 py-1.5 text-right tabular-nums">
                        {row.cartons}
                      </td>
                      <td className="border-b border-[#e6e3da] px-2.5 py-1.5 text-right tabular-nums">
                        {row.gross.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#faf9f5] font-semibold">
                    <td className="px-2.5 py-2">Total</td>
                    <td className="px-2.5 py-2 text-right tabular-nums">
                      {formatNumber(order.quantity)}
                    </td>
                    <td className="px-2.5 py-2" />
                    <td className="px-2.5 py-2 text-right tabular-nums">
                      {formatNumber(packing.cartons)}
                    </td>
                    <td className="px-2.5 py-2 text-right tabular-nums">
                      {packing.gross.toFixed(1)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-1.5 text-[8.5px] leading-3.5 text-[#8b918b]">
              Weights are estimated at 0.42 kg per piece plus 0.85 kg per carton. Carton dimensions
              60 × 40 × 35 cm. Solid colour, solid size packing.
            </p>
          </div>

          <div className="space-y-3">
            <div className="border border-[#141814] p-3.5">
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#6b726b]">
                Shipping marks
              </p>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[-0.01em]">
                {order.buyer}
              </p>
              <p className="text-[10.5px] leading-4 text-[#4c544c]">
                {order.destination}, {order.buyerCountry}
                <br />
                PO {order.id}
                <br />
                Style {order.styleCode} · {order.colour}
                <br />
                Carton 1–{formatNumber(packing.cartons)} of {formatNumber(packing.cartons)}
                <br />
                Made in Bangladesh
              </p>
              <div className="mt-3 border-t border-[#d8d5cb] pt-2">
                <Barcode value={order.id} moduleWidth={1.35} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <SummaryBox label="Net weight" value={`${packing.net.toFixed(1)} kg`} />
              <SummaryBox label="Gross weight" value={`${packing.gross.toFixed(1)} kg`} />
              <SummaryBox label="Cartons" value={formatNumber(packing.cartons)} />
              <SummaryBox label="Pieces" value={formatNumber(order.quantity)} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 border-t border-[#d8d5cb] pt-4 text-[10px] leading-4 text-[#5c635c] sm:grid-cols-2">
          <div>
            <p className="font-semibold uppercase tracking-[0.08em] text-[#4c544c]">
              Packing instructions
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              <li>Solid colour and solid size per carton; mixed sizes only where noted.</li>
              <li>Poly bag each piece with recycled tissue and a size sticker.</li>
              <li>Buyer hangtag at left front; care label at inside side seam.</li>
              <li>Carton drop test and metal detection completed before sealing.</li>
            </ol>
          </div>
          <div className="sm:text-right">
            <p className="font-semibold uppercase tracking-[0.08em] text-[#4c544c]">
              Inspected by
            </p>
            <div className="mt-3 inline-block text-left">
              <div className="h-px w-48 bg-[#9a9f98]" />
              <p className="mt-1">QC lead · {order.factory}</p>
              <p className="text-[#8b918b]">AQL 2.5 · final inspection passed</p>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

function DocumentField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#8b918b]">{label}</p>
      <p className="mt-0.5 font-medium leading-4">{value}</p>
    </div>
  );
}

function TotalRow({
  label,
  value,
  note,
  strong,
}: {
  label: string;
  value: number;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-baseline justify-between border-t border-[#141814] bg-[#f1efe8] px-3 py-2.5"
          : "flex items-baseline justify-between border-b border-[#e6e3da] px-3 py-1.5"
      }
    >
      <span className={strong ? "text-[11px] font-semibold" : "text-[10px] text-[#5c635c]"}>
        {label}
        {note ? <span className="ml-1 text-[8.5px] text-[#8b918b]">({note})</span> : null}
      </span>
      <span
        className={
          strong
            ? "text-[13px] font-semibold tabular-nums"
            : "text-[10.5px] font-medium tabular-nums"
        }
      >
        {formatMoneyFull(value)}
      </span>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d8d5cb] bg-[#faf9f5] px-2.5 py-2">
      <p className="text-[8px] uppercase tracking-[0.08em] text-[#8b918b]">{label}</p>
      <p className="mt-0.5 text-[11px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}
