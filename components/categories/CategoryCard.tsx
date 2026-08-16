"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import type { CategoryListItem } from "@/lib/categories/queries";

interface CategoryCardProps {
  category: CategoryListItem;
  priority?: boolean;
}

export function CategoryCard({ category, priority = false }: CategoryCardProps) {
  const imageUrl = category.image || "/zz.svg";

  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group block h-full select-none"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
        {/* Image Box */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30 p-4 flex items-center justify-center border-b border-border/20">
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Content Box */}
        <div className="flex flex-1 flex-col items-center justify-center p-3.5 text-center">
          <h3 className="text-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-primary line-clamp-1">
            {category.name}
          </h3>
          {category._count?.products !== undefined && (
            <span className="mt-1 text-[11px] font-medium text-muted-foreground">
              {category._count.products} {category._count.products === 1 ? "Product" : "Products"}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
