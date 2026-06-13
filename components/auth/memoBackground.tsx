import { memo } from "react";
import Image from "next/image";
function AnimatedBackground() {
    return (
        <>
            {/* Center Glow */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-96 w-96 md:h-[550px] md:w-[550px] rounded-full bg-blue-500/10 blur-3xl" />
            </div>

            {/* Huge watermark logo */}
            <div className="absolute inset-0 flex items-center justify-center">
                <Image
                    src="/zz.svg"
                    alt=""
                    width={700}
                    height={700}
                    className="
        opacity-[0.025]
        animate-float-delay
        w-[350px]
        md:w-[550px]
      "
                />
            </div>

            {/* Top Left Logo */}
            <div className="absolute top-[5%] md:top-[12%] left-[12%] opacity-[0.2] animate-float-delay  ">
                <Image
                    src="/zz.svg"
                    alt=""
                    width={140}
                    height={140}
                />
            </div>

            {/* Top Right Logo */}
            <div className="absolute md:top-[15%] top-[0%] right-[10%]  animate-float-delay opacity-[0.2]">
                <Image
                    src="/zz.svg"
                    alt=""
                    width={140}
                    height={140}
                />
            </div>

            {/* Bottom Center Logo */}
            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 opacity-[0.04] animate-float hidden md:block">
                <Image
                    src="/zz.svg"
                    alt=""
                    width={220}
                    height={220}
                />
            </div>

            {/* Floating Rings */}
            <div className="absolute top-32 right-24 animate-spin-slow">
                <div className="h-20 w-20 rounded-full border border-blue-200" />
            </div>
            <div className="absolute -top-6 left-16 md:hidden animate-float-delay">
                <div className="h-20 w-20 rounded-full border border-blue-200" />
            </div>
            <div className="absolute bottom-32 left-16 animate-spin-slow">
                <div className="h-16 w-16 rounded-full border border-blue-200" />
            </div>

            <div className="absolute top-1/2 right-8 animate-spin-slow hidden md:block">
                <div className="h-24 w-24 rounded-full border border-blue-100" />
            </div>

            <div className="absolute top-1/3 left-4 animate-spin-slow hidden md:block">
                <div className="h-12 w-12 rounded-full border border-blue-200" />
            </div>
            <div className="absolute top-1/4 left-18 animate-spin-slow hidden md:block">
                <div className="h-12 w-12 rounded-full border border-blue-200" />
            </div>
            <div className="absolute top-1/4 left-128 animate-spin-slow hidden md:block">
                <div className="h-12 w-12 rounded-full border border-blue-200" />
            </div>
            {/* Floating Particles */}

            <div className="absolute top-[15%] left-[20%] animate-float">
                <div className="h-3 w-3 rounded-full bg-blue-400/60" />
            </div>

            <div className="absolute top-[20%] md:top-[25%] right-[18%] animate-float-delay">
                <div className="h-4 w-4 rounded-full bg-blue-500/60" />
            </div>

            <div className="absolute top-[45%] left-[8%] animate-float">
                <div className="h-2 w-2 rounded-full bg-blue-300/70" />
            </div>

            <div className="absolute top-[55%] right-[10%] animate-float-delay">
                <div className="h-3 w-3 rounded-full bg-blue-400/60" />
            </div>

            <div className="absolute bottom-[25%] left-[18%] animate-float">
                <div className="h-4 w-4 rounded-full bg-blue-500/50" />
            </div>

            <div className="absolute bottom-[15%] right-[20%] animate-float-delay">
                <div className="h-3 w-3 rounded-full bg-blue-300/70" />
            </div>

            <div className="absolute top-[35%] left-[50%] animate-float">
                <div className="h-2 w-2 rounded-full bg-blue-500/50" />
            </div>

            <div className="absolute bottom-[35%] right-[40%] animate-float-delay">
                <div className="h-3 w-3 rounded-full bg-blue-400/60" />
            </div>
        </>
    )
}

export default memo(AnimatedBackground);