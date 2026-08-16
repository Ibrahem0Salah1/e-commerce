"use client";

import { FormProvider } from "react-hook-form";
import { useProductForm } from "@/hooks/useProductForm";
import { useProductPreview } from "@/hooks/useProductPreview";
import { ClassificationSection } from "./formComponents/ClassificationSection";
import { PricingInventorySection } from "./formComponents/PricingInventorySection";
import { AttributesSection } from "./formComponents/AttributesSection";
import { MetadataSection } from "./formComponents/MetadataSection";
import { FormActions } from "./formComponents/FormActions";
import { ProductPreview } from "./formComponents/ProductPreview";

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

export function NewProductForm({ categories, brands, attributeTypes }: Props) {
  const { form, nameManuallyEdited, setNameManuallyEdited, onSubmit, families } =
    useProductForm({ categories, brands, attributeTypes });

  const previewProduct = useProductPreview({
    control: form.control,
    categories,
    brands,
    attributeTypes,
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-3xl space-y-5"
      >
        <ProductPreview product={previewProduct} />

        <ClassificationSection
          categories={categories}
          brands={brands}
          families={families}
          nameManuallyEdited={nameManuallyEdited}
          onNameManuallyEdited={setNameManuallyEdited}
        />

        <PricingInventorySection />

        <AttributesSection attributeTypes={attributeTypes} />

        <MetadataSection />

        <FormActions />
      </form>
    </FormProvider>
  );
}