"use client";

import * as React from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import type { ImportPreview } from "@/lib/csv-import";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PreviewResponse = {
  rows: ImportPreview[];
  validCount: number;
  invalidCount: number;
  error?: string;
};

const SAMPLE = `buyerName,factory,priority,dueDate,incoterm,style,colour,quantity,unitPrice,notes
North & Pine,Unit 01 — Gazipur,normal,2027-06-01,FOB,Relaxed tee,Ecru,1200,11.5,"Imported line"
Aurelia,Unit 04 — Chattogram,high,2027-06-15,CIF,Denim jacket,Indigo,800,28,"Second line"`;

export function ImportForm() {
  const { data: session } = authClient.useSession();
  const [text, setText] = React.useState(SAMPLE);
  const [preview, setPreview] = React.useState<PreviewResponse | null>(null);
  const [busy, setBusy] = React.useState(false);

  const validate = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/orders/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = (await response.json()) as PreviewResponse;
      if (!response.ok) {
        toast.error(data.error ?? "Preview failed.");
        return;
      }
      setPreview(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>CSV source</CardTitle>
            <CardDescription>
              One PO per row. Validation uses the same Zod schema as the multi-step form.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={14}
            className="font-mono text-[10.5px]"
            aria-label="CSV source"
          />
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={validate} disabled={busy}>
              {busy ? "Validating…" : "Validate preview"}
            </Button>
            {!session ? <span className="text-[10px] text-warning">Sign in to validate.</span> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Validation preview</CardTitle>
            <CardDescription>No rows are written during preview.</CardDescription>
          </div>
          {preview ? (
            <Badge tone={preview.invalidCount > 0 ? "amber" : "green"} size="sm">
              {preview.validCount} valid · {preview.invalidCount} invalid
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {preview ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[11px]">
                <thead>
                  <tr className="border-y border-line bg-raised/60 text-[9px] uppercase tracking-[0.08em] text-faint">
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Result</th>
                    <th className="px-3 py-2">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {preview.rows.map((row) => (
                    <tr key={row.row}>
                      <td className="px-3 py-2 font-mono">{row.row === 0 ? "header" : row.row}</td>
                      <td className="px-3 py-2">
                        <Badge tone={row.valid ? "green" : "red"} size="sm">
                          {row.valid ? "valid" : "invalid"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted">
                        {row.valid
                          ? `${row.order?.lineItems[0]?.style} · ${row.order?.lineItems[0]?.quantity} pcs`
                          : row.errors.join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-[11px] text-muted">Run validation to see a preview.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
