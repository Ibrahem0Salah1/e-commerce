"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AuthUIContextType = {
    isOAuthPending: boolean;
    setIsOAuthPending: (val: boolean) => void;
};

const AuthUIContext = createContext<AuthUIContextType | null>(null);

export function useAuthUI() {
    const ctx = useContext(AuthUIContext);
    if (!ctx) throw new Error("useAuthUI must be used within <AuthUIProvider>");
    return ctx;
}

/**
 * Standalone provider for the OAuth-pending UI state. Reusable outside the
 * auth pages — e.g. by <AuthModal> — so sign-in forms work anywhere.
 */
export function AuthUIProvider({ children }: { children: ReactNode }) {
    const [isOAuthPending, setIsOAuthPending] = useState(false);

    return (
        <AuthUIContext.Provider value={{ isOAuthPending, setIsOAuthPending }}>
            {children}
        </AuthUIContext.Provider>
    );
}
