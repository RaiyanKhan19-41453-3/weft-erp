"use client";

import * as React from "react";

export function ErrorReporter() {
  React.useEffect(() => {
    const send = (payload: { message: string; stack?: string; url: string }) => {
      void fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      send({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      send({
        message: String(event.reason),
        url: window.location.href,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
