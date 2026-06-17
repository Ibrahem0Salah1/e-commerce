import { ShopFilters } from "@/components/shop/ShopFilters";
import { getBrands, getCategories } from "@/lib/categories";

export default async function ShopListLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

    return (
        <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="hidden lg:col-span-3 lg:block">
                <ShopFilters categories={categories} brands={brands} />
            </div>
            <div className="lg:col-span-9">{children}</div>
        </main>
    );
}
