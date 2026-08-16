"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addProductFormSchema, type AddProductForm, ATTR_FIELD_MAP } from "@/lib/validations";
import { addProductAndInvalidate } from "@/lib/admin/actions";
import { slugify } from "@/lib/utils/slugify";

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
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string }[];
  attributeTypes: AttributeTypeOption[];
};

export function useProductForm({ categories, attributeTypes }: Props) {
  const router = useRouter();
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);
  const lastAutoName = useRef("");

  const form = useForm<AddProductForm>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      madeIn: "",
      price: 0,
      stock: 0,
      sku: "",
      images: [] as string[],
      categoryId: "",
      familyId: "",
      brandId: "",
      isActive: true,
      archived: false,
      featured: false,
      bestSeller: false,
      sizeValueId: "",
      unitValueId: "",
      colorValueId: "",
      shadeValueId: "",
      specGroups: [],
    },
  });

  const { watch, setValue } = form;

  const watchedCategoryId = watch("categoryId");
  const watchedFamilyId = watch("familyId");
  const watchedName = watch("name");

  const selectedCategory = categories.find((c) => c.id === watchedCategoryId);
  const families = selectedCategory?.families ?? [];
  const selectedFamily = families.find((f) => f.id === watchedFamilyId);

  const attrFieldNames = useMemo(() => {
    const names: (keyof AddProductForm)[] = [];
    for (const type of attributeTypes) {
      const key = ATTR_FIELD_MAP[type.slug];
      if (key) names.push(key);
    }
    return names;
  }, [attributeTypes]);

  const watchedAttrValues = watch(attrFieldNames) as (string | undefined)[];

  /* ── Effect: Auto-build name from Family + Attributes ── */
  useEffect(() => {
    if (nameManuallyEdited) return;

    const familyName = selectedFamily?.name;
    if (!familyName) {
      if (lastAutoName.current !== "") {
        lastAutoName.current = "";
        setValue("name", "", { shouldValidate: true });
      }
      return;
    }

    const selectedAttrs: { value: string; displayOrder: number }[] = [];

    for (const type of attributeTypes) {
      const fieldKey = ATTR_FIELD_MAP[type.slug];
      if (!fieldKey) continue;

      const fieldIndex = attrFieldNames.indexOf(fieldKey);
      const valueId = watchedAttrValues[fieldIndex];
      if (!valueId) continue;

      const val = type.values.find((v) => v.id === valueId);
      if (val) {
        selectedAttrs.push({
          value: val.value,
          displayOrder: type.displayOrder ?? Infinity,
        });
      }
    }

    selectedAttrs.sort((a, b) => a.displayOrder - b.displayOrder);

    const parts = [familyName, ...selectedAttrs.map((a) => a.value)];
    const autoName = parts.join(" ");

    if (autoName !== lastAutoName.current) {
      lastAutoName.current = autoName;
      setValue("name", autoName, { shouldValidate: true });
    }
  }, [
    watchedAttrValues,
    attrFieldNames,
    attributeTypes,
    selectedFamily?.name,
    nameManuallyEdited,
    setValue,
  ]);

  /* ── Effect: Live slug derivation from current name ── */
  useEffect(() => {
    if (watchedName) {
      setValue("slug", slugify(watchedName), { shouldValidate: false });
    } else {
      setValue("slug", "", { shouldValidate: false });
    }
  }, [watchedName, setValue]);

  const onSubmit: SubmitHandler<AddProductForm> = async (data) => {
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
        .map((g, gi) => ({
          name: g.name.trim(),
          position: gi,
          specs: (g.specs ?? [])
            .filter((s) => s.key.trim() && s.value.trim())
            .map((s, si) => ({
              key: s.key.trim(),
              value: s.value.trim(),
              position: si,
            })),
        }))
        .filter((g) => g.name && g.specs.length > 0);

      await addProductAndInvalidate({
        name: data.name,
        slug: data.slug,
        description: data.description
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        madeIn: data.madeIn || null,
        price: data.price,
        stock: data.stock,
        sku: data.sku || undefined,
        images: data.images,
        categoryId: data.categoryId,
        familyId: data.familyId,
        brandId: data.brandId || null,
        isActive: data.isActive,
        archived: data.archived,
        featured: data.featured,
        bestSeller: data.bestSeller,
        attributes: attributes.length > 0 ? attributes : undefined,
        specGroups: specGroups.length > 0 ? specGroups : undefined,
      });

      toast.success("Product created", {
        description: `${data.name} has been added.`,
      });
      router.push(`/admin/product/${data.slug}`);
    } catch (err) {
      toast.error("Failed to create product", {
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    }
  };

  return {
    form,
    nameManuallyEdited,
    setNameManuallyEdited,
    onSubmit,
    families,
    selectedFamily,
  };
}