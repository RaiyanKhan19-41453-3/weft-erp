import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <>
      <PageHeader eyebrow={<span>Help</span>} title="Support" description="How to get help with the demo." />
      <Card>
        <CardHeader><CardTitle>Contact & escalation</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-[11px] leading-5 text-muted">
          <p>Check the <Link className="text-brand underline" href="/status">status page</Link> and <a className="text-brand underline" href="https://github.com/RaiyanKhan19-41453-3/weft-erp/blob/main/docs/RUNBOOK.md">runbook</a> first.</p>
          <p>For demo issues, open a GitHub issue on the repository with the route, expected result and actual result. Include a request ID from structured logs where available.</p>
          <Button asChild variant="outline" size="sm">
            <a href="mailto:support@weft.example">Email support</a>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
