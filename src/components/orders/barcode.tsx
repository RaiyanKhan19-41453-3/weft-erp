import { cn } from "@/lib/utils";

/**
 * Code 39 barcode served by /api/barcode. The SVG is generated on the server,
 * so this component stays tiny and works in both server and client invoices.
 */
export function Barcode({
  value,
  className,
  moduleWidth = 2,
  symbology = "code39",
}: {
  value: string;
  className?: string;
  moduleWidth?: number;
  symbology?: "code39" | "code128";
}) {
  const src = `/api/barcode?value=${encodeURIComponent(value)}&scale=${Math.max(1, Math.round(moduleWidth))}&bcid=${symbology}`;
  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        width={moduleWidth * 8 * value.length}
        height={40}
        alt={`Code 39 barcode for ${value}`}
        className="h-10 max-w-full bg-white object-contain"
      />
      <span className="font-mono text-[9px] tracking-[0.22em] text-neutral-600">
        {value.toUpperCase()}
      </span>
    </div>
  );
}
