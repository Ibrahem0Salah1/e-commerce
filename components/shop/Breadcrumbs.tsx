"use client";
import React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProductFilters } from "@/hooks/use-product-filters";

type Crumb = {
  label: string;
  href: string;
};

export function ShopBreadcrumbs({
  categories,
  brands,
}: {
  categories: { slug: string; name: string }[];
  brands: { slug: string; name: string }[];
}) {
  const [filters] = useProductFilters();
  const crumbs: Crumb[] = [{ label: "Products", href: "/shop" }];

  const params = new URLSearchParams();

  if (filters.category) {
    const category = categories.find((c) => c.slug === filters.category);
    params.set("category", filters.category);
    crumbs.push({
      label: category?.name ?? filters.category,
      href: `/shop?${params.toString()}`,
    });
  }

  if (filters.brand) {
    const brand = brands.find((b) => b.slug === filters.brand);
    params.set("brand", filters.brand);
    crumbs.push({
      label: brand?.name ?? filters.brand,
      href: `/shop?${params.toString()}`,
    });
  }

  if (filters.q) {
    const qParams = new URLSearchParams(params);
    qParams.set("q", filters.q);
    crumbs.push({
      label: `"${filters.q}"`,
      href: `/shop?${qParams.toString()}`,
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            // Fragment, NOT nested inside BreadcrumbItem —
            // BreadcrumbItem and BreadcrumbSeparator are both
            // <li> elements and must be siblings under <ol>
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}