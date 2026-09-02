"use client";

import { useMemo } from "react";
import { type Control, useWatch } from "react-hook-form";
import { type AddProductForm, ATTR_FIELD_MAP } from "@/lib/validations";
import { slugify } from "@/lib/utils/slugify";
import type { PreviewProduct } from "@/components/admin/formComponents/ProductPreviewModal";

type FamilyOption = { id: string; name: string; slug: string };

export type CategoryWithFamilies = {
  id: string;
  name: string;
  slug: string;
  families: FamilyOption[];
};

export type AttributeTypeOption = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number | null;
  values: { id: string; value: string; slug: string }[];
};

type Props = {
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string }[];
  attributeTypes: AttributeTypeOption[];
};

export function useProductPreview({
  control,
  categories,
  brands,
  attributeTypes,
}: {
  control: Control<AddProductForm>;
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string }[];
  attributeTypes: AttributeTypeOption[];
}): PreviewProduct {

  const name = useWatch({ control, name: "name" });
  const sku = useWatch({ control, name: "sku" });
  const description = useWatch({ control, name: "description" });
  const images = useWatch({ control, name: "images" });
  const specGroups = useWatch({ control, name: "specGroups" });
  const madeIn = useWatch({ control, name: "madeIn" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const familyId = useWatch({ control, name: "familyId" });
  const brandId = useWatch({ control, name: "brandId" });

  const attrFieldNames = useMemo(() => {
    const names: (keyof AddProductForm)[] = [];
    for (const type of attributeTypes) {
      const key = ATTR_FIELD_MAP[type.slug];
      if (key) names.push(key);
    }
    return names;
  }, [attributeTypes]);

  const watchedAttrValues = useWatch({ control, name: attrFieldNames }) as (
    | string
    | undefined
  )[];

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedBrand = brands.find((b) => b.id === brandId);

  return useMemo(() => {
    const attributes: PreviewProduct["attributes"] = [];
    for (const type of attributeTypes) {
      const fieldKey = ATTR_FIELD_MAP[type.slug];
      if (!fieldKey) continue;
      const fieldIndex = attrFieldNames.indexOf(fieldKey);
      const valueId = watchedAttrValues[fieldIndex];
      if (!valueId) continue;
      const val = type.values.find((v) => v.id === valueId);
      if (val) {
        attributes.push({
          typeName: type.name,
          typeSlug: type.slug,
          value: val.value,
        });
      }
    }

    const descriptionLines = (description ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const specs = (specGroups ?? [])
      .filter((g) => g?.name?.trim())
      .map((g) => ({
        name: g.name.trim(),
        specs: (g.specs ?? [])
          .filter((s) => s?.key?.trim() && s?.value?.trim())
          .map((s) => ({
            key: s.key.trim(),
            value: s.value.trim(),
          })),
      }))
      .filter((g) => g.specs.length > 0);

    return {
      name: name ?? "",
      slug: name ? slugify(name) : "",
      description: descriptionLines,
      price: 0,
      stock: 0,
      sku: sku?.trim() || undefined,
      images: images ?? [],
      madeIn: madeIn?.trim() || null,
      brandName: selectedBrand?.name ?? null,
      categoryName: selectedCategory?.name ?? null,
      attributes,
      specs,
    };
  }, [
    name,
    sku,
    description,
    images,
    specGroups,
    madeIn,
    watchedAttrValues,
    attrFieldNames,
    attributeTypes,
    selectedBrand?.name,
    selectedCategory?.name,
  ]);
}