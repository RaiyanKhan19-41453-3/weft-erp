import { cn } from "@/lib/utils";

export function WeftMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden
      className={cn("size-6", className)}
      fill="none"
    >
      <rect x="1" y="1" width="26" height="26" rx="7" stroke="currentColor" strokeOpacity="0.28" />
      <path
        d="M7 8.5h14M7 14h14M7 19.5h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.42"
      />
      <path
        d="M9.5 6v16M14 6v16M18.5 6v16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="11.2" y="11.2" width="5.6" height="5.6" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function WeftWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <WeftMark className="size-7 text-sidebar-brand" />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-sidebar-ink">
          Weft
        </span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-sidebar-muted">
          Operations
        </span>
      </span>
    </span>
  );
}
