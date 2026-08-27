import { Sidebar } from "@/components/admin/Sidebar";
import { requireAdmin } from "@/lib/auth/authz";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
