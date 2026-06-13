import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { getFeaturedProducts } from "@/lib/products";

export async function FeaturedProducts() {
    const products = await getFeaturedProducts(8);

    if (products.length === 0) return null;

    return (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Featured products</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Hand-picked essentials trusted by clinics nationwide
                    </p>
                </div>
                <Button variant="outline" asChild className="hidden sm:inline-flex">
                    <Link href="/shop">View all</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 grid-rows-[auto_1fr]">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
                <Button variant="outline" asChild>
                    <Link href="/shop">View all products</Link>
                </Button>
            </div>
        </section>
    );
}