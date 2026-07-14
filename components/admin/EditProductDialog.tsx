"use client";

import { useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
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
import { updateProductAndInvalidate } from "@/lib/admin/actions";
import { editProductSchema, type EditProductForm } from "@/lib/validations";
import type { AdminProductDetail } from "@/lib/types";

type Props = {
  product: AdminProductDetail;
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
};

export function EditProductDialog({ product, categories, brands }: Props) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditProductForm>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: product.name,
      slug: product.slug,
      description: (product.description ?? []).join("\n"),
      madeIn: product.madeIn ?? "",
      images: product.images.join("\n"),
      categoryId: product.category.id,
      brandId: product.brand?.id ?? "",
      isActive: product.isActive,
      archived: product.archived,
      featured: product.featured,
      bestSeller: product.bestSeller,
    },
  });

  const onSubmit: SubmitHandler<EditProductForm> = async (data) => {
    try {
      await updateProductAndInvalidate(product.id, {
        name: data.name,
        slug: data.slug,
        description: data.description
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        madeIn: data.madeIn || null,
        images: data.images
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        isActive: data.isActive,
        archived: data.archived,
        featured: data.featured,
        bestSeller: data.bestSeller,
      });
      toast.success("Product updated", {
        description: `${data.name} has been saved.`,
      });
      setOpen(false);
    } catch (err) {
      toast.error("Failed to update product", {
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
        <h2 className="mb-6 text-lg font-semibold">Edit Product</h2>

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
              <Label>Slug</Label>
              <Input {...register("slug")} />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description (one paragraph per line)</Label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Made In</Label>
              <Input
                {...register("madeIn")}
                placeholder="e.g. Germany"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Images (one URL per line)</Label>
            <textarea
              {...register("images")}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Controller
                control={control}
                name="brandId"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label>Featured</Label>
              <Controller
                control={control}
                name="featured"
                render={({ field }) => (
                  <BoolSelect value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Best Seller</Label>
              <Controller
                control={control}
                name="bestSeller"
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
