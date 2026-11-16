import { newOrderSchema, type NewOrderInput } from "./validation/new-order";

const REQUIRED = ["buyerName", "factory", "priority", "dueDate", "incoterm", "style", "colour", "quantity", "unitPrice"] as const;

function parseRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

export type ImportPreview = {
  row: number;
  valid: boolean;
  errors: string[];
  order?: NewOrderInput;
};

export function previewOrderCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [] as ImportPreview[], validCount: 0, invalidCount: 0 };
  const headers = parseRow(lines[0]!).map((header) => header.toLowerCase());
  const missing = REQUIRED.filter((field) => !headers.includes(field.toLowerCase()));

  if (missing.length > 0) {
    return {
      rows: [{ row: 0, valid: false, errors: [`Missing columns: ${missing.join(", ")}`] }],
      validCount: 0,
      invalidCount: 1,
    };
  }

  const rows = lines.slice(1).map((line, index): ImportPreview => {
    const cells = parseRow(line);
    const record = Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""])) as Record<string, string>;
    const candidate = {
      buyerName: record.buyername ?? "",
      factory: record.factory ?? "",
      priority: record.priority ?? "",
      dueDate: record.duedate ?? "",
      incoterm: record.incoterm ?? "",
      notes: record.notes || undefined,
      lineItems: [
        {
          style: record.style ?? "",
          colour: record.colour ?? "",
          quantity: Number(record.quantity),
          unitPrice: Number(record.unitprice),
        },
      ],
    };
    const parsed = newOrderSchema.safeParse(candidate);
    return parsed.success
      ? { row: index + 2, valid: true, errors: [], order: parsed.data }
      : {
          row: index + 2,
          valid: false,
          errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
        };
  });

  return {
    rows,
    validCount: rows.filter((row) => row.valid).length,
    invalidCount: rows.filter((row) => !row.valid).length,
  };
}
