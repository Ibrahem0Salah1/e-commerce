"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductFilters } from "@/hooks/use-product-filters";

type FilterOption = {
  id: string;
  name: string;
  slug: string;
};

type BrandOption = FilterOption & {
  logo: string | null;
};

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export function ShopFiltersClient({
  categories,
  brands,
}: {
  categories: FilterOption[];
  brands: BrandOption[];
}) {
  const [filters, setFilters] = useProductFilters();

  const updateFilters = (nextFilters: Partial<typeof filters>) => {
    void setFilters({
      ...nextFilters,
      page: 1,
    });
  };

  const clearFilters = () => {
    void setFilters({
      category: "",
      brand: "",
      q: "",
      featured: false,
      sort: "name",
      page: 1,
      limit: 20,
    });
  };

  return (
    <aside className="rounded-lg border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Filters</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Refine dental supplies by catalog, brand, and price order.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Reset filters"
          onClick={clearFilters}
        >
          <RotateCcw />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            updateFilters({ category: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <Label>Brand</Label>
        <Select
          value={filters.brand || "all"}
          onValueChange={(value) =>
            updateFilters({ brand: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-y-auto">
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.slug}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      <div className="flex items-center gap-2">
        <Checkbox
          id="featured"
          checked={filters.featured}
          onCheckedChange={(checked) =>
            updateFilters({ featured: checked === true })
          }
        />
        <Label htmlFor="featured" className="font-normal">
          Featured products only
        </Label>
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <Label>Sort by</Label>
        <Select
          value={filters.sort}
          onValueChange={(value) =>
            updateFilters({
              sort: value as (typeof sortOptions)[number]["value"],
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
