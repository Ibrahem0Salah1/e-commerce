"use client";

import { useFormContext } from "react-hook-form";
import type { AddProductForm, EditProductForm } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, MapPin, Info } from "lucide-react";

type Props = {
  variant?: "create" | "edit";
  readOnlyPricing?: {
    price: number;
    stock: number;
    costPrice: number | null;
    marginPercent: number | null;
  } | null;
};

export function PricingInventorySection({ variant = "create", readOnlyPricing }: Props) {
  const { register } = useFormContext<AddProductForm | EditProductForm>();

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <SectionTitle icon={DollarSign} label="2. Pricing & Inventory" />

      {variant === "create" ? (
        <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Price and stock are not set here. New products are created as <strong>inactive with 0 stock</strong>. Use <strong>Restock → New Purchase Invoice</strong> to set cost price, margin and quantity — the selling price is calculated automatically as <code>cost × (1 + margin%)</code> and the product is auto-activated on first restock.
          </span>
        </div>
      ) : readOnlyPricing ? (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Selling Price</div>
            <div className="font-medium">{readOnlyPricing.price} EGP</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Stock</div>
            <div className="font-medium">{readOnlyPricing.stock}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Cost Price</div>
            <div className="font-medium">
              {readOnlyPricing.costPrice !== null ? `${readOnlyPricing.costPrice} EGP` : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Margin</div>
            <div className="font-medium">
              {readOnlyPricing.marginPercent !== null ? `${readOnlyPricing.marginPercent}%` : "—"}
            </div>
          </div>
          <p className="col-span-full mt-1 flex gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Pricing is managed only via restock invoices. Edit cost/margin by creating a new invoice line for this product.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} placeholder="Optional" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="madeIn" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Made In
          </Label>
          <Input id="madeIn" {...register("madeIn")} placeholder="e.g. Germany" />
        </div>
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