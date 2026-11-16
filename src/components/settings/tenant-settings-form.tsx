"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FEATURES = ["orders", "materials", "analytics", "invoices"] as const;
const PLANS = [
  { key: "pro", name: "Pro", price: "$29/mo" },
  { key: "enterprise", name: "Enterprise", price: "$99/mo" },
] as const;

type Settings = {
  brandName: string;
  accent: string;
  features: string;
  plan: string;
  stripeCustomerId?: string | null;
  seatLimit: number;
  monthlyOrderLimit: number;
};

export function TenantSettingsForm() {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [brandName, setBrandName] = React.useState("Weft");
  const [accent, setAccent] = React.useState("#2f7d63");
  const [features, setFeatures] = React.useState<string[]>([...FEATURES]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/settings/tenant")
      .then((response) => response.json())
      .then((data: { settings: Settings | null }) => {
        if (!data.settings) return;
        setSettings(data.settings);
        setBrandName(data.settings.brandName);
        setAccent(data.settings.accent);
        setFeatures(data.settings.features.split(","));
        document.documentElement.style.setProperty("--brand", data.settings.accent);
      })
      .catch(() => {});
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/settings/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, accent, features }),
      });
      const data = (await response.json()) as { error?: string; settings?: Settings };
      if (!response.ok) {
        toast.error(data.error ?? "Could not save settings.");
        return;
      }
      if (data.settings) setSettings(data.settings);
      document.documentElement.style.setProperty("--brand", accent);
      toast.success("Workspace settings saved");
    } finally {
      setBusy(false);
    }
  };

  const checkout = async (plan: "pro" | "enterprise") => {
    setBusy(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setBusy(false);
    }
  };

  const portal = async () => {
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      toast.error(data.error ?? "No billing account yet.");
      return;
    }
    window.location.href = data.url;
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Workspace branding</CardTitle>
            <CardDescription>Owner and admin only. Changes apply to this browser immediately.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <div className="space-y-1.5">
              <Label htmlFor="brandName">Brand name</Label>
              <Input id="brandName" value={brandName} onChange={(event) => setBrandName(event.target.value)} maxLength={60} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accent">Accent colour</Label>
              <div className="flex items-center gap-2">
                <Input id="accent" type="color" className="h-9 w-16 p-1" value={accent} onChange={(event) => setAccent(event.target.value)} />
                <Input value={accent} onChange={(event) => setAccent(event.target.value)} className="w-32 font-mono text-[11px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Enabled modules</Label>
              <div className="flex flex-wrap gap-3">
                {FEATURES.map((feature) => (
                  <label key={feature} className="flex items-center gap-1.5 text-[11px] capitalize">
                    <Checkbox
                      checked={features.includes(feature)}
                      onCheckedChange={(checked) =>
                        setFeatures((current) =>
                          checked ? [...current, feature] : current.filter((item) => item !== feature),
                        )
                      }
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Saving…" : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Plan &amp; limits</CardTitle>
            <CardDescription>Demo entitlements</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-[11px]">
          <div className="flex justify-between"><span className="text-muted">Plan</span><span className="font-medium capitalize">{settings?.plan ?? "free"}</span></div>
          <div className="flex justify-between"><span className="text-muted">Seats</span><span className="font-medium">{settings?.seatLimit ?? 5}</span></div>
          <div className="flex justify-between"><span className="text-muted">Orders / month</span><span className="font-medium">{settings?.monthlyOrderLimit ?? 500}</span></div>
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            {PLANS.map((plan) => (
              <Button
                key={plan.key}
                size="sm"
                variant={settings?.plan === plan.key ? "primary" : "outline"}
                className="w-full justify-between text-[10px]"
                disabled={busy}
                onClick={() => checkout(plan.key)}
              >
                {plan.name} <span>{plan.price}</span>
              </Button>
            ))}
            {settings?.stripeCustomerId ? (
              <Button size="sm" variant="outline" className="w-full text-[10px]" onClick={portal}>
                Manage billing
              </Button>
            ) : null}
            <p className="text-[10px] text-faint">
              Stripe sandbox checkout. Webhooks update the workspace plan after payment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
