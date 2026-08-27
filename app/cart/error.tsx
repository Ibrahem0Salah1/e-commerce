"use client";

import { useEffect } from "react";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/auth/memoBackground";

export default function CartError({
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
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <AnimatedBackground />
      </div>
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Couldn’t load your cart</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "We couldn’t retrieve your cart items. Please try again."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
        )}
        <Button onClick={() => reset()} className="mt-6 gap-2">
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      </div>
    </div>
  );
}
