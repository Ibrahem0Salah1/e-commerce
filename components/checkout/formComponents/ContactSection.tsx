"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CheckoutFormFields } from "@/lib/validations";
import { SectionTitle, inputClass, errorText } from "../shared";

export function ContactSection({ disabled }: { disabled?: boolean }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutFormFields>();

  return (
    <section>
      <SectionTitle>Contact</SectionTitle>
      <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
        <div className="space-y-1 md:space-y-1.5">
          <Label htmlFor="shippingName" className="text-sm">
            Full Name
          </Label>
          <Input
            id="shippingName"
            placeholder="Dr. Ahmed Hassan"
            disabled={disabled}
            className={inputClass}
            {...register("shippingName")}
          />
          {errors.shippingName && (
            <p className={errorText}>{errors.shippingName.message}</p>
          )}
        </div>

        <div className="space-y-1 md:space-y-1.5">
          <Label htmlFor="shippingPhone" className="text-sm">
            Phone Number
          </Label>
          <Input
            id="shippingPhone"
            type="tel"
            placeholder="01012345678"
            disabled={disabled}
            className={inputClass}
            {...register("shippingPhone")}
          />
          {errors.shippingPhone && (
            <p className={errorText}>{errors.shippingPhone.message}</p>
          )}
        </div>
      </div>
    </section>
  );
}
