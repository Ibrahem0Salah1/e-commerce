
import SignUp from "@/components/auth/ClientSignup";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Image from "next/image";
import AnimatedComponent from "@/components/auth/animatedComp";
import AnimatedBackground from "@/components/auth/memoBackground";
//sinup page.tsx
export default function SignUpPage() {
    return (
        <AuthLayout
            formSlot={<SignUp />}
            illustrationSlot={<AnimatedComponent />}
            mobileBackgroundSlot={<AnimatedBackground />}
            header={
                <div className="text-center mb-6">
                    <div className="rounded-lg hidden lg:flex items-center justify-center mx-auto mb-3">
                        <Image src="/zz.svg" alt="MDS Logo" width={64} height={64} />
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Join MDS today
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create an account to get started with MDS
                    </p>
                </div>
            }
        />
    );
}