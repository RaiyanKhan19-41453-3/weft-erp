import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow={<span>Legal</span>} title="Terms of use" description="Demo terms for this portfolio project." />
      <Card>
        <CardHeader><CardTitle>Terms</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-[11px] leading-5 text-muted">
          <p>Weft is a portfolio demonstration. Data, buyers, invoices and performance figures are synthetic. Do not use it for real commercial decisions.</p>
          <p>Accounts and API keys are provided for demonstration only. No service-level agreement is offered.</p>
        </CardContent>
      </Card>
    </>
  );
}
