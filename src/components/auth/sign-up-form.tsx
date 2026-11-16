"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const signup = await authClient.signUp.email({ name, email, password });
    if (signup.error) {
      setError(signup.error.message ?? "Could not create the account.");
      setLoading(false);
      return;
    }

    const created = await authClient.organization.create({
      name: organization,
      slug: `${slugify(organization) || "workspace"}-${Math.random().toString(36).slice(2, 7)}`,
    });
    if (created.error || !created.data) {
      setError(created.error?.message ?? "Account created, but the workspace failed.");
      setLoading(false);
      return;
    }

    await authClient.organization.setActive({ organizationId: created.data.id });
    router.push("/");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a workspace</CardTitle>
        <CardDescription>Your orders, materials and audit trail stay scoped to this organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Northwind Apparel"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-[11px] text-danger">{error}</p> : null}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create workspace"}
          </Button>
        </form>
        <p className="mt-4 text-[11px] text-muted">
          Already have an account? <Link className="text-brand underline" href="/sign-in">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
