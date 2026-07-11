// app/admin/%28protected%29/product/%5Bslug%5D/%5BvariantId%5D/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getVariantById } from "@/lib/admin/variant";
import { EditVariantDialog } from "@/components/admin/EditVariantDialog";
import { formatNumber } from "@/lib/utils/format";
import Image from "next/image";
type Props = {
  params: Promise<{ slug: string; variantId: string }>;
};

export default async function AdminVariantDetailPage({ params }: Props) {
  const { slug, variantId } = await params;
  const variant = await getVariantById(variantId);

  if (!variant) notFound();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/product/${slug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {variant.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {variant.product.name} &middot; SKU: {variant.sku ?? "—"}
            </p>
          </div>
        </div>

        <EditVariantDialog variant={variant} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Details
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Variant Name</dt>
              <dd className="font-medium">{variant.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="font-mono text-xs">{variant.sku ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Price</dt>
              <dd className="font-medium">
                {formatNumber(variant.price)} EGP
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stock</dt>
              <dd className="font-medium">{variant.stock}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                {variant.isActive ? (
                  <Badge variant="default" className="bg-emerald-600">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Archived</dt>
              <dd>{variant.archived ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Limited Quantity</dt>
              <dd>{variant.isLimitedQuantity ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{variant.createdAt.toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {variant.image && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Image
            </h2>
            <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-lg bg-secondary/40">
              <Image
                src={variant.image}
                alt={variant.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
