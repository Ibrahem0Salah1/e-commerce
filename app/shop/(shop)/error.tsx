// error.tsx next to your shop page
"use client";
import { Button } from "@/components/ui/button";
export default function ShopError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted-foreground">Failed to load products</p>
            <Button onClick={reset}>Try again</Button>
        </div>
    );
}