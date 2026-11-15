"use client";

import * as React from "react";
import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-xl px-6 py-10 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <CircleAlert className="size-5" />
      </div>
      <h1 className="mt-4 text-[17px] font-semibold tracking-[-0.02em]">
        This view could not be rendered
      </h1>
      <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-5 text-muted">
        The server component boundary caught an unexpected error. The rest of the workspace is
        still available — retry this segment or return to the overview.
      </p>
      {error instanceof Error && error.message ? (
        <p className="mx-auto mt-3 max-w-md rounded-md bg-sunken/70 px-3 py-2 font-mono text-[10px] text-muted">
          {error.message}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" onClick={() => retry()}>
          <RotateCcw />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to overview</Link>
        </Button>
      </div>
    </Card>
  );
}
