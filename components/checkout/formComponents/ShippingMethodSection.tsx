"use client";

import { Controller, useFormContext } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatNumber } from "@/lib/utils/format";
import type { ShippingMethodOption } from "@/lib/orders/types";
import type { CheckoutFormFields } from "@/lib/validations";
import { SectionTitle, errorText } from "../shared";

export function ShippingMethodSection({
  shippingMethods,
}: {
  shippingMethods: ShippingMethodOption[];
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<CheckoutFormFields>();

  return (
    <section>
      <SectionTitle>Shipping Method</SectionTitle>
      <div className="mt-3 md:mt-4">
        {shippingMethods.length === 0 ? (
          <p className="text-xs md:text-sm text-destructive">
            No shipping methods available right now. Please contact support.
          </p>
        ) : (
          <Controller
            control={control}
            name="shippingMethodId"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex flex-col gap-1.5 md:gap-2"
              >
                {shippingMethods.map((method) => {
                  const isSelected = field.value === method.id;
                  return (
                    <label
                      key={method.id}
                      htmlFor={`method-${method.id}`}
                      className={`flex cursor-pointer items-center justify-between rounded-sm px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-[15px] transition-colors ${
                        isSelected ? "bg-muted" : "hover:bg-muted/60"
                      }`}
                    >
                      <span className="flex items-center gap-2 md:gap-3">
                        <RadioGroupItem id={`method-${method.id}`} value={method.id} />
                        <span className="font-medium text-foreground">{method.name}</span>
                      </span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatNumber(method.price)} EGP
                      </span>
                    </label>
                  );
                })}
              </RadioGroup>
            )}
          />
        )}
        {errors.shippingMethodId && (
          <p className={errorText}>{errors.shippingMethodId.message}</p>
        )}
      </div>
    </section>
  );
}
