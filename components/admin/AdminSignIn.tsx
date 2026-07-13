"use client"

import { authClient } from "@/lib/auth/client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signInSchema, otpSchema } from "@/lib/validations"
import type { OtpForm, SignInFormFields } from "@/lib/types"





export default function AdminSignIn({ callbackUrl = "/" }: { callbackUrl?: string }) {
    const [step, setStep] = useState<"credentials" | "otp">("credentials")
    const [error, setError] = useState<string | null>(null)
    const [otpSending, setOtpSending] = useState(false)
    const router = useRouter()
    const otpSent = useRef(false)

    // Send OTP automatically when transitioning to otp step
    useEffect(() => {
        if (step === "otp" && !otpSent.current) {
            otpSent.current = true
            setOtpSending(true)
            authClient.twoFactor.sendOtp().then(({ error }) => {
                setOtpSending(false)
                if (error) {
                    setError(error.message ?? "Failed to send verification code")
                }
            })
        }
    }, [step])

    const signInForm = useForm<SignInFormFields>({
        resolver: zodResolver(signInSchema),
        defaultValues: { email: "", password: "" },
    })

    const otpForm = useForm<OtpForm>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: "" },
    })

    const handleSignIn = async (values: SignInFormFields) => {
        setError(null)
        const { data, error } = await authClient.signIn.email({
            email: values.email,
            password: values.password,
        })

        if (error) {
            setError(error.message ?? "Invalid email or password")
            return
        }

        if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
            setStep("otp")
        } else {
            router.push(callbackUrl)
        }
    }

    const handleVerifyOtp = async (values: OtpForm) => {
        setError(null)
        const { data, error } = await authClient.twoFactor.verifyOtp({
            code: values.otp,
            trustDevice: true,
        })

        if (error) {
            setError(error.message ?? "Invalid verification code")
            return
        }

        if (data) {
            router.push(callbackUrl)
        }
    }

    const handleGoogleSignIn = () => {
        authClient.signIn.social({
            provider: "google",
            callbackURL: callbackUrl,
        })
    }

    if (step === "otp") {
        return (
            <div className="space-y-4">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Enter Verification Code</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {otpSending
                            ? "Sending verification code..."
                            : "Check your email for the security code"
                        }
                    </p>
                </div>

                <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="otp">Verification code</Label>
                        <Input
                            id="otp"
                            placeholder="123456"
                            maxLength={6}
                            autoFocus
                            disabled={otpSending}
                            {...otpForm.register("otp")}
                        />
                        {otpForm.formState.errors.otp && (
                            <p className="text-xs text-destructive">
                                {otpForm.formState.errors.otp.message}
                            </p>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={otpSending || otpForm.formState.isSubmitting}
                    >
                        {otpSending ? "Sending..." : otpForm.formState.isSubmitting ? "Verifying..." : "Verify"}
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-3">
                <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@yourapp.com"
                        autoComplete="email"
                        autoFocus
                        {...signInForm.register("email")}
                    />
                    {signInForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                            {signInForm.formState.errors.email.message}
                        </p>
                    )}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...signInForm.register("password")}
                    />
                    {signInForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                            {signInForm.formState.errors.password.message}
                        </p>
                    )}
                </div>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    disabled={signInForm.formState.isSubmitting}
                >
                    {signInForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
            >
                Sign In with Google
            </Button>
        </div>
    )
}
