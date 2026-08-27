"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionTitle } from "../shared";

export function PaymentSection() {
  return (
    <section>
      <SectionTitle>Payment</SectionTitle>
      <div className="mt-3 md:mt-4 space-y-2">
        <RadioGroup value="cod" className="flex flex-col gap-2">
          {/* COD — auto-selected, active */}
          <label
            htmlFor="pay-cod"
            className="flex cursor-pointer items-center justify-between rounded-sm border border-primary bg-muted px-3 md:px-4 py-3"
          >
            <span className="flex items-center gap-2 md:gap-3">
              <RadioGroupItem value="cod" id="pay-cod" />
              <span className="text-sm md:text-[15px] font-medium text-foreground">Cash on Delivery (COD)</span>
            </span>
            <span className="hidden sm:inline text-xs md:text-sm text-muted-foreground">Pay when your order arrives</span>
            <span className="sm:hidden text-[11px] text-muted-foreground">Pay on arrival</span>
          </label>

          {/* Coming soon — disabled, muted, danger caption */}
          <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 md:px-4 py-3 opacity-60">
            <div className="flex items-center gap-2 md:gap-3">
              <RadioGroupItem value="card" id="pay-card" disabled />
              <span className="text-sm md:text-[15px] font-medium text-muted-foreground">Visa · Vodafone Cash · InstaPay</span>
            </div>
            <p className="mt-1.5 ml-7 text-xs font-medium text-accent-foreground">Coming soon</p>
          </div>
        </RadioGroup>
      </div>
    </section>
  );
}
