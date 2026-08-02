import { ShopFilters } from "@/components/shop/ShopFilters";
import { getCategoriesWithFamilies } from "@/lib/categories/queries";
import { getBrands } from "@/lib/brands/queries";
export default async function ShopListLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [categories, brands] = await Promise.all([getCategoriesWithFamilies(), getBrands()]);
    void getCategoriesWithFamilies(); // warm the cache
    void getBrands();
    return (
        <main className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-10">
            <div className="hidden lg:col-span-3 lg:block">
                <ShopFilters categories={categories} brands={brands} />
            </div>
            <div className="lg:col-span-9">{children}</div>
        </main>
    );
}
