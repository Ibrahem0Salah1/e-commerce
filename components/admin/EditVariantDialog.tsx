"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "./Modal";
import { updateVariantAndInvalidate } from "@/lib/admin/actions";
import { editVariantSchema, type EditVariantForm } from "@/lib/validations";

type Props = {
  variant: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    isLimitedQuantity: boolean;
    image: string | null;
    isActive: boolean;
    archived: boolean;
  };
};

export function EditVariantDialog({ variant }: Props) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditVariantForm>({
    resolver: zodResolver(editVariantSchema),
    defaultValues: {
      name: variant.name,
      sku: variant.sku ?? "",
      price: variant.price,
      stock: variant.stock,
      isLimitedQuantity: variant.isLimitedQuantity,
      image: variant.image ?? "",
      isActive: variant.isActive,
      archived: variant.archived,
    },
  });

  const onSubmit = async (data: EditVariantForm) => {
    try {
      await updateVariantAndInvalidate(variant.id, {
        name: data.name,
        sku: data.sku || null,
        price: data.price,
        stock: data.stock,
        isLimitedQuantity: data.isLimitedQuantity,
        image: data.image || null,
        isActive: data.isActive,
        archived: data.archived,
      });
      toast.success("Variant updated", {
        description: `${data.name} has been saved.`,
      });
      setOpen(false);
    } catch (err) {
      toast.error("Failed to update variant", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        <Pencil className="mr-1.5 h-4 w-4" />
        Edit
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-6 text-lg font-semibold">Edit Variant</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input {...register("sku")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Price (EGP)</Label>
              <Input type="number" {...register("price", { valueAsNumber: true })} />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" {...register("stock", { valueAsNumber: true })} />
              {errors.stock && (
                <p className="text-xs text-destructive">{errors.stock.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Image URL</Label>
            <Input
              {...register("image")}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Active</Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <BoolSelect value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Archived</Label>
              <Controller
                control={control}
                name="archived"
                render={({ field }) => (
                  <BoolSelect value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Limited Qty</Label>
              <Controller
                control={control}
                name="isLimitedQuantity"
                render={({ field }) => (
                  <BoolSelect value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? "Saving\u2026" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function BoolSelect({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Select
      value={value ? "true" : "false"}
      onValueChange={(v) => onChange(v === "true")}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">Yes</SelectItem>
        <SelectItem value="false">No</SelectItem>
      </SelectContent>
    </Select>
  );
}
