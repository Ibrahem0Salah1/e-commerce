"use client";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-md ${className}`} />;
}

export function CheckoutSkeleton() {
  return (
    <>
      {/* Mobile dropdown skeleton — bg-accent */}
      <div className="lg:hidden bg-accent border-y border-zinc-200 px-4 md:px-6 py-3 flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
      {/* LEFT: form skeleton — mirrors CheckoutForm */}
      <div className="space-y-6 md:space-y-8 lg:space-y-10 lg:col-span-3 px-4 md:px-6 lg:px-12 xl:px-36 py-8 md:py-10 lg:py-24">
        {/* Contact */}
        <section>
          <Skeleton className="h-5 md:h-6 w-28 md:w-32" />
          <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-1.5 md:space-y-2">
                <Skeleton className="h-3 md:h-4 w-24 md:w-28" />
                <Skeleton className="h-10 md:h-11 w-full rounded-sm" />
              </div>
            ))}
          </div>
        </section>

        {/* Delivery */}
        <section>
          <Skeleton className="h-5 md:h-6 w-24 md:w-28" />
          <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5 md:space-y-2">
                <Skeleton className="h-3 md:h-4 w-28 md:w-36" />
                <Skeleton className="h-10 md:h-11 w-full rounded-sm" />
              </div>
            ))}
          </div>
        </section>

        {/* Shipping Method */}
        <section>
          <Skeleton className="h-5 md:h-6 w-32 md:w-44" />
          <div className="mt-3 md:mt-4 flex flex-col gap-1.5 md:gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-sm bg-muted/40 px-3 md:px-4 py-2.5 md:py-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <Skeleton className="h-3 w-3 md:h-4 md:w-4 rounded-full" />
                  <Skeleton className="h-3 md:h-4 w-24 md:w-32" />
                </div>
                <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
              </div>
            ))}
          </div>
        </section>

        {/* Payment */}
        <section>
          <Skeleton className="h-5 md:h-6 w-24 md:w-28" />
          <div className="mt-3 md:mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-sm border border-primary bg-muted px-3 md:px-4 py-3">
              <div className="flex items-center gap-2 md:gap-3">
                <Skeleton className="h-3 w-3 md:h-4 md:w-4 rounded-full" />
                <Skeleton className="h-3 md:h-4 w-28 md:w-36" />
              </div>
              <Skeleton className="h-3 w-20 md:w-28 hidden sm:block" />
            </div>
            <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 md:px-4 py-3 opacity-60">
              <div className="flex items-center gap-2 md:gap-3">
                <Skeleton className="h-3 w-3 md:h-4 md:w-4 rounded-full" />
                <Skeleton className="h-3 md:h-4 w-40 md:w-56" />
              </div>
              <Skeleton className="mt-2 ml-7 h-3 w-20 md:w-24" />
            </div>
          </div>
        </section>

        {/* FormActions */}
        <div>
          <Skeleton className="h-11 md:h-[52px] w-full rounded-sm" />
          <Skeleton className="mt-2 md:mt-3 h-3 w-48 md:w-64" />
        </div>
      </div>

      {/* RIGHT: summary skeleton — hidden on mobile, dropdown handles it */}
      <aside className="hidden lg:block lg:col-span-2 px-4 md:px-6 lg:px-12 py-8 md:py-10 lg:py-24 bg-zinc-100">
        <div className="lg:sticky lg:top-24">
          <Skeleton className="h-3 w-28 md:w-32" />
          <div className="mt-4 md:mt-5 space-y-3 md:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 md:gap-3">
                <Skeleton className="size-12 md:size-14 rounded-sm shrink-0" />
                <div className="flex-1 space-y-1.5 md:space-y-2">
                  <Skeleton className="h-3 md:h-4 w-3/4" />
                  <Skeleton className="h-3 w-16 md:w-20" />
                </div>
                <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
              </div>
            ))}
          </div>
          <div className="mt-5 md:mt-6 space-y-2 md:space-y-3 border-t border-transparent pt-4 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
              <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
              <Skeleton className="h-3 md:h-4 w-12 md:w-16" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 md:h-5 w-12 md:w-16" />
              <Skeleton className="h-4 md:h-5 w-24 md:w-28" />
            </div>
          </div>
        </div>
      </aside>
      </div>
    </>
  );
}
