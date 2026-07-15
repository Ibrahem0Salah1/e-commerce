import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBestsellerProducts } from "@/lib/products/queries";
import { CardsSlider, type CardData } from "@/components/home/CardsSlider";

export async function BestsellerProducts() {
  const products = await getBestsellerProducts();

  if (products.length === 0) return null;

  const sliderCards: CardData[] = products.map((p, i) => ({
    id: i + 1,
    title: p.name,
    category: p.category?.name ?? "",
    image: p.images[0] ?? "",
    slug: p.slug,
    description: p.description[1] ?? "",
    brand: p.brand?.name ?? "MDS",
    price: p.basePrice,
    variantsCount: p.variants.length,
    rating: p.rating,
    reviewCount: p.reviewCount,
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-border/10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Bestsellers
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Our most popular supplies, chosen repeatedly by dental professionals
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="hidden sm:inline-flex rounded-[6px] border-border/25 bg-background/50 hover:bg-secondary/40 text-xs font-semibold px-4 py-1.5 h-9 hover:border-border/50 hover:text-foreground transition-all shadow-xs"
        >
          <Link href="/shop">View all</Link>
        </Button>
      </div>

      <CardsSlider cards={sliderCards} />

      <div className="mt-8 text-center sm:hidden">
        <Button
          variant="outline"
          asChild
          className="w-full rounded-[6px] border-border/25 bg-background/50 hover:bg-secondary/40 text-xs font-semibold py-2 h-10"
        >
          <Link href="/shop">View all products</Link>
        </Button>
      </div>
    </section>
  );
}
