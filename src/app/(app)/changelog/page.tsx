import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Changelog" };

const ENTRIES = [
  ["2026-11-17", "Added observability, security headers, shared rate limits and scheduled reminders."],
  ["2026-11-16", "Added GS1 SSCC labels, invoice versions, PDF export, OpenAPI, API keys and webhooks."],
  ["2026-11-16", "Added BOMs, material reservations, goods receipts and landed cost."],
  ["2026-11-16", "Added server-driven table, auth, roles, tenant scoping and governed workflow."],
];

export default function ChangelogPage() {
  return (
    <>
      <PageHeader eyebrow={<span>Product</span>} title="Changelog" description="Milestone highlights." />
      <Card>
        <CardHeader><CardTitle>Recent changes</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-[11px]">
          {ENTRIES.map(([date, text]) => (
            <div key={date} className="flex gap-3 border-b border-line py-2 last:border-0">
              <span className="numeric shrink-0 text-faint">{date}</span>
              <span className="text-muted">{text}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
