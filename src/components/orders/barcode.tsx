import { cn } from "@/lib/utils";

/**
 * Code 39-style barcode rendered as CSS bars. This is a visual demo, not a
 * certified barcode — it is deterministic so the same PO always prints the
 * same pattern and is labelled as such for screen readers.
 */
const CODE39: Record<string, string> = {
  "0": "101001101101",
  "1": "110100101011",
  "2": "101100101011",
  "3": "110110010101",
  "4": "101001101011",
  "5": "110100110101",
  "6": "101100110101",
  "7": "101001011011",
  "8": "110100101101",
  "9": "101100101101",
  A: "110101001011",
  B: "101101001011",
  C: "110110100101",
  D: "101011001011",
  E: "110101100101",
  F: "101101100101",
  G: "101010011011",
  H: "110101001101",
  I: "101101001101",
  J: "101011001101",
  K: "110101010011",
  L: "101101010011",
  M: "110110101001",
  N: "101011010011",
  O: "110101101001",
  P: "101101101001",
  Q: "101010110011",
  R: "110101011001",
  S: "101101011001",
  T: "101011011001",
  U: "110010101011",
  V: "100110101011",
  W: "110011010101",
  X: "100101101011",
  Y: "110010110101",
  Z: "100110110101",
  "-": "100101011011",
  ".": "110010101101",
  " ": "100110101101",
  "*": "100101101101",
};

function runs(binary: string) {
  const result: Array<{ bar: boolean; width: number }> = [];
  for (const bit of binary) {
    const bar = bit === "1";
    const last = result[result.length - 1];
    if (last && last.bar === bar) last.width += 1;
    else result.push({ bar, width: 1 });
  }
  return result;
}

export function Barcode({
  value,
  className,
  moduleWidth = 2,
}: {
  value: string;
  className?: string;
  moduleWidth?: number;
}) {
  const encoded = `*${value.toUpperCase().replace(/[^0-9A-Z\-. ]/g, "")}*`;
  const segments = encoded.split("").flatMap((character, index) => {
    const pattern = CODE39[character] ?? CODE39["-"]!;
    const parts = runs(pattern).map((run, runIndex) => ({
      ...run,
      key: `${index}-${runIndex}`,
    }));
    // Inter-character gap (narrow space).
    if (index < encoded.length - 1) {
      parts.push({ bar: false, width: 1, key: `${index}-gap` });
    }
    return parts;
  });

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <div
        role="img"
        aria-label={`Barcode for ${value}`}
        className="flex h-10 items-stretch bg-white"
        style={{ width: "fit-content" }}
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            aria-hidden
            style={{
              width: segment.width * moduleWidth,
              backgroundColor: segment.bar ? "#111111" : "transparent",
            }}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] tracking-[0.22em] text-neutral-600">
        {value.toUpperCase()}
      </span>
    </div>
  );
}
