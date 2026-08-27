"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CheckoutFormFields } from "@/lib/validations";
import { SectionTitle, inputClass, errorText } from "../shared";

export function DeliverySection({ disabled }: { disabled?: boolean }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutFormFields>();

  return (
    <section>
      <SectionTitle>Delivery</SectionTitle>
      <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
        <div className="space-y-1 md:space-y-1.5">
          <Label htmlFor="shippingCity" className="text-sm">
            City / Governorate
          </Label>
          <Input
            id="shippingCity"
            placeholder="Cairo / Nasr City"
            disabled={disabled}
            className={inputClass}
            {...register("shippingCity")}
          />
          {errors.shippingCity && (
            <p className={errorText}>{errors.shippingCity.message}</p>
          )}
        </div>

        <div className="space-y-1 md:space-y-1.5">
          <Label htmlFor="shippingAddress" className="text-sm">
            Address
          </Label>
          <Input
            id="shippingAddress"
            placeholder="Building 12, Clinic 304, Al-Tayaran St."
            disabled={disabled}
            className={inputClass}
            {...register("shippingAddress")}
          />
          {errors.shippingAddress && (
            <p className={errorText}>{errors.shippingAddress.message}</p>
          )}
        </div>

        <div className="space-y-1 md:space-y-1.5">
          <Label htmlFor="shippingNotes" className="text-sm">
            Delivery Notes <span className="text-xs">(optional)</span>
          </Label>
          <Input
            id="shippingNotes"
            placeholder="Call before arrival, clinic closes at 8 PM"
            disabled={disabled}
            className={inputClass}
            {...register("shippingNotes")}
          />
          {errors.shippingNotes && (
            <p className={errorText}>{errors.shippingNotes.message}</p>
          )}
        </div>
      </div>
    </section>
  );
}
