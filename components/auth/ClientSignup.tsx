"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/lib/validations";
import type { SignUpFormFields } from "@/lib/types";
import { authClient, signUp, signIn } from "@/lib/auth/client";
import { mapAuthError } from "@/lib/auth/client-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthUI } from "@/components/auth/AuthUIProvider";
import { GoogleIcon } from "@/components/auth/Client-login";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm as useFormOtp } from "react-hook-form";
import { zodResolver as zodOtpResolver } from "@hookform/resolvers/zod";
import { otpSchema } from "@/lib/validations";
import type { OtpForm } from "@/lib/types";

type SignUpProps = {
    callbackUrl?: string;
    /** Provided by <AuthModal> to switch modes in place instead of navigating. */
    onSwitchToSignIn?: () => void;
};

export default function SignUp({
    callbackUrl = "/",
    onSwitchToSignIn,
}: SignUpProps) {
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
    } = useForm<SignUpFormFields>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const otpForm = useFormOtp<OtpForm>({
        resolver: zodOtpResolver(otpSchema),
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
        if (step === "form") otpSent.current = false;
    }, [step]);

    const onSubmit: SubmitHandler<SignUpFormFields> = async (data) => {
        const { data: result, error } = await signUp.email({
            name: data.name,
            email: data.email,
            password: data.password,
        });

        if (error) {
            setError("root", { message: mapAuthError(error, "signup") });
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
                setError("root", { message: mapAuthError(error, "signup") });
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
                        <Label htmlFor="otp-signup">Verification code</Label>
                        <Input
                            id="otp-signup"
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
                        Back
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className="w-full space-y-5">
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-sm font-medium text-[var(--foreground)]">
                        Full name
                    </Label>
                    <Input
                        id="signup-name"
                        type="text"
                        placeholder="Ahmed Hassan"
                        autoComplete="name"
                        className="h-11 bg-[var(--input)] border-[var(--border)] focus-visible:ring-[var(--ring)]"
                        {...register("name")}
                    />
                    {errors.name && (
                        <p className="text-xs text-[var(--destructive)]">{errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-[var(--foreground)]">
                        Email
                    </Label>
                    <Input
                        id="signup-email"
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
                    <Label htmlFor="signup-password" className="text-sm font-medium text-[var(--foreground)]">
                        Password
                    </Label>
                    <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-11 bg-[var(--input)] border-[var(--border)] focus-visible:ring-[var(--ring)]"
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
                    )}
                    <p className="text-xs text-[var(--muted-foreground)]">
                        Min 8 characters, one uppercase, one number
                    </p>
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
                            <Spinner /> Creating account...
                        </span>
                    ) : (
                        "Agree & Join"
                    )}
                </Button>

                <p className="text-xs text-center text-[var(--muted-foreground)]">
                    By clicking Agree & Join, you agree to MDS&apos;s Terms of Service.
                </p>
            </form>

            <p className="text-center text-sm text-[var(--muted-foreground)]">
                Already on MDS?{" "}
                {onSwitchToSignIn ? (
                    <button
                        type="button"
                        onClick={onSwitchToSignIn}
                        className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline"
                    >
                        Sign in
                    </button>
                ) : (
                    <Link
                        href="/auth/login"
                        className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline"
                    >
                        Sign in
                    </Link>
                )}
            </p>
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
