"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, otpSchema } from "@/lib/validations";
import type { SignInFormFields, OtpForm } from "@/lib/types";
import { authClient, signIn } from "@/lib/auth/client";
import { mapAuthError } from "@/lib/auth/client-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthUI } from "@/components/auth/AuthUIProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SignInProps = {
    callbackUrl?: string;
    /** Provided by <AuthModal> to switch modes in place instead of navigating. */
    onSwitchToSignUp?: () => void;
};

export default function SignIn({
    callbackUrl = "/",
    onSwitchToSignUp,
}: SignInProps) {
    const router = useRouter();
    const { setIsOAuthPending } = useAuthUI();
    const [step, setStep] = useState<"form" | "otp">("form");
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpSending, setOtpSending] = useState(false);
    const otpSent = useRef(false);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormFields>({
        resolver: zodResolver(signInSchema),
        defaultValues: { email: "", password: "" },
    });

    const otpForm = useForm<OtpForm>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: "" },
    });

    useEffect(() => {
        if (step === "otp" && !otpSent.current) {
            otpSent.current = true;
            setOtpSending(true);
            authClient.twoFactor.sendOtp().then(({ error }) => {
                setOtpSending(false);
                if (error) setOtpError(error.message ?? "Failed to send code");
            });
        }
        if (step === "form") {
            otpSent.current = false;
        }
    }, [step]);

    const onSubmit: SubmitHandler<SignInFormFields> = async (data) => {
        const { data: result, error } = await signIn.email({
            email: data.email,
            password: data.password,
        });

        if (error) {
            setError("root", { message: mapAuthError(error, "signin") });
            return;
        }

        if ((result as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
            setStep("otp");
            return;
        }

        router.push(callbackUrl);
        router.refresh();
    };

    const handleOAuth = async (provider: "google") => {
        setIsOAuthPending(true);
        setOtpError(null);
        try {
            const { data, error } = await signIn.social({
                provider,
                callbackURL: callbackUrl,
            });
            if (error) {
                setIsOAuthPending(false);
                setError("root", { message: mapAuthError(error, "signin") });
                return;
            }
            if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
                setIsOAuthPending(false);
                setStep("otp");
                return;
            }
        } catch {
            setIsOAuthPending(false);
        }
    };

    const handleVerifyOtp = async (values: OtpForm) => {
        setOtpError(null);
        const { error } = await authClient.twoFactor.verifyOtp({
            code: values.otp,
            trustDevice: true,
        });
        if (error) {
            setOtpError(error.message ?? "Invalid code");
            return;
        }
        router.push(callbackUrl);
        router.refresh();
    };

    if (step === "otp") {
        return (
            <div className="w-full space-y-4">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Enter Verification Code</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {otpSending ? "Sending code..." : "Check your email for the security code"}
                    </p>
                </div>
                <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="otp-signin">Verification code</Label>
                        <Input
                            id="otp-signin"
                            placeholder="123456"
                            maxLength={6}
                            autoFocus
                            disabled={otpSending}
                            {...otpForm.register("otp")}
                        />
                        {otpForm.formState.errors.otp && (
                            <p className="text-xs text-destructive">{otpForm.formState.errors.otp.message}</p>
                        )}
                    </div>
                    {otpError && <p className="text-sm text-destructive">{otpError}</p>}
                    <Button type="submit" className="w-full h-11" disabled={otpSending || otpForm.formState.isSubmitting}>
                        {otpSending ? "Sending..." : otpForm.formState.isSubmitting ? "Verifying..." : "Verify"}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")}>
                        Back to sign in
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className="w-full space-y-5">
            {/* OAuth buttons */}
            <div className="space-y-3">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] font-medium h-11"
                    onClick={() => handleOAuth("google")}
                >
                    <GoogleIcon />
                    Continue with Google
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <Separator className="flex-1 bg-[var(--border)]" />
                <span className="text-xs text-[var(--muted-foreground)] font-medium">or</span>
                <Separator className="flex-1 bg-[var(--border)]" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                    <Label
                        htmlFor="signin-email"
                        className="text-sm font-medium text-[var(--foreground)]"
                    >
                        Email
                    </Label>
                    <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="h-11 bg-[var(--input)] border-[var(--border)] focus-visible:ring-[var(--ring)]"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="signin-password"
                            className="text-sm font-medium text-[var(--foreground)]"
                        >
                            Password
                        </Label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-11 bg-[var(--input)] border-[var(--border)] focus-visible:ring-[var(--ring)]"
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
                    )}
                </div>

                {errors.root && (
                    <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2.5">
                        <p className="text-xs text-[var(--destructive)]">{errors.root.message}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-primary hover:bg-accent-foreground text-white font-semibold text-sm"
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Spinner /> Signing in...
                        </span>
                    ) : (
                        "Sign in"
                    )}
                </Button>
            </form>
        </div>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

export function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}
