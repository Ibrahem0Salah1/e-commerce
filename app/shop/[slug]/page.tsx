import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Star, Check, Shield, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getProductBySlug } from "@/lib/products/queries";
import { formatNumber } from "@/lib/utils/format";
import { AddToCartButton } from "./AddToCartButton";
import { ImageGallery } from "./ImageGallery";
import { TruncatedDescription } from "./TruncatedDescription";
import { getProductBySlugWithInventory } from "@/lib/products/queries";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlugWithInventory(slug);

  if (!product) return notFound();

  return {
    title: `${product.name} | MDS Dental Store`,
    description: product.description?.[0] ?? `Buy ${product.name} from MDS`,
    openGraph: {
      title: product.name,
      images: [{ url: product.images[0] }],
    },
  };
}


export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlugWithInventory(slug);

  if (!product) return notFound();

  const description =
    product.description && product.description.length > 0
      ? product.description
      : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="transition-colors hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.category?.name ?? ""}</span>
      </nav>

      {/* Core Grid */}
      <div className="grid gap-10 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] items-start">
        {/* Gallery */}
        <ImageGallery images={product.images} name={product.name} />

        {/* Info */}
        <div className="flex flex-col gap-6">
          {/* Brand + Rating */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {product.brand?.name ?? "MDS"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="flex text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${product.rating && i < Math.round(product.rating)
                      ? "fill-current"
                      : "fill-muted text-muted"
                      }`}
                  />
                ))}
              </div>
              {product.rating !== null ? (
                <span className="text-xs text-muted-foreground">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No reviews yet
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {product.name}
            </h1>
            {product.sku && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                SKU: {product.sku}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 border-b border-border pb-6">
            <span className="text-3xl font-bold text-foreground">
              {formatNumber(product.price)}
            </span>
            <span className="text-lg font-normal text-muted-foreground">
              EGP
            </span>
            <span className="text-sm text-muted-foreground">/ each</span>
          </div>

          {/* Attributes (displayed as selected variants) */}
          {product.attributes.length > 0 && (
            <div className="space-y-4 flex flex-row gap-4">
              {product.attributes.map((attr) => (
                <div key={attr.typeSlug}>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    {attr.typeName}
                  </label>
                  <Badge
                    variant="outline"
                    className="h-8 rounded-md border-2 border-primary bg-primary/5 px-3 text-sm font-medium text-primary"
                  >
                    {attr.value}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Stock + Cart */}
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Check className="h-4 w-4" />
              <span>
                {product.stock && product.stock > 0
                  ? `In Stock — ${product.stock} available`
                  : "Out of Stock"}
              </span>
            </div>
            <AddToCartButton product={product} />
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              OEM Certified
            </div>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Secure Procurement
            </div>
          </div>

          {/* Description */}
          {description.length > 0 && (
            <TruncatedDescription paragraphs={description} />
          )}
        </div>
      </div>

      <Separator className="my-12" />

      {/* Bento Grid: Specs & Features */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Technical Specs */}
        {product.specs.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
              <span className="text-sm font-semibold text-primary">Specs</span>
              <h2 className="text-sm font-semibold text-foreground">
                Technical Specifications
              </h2>
            </div>
            <div className="p-0">
              <Accordion
                type="multiple"
                defaultValue={product.specs.map((_, i) => `spec-${i}`)}
              >
                {product.specs.map((group, i) => {
                  if (group.specs.length === 0) return null;
                  return (
                    <AccordionItem
                      key={group.name}
                      value={`spec-${i}`}
                      className="border-b border-border/50 last:border-0"
                    >
                      <AccordionTrigger className="px-5 py-3 text-sm font-medium hover:no-underline">
                        {group.name}
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-4">
                        <table className="w-full text-sm">
                          <tbody>
                            {group.specs.map((spec, j) => (
                              <tr
                                key={spec.id}
                                className={
                                  j < group.specs.length - 1
                                    ? "border-b border-border/40"
                                    : ""
                                }
                              >
                                <td className="w-1/2 py-2.5 pr-4 text-muted-foreground">
                                  {spec.key}
                                </td>
                                <td className="py-2.5 font-medium text-foreground">
                                  {spec.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>
        )}

        {/* Key Features / Description */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <span className="text-sm font-semibold text-primary">Features</span>
            <h2 className="text-sm font-semibold text-foreground">
              Key Features
            </h2>
          </div>
          <div className="bg-muted/10 p-5">
            {description.length > 0 ? (
              <ul className="space-y-3">
                {description.map((para, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{para}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Premium medical supply with certified quality standards.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <>
          <Separator className="my-12" />
          <section>
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              Customer Reviews
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {review.user.name}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating
                              ? "fill-primary text-primary"
                              : "fill-muted text-muted"
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {review.title}
                    </p>
                  )}
                  {review.body && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {review.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}