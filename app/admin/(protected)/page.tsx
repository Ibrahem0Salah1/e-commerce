import { requireAdmin } from "@/lib/auth/authz";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <section className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Operations
      </p>
      <h1 className="text-3xl font-semibold text-foreground">
        Welcome, {session.user.name}
      </h1>
      <p className="max-w-2xl text-muted-foreground">
        Your admin authentication and authorization layer is active. Product,
        order, customer, and support tools can now be mounted under this
        protected route group.
      </p>
    </section>
  );
}
