import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/config/prisma";
import { NewProductForm } from "@/components/admin/NewProductForm";
import { AdminRules } from "@/components/admin/AdminRules";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Add New Product</h1>
          <p className="text-sm text-muted-foreground">
            Create a new product with a default variant
          </p>
        </div>
      </div>

      <AdminRules variant="addProduct" />

      <NewProductForm categories={categories} brands={brands} />
    </section>
  );
}
