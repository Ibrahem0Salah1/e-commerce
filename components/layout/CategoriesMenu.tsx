import Link from "next/link";
import Image from "next/image";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { getCategories } from "@/lib/categories/queries";
import { getBrands } from "@/lib/categories/queries";

export async function CategoriesMenu() {
    const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent text-sm text-foreground hover:bg-transparent hover:text-primary data-[state=open]:bg-transparent data-[state=open]:text-primary">
                        Categories
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="grid w-[520px] grid-cols-[1fr_1.3fr] gap-4 p-4">
                            {/* ───── CATEGORIES ───── */}
                            <div>
                                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Categories
                                </p>
                                <div className="grid grid-cols-1 gap-1">
                                    {categories.map((category) => (
                                        <NavigationMenuLink asChild key={category.id}>
                                            <Link
                                                href={`/shop?category=${category.slug}`}
                                                className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
                                            >
                                                <p className="text-sm font-medium text-foreground">
                                                    {category.name}
                                                </p>
                                            </Link>
                                        </NavigationMenuLink>
                                    ))}
                                </div>
                            </div>

                            {/* ───── BRANDS ───── */}
                            <div className="border-l border-border pl-6">
                                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Brands
                                </p>
                                <div className="max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                    <div className="grid grid-cols-2 gap-1">
                                        {brands.map((brand) => (
                                            <NavigationMenuLink asChild key={brand.id}>
                                                <Link
                                                    href={`/shop?brand=${brand.slug}`}
                                                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
                                                >
                                                    {brand.logo ? (
                                                        <Image
                                                            src={brand.logo}
                                                            alt={brand.name}
                                                            width={24}
                                                            height={24}
                                                            className="h-6 w-6 shrink-0 rounded object-contain"
                                                        />
                                                    ) : (
                                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-semibold text-muted-foreground">
                                                            {brand.name[0]}
                                                        </div>
                                                    )}
                                                    <span className="truncate text-sm font-medium text-foreground">
                                                        {brand.name}
                                                    </span>
                                                </Link>
                                            </NavigationMenuLink>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}