import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug } from "@/lib/categories/queries";
import { FamilyForm } from "@/components/admin/families";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function NewFamilyPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">
          <Link
            href="/admin/categories"
            className="hover:text-primary"
          >
            Categories
          </Link>
          <span className="mx-1">/</span>
          <Link
            href={`/admin/categories/${slug}/families`}
            className="hover:text-primary"
          >
            {category.name}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-foreground">New Family</span>
        </p>
        <h1 className="text-2xl font-semibold">New Family</h1>
        <p className="text-sm text-muted-foreground">
          Create a new product family in &quot;{category.name}&quot;
        </p>
      </div>

      <FamilyForm
        categorySlug={slug}
        categoryName={category.name}
        categoryId={category.id}
      />
    </div>
  );
}
