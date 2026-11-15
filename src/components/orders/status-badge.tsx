import * as React from "react";
import { PRIORITY_META, STATUS_META, type OrderPriority, type OrderStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusDot({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-1.5 shrink-0 rounded-full", STATUS_META[status].dotClass, className)}
    />
  );
}

export function OrderStatusBadge({
  status,
  className,
  short = false,
}: {
  status: OrderStatus;
  className?: string;
  short?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge className={cn("gap-1.5 whitespace-nowrap", meta.badgeClass, className)}>
      <StatusDot status={status} className="size-1" />
      {short ? meta.short : meta.label}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: OrderPriority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  if (priority === "normal") {
    return (
      <span className={cn("text-[11px] text-muted", className)} aria-label="Normal priority">
        Normal
      </span>
    );
  }
  return (
    <Badge className={cn("gap-1.5 whitespace-nowrap", meta.badgeClass, className)}>
      <span aria-hidden className={cn("size-1 rounded-full", meta.dotClass)} />
      {meta.label}
    </Badge>
  );
}

export function LocalBadge({ className }: { className?: string }) {
  return (
    <Badge
      tone="brand"
      className={cn("whitespace-nowrap", className)}
      title="Stored in this browser only"
    >
      Browser PO
    </Badge>
  );
}
