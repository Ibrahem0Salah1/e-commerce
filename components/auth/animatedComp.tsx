import { memo } from "react";
import Image from "next/image";
function AnimatedComponent() {
    return (
        <div className="relative flex  w-full max-w-sm flex-col items-center justify-center">
            {/* decorative blobs — scoped to this box, not the whole screen */}
            <div className="absolute -top-20 -right-20 h-[300px] w-[300px] rounded-full bg-[#dce8fb] opacity-40" />
            <div className="absolute -bottom-15 -left-15 h-[200px] w-[200px] rounded-full bg-[#dce8fb] opacity-40" />

            <span className="relative z-10 mb-3 text-xs font-medium uppercase tracking-wider text-[#5b8de8]">
                Premium dental supplies
            </span>

            <svg
                width="280"
                height="300"
                viewBox="0 0 280 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 w-[280px] h-[300px]"
            >
                <circle cx="140" cy="155" r="90" fill="#dce8fb" opacity="0.5" />

                <g className="origin-[140px_155px] animate-spin-slow transform-gpu">
                    <circle cx="140" cy="65" r="4" fill="#a8c4f5" opacity="0.6" />
                    <circle cx="215" cy="110" r="3" fill="#5b8de8" opacity="0.5" />
                    <circle cx="215" cy="200" r="3" fill="#a8c4f5" opacity="0.5" />
                    <circle cx="140" cy="245" r="4" fill="#5b8de8" opacity="0.6" />
                    <circle cx="65" cy="200" r="3" fill="#a8c4f5" opacity="0.5" />
                    <circle cx="65" cy="110" r="3" fill="#5b8de8" opacity="0.5" />
                </g>

                <g className="animate-float3 transform-gpu">
                    <ellipse cx="140" cy="200" rx="50" ry="10" fill="#0048b5" opacity="0.12" />
                </g>

                <g className="animate-float transform-gpu drop-shadow-[0_8px_6px_rgba(0,72,181,0.2)]">
                    <path
                        d="M108 118 C108 104 114 96 122 96 C127 96 130.5 99 132 103 C133.5 99 137 96 142 96 C150 96 156 104 156 118 C156 134 146 148 140 157 C138 161 135 165 132 170 C129 165 126 161 124 157 C118 148 108 134 108 118Z"
                        fill="url(#toothGrad)"
                        stroke="#a8c4f5"
                        strokeWidth="1"
                    />
                    <defs>
                        <linearGradient id="toothGrad" x1="108" y1="96" x2="156" y2="170" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="60%" stopColor="#eaf1fc" />
                            <stop offset="100%" stopColor="#dce8fb" />
                        </linearGradient>
                    </defs>
                    <path d="M118 112 C118 107 121 104 124 104 C125.5 104 126.5 105 127 106.5" stroke="#a8c4f5" strokeWidth="1" fill="none" strokeLinecap="round" />
                    <ellipse cx="122" cy="109" rx="5" ry="3" fill="#eaf1fc" opacity="0.8" />
                    <line x1="108" y1="127" x2="156" y2="127" stroke="#a8c4f5" strokeWidth="0.5" strokeDasharray="3 3" />
                </g>

                <g className="origin-[85px_140px] animate-float2 transform-gpu">
                    <g transform="rotate(8deg)" className="origin-[85px_140px]">
                        <rect x="74" y="118" width="8" height="44" rx="4" fill="#0048b5" />
                        <rect x="70" y="114" width="16" height="8" rx="4" fill="#1f5fc7" />
                        <rect x="74" y="108" width="8" height="10" rx="3" fill="#0048b5" />
                        <ellipse cx="78" cy="165" rx="5" ry="3" fill="#0048b5" />
                    </g>
                </g>

                <g className="origin-[195px_130px] animate-float-delay transform-gpu">
                    <g transform="rotate(-15deg)" className="origin-[195px_130px]">
                        <rect x="190" y="108" width="6" height="40" rx="3" fill="#1f5fc7" />
                        <rect x="187" y="105" width="12" height="6" rx="3" fill="#5b8de8" />
                        <ellipse cx="193" cy="151" rx="4" ry="2.5" fill="#1f5fc7" />
                    </g>
                </g>

                <g className="animate-float3-delay transform-gpu">
                    <rect x="95" y="200" width="32" height="20" rx="5" fill="#0048b5" />
                    <rect x="95" y="200" width="32" height="8" rx="5" fill="#1f5fc7" />
                    <rect x="99" y="212" width="6" height="5" rx="1" fill="white" opacity="0.4" />
                    <rect x="109" y="212" width="6" height="5" rx="1" fill="white" opacity="0.4" />
                    <rect x="119" y="212" width="4" height="5" rx="1" fill="white" opacity="0.4" />
                    <text x="111" y="208" fontFamily="system-ui" fontSize="5" fill="white" textAnchor="middle" opacity="0.7">DENTAL</text>
                </g>

                <g className="animate-float2-delay transform-gpu">
                    <circle cx="175" cy="210" r="16" fill="#eaf1fc" stroke="#a8c4f5" strokeWidth="1" />
                    <path d="M168 210 L173 215 L182 205" stroke="#0048b5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                <circle
                    cx="140" cy="155" r="28" fill="none" stroke="#a8c4f5" strokeWidth="0.5" strokeDasharray="4 4"
                    className="origin-[140px_155px] animate-spin-slow-reverse transform-gpu"
                />
            </svg>

            <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-[#dce8fb] px-3 py-1 text-[11px] font-medium text-[#0048b5]">✓ 10,000+ products</span>
                <span className="rounded-full bg-[#dce8fb] px-3 py-1 text-[11px] font-medium text-[#0048b5]">✓ Authentic brands</span>
                <span className="rounded-full bg-[#dce8fb] px-3 py-1 text-[11px] font-medium text-[#0048b5]">✓ Fast delivery</span>
            </div>
        </div>
    );
}


export default memo(AnimatedComponent);

