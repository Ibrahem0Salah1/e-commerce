import { ArrowLeft } from "lucide-react";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex size-8 items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <div className="h-6 w-44 animate-pulse rounded-md bg-muted sm:h-7" />
          <div className="mt-1.5 h-4 w-20 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="size-20 shrink-0 animate-pulse rounded-lg bg-muted sm:size-24" />
              <div className="flex flex-1 flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <div className="size-7 animate-pulse rounded-md bg-muted" />
                    <div className="h-7 w-10 animate-pulse rounded-md bg-muted" />
                    <div className="size-7 animate-pulse rounded-md bg-muted" />
                  </div>
                  <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </section>

        <aside>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="my-4 h-px bg-border" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-5 h-9 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </aside>
      </div>
    </div>
  );
}
