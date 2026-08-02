import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories/queries";
import { CategoryForm } from "@/components/admin/categories";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Category</h1>
        <p className="text-sm text-muted-foreground">
          Update category details
        </p>
      </div>

      <CategoryForm
        initialSlug={slug}
        defaultValues={{
          name: category.name,
          description: category?.description ?? "",
          image: category?.image ?? "",
          isActive: category.isActive,
        }}
      />
    </div>
  );
}
