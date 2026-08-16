"use client";

import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

export function PendingMergeBanner() {
  const {
    hasPendingMerge,
    pendingGuestItems,
    isMerging,
    retryPendingMerge,
    discardPendingGuestItems,
  } = useCart();

  if (!hasPendingMerge) return null;

  const count = pendingGuestItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900">
            {pendingGuestItems.length} item{pendingGuestItems.length === 1 ? "" : "s"}{" "}
            ({count}) couldn&apos;t be synced to your account.
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            They are still saved on this device. You can try syncing again or
            remove them.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={retryPendingMerge}
          disabled={isMerging}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isMerging ? "animate-spin" : ""}`} />
          {isMerging ? "Syncing…" : "Try again"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={discardPendingGuestItems}
          disabled={isMerging}
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </Button>
      </div>
    </div>
  );
}
