"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getCategoriesWithFamilies } from "@/lib/categories/queries";
import { getBrands } from "@/lib/brands/queries";
type Category = Awaited<ReturnType<typeof getCategoriesWithFamilies>>[number];
type Brand = Awaited<ReturnType<typeof getBrands>>[number];

interface CategoriesMenuProps {
    categories: Category[];
    brands: Brand[];
}

const BRANDS_ID = "__brands__";

export default function CategoriesMenuClient({ categories, brands }: CategoriesMenuProps) {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const active = categories.find((c) => c.id === activeId) ?? categories[0];
    const isBrands = activeId === BRANDS_ID;

    return (
        <div
            className="relative hidden md:block"
            onMouseEnter={() => {
                setOpen(true);
                if (!activeId) setActiveId(categories[0]?.id ?? BRANDS_ID);
            }}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                type="button"
            >
                Categories
                <ChevronDown
                    className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        open && "rotate-180"
                    )}
                />
            </button>

            {/* hover bridge */}
            <div className="absolute left-0 right-0 top-full h-3" />

            <div
                className={cn(
                    "absolute left-0 top-[calc(100%+0.75rem)] z-50 origin-top",
                    "transition-all duration-200",
                    open
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-1 pointer-events-none"
                )}
                style={{ width: "min(920px, 90vw)" }}
            >
                <div className="grid grid-cols-[240px_1fr] overflow-hidden rounded-xl border border-border/60 bg-popover/95 backdrop-blur shadow-xl">
                    {/* Left: categories + brands */}
                    <ul className="border-r border-border/60 bg-muted/30 py-2 max-h-[70vh] overflow-y-auto">
                        {categories.map((cat) => {
                            const isActive = activeId === cat.id;
                            return (
                                <li key={cat.id}>
                                    <button
                                        type="button"
                                        onMouseEnter={() => setActiveId(cat.id)}
                                        className={cn(
                                            "group flex  w-full items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors",
                                            isActive
                                                ? "bg-background text-primary font-medium"
                                                : "text-black  hover:bg-background/10"
                                        )}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                        <ArrowRight
                                            className={cn(
                                                "h-3.5 w-3.5 shrink-0 transition-all",
                                                isActive
                                                    ? "opacity-100 translate-x-0"
                                                    : "opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0"
                                            )}
                                        />
                                    </button>
                                </li>
                            );
                        })}

                        {/* divider */}
                        <li className="my-2 mx-4 border-t border-border/60" />

                        <li>
                            <button
                                type="button"
                                onMouseEnter={() => setActiveId(BRANDS_ID)}
                                className={cn(
                                    "group flex  w-full items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors",
                                    isBrands
                                        ? "bg-background text-primary font-medium"
                                        : "text-black  hover:bg-background/10"
                                )}
                            >
                                <span className="truncate">Brands</span>
                                <ArrowRight
                                    className={cn(
                                        "h-3.5 w-3.5 shrink-0 transition-all",
                                        isBrands
                                            ? "opacity-100 translate-x-0"
                                            : "opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0"
                                    )}
                                />
                            </button>
                        </li>
                    </ul>

                    {/* Right: families or brands */}
                    <div className="p-5 max-h-[70vh] overflow-y-auto">
                        {isBrands ? (
                            <>
                                <div className="mb-4 flex items-baseline justify-between">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Shop by brand
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {brands.length} brands
                                    </span>
                                </div>
                                <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                                    {brands.map((brand) => (
                                        <li key={brand.slug}>
                                            <Link
                                                href={`/shop?brand=${brand.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-border/60 hover:bg-muted/50"
                                            >
                                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-background ring-1 ring-border/60">
                                                    <Image
                                                        src={brand.logo ?? "/zz.svg"}
                                                        alt={brand.name}
                                                        fill
                                                        sizes="40px"
                                                        className="object-contain p-1"
                                                    />
                                                </div>
                                                <span className="truncate text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                                    {brand.name}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : active ? (
                            <>
                                <div className=" flex items-baseline justify-between">
                                    <h3 className="text-base py-2 font-normal text-foreground">
                                        {active.name}
                                    </h3>
                                    <Link
                                        href={`/shop?category=${active.slug}`}
                                        onClick={() => setOpen(false)}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        View all →
                                    </Link>
                                </div>
                                <ul className="grid grid-cols-2 gap-1 lg:grid-cols-3">
                                    {active.families.map((family) => (
                                        <li key={family.slug}>
                                            <Link
                                                href={`/shop?category=${active.slug}&family=${family.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="group flex items-center font-normal justify-between gap-2 rounded-md p-2 text-base hover:bg-muted/60 hover:text-primary transition-colors"
                                            >
                                                <span className="truncate text-sm text-foreground/70 group-hover:text-primary transition-colors">{family.name}</span>
                                                <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
