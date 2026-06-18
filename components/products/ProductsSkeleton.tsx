

export function ProductsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-lg border border-border bg-muted p-4">
                    <div className="h-40 bg-muted rounded mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                </div>
            ))}
        </div>
    );
}