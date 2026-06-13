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
import { getCategories } from "@/lib/categories";
import { getBrands } from "@/lib/categories";

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
                        <div className="grid grid-cols-2 w-255 gap-4  p-4">
                            {/* ───── CATEGORIES ───── */}
                            <div>
                                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Categories
                                </p>
                                <div className="grid grid-cols-2 gap-1">
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
                                                        width={44}
                                                        height={44}
                                                        unoptimized
                                                        className="rounded object-contain"
                                                    />
                                                ) : (
                                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-[10px] font-semibold text-muted-foreground">
                                                        {brand.name[0]}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-foreground">
                                                    {brand.name}
                                                </span>
                                            </Link>
                                        </NavigationMenuLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}