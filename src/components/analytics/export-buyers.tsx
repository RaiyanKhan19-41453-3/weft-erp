"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import type { BuyerScore } from "@/lib/data/orders";
import { Button } from "@/components/ui/button";
import { downloadCsv, formatNumber, toCsv } from "@/lib/utils";

export function ExportBuyersButton({ buyers }: { buyers: BuyerScore[] }) {
  const exportRows = () => {
    const content = toCsv(
      [
        "Buyer",
        "Country",
        "Orders",
        "Units",
        "Value USD",
        "On-time %",
        "At risk",
        "Defect %",
        "Trend",
      ],
      buyers.map((buyer) => [
        buyer.name,
        buyer.country,
        buyer.orders,
        buyer.units,
        buyer.value.toFixed(2),
        buyer.onTimeRate.toFixed(1),
        buyer.atRisk,
        buyer.defectRate.toFixed(1),
        buyer.trend.toFixed(1),
      ]),
    );
    downloadCsv("weft-buyer-scorecard-2026-11-16.csv", content);
    toast.success(`${formatNumber(buyers.length)} buyer scorecards exported`);
  };

  return (
    <Button variant="outline" size="sm" onClick={exportRows}>
      <Download />
      Export scorecard
    </Button>
  );
}
