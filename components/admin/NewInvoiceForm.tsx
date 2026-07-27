"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createPurchaseInvoiceFormSchema,
  type PurchaseInvoiceForm,
} from "@/lib/validations";
import { createPurchaseInvoiceAndInvalidate } from "@/lib/restock/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Loader2 } from "lucide-react";

type ProductOption = {
  id: string;
  name: string;
  stock: number | null;
  // images: string[];
};

export function NewInvoiceForm({ products }: { products: ProductOption[] }) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PurchaseInvoiceForm>({
    resolver: zodResolver(createPurchaseInvoiceFormSchema),
    defaultValues: {
      supplierName: "",
      invoiceNumber: "",
      supplierPhone: "",
      lines: [{ productId: "", costPrice: 0, marginPercent: 0, quantityAdded: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  async function onSubmit(values: PurchaseInvoiceForm) {
    setSubmitting(true);
    try {
      await createPurchaseInvoiceAndInvalidate(values);
      toast.success("Invoice saved", {
        description: `${values.lines.length} product(s) restocked successfully.`,
      });
      form.reset({
        supplierName: "",
        invoiceNumber: "",
        supplierPhone: "",
        lines: [{ productId: "", costPrice: 0, marginPercent: 0, quantityAdded: 1 }],
      });
    } catch (err) {
      toast.error("Failed to save invoice", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Supplier *</Label>
          <Input {...form.register("supplierName")} placeholder="Supplier name" />
          {form.formState.errors.supplierName && (
            <p className="text-xs text-destructive">
              {form.formState.errors.supplierName.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Invoice #</Label>
          <Input {...form.register("invoiceNumber")} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label>Supplier Phone *</Label>
          <Input {...form.register("supplierPhone")} placeholder="Phone number" />
          {form.formState.errors.supplierPhone && (
            <p className="text-xs text-destructive">
              {form.formState.errors.supplierPhone.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const costPrice = form.watch(`lines.${index}.costPrice`);
          const marginPercent = form.watch(`lines.${index}.marginPercent`);
          const preview =
            costPrice && marginPercent !== undefined
              ? (costPrice * (1 + marginPercent / 100)).toFixed(2)
              : null;

          return (
            <div key={field.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Line {index + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive/80 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Product</Label>
                <select
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...form.register(`lines.${index}.productId`)}
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock: {p.stock ?? 0})
                    </option>
                  ))}
                </select>
                {form.formState.errors.lines?.[index]?.productId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.lines[index]?.productId?.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Cost (EGP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`lines.${index}.costPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                  {form.formState.errors.lines?.[index]?.costPrice && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.lines[index]?.costPrice?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Margin (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register(`lines.${index}.marginPercent`, {
                      valueAsNumber: true,
                    })}
                  />
                  {form.formState.errors.lines?.[index]?.marginPercent && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.lines[index]?.marginPercent?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Qty Added</Label>
                  <Input
                    type="number"
                    {...form.register(`lines.${index}.quantityAdded`, {
                      valueAsNumber: true,
                    })}
                  />
                  {form.formState.errors.lines?.[index]?.quantityAdded && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.lines[index]?.quantityAdded?.message}
                    </p>
                  )}
                </div>
              </div>

              {preview && (
                <p className="text-xs text-muted-foreground">
                  New selling price:{" "}
                  <span className="font-medium text-foreground">{preview} EGP</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {form.formState.errors.lines?.message && (
        <p className="text-sm text-destructive">
          {form.formState.errors.lines.message}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({ productId: "", costPrice: 0, marginPercent: 0, quantityAdded: 1 })
        }
        className="cursor-pointer"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add another product
      </Button>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting} className="cursor-pointer">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Invoice"
          )}
        </Button>
      </div>
    </form>
  );
}
