"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProductFilters } from "@/hooks/use-product-filters";
import Link from "next/link";

export function ShopBreadcrumbs() {
  const [filters] = useProductFilters();
  const items: { label: string; href?: string; isPage?: boolean }[] = [];

  items.push({ label: "Products", href: "/shop" });

  if (filters.category) {
    items.push({ label: filters.category, href: "/shop" });
  }

  if (filters.brand) {
    items.push({ label: filters.brand, isPage: true });
  }

  if (filters.q) {
    items.push({ label: `"${filters.q}"`, isPage: true });
  }

  if (items.length === 1) {
    items[0] = { ...items[0], isPage: true };
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, i) => (
          <BreadcrumbItem key={i}>
            {item.isPage || i === items.length - 1 ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={item.href ?? "/shop"}>{item.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
        {items.length > 1 &&
          Array.from({ length: items.length - 1 }).map((_, i) => (
            <BreadcrumbSeparator key={`sep-${i}`} />
          ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
