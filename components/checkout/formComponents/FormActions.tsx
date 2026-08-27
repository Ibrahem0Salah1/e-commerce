"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isPlacingOrder: boolean;
  isMerging: boolean;
  hasPendingMerge: boolean;
};

export function FormActions({
  isPlacingOrder,
  isMerging,
  hasPendingMerge,
}: Props) {
  return (
    <div>
      <Button
        type="submit"
        disabled={isPlacingOrder || isMerging || hasPendingMerge}
        className="w-full rounded-sm text-sm md:text-base px-4 py-5 md:py-6 font-semibold cursor-pointer"
      >
        {isPlacingOrder ? (
          <>
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
            Placing Order…
          </>
        ) : (
          <>Confirm Order</>
        )}
      </Button>

      {isMerging && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing your saved cart…
        </p>
      )}
      {!isMerging && hasPendingMerge && (
        <p className="mt-2 text-xs text-destructive">
          Some saved items aren&apos;t synced.{" "}
          <Link href="/cart" className="underline underline-offset-2">
            Review your cart
          </Link>{" "}
          to retry or discard them.
        </p>
      )}
    </div>
  );
}
