import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts } from "@/lib/products";
import { CardsSlider, type CardData } from "@/components/home/CardsSlider";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  const sliderCards: CardData[] = products.map((p, i) => ({
    id: i + 1,
    title: p.name,
    description: p.description.join(" "),
    category: p.category.name,
    image: p.images[0] ?? "",
    slug: p.slug,
    author: {
      name: p.brand?.name ?? "Dental Store",
      avatar: p.brand?.logo ?? "/placeholder-brand.png",
    },
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    readTime: `${p.variants.length} variant${p.variants.length !== 1 ? "s" : ""}`,
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Featured products
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hand-picked essentials trusted by clinics nationwide
          </p>
        </div>
        <Button variant="outline" asChild className="hidden sm:inline-flex">
          <Link href="/shop">View all</Link>
        </Button>
      </div>

      <CardsSlider cards={sliderCards} />

      <div className="mt-8 text-center sm:hidden">
        <Button variant="outline" asChild>
          <Link href="/shop">View all products</Link>
        </Button>
      </div>
    </section>
  );
}