import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow={<span>Legal</span>} title="Privacy" description="What this demo stores." />
      <Card>
        <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-[11px] leading-5 text-muted">
          <p>Account details, organizations and demo records live in Neon Postgres. UI preferences and unsent drafts live in your browser.</p>
          <p>No analytics cookies or third-party trackers are used. Error reports are stored as structured server logs.</p>
        </CardContent>
      </Card>
    </>
  );
}
