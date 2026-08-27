"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { useSession } from "@/lib/auth/client";
import { AuthUIProvider, useAuthUI } from "@/components/auth/AuthUIProvider";
import SignInForm from "@/components/auth/Client-login";
import SignUpForm from "@/components/auth/ClientSignup";

type AuthMode = "signin" | "signup";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where to land after a successful sign-in / sign-up / OAuth round-trip. */
  callbackUrl?: string;
};

/**
 * In-place authentication dialog containing both sign-in and sign-up flows
 * (email + Google OAuth). Closes itself as soon as an authenticated session
 * appears, so parents don't need to wire success callbacks.
 */
export function AuthModal({ open, onOpenChange, callbackUrl = "/" }: Props) {
  return (
    <AuthUIProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <AuthModalInner open={open} onOpenChange={onOpenChange} callbackUrl={callbackUrl} />
      </Dialog>
    </AuthUIProvider>
  );
}

function AuthModalInner({
  open,
  onOpenChange,
  callbackUrl,
}: Required<Props>) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const { isOAuthPending } = useAuthUI();
  const { data: session } = useSession();

  // Self-close once authenticated (email flows flip the session reactively;
  // Google flows land back on the page with a fresh session).
  const isAuthenticated = !!session?.user;
  useEffect(() => {
    if (open && isAuthenticated) {
      onOpenChange(false);
    }
  }, [open, isAuthenticated, onOpenChange]);

  const switchToSignIn = () => setMode("signin");
  const switchToSignUp = () => setMode("signup");

  return (
    <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
      {isOAuthPending ? (
        <div className="flex min-h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">Redirecting to Google…</p>
        </div>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle>
              {mode === "signin"
                ? "Sign in to continue"
                : "Create your account"}
            </DialogTitle>
            <DialogDescription>
              {mode === "signin"
                ? "Your cart will be waiting and synced once you're signed in."
                : "Join MDS to continue."}
            </DialogDescription>
          </DialogHeader>

          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
            {(
              [
                ["signin", "Sign In"],
                ["signup", "Sign Up"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={
                  value === "signin" ? switchToSignIn : switchToSignUp
                }
                className={cn(
                  "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={mode === value}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "signin" ? (
            <SignInForm
              key="signin"
              callbackUrl={callbackUrl}
              onSwitchToSignUp={switchToSignUp}
            />
          ) : (
            <SignUpForm
              key="signup"
              callbackUrl={callbackUrl}
              onSwitchToSignIn={switchToSignIn}
            />
          )}
        </>
      )}
    </DialogContent>
  );
}
