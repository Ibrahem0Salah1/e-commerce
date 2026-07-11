import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Access denied
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          You do not have permission to view this page.
        </h1>
        <p className="mt-3 text-muted-foreground">
          This area is reserved for MDS administrators.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
