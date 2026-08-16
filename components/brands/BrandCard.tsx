"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Award } from "lucide-react";
import type { BrandListItem } from "@/lib/brands/queries";

interface BrandCardProps {
  brand: BrandListItem;
  priority?: boolean;
}

export function BrandCard({ brand, priority = false }: BrandCardProps) {
  const logoUrl = brand.logo;

  return (
    <Link
      href={`/shop?brand=${brand.slug}`}
      className="group block h-full select-none"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
        {/* Logo / Image Box */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/20 p-4 flex items-center justify-center border-b border-border/20">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={brand.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/60 transition-transform duration-500 group-hover:scale-105">
              <Award className="h-10 w-10 stroke-1" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Content Box */}
        <div className="flex flex-1 flex-col items-center justify-center p-3.5 text-center">
          <h3 className="text-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-primary line-clamp-1">
            {brand.name}
          </h3>
          {brand._count?.products !== undefined && (
            <span className="mt-1 text-[11px] font-medium text-muted-foreground">
              {brand._count.products} {brand._count.products === 1 ? "Product" : "Products"}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
