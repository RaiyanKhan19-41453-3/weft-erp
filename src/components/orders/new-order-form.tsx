"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CloudOff,
  Factory as FactoryIcon,
  Layers3,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  BUYERS,
  COLOURS,
  FACTORIES,
  PRIORITY_META,
  STYLES,
  type OrderDetail,
  type OrderPriority,
} from "@/lib/constants";
import { newOrderSchema, type NewOrderInput } from "@/lib/validation/new-order";
import { useLocalOrders } from "@/lib/stores/local-orders";
import { useOrderDraft } from "@/lib/stores/order-draft";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress, Spinner } from "@/components/ui/misc";
import { PriorityBadge } from "@/components/orders/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDateShort, formatMoneyFull, formatNumber } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Buyer & terms", description: "Who is buying and when it ships" },
  { id: 2, label: "Style lines", description: "Styles, colours and quantities" },
  { id: 3, label: "Review", description: "Check the PO and submit" },
] as const;

const DEFAULT_VALUES: NewOrderInput = {
  buyerName: BUYERS[0].name,
  factory: FACTORIES[0].name,
  priority: "normal",
  dueDate: "2027-01-15",
  incoterm: "FOB",
  notes: "",
  lineItems: [
    {
      style: STYLES[0].name,
      colour: COLOURS[0],
      quantity: 2400,
      unitPrice: 12.5,
    },
  ],
};

type StepOneFields = "buyerName" | "factory" | "priority" | "dueDate" | "incoterm";

export function NewOrderForm() {
  const router = useRouter();
  const addLocalOrder = useLocalOrders((state) => state.addOrder);
  const savedAt = useOrderDraft((state) => state.updatedAt);
  const [step, setStep] = React.useState(1);
  const [restoredFrom, setRestoredFrom] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  const form = useForm<NewOrderInput>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });
  const watched = useWatch({ control: form.control });
  const watchedLines = watched.lineItems ?? [];
  const lineCount = watchedLines.length;

  const totals = watchedLines.reduce<{ quantity: number; value: number }>(
    (accumulator, line) => {
      const quantity = Number(line?.quantity) || 0;
      const unitPrice = Number(line?.unitPrice) || 0;
      return {
        quantity: accumulator.quantity + quantity,
        value: accumulator.value + quantity * unitPrice,
      };
    },
    { quantity: 0, value: 0 },
  );

  const buyer = BUYERS.find((item) => item.name === watched.buyerName);
  const factory = FACTORIES.find((item) => item.name === watched.factory);

  React.useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      if (!useOrderDraft.persist.hasHydrated()) {
        await useOrderDraft.persist.rehydrate();
      }
      if (cancelled) return;
      const snapshot = useOrderDraft.getState();
      if (snapshot.draft) {
        const parsed = newOrderSchema.safeParse(snapshot.draft);
        form.reset(parsed.success ? parsed.data : DEFAULT_VALUES);
        setRestoredFrom(snapshot.updatedAt);
      }
      setHydrated(true);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [form]);

  React.useEffect(() => {
    if (!hydrated) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          useOrderDraft.getState().save(values);
        }, 450);
      },
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [form, hydrated]);

  const nextStep = async () => {
    const valid =
      step === 1
        ? await form.trigger(
            ["buyerName", "factory", "priority", "dueDate", "incoterm"] satisfies StepOneFields[],
            { shouldFocus: true },
          )
        : await form.trigger("lineItems", { shouldFocus: true });
    if (valid) setStep((current) => Math.min(3, current + 1));
  };

  const resetDraft = () => {
    useOrderDraft.getState().clear();
    form.reset(DEFAULT_VALUES);
    setRestoredFrom(null);
    setStep(1);
    toast.success("Draft cleared", { description: "The form is back to its demo defaults." });
  };

  const onSubmit = async (values: NewOrderInput) => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        detail?: OrderDetail;
        error?: string;
      };

      if (!response.ok || !payload.detail) {
        form.setError("root", {
          message:
            payload.error ??
            "The purchase order could not be created. Check the fields and try again.",
        });
        return;
      }

      addLocalOrder(payload.detail);
      useOrderDraft.getState().clear();
      toast.success(`Purchase order ${payload.detail.id} created`, {
        description: "Validated by the API and saved in this browser only.",
      });
      router.push(`/orders/${payload.detail.id}`);
    } catch {
      form.setError("root", {
        message: "The order service could not be reached. Check your connection and retry.",
      });
    }
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.62fr_1fr]">
      <div className="min-w-0 space-y-3">
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-raised/50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-y-2">
              {STEPS.map((item, index) => {
                const complete = item.id < step;
                const active = item.id === step;
                return (
                  <React.Fragment key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.id < step) setStep(item.id);
                      }}
                      disabled={item.id > step}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-md text-left outline-none transition-opacity disabled:cursor-default",
                        item.id > step && "opacity-45",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                          complete && "border-brand bg-brand text-white dark:text-[#07120e]",
                          active && "border-ink bg-ink text-surface dark:border-ink dark:bg-ink",
                          !complete && !active && "border-line-strong bg-surface text-muted",
                        )}
                      >
                        {complete ? <Check className="size-3.5" /> : item.id}
                      </span>
                      <span>
                        <span
                          className={cn(
                            "block text-[11.5px] font-medium",
                            active ? "text-ink" : "text-muted",
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="hidden text-[9.5px] text-faint sm:block">
                          {item.description}
                        </span>
                      </span>
                    </button>
                    {index < STEPS.length - 1 ? (
                      <span
                        aria-hidden
                        className={cn(
                          "mx-2 hidden h-px w-8 sm:block",
                          complete ? "bg-brand/50" : "bg-line",
                        )}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
              <span className="ml-auto hidden text-[10px] uppercase tracking-[0.08em] text-faint lg:block">
                Step {step} of 3
              </span>
            </div>
            <Progress
              value={(step / 3) * 100}
              className="mt-3 h-0.5"
              indicatorClassName="bg-brand"
              label="Purchase order form progress"
            />
          </div>

          {restoredFrom ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-brand/15 bg-brand-soft/50 px-4 py-2 text-[11px] text-brand-ink dark:bg-brand/[0.06] dark:text-brand">
              <RotateCcw className="size-3.5" />
              Restored an unsent draft saved {formatDateShort(restoredFrom)}.
              <button
                type="button"
                onClick={resetDraft}
                className="ml-auto font-medium underline underline-offset-2"
              >
                Start fresh
              </button>
            </div>
          ) : null}

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {step === 1 ? (
              <fieldset className="px-4 py-4">
                <legend className="sr-only">Buyer and commercial terms</legend>
                <div className="mb-4">
                  <h2 className="text-[13.5px] font-semibold">Buyer and commercial terms</h2>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    Everything the merchandising team needs to open a PO. Due dates use the demo
                    snapshot of 16 Nov 2026.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Buyer"
                    htmlFor="buyerName"
                    error={form.formState.errors.buyerName?.message}
                    hint={buyer ? `${buyer.city}, ${buyer.country}` : undefined}
                  >
                    <Controller
                      control={form.control}
                      name="buyerName"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            id="buyerName"
                            aria-invalid={!!form.formState.errors.buyerName}
                          >
                            <SelectValue placeholder="Choose a buyer" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUYERS.map((item) => (
                              <SelectItem key={item.name} value={item.name}>
                                {item.name} — {item.country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field
                    label="Production unit"
                    htmlFor="factory"
                    error={form.formState.errors.factory?.message}
                    hint={factory ? `${factory.lines.length} lines available` : undefined}
                  >
                    <Controller
                      control={form.control}
                      name="factory"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            id="factory"
                            aria-invalid={!!form.formState.errors.factory}
                          >
                            <SelectValue placeholder="Choose a unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {FACTORIES.map((item) => (
                              <SelectItem key={item.name} value={item.name}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field
                    label="Ship window"
                    htmlFor="dueDate"
                    error={form.formState.errors.dueDate?.message}
                  >
                    <Input
                      id="dueDate"
                      type="date"
                      min="2026-11-17"
                      aria-invalid={!!form.formState.errors.dueDate}
                      {...form.register("dueDate")}
                    />
                  </Field>

                  <Field
                    label="Priority"
                    htmlFor="priority"
                    error={form.formState.errors.priority?.message}
                  >
                    <Controller
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value as OrderPriority)}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["low", "normal", "high", "urgent"] as const).map((value) => (
                              <SelectItem key={value} value={value}>
                                {PRIORITY_META[value].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field
                    label="Incoterm"
                    htmlFor="incoterm"
                    error={form.formState.errors.incoterm?.message}
                  >
                    <Controller
                      control={form.control}
                      name="incoterm"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="incoterm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["FOB", "CIF", "EXW", "DDP"] as const).map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <div className="rounded-lg border border-line bg-raised/50 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-faint">
                      <UserRound className="size-3" />
                      Buyer contact
                    </div>
                    {buyer ? (
                      <>
                        <p className="mt-1.5 text-[11.5px] font-medium">{buyer.contact}</p>
                        <p className="text-[10.5px] text-muted">{buyer.email}</p>
                        <p className="mt-1 text-[10px] text-faint">
                          Destination port · {buyer.port}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-faint">Choose a buyer to see contact details.</p>
                    )}
                  </div>
                </div>
              </fieldset>
            ) : null}

            {step === 2 ? <StyleLinesStep form={form} totals={totals} /> : null}

            {step === 3 ? (
              <fieldset className="px-4 py-4">
                <legend className="sr-only">Review purchase order</legend>
                <div className="mb-3">
                  <h2 className="text-[13.5px] font-semibold">Review purchase order</h2>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    The API re-validates this payload with the same Zod schema before returning the
                    order.
                  </p>
                </div>

                <div className="grid gap-x-6 gap-y-4 rounded-lg border border-line bg-raised/40 p-4 sm:grid-cols-3">
                  <ReviewField label="Buyer" value={watched.buyerName ?? "—"} sub={buyer?.country} />
                  <ReviewField
                    label="Production unit"
                    value={factory?.short ?? "—"}
                    sub={factory?.name}
                  />
                  <ReviewField
                    label="Ship window"
                    value={watched.dueDate ? formatDateShort(watched.dueDate) : "—"}
                    sub={`Incoterm ${watched.incoterm ?? "—"}`}
                  />
                  <ReviewField label="Priority" value={PRIORITY_META[watched.priority ?? "normal"].label} />
                  <ReviewField
                    label="Lines"
                    value={`${lineCount} style${lineCount === 1 ? "" : "s"}`}
                  />
                  <ReviewField label="Total units" value={`${formatNumber(totals.quantity)} pcs`} />
                </div>

                <div className="mt-3 overflow-hidden rounded-lg border border-line">
                  <table className="w-full min-w-[480px] text-left text-[11.5px]">
                    <thead>
                      <tr className="border-b border-line bg-raised/70 text-[9px] uppercase tracking-[0.08em] text-faint">
                        <th className="px-3 py-2 font-medium">Style</th>
                        <th className="px-3 py-2 font-medium">Colour</th>
                        <th className="px-3 py-2 text-right font-medium">Qty</th>
                        <th className="px-3 py-2 text-right font-medium">Unit</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {watchedLines.map((line, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 font-medium">{line?.style ?? "—"}</td>
                          <td className="px-3 py-2 text-muted">{line?.colour ?? "—"}</td>
                          <td className="numeric px-3 py-2 text-right">
                            {formatNumber(Number(line?.quantity) || 0)}
                          </td>
                          <td className="numeric px-3 py-2 text-right">
                            {formatMoneyFull(Number(line?.unitPrice) || 0)}
                          </td>
                          <td className="numeric px-3 py-2 text-right font-medium">
                            {formatMoneyFull(
                              (Number(line?.quantity) || 0) * (Number(line?.unitPrice) || 0),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-line bg-raised/60">
                        <td colSpan={2} className="px-3 py-2 text-[11px] font-medium">
                          Total
                        </td>
                        <td className="numeric px-3 py-2 text-right font-medium">
                          {formatNumber(totals.quantity)}
                        </td>
                        <td />
                        <td className="numeric px-3 py-2 text-right font-semibold">
                          {formatMoneyFull(totals.value)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4">
                  <Field
                    label="Handover note (optional)"
                    htmlFor="notes"
                    error={form.formState.errors.notes?.message}
                    hint={`${watched.notes?.length ?? 0} / 500 characters`}
                  >
                    <Textarea
                      id="notes"
                      rows={3}
                      maxLength={500}
                      placeholder="Cutting instructions, trims, packaging or buyer requirements…"
                      aria-invalid={!!form.formState.errors.notes}
                      {...form.register("notes")}
                    />
                  </Field>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-md border border-line bg-sunken/50 px-3 py-2.5 text-[10.5px] leading-4 text-muted">
                  <CloudOff className="mt-0.5 size-3.5 shrink-0 text-faint" />
                  <p>
                    Submitting calls <code className="font-mono text-[10px]">POST /api/orders</code>,
                    which validates and returns a PO. There is no database: the result is saved in
                    this browser&apos;s localStorage so you can open, print and remove it.
                  </p>
                </div>
              </fieldset>
            ) : null}

            {rootError ? (
              <div
                role="alert"
                className="mx-4 mb-3 flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger"
              >
                <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                {rootError}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-raised/30 px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={step === 1 || form.formState.isSubmitting}
              >
                <ArrowLeft />
                Back
              </Button>

              <span className="ml-auto flex items-center gap-2">
                <span className="hidden items-center gap-1 text-[10px] text-faint sm:flex">
                  {savedAt ? (
                    <>
                      <CloudOff className="size-3" />
                      Draft saved locally {formatDateShort(savedAt)}
                    </>
                  ) : (
                    <>
                      <CloudOff className="size-3" />
                      Draft saves in this browser
                    </>
                  )}
                </span>
                {step < 3 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={(event) => {
                      // The footer button becomes the submit button on the next
                      // render. Preventing the default action stops the browser
                      // from treating that same click as a form submission.
                      event.preventDefault();
                      void nextStep();
                    }}
                  >
                    Continue
                    <ArrowRight />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Creating PO…
                      </>
                    ) : (
                      <>
                        <Check />
                        Create purchase order
                      </>
                    )}
                  </Button>
                )}
              </span>
            </div>
          </form>
        </Card>
      </div>

      <aside className="space-y-3">
        <Card className="xl:sticky xl:top-[72px]">
          <CardHeader className="pb-2">
            <div>
              <CardTitle>Draft summary</CardTitle>
              <CardDescription>Updates as you type</CardDescription>
            </div>
            <Badge tone="brand" size="sm">
              Draft
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            <div className="flex items-baseline justify-between border-b border-line pb-2.5">
              <span className="text-[10px] uppercase tracking-[0.07em] text-faint">Indicative value</span>
              <span className="numeric text-[17px] font-semibold">{formatMoneyFull(totals.value)}</span>
            </div>
            <SummaryRow label="Units" value={`${formatNumber(totals.quantity)} pcs`} />
            <SummaryRow label="Styles" value={`${lineCount}`} />
            <SummaryRow label="Buyer" value={buyer?.name ?? "—"} />
            <SummaryRow label="Unit" value={factory?.short ?? "—"} />
            <SummaryRow
              label="Ship window"
              value={watched.dueDate ? formatDateShort(watched.dueDate) : "—"}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-muted">Priority</span>
              <PriorityBadge priority={watched.priority ?? "normal"} />
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2.5">
              <span className="text-[10.5px] text-muted">Incoterm</span>
              <span className="text-[11px] font-medium">{watched.incoterm ?? "—"}</span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 rounded-md bg-sunken/60 px-2.5 py-2 text-[10px] text-muted">
              {hydrated ? (
                <>
                  <CloudOff className="size-3 shrink-0 text-faint" />
                  Autosaved in localStorage · not sent until you submit
                </>
              ) : (
                <>
                  <Spinner className="size-3" />
                  Checking for a saved draft…
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <div>
              <CardTitle>What this flow demonstrates</CardTitle>
              <CardDescription>Patterns used in production ERP forms</CardDescription>
            </div>
            <Sparkles className="size-4 text-muted" />
          </CardHeader>
          <CardContent className="space-y-2.5 pt-1">
            <Feature
              icon={<Layers3 className="size-3.5" />}
              title="React Hook Form + Zod"
              description="One schema drives client validation and the API route."
            />
            <Feature
              icon={<RotateCcw className="size-3.5" />}
              title="Recoverable drafts"
              description="Zustand persist restores unsent input after a refresh."
            />
            <Feature
              icon={<FactoryIcon className="size-3.5" />}
              title="Browser-local result"
              description="The returned PO appears in the explorer and detail views."
            />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function StyleLinesStep({
  form,
  totals,
}: {
  form: UseFormReturn<NewOrderInput>;
  totals: { quantity: number; value: number };
}) {
  // useFieldArray generates ids with crypto.randomUUID at render time. Keeping
  // it in the step that only mounts on the client avoids calling random values
  // while the route shell is prerendered.
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });
  const watchedLines = useWatch({ control: form.control, name: "lineItems" }) ?? [];

  return (
    <fieldset className="px-4 py-4">
      <legend className="sr-only">Style lines</legend>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[13.5px] font-semibold">Style lines</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Up to five styles per PO. Quantities are whole pieces; prices are USD per piece.
          </p>
        </div>
        <Badge tone="neutral" size="sm">
          {fields.length} / 5 lines
        </Badge>
      </div>

      <div className="space-y-2.5">
        {fields.map((field, index) => {
          const lineErrors = form.formState.errors.lineItems?.[index];
          const quantity = Number(watchedLines[index]?.quantity) || 0;
          const price = Number(watchedLines[index]?.unitPrice) || 0;
          return (
            <div key={field.id} className="rounded-lg border border-line bg-raised/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold">Style line {index + 1}</p>
                <div className="flex items-center gap-2">
                  <span className="numeric text-[10.5px] text-muted">
                    {formatMoneyFull(quantity * price)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remove style line ${index + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Style"
                  htmlFor={`line-style-${index}`}
                  error={lineErrors?.style?.message}
                >
                  <Controller
                    control={form.control}
                    name={`lineItems.${index}.style`}
                    render={({ field: control }) => (
                      <Select value={control.value} onValueChange={control.onChange}>
                        <SelectTrigger
                          id={`line-style-${index}`}
                          aria-invalid={!!lineErrors?.style}
                        >
                          <SelectValue placeholder="Choose a style" />
                        </SelectTrigger>
                        <SelectContent>
                          {STYLES.map((style) => (
                            <SelectItem key={style.name} value={style.name}>
                              {style.name} · {style.gsm} gsm
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field
                  label="Colour"
                  htmlFor={`line-colour-${index}`}
                  error={lineErrors?.colour?.message}
                >
                  <Controller
                    control={form.control}
                    name={`lineItems.${index}.colour`}
                    render={({ field: control }) => (
                      <Select value={control.value} onValueChange={control.onChange}>
                        <SelectTrigger
                          id={`line-colour-${index}`}
                          aria-invalid={!!lineErrors?.colour}
                        >
                          <SelectValue placeholder="Choose a colour" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOURS.map((colour) => (
                            <SelectItem key={colour} value={colour}>
                              {colour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field
                  label="Quantity (pcs)"
                  htmlFor={`line-quantity-${index}`}
                  error={lineErrors?.quantity?.message}
                >
                  <Input
                    id={`line-quantity-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={100}
                    step={10}
                    aria-invalid={!!lineErrors?.quantity}
                    {...form.register(`lineItems.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                </Field>

                <Field
                  label="Unit price (USD)"
                  htmlFor={`line-price-${index}`}
                  error={lineErrors?.unitPrice?.message}
                >
                  <Input
                    id={`line-price-${index}`}
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step="0.01"
                    aria-invalid={!!lineErrors?.unitPrice}
                    {...form.register(`lineItems.${index}.unitPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              style: STYLES[(fields.length + 1) % STYLES.length]!.name,
              colour: COLOURS[(fields.length + 2) % COLOURS.length]!,
              quantity: 1200,
              unitPrice: 10,
            })
          }
          disabled={fields.length >= 5}
        >
          <Plus />
          Add style line
        </Button>
        <span className="text-[10px] text-faint">
          {formatNumber(totals.quantity)} pcs · {formatMoneyFull(totals.value)} indicative value
        </span>
      </div>
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-[9.5px] text-faint">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-[10.5px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ReviewField({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-faint">{label}</p>
      <p className="mt-0.5 text-[11.5px] font-medium">{value}</p>
      {sub ? <p className="text-[10px] text-muted">{sub}</p> : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10.5px] text-muted">{label}</span>
      <span className="truncate text-[11px] font-medium">{value}</span>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-muted">
        {icon}
      </span>
      <span>
        <span className="block text-[11px] font-medium">{title}</span>
        <span className="block text-[10px] leading-4 text-muted">{description}</span>
      </span>
    </div>
  );
}
