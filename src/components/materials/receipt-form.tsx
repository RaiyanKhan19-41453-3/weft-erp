"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PackageCheck } from "lucide-react";
import type { Material } from "@/lib/data/materials";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReceiptForm({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [sku, setSku] = React.useState(materials[0]?.sku ?? "");
  const [quantity, setQuantity] = React.useState("500");
  const [supplier, setSupplier] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/api/materials/${encodeURIComponent(sku)}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(quantity),
          supplier: supplier || undefined,
          note: note || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "The receipt could not be recorded.");
        return;
      }
      toast.success("Goods receipt recorded", { description: "Stock coverage has been recalculated." });
      setQuantity("500");
      setSupplier("");
      setNote("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const material = materials.find((item) => item.sku === sku);

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div className="space-y-1.5">
        <Label htmlFor="receipt-sku">Material</Label>
        <select
          id="receipt-sku"
          value={sku}
          onChange={(event) => setSku(event.target.value)}
          className="h-8 w-full rounded-control border border-line bg-surface px-2 text-[11px]"
        >
          {materials.map((item) => (
            <option key={item.sku} value={item.sku}>
              {item.name} · {item.sku}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="receipt-qty">Quantity ({material?.unit ?? "units"})</Label>
          <Input
            id="receipt-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="h-8 text-[11px]"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="receipt-supplier">Supplier</Label>
          <Input
            id="receipt-supplier"
            value={supplier}
            onChange={(event) => setSupplier(event.target.value)}
            placeholder={material?.supplier ?? "Optional"}
            className="h-8 text-[11px]"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="receipt-note">Note</Label>
        <Textarea
          id="receipt-note"
          rows={2}
          maxLength={200}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional delivery reference"
          className="text-[11px]"
        />
      </div>
      <Button type="submit" variant="primary" size="sm" disabled={busy || !sku} className="w-full">
        <PackageCheck />
        {busy ? "Recording…" : "Record receipt"}
      </Button>
    </form>
  );
}
