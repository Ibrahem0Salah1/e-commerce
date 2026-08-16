import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBrands } from "@/lib/brands/queries";
import { CardsSlider } from "@/components/home/CardsSlider";

export async function ShopByBrands() {
  const brands = await getBrands(12);

  if (brands.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-b border-border/10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Shop by Brand
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore products from world-leading dental manufacturers
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="hidden sm:inline-flex rounded-md border-border/30 bg-background text-xs font-semibold px-4 h-9 hover:bg-accent transition-colors"
        >
          <Link href="/shop">Explore all brands</Link>
        </Button>
      </div>

      <CardsSlider items={brands} variant="brand" />

      <div className="mt-6 text-center sm:hidden">
        <Button
          variant="outline"
          asChild
          className="w-full rounded-md border-border/30 bg-background text-xs font-semibold h-10"
        >
          <Link href="/shop">Explore all brands</Link>
        </Button>
      </div>
    </section>
  );
}
