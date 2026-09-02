"use client";

import { useState } from "react";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "./Modal";
import { updateProductAndInvalidate } from "@/lib/admin/actions";
import {
  ATTR_FIELD_MAP,
  editProductFormSchema,
  type EditProductForm,
} from "@/lib/validations";
import type { AdminProductDetail } from "@/lib/types";
import { ClassificationSection } from "@/components/admin/formComponents/ClassificationSection";
import { PricingInventorySection } from "@/components/admin/formComponents/PricingInventorySection";
import { AttributesSection } from "@/components/admin/formComponents/AttributesSection";
import { MetadataSection } from "@/components/admin/formComponents/MetadataSection";

type FamilyOption = { id: string; name: string; slug: string };

type CategoryWithFamilies = {
  id: string;
  name: string;
  slug: string;
  families: FamilyOption[];
};

type AttributeTypeOption = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number | null;
  values: { id: string; value: string; slug: string }[];
};

type Props = {
  product: AdminProductDetail;
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string }[];
  attributeTypes: AttributeTypeOption[];
};

export function EditProductDialog({
  product,
  categories,
  brands,
  attributeTypes,
}: Props) {
  const [open, setOpen] = useState(false);

  const defaults: EditProductForm = {
    name: product.name,
    slug: product.slug,
    description: (product.description ?? []).join("\n"),
    madeIn: product.madeIn ?? "",
    images: product.images,
    categoryId: product.category?.id ?? "",
    familyId: product.family?.id ?? "",
    brandId: product.brand?.id ?? "",
    isActive: product.isActive,
    archived: product.archived,
    featured: product.featured,
    bestSeller: product.bestSeller,
    sku: product.sku ?? "",
    sizeValueId: "",
    unitValueId: "",
    colorValueId: "",
    shadeValueId: "",
    specGroups: (product.specGroups ?? []).map((group) => ({
      name: group.name,
      position: group.position,
      specs: group.specs.map((spec) => ({
        key: spec.key,
        value: spec.value,
        position: spec.position,
      })),
    })),
  };

  for (const type of attributeTypes) {
    const fieldKey = ATTR_FIELD_MAP[type.slug];
    if (!fieldKey) continue;
    const match = product.attributeValues?.find(
      (av) => av.attributeTypeId === type.id,
    );
    if (match) {
      (defaults as Record<string, unknown>)[fieldKey] =
        match.attributeValueId;
    }
  }

  const form = useForm<EditProductForm>({
    resolver: zodResolver(editProductFormSchema),
    defaultValues: defaults,
  });

  const watchedCategoryId = form.watch("categoryId");
  const families =
    categories.find((c) => c.id === watchedCategoryId)?.families ?? [];

  const onSubmit: SubmitHandler<EditProductForm> = async (data) => {
    try {
      const attributes: {
        attributeTypeId: string;
        attributeValueId: string;
      }[] = [];
      for (const type of attributeTypes) {
        const fieldKey = ATTR_FIELD_MAP[type.slug];
        if (!fieldKey) continue;
        const valueId = data[fieldKey] as string | undefined;
        if (valueId) {
          attributes.push({
            attributeTypeId: type.id,
            attributeValueId: valueId,
          });
        }
      }

      const specGroups = (data.specGroups ?? [])
        .map((group, gi) => ({
          name: group.name.trim(),
          position: gi,
          specs: (group.specs ?? [])
            .filter((spec) => spec.key.trim() && spec.value.trim())
            .map((spec, si) => ({
              key: spec.key.trim(),
              value: spec.value.trim(),
              position: si,
            })),
        }))
        .filter((group) => group.name && group.specs.length > 0);

      await updateProductAndInvalidate(product.id, {
        name: data.name,
        description: data.description
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        madeIn: data.madeIn || null,
        images: data.images,
        categoryId: data.categoryId,
        familyId: data.familyId || null,
        brandId: data.brandId || null,
        isActive: data.isActive,
        archived: data.archived,
        featured: data.featured,
        bestSeller: data.bestSeller,
        sku: data.sku.trim() || null,
        attributes,
        specGroups,
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

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-1.5 h-4 w-4" />
        Edit
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} size="xl">
        <h2 className="mb-6 text-lg font-semibold">Edit Product</h2>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-h-[80vh] space-y-6 overflow-y-auto pr-2"
          >
            <ClassificationSection
              categories={categories}
              brands={brands}
              families={families}
              variant="edit"
              lockedSlug={product.slug}
              nameManuallyEdited={false}
              onNameManuallyEdited={() => {}}
            />

            <PricingInventorySection
              variant="edit"
              readOnlyPricing={{
                price: Number(product.price),
                stock: product.stock ?? 0,
                costPrice: product.costPrice !== null && product.costPrice !== undefined ? Number(product.costPrice) : null,
                marginPercent: product.marginPercent !== null && product.marginPercent !== undefined ? Number(product.marginPercent) : null,
              }}
            />

            <AttributesSection attributeTypes={attributeTypes} />

            <MetadataSection variant="edit" />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </>
  );
}
