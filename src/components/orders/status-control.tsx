"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { STATUS_META, type Order, type OrderStatus } from "@/lib/constants";
import type { WeftRole } from "@/lib/permissions";
import { nextStatuses } from "@/lib/workflow";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StatusControl({
  order,
  enabled,
  role,
}: {
  order: Order;
  enabled: boolean;
  role: WeftRole | "public";
}) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = React.useOptimistic<OrderStatus>(order.status);
  const [pending, startTransition] = React.useTransition();
  const allowed = role === "public" ? [] : nextStatuses(order.status, role);

  if (!enabled || order.isLocal) return null;

  const update = (next: OrderStatus) => {
    const previous = order.status;
    if (next === previous) return;

    startTransition(async () => {
      setOptimisticStatus(next);
      try {
        const response = await fetch(`/api/orders/${order.id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next, note: "Changed from the order detail view" }),
        });
        const data = (await response.json()) as {
          error?: string;
          message?: string;
          approvalRequired?: boolean;
        };
        if (response.status === 202) {
          setOptimisticStatus(previous);
          toast.success("Approval requested", { description: data.message });
          router.refresh();
          return;
        }
        if (!response.ok) {
          setOptimisticStatus(previous);
          toast.error(data.error ?? "The status could not be updated.");
          return;
        }
        toast.success(`Status moved to ${STATUS_META[next].label}`);
        router.refresh();
      } catch {
        setOptimisticStatus(previous);
        toast.error("The status service could not be reached.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2" aria-busy={pending}>
      <Select value={optimisticStatus} onValueChange={(value) => update(value as OrderStatus)} disabled={pending || allowed.length === 0}>
        <SelectTrigger className="h-8 w-[158px] text-[11px]" aria-label="Update order status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowed.map((status) => (
            <SelectItem key={status} value={status} className="text-[11px]">
              {STATUS_META[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending ? <Loader2 className="size-3.5 animate-spin text-muted" aria-hidden /> : null}
      {allowed[0] ? (
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 md:inline-flex"
          disabled={pending}
          onClick={() => update(allowed[0]!)}
        >
          Advance
        </Button>
      ) : null}
    </div>
  );
}
