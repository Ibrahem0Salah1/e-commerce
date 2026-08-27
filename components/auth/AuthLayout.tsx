"use client";

import { ReactNode } from "react";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { useAuthUI, AuthUIProvider } from "@/components/auth/AuthUIProvider";

export function AuthLayout({
    header,
    formSlot,
    illustrationSlot,
    mobileBackgroundSlot,
}: {
    header?: ReactNode;
    formSlot: ReactNode;
    illustrationSlot: ReactNode;
    mobileBackgroundSlot?: ReactNode;
}) {
    return (
        <AuthUIProvider>
            <AuthLayoutInner
                header={header}
                formSlot={formSlot}
                illustrationSlot={illustrationSlot}
                mobileBackgroundSlot={mobileBackgroundSlot}
            />
        </AuthUIProvider>
    );
}

function AuthLayoutInner({
    header,
    formSlot,
    illustrationSlot,
    mobileBackgroundSlot,
}: {
    header?: ReactNode;
    formSlot: ReactNode;
    illustrationSlot: ReactNode;
    mobileBackgroundSlot?: ReactNode;
}) {
    const { isOAuthPending } = useAuthUI();

    // While OAuth redirect is pending — show ONLY the loader, nothing else
    if (isOAuthPending) {
        return (
            <main className="h-screen  flex items-center justify-center bg-background">
                <AuthLoading />
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-hidden bg-background flex flex-col lg:flex-row">
            {/* ───── LEFT — FORM ───── */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
                {mobileBackgroundSlot && (
                    <div className="lg:hidden absolute inset-0 bg-white overflow-hidden pointer-events-none">
                        {mobileBackgroundSlot}
                    </div>
                )}
                <div className="w-full max-w-sm relative z-10 lg:mt-0 mt-12">
                    {header}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        {formSlot}
                    </div>
                </div>
            </div>

            {/* ───── RIGHT — ILLUSTRATION (desktop only) ───── */}
            <div className="hidden lg:flex flex-1 bg-[#eaf1fc] items-center justify-center flex-col p-8 relative overflow-hidden">
                {illustrationSlot}
            </div>
        </main>
    );
}
