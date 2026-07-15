export function ProductsSkeleton() {
    return (
        <div className="relative space-y-4">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                        <div className="skeleton-shimmer aspect-4/3" />
                        <div className="space-y-3 p-4">
                            <div className="skeleton-shimmer h-3.5 w-full rounded" />
                            <div className="skeleton-shimmer h-3.5 w-3/5 rounded" />
                            <div className="flex items-center justify-between pt-2">
                                <div className="skeleton-shimmer h-4 w-16 rounded" />
                                <div className="skeleton-shimmer h-8 w-20 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
