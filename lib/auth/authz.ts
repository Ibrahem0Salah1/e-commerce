import { auth } from "@/lib/auth/server";
import { isAdminRole } from "@/lib/auth/roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSessionTwoFactorVerified } from "@/lib/auth/admin-2fa";

export const ADMIN_LOGIN_PATH = "/admin/login";
export const UNAUTHORIZED_PATH = "/unauthorized";
export const ADMIN_2FA_PATH = "/admin/verify-2fa";

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(options?: { redirectTo?: string }) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect(options?.redirectTo ?? "/auth/login");
  }
  return session;
}

export async function requireAdmin(options?: {
  loginPath?: string;
  unauthorizedPath?: string;
  callbackUrl?: string;
}) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect(options?.loginPath ?? ADMIN_LOGIN_PATH);
  }
  if (!isAdminRole(session.user.role)) {
    redirect(options?.unauthorizedPath ?? UNAUTHORIZED_PATH);
  }

  // Role alone isn't enough — this SESSION must have separately cleared
  // OTP, regardless of how it was created: password+OTP, Google from the
  // storefront, anything future. Checked per-session, not per-user.
  if (session.user.twoFactorEnabled) {
    const verified = await isSessionTwoFactorVerified(session.session.token);
    if (!verified) {
      const cb = options?.callbackUrl;
      redirect(cb ? `${ADMIN_2FA_PATH}?callbackUrl=${encodeURIComponent(cb)}` : ADMIN_2FA_PATH);
    }
  }

  return session as NonNullable<AuthSession>;
}

export async function userCanManageUsers(userId: string) {
  const result = await auth.api.userHasPermission({
    body: { userId, permissions: { user: ["list", "get", "update"] } },
  });
  return result.success;
}