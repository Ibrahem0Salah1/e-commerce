import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getProductBySlug } from "@/lib/products";
import { AddToCartButton } from "./AddToCartButton";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="transition-colors hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.category.name}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-2 md:gap-10">

        <ImageGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {product.category.name}
            </span>
            {product.brand && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {product.brand.name}
              </span>
            )}
            {product.featured && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    product.rating && i < Math.round(product.rating)
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            {product.rating !== null ? (
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{product.rating}</span>
                {" "}({product.reviewCount} reviews)
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">No reviews yet</span>
            )}
          </div>

          <Separator />

          <p className="text-3xl font-bold text-foreground">
            {product.basePrice.toLocaleString()}
            <span className="ml-1 text-lg font-normal text-muted-foreground">EGP</span>
          </p>

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <AddToCartButton product={product} />
        </div>
      </div>

      <Separator className="my-12" />

      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        {product.specs.length > 0 && (
          <section>
            <h2 className="mb-5 text-lg font-semibold text-foreground">
              Specifications
            </h2>
            <Accordion type="multiple" defaultValue={product.specs.map((_, i) => `spec-${i}`)}>
              {product.specs.map((group, i) => (
                <AccordionItem key={group.name} value={`spec-${i}`}>
                  <AccordionTrigger className="text-sm font-medium">
                    {group.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <tbody>
                        {group.specs.map((spec, j) => (
                          <tr
                            key={spec.key}
                            className={j < group.specs.length - 1 ? "border-b border-border" : ""}
                          >
                            <td className="py-2.5 pr-4 text-muted-foreground w-1/2">
                              {spec.key}
                            </td>
                            <td className="py-2.5 text-foreground font-medium">
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {product.reviews.length > 0 && (
          <section>
            <h2 className="mb-5 text-lg font-semibold text-foreground">
              Customer Reviews
            </h2>
            <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{product.rating}</p>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        product.rating && i < Math.round(product.rating)
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.reviewCount} reviews
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {review.user.name}
                      </p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
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
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {review.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const main = images[0] ?? "/placeholder-product.png";
  const thumbs = images.slice(1, 5);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/40">
        <Image
          src={main}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
      {thumbs.length > 0 && (
        <div className="flex gap-3">
          {thumbs.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square size-20 overflow-hidden rounded-lg bg-secondary/40 ring-1 ring-border transition-shadow hover:ring-foreground/30"
            >
              <Image
                src={src}
                alt={`${name} ${i + 2}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
