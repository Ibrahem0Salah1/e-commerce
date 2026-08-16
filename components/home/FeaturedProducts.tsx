// components/home/FeaturedProducts.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts, getProductsInventory, mergeInventoryIntoProducts } from "@/lib/products/queries";
import { CardsSlider } from "@/components/home/CardsSlider";

export async function FeaturedProducts() {
  // 1. Cached display data (no stock)
  const displayProducts = await getFeaturedProducts();

  if (displayProducts.length === 0) return null;

  // 2. Fresh inventory from DB
  const productIds = displayProducts.map((p) => p.id);
  const inventoryMap = await getProductsInventory(productIds);

  // 3. Merge so ProductCard gets its required `stock` field
  const products = mergeInventoryIntoProducts(displayProducts, inventoryMap);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-border/10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Featured Products
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Hand-picked essentials trusted by clinics nationwide
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="hidden sm:inline-flex rounded-md border-border/30 bg-background text-xs font-semibold px-4 h-9 hover:bg-accent transition-colors"
        >
          <Link href="/shop?featured=true">View all</Link>
        </Button>
      </div>

      <CardsSlider products={products} />

      <div className="mt-8 text-center sm:hidden">
        <Button
          variant="outline"
          asChild
          className="w-full rounded-md border-border/30 bg-background text-xs font-semibold h-10"
        >
          <Link href="/shop?featured=true">View all products</Link>
        </Button>
      </div>
    </section>
  );
}