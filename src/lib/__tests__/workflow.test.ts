import { describe, expect, it } from "vitest";
import { checkTransition, nextStatuses, requiresApproval } from "@/lib/workflow";

describe("PO workflow", () => {
  it("allows only adjacent forward transitions", () => {
    expect(checkTransition("draft", "confirmed", "merchandiser")).toEqual({ ok: true });
    expect(checkTransition("draft", "shipped", "owner").ok).toBe(false);
    expect(checkTransition("qc", "ready", "factory")).toEqual({ ok: true });
    expect(checkTransition("ready", "shipped", "factory")).toEqual({ ok: true });
  });

  it("restricts cancellation to privileged roles", () => {
    expect(checkTransition("confirmed", "cancelled", "viewer").ok).toBe(false);
    expect(checkTransition("confirmed", "cancelled", "admin")).toEqual({ ok: true });
  });

  it("requires approval for non-admin shipments", () => {
    expect(requiresApproval("shipped", "factory")).toBe(true);
    expect(requiresApproval("shipped", "owner")).toBe(false);
    expect(nextStatuses("shipped", "owner")).toEqual([]);
  });
});
