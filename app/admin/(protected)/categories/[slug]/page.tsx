import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories/queries";
import { CategoryDetail } from "@/components/admin/categories";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        <p className="text-sm text-muted-foreground">Category details</p>
      </div>

      <CategoryDetail category={category} />
    </div>
  );
}
