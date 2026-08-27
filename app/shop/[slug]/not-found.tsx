import Link from "next/link";
import { PackageSearch, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/auth/memoBackground";

export default function ProductNotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="pointer-events-none absolute inset-0">
        <AnimatedBackground />
      </div>

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <PackageSearch className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground">Product not found</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          This product is no longer available, may have been removed, or was deactivated by the admin.
          <span className="block mt-1">Try browsing our catalog for similar supplies.</span>
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="gap-2">
            <Link href="/shop">
              <Search className="h-4 w-4" />
              Browse Catalog
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground/60">
          Error 404 — Product unavailable or inactive
        </p>
      </div>
    </div>
  );
}
