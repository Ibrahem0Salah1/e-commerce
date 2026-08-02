import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFamiliesByCategory } from "@/lib/families/queries";
import { getCategoryBySlug } from "@/lib/categories/queries";
import { FamilyList } from "@/components/admin/families";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function FamiliesPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const families = await getFamiliesByCategory(slug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
              href={`/admin/categories/${slug}`}
              className="hover:text-primary"
            >
              {category.name}
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground">Families</span>
          </p>
          <h1 className="text-2xl font-semibold">Product Families</h1>
          <p className="text-sm text-muted-foreground">
            Families in &quot;{category.name}&quot;
          </p>
        </div>
        <Link href={`/admin/categories/${slug}/families/new`}>
          <Button className="cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" />
            New Family
          </Button>
        </Link>
      </div>

      <FamilyList families={families} categorySlug={slug} />
    </div>
  );
}
