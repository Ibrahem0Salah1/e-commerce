// app/admin/%28protected%29/product/%5Bslug%5D/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteProductAndInvalidate } from "@/lib/admin/actions";
import { getAdminProductBySlug } from "@/lib/admin/products";
import { EditProductDialog } from "@/components/admin/EditProductDialog";
import { formatNumber } from "@/lib/utils/format";
import prisma from "@/lib/config/prisma";
import type { AdminProductDetail } from "@/lib/types";
import { plain } from "@/lib/utils/serialize";
type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product: AdminProductDetail | null = plain(await getAdminProductBySlug(slug));;

  if (!product) notFound();

  const [categories, brands, attributeTypes] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        families: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.attributeType.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        displayOrder: true,
        values: {
          orderBy: { value: "asc" },
          select: { id: true, value: true, slug: true },
        },
      },
    }),
  ]);
  const description = product.description && product.description.length > 0
    ? [product.description[0]]
    : []
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {product.name}
              </h1>
              <Badge
                variant={product.isActive ? "default" : "destructive"}
                className={`shrink-0 text-[10px] ${
                  product.isActive
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : ""
                }`}
              >
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">/{product.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/shop/${product.slug}`} target="_blank">
              View on site
            </Link>
          </Button>
          <EditProductDialog
            product={product}
            categories={categories}
            brands={brands}
            attributeTypes={attributeTypes}
          />
          <form
            action={async () => {
              "use server";
              await deleteProductAndInvalidate(product.id);
            }}
          >
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="cursor-pointer"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">
                  {product.category?.name ?? "\u2014"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Family</dt>
                <dd className="font-medium">
                  {product.family?.name ?? "\u2014"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Brand</dt>
                <dd className="font-medium">
                  {product.brand?.name ?? "\u2014"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-medium">
                  {product.price != null
                    ? `${formatNumber(product.price)} EGP`
                    : "\u2014"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Stock</dt>
                <dd className="font-medium">
                  {product.stock != null ? product.stock : "\u2014"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">SKU</dt>
                <dd className="font-medium font-mono text-xs">
                  {product.sku ?? "\u2014"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Featured</dt>
                <dd>{product.featured ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Best Seller</dt>
                <dd>{product.bestSeller ? "Yes" : "No"}</dd>
              </div>
              {product.madeIn && (
                <div>
                  <dt className="text-muted-foreground">Made In</dt>
                  <dd>{product.madeIn}</dd>
                </div>
              )}
            </dl>
          </div>

          {description && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </h2>
              <div className="space-y-1 text-sm text-foreground">
                {description.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {product.specGroups.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Specifications
              </h2>
              <div className="space-y-4">
                {product.specGroups.map((group) => (
                  <div key={group.id}>
                    <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {group.name}
                    </h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {group.specs.map((spec) => (
                        <div key={spec.id} className="flex justify-between">
                          <dt className="text-muted-foreground">{spec.key}</dt>
                          <dd className="font-medium">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Images
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-lg bg-secondary/40"
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 15vw"
                  />
                </div>
              ))}
              {product.images.length === 0 && (
                <p className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                  No images
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Reviews
            </h2>
            <p className="text-2xl font-bold">
              {product._count.reviews}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                reviews
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
