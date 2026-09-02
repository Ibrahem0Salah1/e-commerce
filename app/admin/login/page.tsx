import AdminSignIn from "@/components/admin/AdminSignIn";
import { AuthLayout } from "@/components/auth/AuthLayout";
import AnimatedComponent from "@/components/auth/animatedComp";
import AnimatedBackground from "@/components/auth/memoBackground";
import Image from "next/image";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  // Strip sensitive query params if present (e.g. ?email=&password= leak from old builds / browser history)
  if (params.email || params.password) {
    const { redirect } = await import("next/navigation");
    const clean = params.callbackUrl ? `/admin/login?callbackUrl=${encodeURIComponent(params.callbackUrl)}` : "/admin/login";
    redirect(clean);
  }
  const callbackUrl =
    params.callbackUrl?.startsWith("/admin") && !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : "/admin";

  return (
    <AuthLayout
      formSlot={<AdminSignIn callbackUrl={callbackUrl} hideSocial={true} />}
      illustrationSlot={<AnimatedComponent />}
      mobileBackgroundSlot={<AnimatedBackground />}
      header={
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 hidden items-center justify-center rounded-lg lg:flex">
            <Image src="/zz.svg" alt="MDS Logo" width={64} height={64} />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Secure access for operations and CRM management
          </p>
        </div>
      }
    />
  );
}
