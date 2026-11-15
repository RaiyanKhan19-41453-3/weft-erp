import { z } from "zod";
import { ORDER_PRIORITIES } from "@/lib/constants";

export const lineItemSchema = z.object({
  style: z.string().min(1, "Choose a style"),
  colour: z.string().min(1, "Choose a colour"),
  quantity: z
    .number({ error: "Enter a quantity" })
    .int("Use whole pieces")
    .min(100, "Minimum 100 pcs per line")
    .max(50_000, "Maximum 50,000 pcs per line"),
  unitPrice: z
    .number({ error: "Enter a unit price" })
    .min(1, "Minimum $1.00")
    .max(500, "Maximum $500.00"),
});

export const newOrderSchema = z.object({
  buyerName: z.string().min(1, "Choose a buyer"),
  factory: z.string().min(1, "Choose a production unit"),
  priority: z.enum(ORDER_PRIORITIES),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a due date")
    .refine((value) => value > "2026-11-16", "Due date must be after 16 Nov 2026"),
  incoterm: z.enum(["FOB", "CIF", "EXW", "DDP"]),
  notes: z.string().max(500, "Keep notes under 500 characters").optional(),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "Add at least one style")
    .max(5, "A maximum of 5 style lines"),
});

export type NewOrderInput = z.infer<typeof newOrderSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
