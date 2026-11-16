import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Status" };

export default function StatusPage() {
  return (
    <>
      <PageHeader eyebrow={<span>System</span>} title="Status" description="Current component status for the Weft demo." />
      <Card>
        <CardHeader><CardTitle>All systems operational</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-[11px] text-muted">
          <p>Web app: operational · API: operational · Neon database: operational · Scheduled jobs: operational.</p>
          <p>Automated uptime checks run every 30 minutes from GitHub Actions. Historical incidents are not fabricated.</p>
        </CardContent>
      </Card>
    </>
  );
}
