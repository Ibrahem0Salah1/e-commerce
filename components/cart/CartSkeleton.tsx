"use client";

import { Loader2 } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-md ${className}`} />;
}

type Props = {
  isMerging?: boolean;
};

export function CartSkeleton({ isMerging = false }: Props) {
  const label = isMerging ? "Syncing your saved items…" : "Loading your cart…";

  return (
    <div className="min-h-screen bg-background">
      {/* Header — border-b like cart page */}
      <div className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-6 w-48" />
          <div className="mt-1.5 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <Skeleton className="h-4 w-64" />
            <span className="sr-only">{label}</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">{label}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* LEFT: items */}
          <div className="lg:col-span-3 px-4 sm:px-6 lg:pl-24 xl:pl-36 lg:pr-12 py-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>

              <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-zinc-100">
                <Skeleton className="col-span-6 h-3 w-24" />
                <Skeleton className="col-span-2 h-3 w-16 mx-auto" />
                <Skeleton className="col-span-2 h-3 w-12 mx-auto" />
                <Skeleton className="col-span-2 h-3 w-12 ml-auto" />
              </div>

              <div className="divide-y divide-zinc-100">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col md:grid md:grid-cols-12 md:gap-4 items-start md:items-center py-5 gap-4"
                  >
                    <div className="col-span-6 flex items-start gap-4 w-full">
                      <Skeleton className="w-24 h-24 shrink-0 rounded-sm" />
                      <div className="flex flex-col grow min-w-0 gap-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="mt-2 h-3 w-16" />
                      </div>
                    </div>
                    <div className="col-span-2 w-full md:w-auto mt-2 md:mt-0 flex justify-between md:block items-center">
                      <Skeleton className="h-3 w-10 md:hidden" />
                      <Skeleton className="h-4 w-20 md:mx-auto" />
                    </div>
                    <div className="col-span-2 flex justify-center w-full md:w-auto mt-2 md:mt-0">
                      <div className="flex items-center border border-zinc-200 rounded-sm h-8 overflow-hidden bg-white">
                        <Skeleton className="w-8 h-full rounded-none" />
                        <Skeleton className="w-12 h-full rounded-none border-x border-zinc-100" />
                        <Skeleton className="w-8 h-full rounded-none" />
                      </div>
                    </div>
                    <div className="col-span-2 w-full md:w-auto mt-2 md:mt-0 flex justify-between md:block items-center">
                      <Skeleton className="h-3 w-12 md:hidden" />
                      <Skeleton className="h-4 w-20 md:ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: summary — bg-zinc-100 like checkout */}
          <aside className="lg:col-span-2 px-4 sm:px-6 lg:px-12 py-10 bg-zinc-100">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div>
                <Skeleton className="h-3 w-32" />
                <div className="mt-5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
                <div className="mt-5 flex justify-between items-center border-t border-zinc-200 pt-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-sm" />
                <Skeleton className="h-9 w-full rounded-sm bg-white" />
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-3">
                {[1, 2].map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-sm shrink-0 bg-white" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 rounded-sm bg-white px-4 py-4">
                <Skeleton className="h-5 w-5 rounded-sm shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
