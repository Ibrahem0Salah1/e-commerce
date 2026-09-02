import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/authz";
import { isAdminRole } from "@/lib/auth/roles";
import { isSessionTwoFactorVerified } from "@/lib/auth/admin-2fa";
import { AdminStepUpForm } from "@/components/admin/AdminStepUpForm";

export default async function AdminVerify2FAPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl?.startsWith("/admin") && !callbackUrl.startsWith("//") ? callbackUrl : "/admin";

  const session = await getCurrentSession();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(safeCallback)}`);
  }
  if (!session.user.twoFactorEnabled) {
    redirect(safeCallback); // nothing to verify — don't trap them here
  }
  if (await isSessionTwoFactorVerified(session.session.token)) {
    redirect(safeCallback); // already cleared it, e.g. hit page directly after verifying
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-xl font-semibold">Verify it's you</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This admin session hasn't completed two-factor verification yet. We&apos;ll email a code to{" "}
        {session.user.email}.
      </p>
      <AdminStepUpForm callbackUrl={safeCallback} />
    </div>
  );
}