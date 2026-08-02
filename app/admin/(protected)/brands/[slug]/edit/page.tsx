import { notFound } from "next/navigation";
import { getBrandBySlug } from "@/lib/brands/queries";
import { BrandForm } from "@/components/admin/brands";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditBrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Brand</h1>
        <p className="text-sm text-muted-foreground">
          Update brand details
        </p>
      </div>

      <BrandForm
        initialSlug={slug}
        defaultValues={{
          name: brand.name,
          logo: brand.logo ?? "",
          description: brand.description?? "",
          isActive: brand.isActive,
        }}
      />
    </div>
  );
}
