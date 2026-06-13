import Link from "next/link";
import { ShieldCheck, Truck, Banknote } from "lucide-react";
import { memo } from "react";
function Hero() {
    return (
        <section className="relative overflow-hidden bg-background">
            {/* Ambient background shapes */}
            <div className="absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-accent/60 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-[260px] w-[260px] rounded-full bg-accent/40 blur-2xl" />

            <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
                {/* ───────────── LEFT — COPY ───────────── */}
                <div className="relative z-10 text-center lg:text-left">
                    <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary">
                        Trusted by clinics across Egypt
                    </span>

                    <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                        Premium dental supplies,
                        <br />
                        <span className="text-primary">delivered to your clinic</span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
                        From orthodontic brackets to imaging sensors — source authentic,
                        quality-checked dental products with fast nationwide delivery and
                        cash on delivery available.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                        <Link
                            href="/shop"
                            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Shop all products
                        </Link>
                        <Link
                            href="/shop?category=equipment"
                            className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-card px-8 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                        >
                            Browse equipment
                        </Link>
                    </div>

                    {/* Inline trust indicators */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:justify-start">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            Authentic products
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Truck className="h-4 w-4 text-primary" />
                            Nationwide delivery
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Banknote className="h-4 w-4 text-primary" />
                            Cash on delivery
                        </div>
                    </div>
                </div>

                {/* ───────────── RIGHT — ILLUSTRATION ───────────── */}
                <div className="relative z-10 flex items-center justify-center">
                    <div className="relative flex w-full max-w-md flex-col items-center">
                        <div className="absolute -top-10 -right-6 h-[260px] w-[260px] rounded-full bg-accent opacity-60" />
                        <div className="absolute bottom-0 -left-10 h-[180px] w-[180px] rounded-full bg-accent opacity-40" />

                        <svg
                            viewBox="0 0 320 340"
                            className="relative z-10 h-auto w-full max-w-[320px]"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="160" cy="175" r="110" fill="var(--accent)" opacity="0.5" />

                            {/* orbiting dots */}
                            <g className="origin-[160px_175px] animate-spin-slow transform-gpu">
                                <circle cx="160" cy="65" r="5" fill="#a8c4f5" opacity="0.6" />
                                <circle cx="255" cy="120" r="4" fill="#5b8de8" opacity="0.5" />
                                <circle cx="255" cy="230" r="4" fill="#a8c4f5" opacity="0.5" />
                                <circle cx="160" cy="285" r="5" fill="#5b8de8" opacity="0.6" />
                                <circle cx="65" cy="230" r="4" fill="#a8c4f5" opacity="0.5" />
                                <circle cx="65" cy="120" r="4" fill="#5b8de8" opacity="0.5" />
                            </g>

                            {/* ground shadow */}
                            <g className="animate-float3 transform-gpu">
                                <ellipse cx="160" cy="232" rx="60" ry="12" fill="var(--primary)" opacity="0.12" />
                            </g>

                            {/* central molar */}
                            <g className="animate-float transform-gpu drop-shadow-[0_10px_8px_rgba(0,72,181,0.18)]">
                                <path
                                    d="M122 132
                     C122 110 132 96 146 96
                     C153 96 159 100 162 105
                     C165 100 171 96 178 96
                     C192 96 202 110 202 132
                     C202 154 188 174 178 188
                     C174 195 169 204 166 215
                     L166 232
                     C166 240 161 245 154 245
                     L150 245
                     C145 245 141 242 139 238
                     C137 242 133 245 128 245
                     L124 245
                     C117 245 112 240 112 232
                     L112 215
                     C109 204 104 195 100 188
                     C90 174 76 154 76 132"
                                    fill="url(#heroToothGrad)"
                                    stroke="#a8c4f5"
                                    strokeWidth="1.5"
                                    transform="translate(40 -10) scale(0.95)"
                                />
                                <defs>
                                    <linearGradient id="heroToothGrad" x1="76" y1="96" x2="202" y2="245" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="60%" stopColor="#eaf1fc" />
                                        <stop offset="100%" stopColor="#dce8fb" />
                                    </linearGradient>
                                </defs>
                                <ellipse cx="145" cy="115" rx="8" ry="4.5" fill="#eaf1fc" opacity="0.9" transform="translate(40 -10) scale(0.95)" />
                            </g>

                            {/* floating dental mirror */}
                            <g className="origin-[80px_150px] animate-float2 transform-gpu">
                                <g transform="rotate(10deg)" className="origin-[80px_150px]">
                                    <circle cx="80" cy="118" r="20" fill="#eaf1fc" stroke="#a8c4f5" strokeWidth="1.5" />
                                    <circle cx="80" cy="118" r="13" fill="#dce8fb" />
                                    <rect x="76" y="136" width="8" height="48" rx="4" fill="var(--primary)" />
                                </g>
                            </g>

                            {/* floating syringe / instrument */}
                            <g className="origin-[245px_150px] animate-float-delay transform-gpu">
                                <g transform="rotate(-12deg)" className="origin-[245px_150px]">
                                    <rect x="232" y="120" width="10" height="56" rx="4" fill="#1f5fc7" />
                                    <rect x="228" y="114" width="18" height="10" rx="4" fill="#5b8de8" />
                                    <ellipse cx="237" cy="182" rx="6" ry="3.5" fill="#1f5fc7" />
                                </g>
                            </g>

                            {/* floating product box */}
                            <g className="animate-float3-delay transform-gpu">
                                <rect x="112" y="232" width="40" height="26" rx="6" fill="var(--primary)" />
                                <rect x="112" y="232" width="40" height="10" rx="6" fill="#1f5fc7" />
                                <text x="132" y="250" fontFamily="system-ui" fontSize="6" fill="white" textAnchor="middle" opacity="0.75">
                                    DENTAL
                                </text>
                            </g>

                            {/* floating checkmark badge */}
                            <g className="animate-float2-delay transform-gpu">
                                <circle cx="208" cy="252" r="19" fill="#eaf1fc" stroke="#a8c4f5" strokeWidth="1.5" />
                                <path d="M199 252 L206 259 L218 245" stroke="var(--primary)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </g>

                            {/* dashed orbit ring */}
                            <circle
                                cx="160" cy="175" r="34" fill="none" stroke="#a8c4f5" strokeWidth="0.75" strokeDasharray="5 5"
                                className="origin-[160px_175px] animate-spin-slow-reverse transform-gpu"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(Hero);