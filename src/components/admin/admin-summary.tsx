"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Summary = {
  organization?: { name: string; slug: string } | null;
  orderCount?: number;
  members?: Array<{ id: string; role: string; userId: string }>;
  settings?: { plan: string; seatLimit: number; monthlyOrderLimit: number } | null;
  error?: string;
};

export function AdminSummary() {
  const [data, setData] = React.useState<Summary | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/summary")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ error: "Could not load the summary." }));
  }, []);

  if (data?.error) return <Card><CardContent className="p-4 text-[11px] text-danger">{data.error}</CardContent></Card>;
  if (!data) return <Card><CardContent className="p-4 text-[11px] text-muted">Loading…</CardContent></Card>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Organization</CardTitle>
            <CardDescription>{data.organization?.slug ?? "—"}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-[11px]">
          <div className="flex justify-between"><span className="text-muted">Name</span><span className="font-medium">{data.organization?.name ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted">Orders</span><span className="font-medium">{data.orderCount ?? 0}</span></div>
          <div className="flex justify-between"><span className="text-muted">Plan</span><span className="font-medium capitalize">{data.settings?.plan ?? "free"}</span></div>
          <div className="flex justify-between"><span className="text-muted">Seat limit</span><span className="font-medium">{data.settings?.seatLimit ?? 5}</span></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>Roles in the active workspace</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {(data.members ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-line px-2.5 py-2 text-[10.5px]">
              <span className="font-mono text-muted">{item.userId.slice(0, 12)}…</span>
              <Badge tone="neutral" size="sm">{item.role}</Badge>
            </div>
          ))}
          {(data.members ?? []).length === 0 ? <p className="text-[11px] text-muted">No members.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
