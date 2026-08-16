"use client";

import Image from "next/image";
import {
  Check,
  ChevronRight,
  Lock,
  Shield,
  Star,
  ZoomIn,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { useState } from "react";

/* ───────────────────────────────────────────────
   Preview data shape (client-only, no DB ids required)
   ─────────────────────────────────────────────── */
export type PreviewProduct = {
  name: string;
  slug: string;
  description: string[];
  price: number;
  stock: number;
  sku?: string;
  images: string[];
  madeIn?: string | null;
  brandName?: string | null;
  categoryName?: string | null;
  attributes: {
    typeName: string;
    typeSlug: string;
    value: string;
  }[];
  specs: {
    name: string;
    specs: { key: string; value: string }[];
  }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: PreviewProduct;
};

/* ───────────────────────────────────────────────
   Lightweight gallery (no sticky/layout side-effects)
   ─────────────────────────────────────────────── */
function PreviewGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        No images yet
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="flex gap-2 overflow-x-auto pb-1 md:w-16 md:flex-col md:overflow-visible md:pb-0">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setActive(i);
              setZoomed(false);
            }}
            className={cn(
              "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-colors md:h-16 md:w-16",
              active === i
                ? "border-primary"
                : "border-transparent hover:border-border"
            )}
          >
            <Image
              src={img}
              alt={`${name} view ${i + 1}`}
              fill
              className="object-contain p-1.5"
              sizes="64px"
            />
          </button>
        ))}
      </div>

      <div className="relative flex aspect-square flex-1 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/30 p-4">
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          className="absolute right-3 top-3 z-10 rounded-full border border-border/50 bg-background/90 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <Image
          src={images[active]}
          alt={name || "Product"}
          fill
          className={cn(
            "object-contain transition-transform duration-300",
            zoomed ? "scale-125 cursor-zoom-out" : "scale-100 cursor-zoom-in"
          )}
          sizes="(max-width: 768px) 100vw, 40vw"
        />
      </div>
    </div>
  );
}

function PreviewDescription({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!paragraphs.length) return null;

  const needsTruncation =
    paragraphs.length > 1 || paragraphs.some((p) => p.length > 200);

  return (
    <div>
      <div
        className={cn(
          "space-y-2 text-sm leading-relaxed text-muted-foreground",
          !expanded && needsTruncation && "line-clamp-6"
        )}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export function ProductPreviewModal({ open, onOpenChange, product }: Props) {
  const description = product.description ?? [];
  const hasSpecs = product.specs.some((g) => g.specs.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl lg:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold">
            Product preview
            {product.name ? (
              <span className="ml-2 font-normal text-muted-foreground">
                — {product.name}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {/* Breadcrumbs (static preview) */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Home</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Shop</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">
              {product.categoryName || "Category"}
            </span>
          </nav>

          {/* Core grid */}
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
            <PreviewGallery images={product.images} name={product.name} />

            <div className="flex flex-col gap-5">
              {/* Brand + rating placeholder */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {product.brandName || "MDS"}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex text-muted">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-muted" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    No reviews yet
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {product.name || (
                    <span className="text-muted-foreground">Untitled product</span>
                  )}
                </h1>
                {product.sku ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    SKU: {product.sku}
                  </p>
                ) : null}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 border-b border-border pb-5">
                <span className="text-3xl font-bold text-foreground">
                  {product.price > 0 ? formatNumber(product.price) : "—"}
                </span>
                <span className="text-lg font-normal text-muted-foreground">
                  EGP
                </span>
                <span className="text-sm text-muted-foreground">/ each</span>
              </div>

              {/* Attributes */}
              {product.attributes.length > 0 && (
                <div className="flex flex-row flex-wrap gap-4">
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

              {/* Stock + cart stub */}
              <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Check className="h-4 w-4" />
                  <span>
                    {product.stock > 0
                      ? `In Stock — ${product.stock} available`
                      : "Out of Stock"}
                  </span>
                </div>
                <Button size="lg" className="w-full" disabled>
                  Add to cart
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  OEM Certified
                </div>
                <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Secure Procurement
                </div>
              </div>

              {description.length > 0 && (
                <PreviewDescription paragraphs={description} />
              )}
            </div>
          </div>

          <Separator className="my-10" />

          {/* Specs + Features */}
          <div className="grid gap-6 md:grid-cols-2">
            {hasSpecs ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
                  <span className="text-sm font-semibold text-primary">Specs</span>
                  <h2 className="text-sm font-semibold text-foreground">
                    Technical Specifications
                  </h2>
                </div>
                <Accordion
                  type="multiple"
                  defaultValue={product.specs.map((_, i) => `spec-${i}`)}
                >
                  {product.specs.map((group, i) => {
                    if (group.specs.length === 0) return null;
                    return (
                      <AccordionItem
                        key={`${group.name}-${i}`}
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
                                  key={`${spec.key}-${j}`}
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
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-sm text-muted-foreground">
                No specifications yet
              </div>
            )}

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
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm leading-relaxed text-foreground"
                      >
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
