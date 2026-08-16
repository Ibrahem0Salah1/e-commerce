"use client";

import { useFormContext } from "react-hook-form";
import type { AddProductForm } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, MapPin } from "lucide-react";

export function PricingInventorySection() {
  const { register, formState } = useFormContext<AddProductForm>();
  const errors = formState.errors;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <SectionTitle icon={DollarSign} label="2. Pricing & Inventory" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (EGP)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min={0}
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price?.message && (
            <p className="mt-1 text-xs text-destructive">
              {errors.price.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            step="1"
            min={0}
            {...register("stock", { valueAsNumber: true })}
          />
          {errors.stock?.message && (
            <p className="mt-1 text-xs text-destructive">
              {errors.stock.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} placeholder="Optional" />
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="madeIn" className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          Made In
        </Label>
        <Input
          id="madeIn"
          {...register("madeIn")}
          placeholder="e.g. Germany"
        />
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </div>
    </div>
  );
}