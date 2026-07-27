"use client";

import { useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Pencil,
  Tag,
  DollarSign,
  ImageIcon,
  Layers,
  Info,
  MapPin,
} from "lucide-react";
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
import {
  editProductFormSchema,      // ← new client schema
  updateProductSchema,        // ← keep for server action typing if needed
  type EditProductForm,
} from "@/lib/validations";
import type { AdminProductDetail } from "@/lib/types";

type FamilyOption = { id: string; name: string; slug: string };

type CategoryWithFamilies = {
  id: string;
  name: string;
  slug: string;
  families: FamilyOption[];
};

type Props = {
  product: AdminProductDetail;
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string }[];
};

export function EditProductDialog({ product, categories, brands }: Props) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditProductForm>({
    resolver: zodResolver(editProductFormSchema),  // ← switch to client schema
    defaultValues: {
      name: product.name,
      description: (product.description ?? []).join("\n"),
      madeIn: product.madeIn ?? "",
      images: product.images.join("\n"),
      categoryId: product.category?.id ?? "",
      familyId: product.family?.id ?? "",
      brandId: product.brand?.id ?? "",
      isActive: product.isActive,
      archived: product.archived,
      featured: product.featured,
      bestSeller: product.bestSeller,
      price: Number(product.price) || 0,
      stock: product.stock ?? 0,
      sku: product.sku ?? "",
    },
  });

  const watchedCategoryId = watch("categoryId");
  const selectedCategory = categories.find((c) => c.id === watchedCategoryId);
  const families = selectedCategory?.families ?? [];

  const onSubmit: SubmitHandler<EditProductForm> = async (data) => {
    try {
      await updateProductAndInvalidate(product.id, {
        name: data.name,
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
        familyId: data.familyId,
        brandId: data.brandId || null,
        isActive: data.isActive,
        archived: data.archived,
        featured: data.featured,
        bestSeller: data.bestSeller,
        price: data.price,
        stock: data.stock,
        sku: data.sku || undefined,
      });
      toast.success("Product updated", {
        description: `${data.name} has been saved.`,
      });
      setOpen(false);
    } catch (err) {
      toast.error("Failed to update product", {
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    }
  };

  /* ── Render helpers ── */
  const SectionTitle = ({
    icon: Icon,
    label,
  }: {
    icon: React.ElementType;
    label: string;
  }) => (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </div>
  );

  const ErrorMsg = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

  const Helper = ({ text }: { text: string }) => (
    <p className="text-xs text-muted-foreground mt-1">{text}</p>
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-1.5 h-4 w-4" />
        Edit
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-6 text-lg font-semibold">Edit Product</h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 max-h-[80vh] overflow-y-auto pr-2"
        >
          {/* ═══════════════════════════════════════════
              PRODUCT IDENTITY
              ═══════════════════════════════════════════ */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <SectionTitle icon={Tag} label="Product Identity" />

            <div className="space-y-1.5 mb-4">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...register("name")} />
              <ErrorMsg msg={errors.name?.message} />
            </div>

            {/* Slug — read-only, frozen forever */}
            <div className="space-y-1.5 mb-4">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                URL Slug <span className="text-xs font-normal">(locked)</span>
              </Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-mono text-xs text-foreground">
                  {product.slug}
                </span>
              </div>
              <Helper text="Slug is permanent after creation to preserve existing links, cart URLs, and bookmarks." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                {...register("description")}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-y"
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              PRICING & INVENTORY
              ═══════════════════════════════════════════ */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <SectionTitle icon={DollarSign} label="Pricing & Inventory" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-price">Price (EGP)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("price", { valueAsNumber: true })}
                />
                <ErrorMsg msg={errors.price?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  step="1"
                  min={0}
                  {...register("stock", { valueAsNumber: true })}
                />
                <ErrorMsg msg={errors.stock?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  {...register("sku")}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="edit-madeIn" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Made In
              </Label>
              <Input
                id="edit-madeIn"
                {...register("madeIn")}
                placeholder="e.g. Germany"
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              MEDIA
              ═══════════════════════════════════════════ */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <SectionTitle icon={ImageIcon} label="Media" />
            <div className="space-y-1.5">
              <Label htmlFor="edit-images">Images</Label>
              <textarea
                id="edit-images"
                {...register("images")}
                rows={3}
                placeholder="One image URL per line"
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-y"
              />
              <Helper text="Paste one public image URL per line. First image is the cover." />
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              CLASSIFICATION
              ═══════════════════════════════════════════ */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <SectionTitle icon={Layers} label="Classification" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue("familyId", "");
                      }}
                    >
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
                <ErrorMsg msg={errors.categoryId?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Family</Label>
                <Controller
                  control={control}
                  name="familyId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={families.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select family" />
                      </SelectTrigger>
                      <SelectContent>
                        {families.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <ErrorMsg msg={errors.familyId?.message} />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label>Brand</Label>
              <Controller
                control={control}
                name="brandId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? "" : v)
                    }
                  >
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

          {/* ═══════════════════════════════════════════
              STATUS & VISIBILITY
              ═══════════════════════════════════════════ */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <SectionTitle icon={Info} label="Status & Visibility" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <BoolField control={control} name="isActive" label="Active" />
              <BoolField control={control} name="featured" label="Featured" />
              <BoolField
                control={control}
                name="bestSeller"
                label="Best Seller"
              />
              <BoolField control={control} name="archived" label="Archived" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ───────────────────────────────────────────────
   Bool field sub-component
   ─────────────────────────────────────────────── */
function BoolField({
  control,
  name,
  label,
}: {
  control: any;
  name: keyof EditProductForm;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value ? "true" : "false"}
            onValueChange={(v) => field.onChange(v === "true")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}