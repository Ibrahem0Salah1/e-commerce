import { notFound } from "next/navigation";
import Link from "next/link";
import { getFamilyBySlug } from "@/lib/families/queries";
import { getCategoryBySlug } from "@/lib/categories/queries";
import { FamilyForm } from "@/components/admin/families";

type Props = {
  params: Promise<{ slug: string; familySlug: string }>;
};

export default async function EditFamilyPage({ params }: Props) {
  const { slug, familySlug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const family = await getFamilyBySlug(familySlug);
  if (!family) notFound();

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
          <span className="text-foreground">Edit</span>
        </p>
        <h1 className="text-2xl font-semibold">Edit Family</h1>
        <p className="text-sm text-muted-foreground">
          Update family details in &quot;{category.name}&quot;
        </p>
      </div>

      <FamilyForm
        categorySlug={slug}
        categoryName={category.name}
        categoryId={category.id}
        familySlug={familySlug}
        defaultValues={{
          name: family.name,
          isActive: family.isActive,
        }}
      />
    </div>
  );
}
