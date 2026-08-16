"use client";

import { Sparkles, Truck, ShieldCheck, Tag, Award, Zap } from "lucide-react";

const tickerItems = [
  {
    icon: Truck,
    text: "Express Delivery to Dental Clinics Nationwide Across Egypt",
    badge: "FAST SHIPPING",
  },
  {
    icon: ShieldCheck,
    text: "100% Guaranteed Authentic Dental Materials & Equipment",
    badge: "VERIFIED SUPPLIES",
  },
  {
    icon: Tag,
    text: "Special Clinic & Practice Discounts on Bulk Orders",
    badge: "EXCLUSIVE OFFERS",
  },
  {
    icon: Award,
    text: "Official Brands: 3M, Dentsply Sirona, Woodpecker, Kerr & Kulzer",
    badge: "TOP BRANDS",
  },
  {
    icon: Zap,
    text: "Same-Day Dispatch for Emergency Endodontic & Surgical Supplies",
    badge: "SAME DAY",
  },
  {
    icon: Sparkles,
    text: "Premium Quality Composite, Restorative & Prosthodontic Range",
    badge: "DENTAL ESSENTIALS",
  },
];

export function SupplyTicker() {
  return (
    <div className="relative flex justify-center items-center  w-full overflow-hidden bg-liner-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20  sm:py-3 shadow-inner">
      <style>{`
        @keyframes ticker-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 35s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Gradient side overlays for smooth fade effect */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10 bg-liner-to-r from-background to-transparent opacity-90" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10 bg-liner-to-l from-background to-transparent opacity-90" />

      <div className="ticker-track">
        {/* Duplicated list creates a seamless infinite loop */}
        {[...tickerItems, ...tickerItems].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-2.5 px-6 py-6   whitespace-nowrap select-none"
            >
              <span className="inline-flex items-center text-xs sm:text-sm  text-md gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5  font-bold uppercase tracking-wider text-primary border border-primary/30">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {item.badge}
              </span>
              <span className="text-xs sm:text-sm lg:text-md font-medium text-foreground/90">
                {item.text}
              </span>
              <span className="ml-4 h-1.5 w-1.5 rounded-full bg-primary/40" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
