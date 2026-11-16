"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("demo@weft.local");
  const [password, setPassword] = React.useState("demo1234");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? "Could not sign in.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your workspace account, or the seeded demo account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-[11px] text-danger">{error}</p> : null}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-[11px] text-muted">
          No account? <Link className="text-brand underline" href="/sign-up">Create a workspace</Link>
        </p>
      </CardContent>
    </Card>
  );
}
