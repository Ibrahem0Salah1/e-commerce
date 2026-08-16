"use client";

import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductFilters } from "@/hooks/use-product-filters";
import type { BrandListItem, CategoryWithFamilies } from "@/lib/types";

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "stock_asc", label: "Stock: low to high" },
  { value: "stock_desc", label: "Stock: high to low" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

export function AdminFilters({
  categories,
  brands,
}: {
  categories: CategoryWithFamilies[];
  brands: BrandListItem[];
}) {
  const [filters, setFilters] = useProductFilters();

  const updateFilters = (next: Partial<typeof filters>) => {
    void setFilters({ ...next, page: 1 });
  };

  const clearFilters = () => {
    void setFilters({
      q: "",
      category: "",
      family: "",
      brand: "",
      featured: false,
      bestSeller: false,
      inStock: false,
      outOfStock: false,
      lowStock: false,
      sort: "name",
      page: 1,
      limit: 20,
    });
  };

  const selectedCategory = categories.find((c) => c.slug === filters.category);
  const families = selectedCategory?.families ?? [];
  const selectedFamily = families.find((f) => f.slug === filters.family);
  const selectedBrand = brands.find((b) => b.slug === filters.brand);

  const chips = [
    selectedCategory && {
      key: "category",
      label: selectedCategory.name,
      clear: () => updateFilters({ category: "", family: "" }),
    },
    selectedFamily && {
      key: "family",
      label: selectedFamily.name,
      clear: () => updateFilters({ family: "" }),
    },
    selectedBrand && {
      key: "brand",
      label: selectedBrand.name,
      clear: () => updateFilters({ brand: "" }),
    },
    filters.featured && {
      key: "featured",
      label: "Featured",
      clear: () => updateFilters({ featured: false }),
    },
    filters.bestSeller && {
      key: "bestSeller",
      label: "Best Seller",
      clear: () => updateFilters({ bestSeller: false }),
    },
    filters.inStock && {
      key: "inStock",
      label: "In stock",
      clear: () => updateFilters({ inStock: false }),
    },
    filters.outOfStock && {
      key: "outOfStock",
      label: "Out of stock",
      clear: () => updateFilters({ outOfStock: false }),
    },
    filters.lowStock && {
      key: "lowStock",
      label: "Low stock (<5)",
      clear: () => updateFilters({ lowStock: false }),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  return (
    <div className="space-y-3 rounded-lg border border-border/40 bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              updateFilters({
                category: value === "all" ? "" : value,
                family: "",
              })
            }
          >
            <SelectTrigger className="w-44">
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

        {families.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Family</Label>
            <Select
              value={filters.family || "all"}
              onValueChange={(value) =>
                updateFilters({ family: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All families" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All families</SelectItem>
                {families.map((family) => (
                  <SelectItem key={family.id} value={family.slug}>
                    {family.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Brand</Label>
          <Select
            value={filters.brand || "all"}
            onValueChange={(value) =>
              updateFilters({ brand: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="w-44">
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

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sort by</Label>
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              updateFilters({ sort: value as SortValue })
            }
          >
            <SelectTrigger className="w-44">
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

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Reset filters"
          onClick={clearFilters}
          className="rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="admin-featured"
            checked={filters.featured}
            onCheckedChange={(checked) =>
              updateFilters({ featured: checked === true })
            }
            className="rounded-[4px] border-border"
          />
          <Label htmlFor="admin-featured" className="text-xs font-normal">
            Featured
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="admin-best-seller"
            checked={filters.bestSeller}
            onCheckedChange={(checked) =>
              updateFilters({ bestSeller: checked === true })
            }
            className="rounded-[4px] border-border"
          />
          <Label htmlFor="admin-best-seller" className="text-xs font-normal">
            Best Seller
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="admin-in-stock"
            checked={filters.inStock}
            onCheckedChange={(checked) =>
              updateFilters({ inStock: checked === true })
            }
            className="rounded-[4px] border-border"
          />
          <Label htmlFor="admin-in-stock" className="text-xs font-normal">
            In stock
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="admin-out-of-stock"
            checked={filters.outOfStock}
            onCheckedChange={(checked) =>
              updateFilters({ outOfStock: checked === true })
            }
            className="rounded-[4px] border-border"
          />
          <Label htmlFor="admin-out-of-stock" className="text-xs font-normal">
            Out of stock
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="admin-low-stock"
            checked={filters.lowStock}
            onCheckedChange={(checked) =>
              updateFilters({ lowStock: checked === true })
            }
            className="rounded-[4px] border-border"
          />
          <Label htmlFor="admin-low-stock" className="text-xs font-normal">
            Low stock (&lt;5)
          </Label>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="group flex items-center gap-1 rounded-full border border-border/20 bg-secondary/40 py-1 pl-2.5 pr-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
            >
              {chip.label}
              <X className="h-3 w-3 text-muted-foreground/60 transition-colors group-hover:text-destructive" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
