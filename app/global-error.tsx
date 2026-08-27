"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import AnimatedBackground from "@/components/auth/memoBackground";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
          <div className="pointer-events-none absolute inset-0">
            <AnimatedBackground />
          </div>
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Critical error</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => reset()}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
