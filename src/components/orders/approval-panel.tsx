"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { STATUS_META, type OrderStatus } from "@/lib/constants";
import type { OrderApproval } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { formatDateShort } from "@/lib/utils";

export function ApprovalPanel({
  orderId,
  approvals,
  canDecide,
}: {
  orderId: string;
  approvals: OrderApproval[];
  canDecide: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const pending = approvals.filter((approval) => approval.decision === "pending");

  if (approvals.length === 0) return null;

  const decide = async (approvalId: string, decision: "approved" | "rejected") => {
    setBusy(approvalId);
    try {
      const response = await fetch(`/api/orders/${orderId}/approvals/${approvalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          note: (document.getElementById(`approval-note-${approvalId}`) as HTMLTextAreaElement | null)?.value,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "The approval could not be recorded.");
        return;
      }
      toast.success(decision === "approved" ? "Approval granted" : "Approval rejected");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="text-[11.5px] font-semibold">Approvals</p>
      <p className="mt-0.5 text-[10.5px] text-faint">
        Shipments from a non-admin role require owner or admin approval.
      </p>
      <div className="mt-3 space-y-2">
        {approvals.map((approval) => (
          <div
            key={approval.id}
            className="rounded-md border border-line bg-raised/40 px-3 py-2 text-[10.5px]"
          >
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-medium text-ink">
                Move to {STATUS_META[approval.requestedStatus as OrderStatus]?.label ?? approval.requestedStatus}
              </span>
              <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
                {approval.decision}
              </span>
              <span className="ml-auto text-faint">{formatDateShort(approval.requestedAt)}</span>
            </div>
            <p className="mt-1 text-faint">
              Requested by {approval.requestedBy}
              {approval.note ? ` · ${approval.note}` : ""}
            </p>
            {approval.decidedBy ? (
              <p className="mt-1 text-muted">
                {approval.decision} by {approval.decidedBy}
              </p>
            ) : null}
            {canDecide && approval.decision === "pending" ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  id={`approval-note-${approval.id}`}
                  rows={2}
                  maxLength={200}
                  placeholder="Optional decision note"
                  className="text-[10.5px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="h-7 text-[10px]"
                    disabled={busy === approval.id}
                    onClick={() => decide(approval.id, "approved")}
                  >
                    <Check />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px]"
                    disabled={busy === approval.id}
                    onClick={() => decide(approval.id, "rejected")}
                  >
                    <X />
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {pending.length > 0 ? (
        <p className="mt-2 text-[10px] text-warning">{pending.length} pending approval(s)</p>
      ) : null}
    </div>
  );
}
