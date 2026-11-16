"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { STATUS_META, STATUS_ORDER, type Order, type OrderStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StatusControl({ order, enabled }: { order: Order; enabled: boolean }) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = React.useOptimistic<OrderStatus>(order.status);
  const [pending, startTransition] = React.useTransition();

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
        const data = (await response.json()) as { error?: string };
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
      <Select value={optimisticStatus} onValueChange={(value) => update(value as OrderStatus)} disabled={pending}>
        <SelectTrigger className="h-8 w-[158px] text-[11px]" aria-label="Update order status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ORDER.map((status) => (
            <SelectItem key={status} value={status} className="text-[11px]">
              {STATUS_META[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending ? <Loader2 className="size-3.5 animate-spin text-muted" aria-hidden /> : null}
      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 md:inline-flex"
        disabled={optimisticStatus === "shipped" || pending}
        onClick={() => {
          const index = STATUS_ORDER.indexOf(optimisticStatus);
          const next = STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)];
          if (next) update(next);
        }}
      >
        Advance
      </Button>
    </div>
  );
}
