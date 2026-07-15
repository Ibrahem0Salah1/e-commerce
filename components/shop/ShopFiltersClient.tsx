"use client";

import { RotateCcw, X } from "lucide-react";
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

type FamilyOption = FilterOption;

type CategoryWithFamilies = FilterOption & {
  families: FamilyOption[];
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
  categories: CategoryWithFamilies[];
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
      family: "",
      brand: "",
      q: "",
      featured: false,
      sort: "name",
      page: 1,
      limit: 20,
    });
  };

  const selectedCategory = categories.find(
    (c) => c.slug === filters.category,
  );
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
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  return (
    <aside className="rounded-[4px] border bg-card p-5 shadow-xs lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Filters</h2>
          <p className="mt-0.5 text-xs text-muted-foreground/75">
            Refine by catalog, brand, and price.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Reset filters"
          onClick={clearFilters}
          className="rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
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

      <Separator className="my-3.5 bg-border/15" />

      <div className="space-y-1.5">
        <Label className="text-sm  text-muted-foreground">Category</Label>
        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            updateFilters({
              category: value === "all" ? "" : value,
              family: "",
            })
          }
        >
          <SelectTrigger className="w-full rounded-[4px] border-border/60 hover:border-border/30 transition-colors">
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
        <div className="mt-4 space-y-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <Label className="text-sm text-muted-foreground">Family</Label>
          <Select
            value={filters.family || "all"}
            onValueChange={(value) =>
              updateFilters({ family: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="w-full rounded-[4px] border-border/60 hover:border-border/30 transition-colors">
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

      <Separator className="my-4 bg-border/15" />

      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground">Brand</Label>
        <Select
          value={filters.brand || "all"}
          onValueChange={(value) =>
            updateFilters({ brand: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="w-full rounded-[4px] border-border/60  hover:border-border/30 transition-colors">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-y-auto ">
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.slug}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4 bg-border/15" />

      <div className="flex items-center gap-2.5">
        <Checkbox
          id="featured"
          checked={filters.featured}
          onCheckedChange={(checked) =>
            updateFilters({ featured: checked === true })
          }
          className="rounded-[4px] border-border"
        />
        <Label htmlFor="featured" className="text-sm font-normal text-foreground/90">
          Featured products only
        </Label>
      </div>

      <Separator className="my-4 bg-border/15" />

      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground">Sort by</Label>
        <Select
          value={filters.sort}
          onValueChange={(value) =>
            updateFilters({
              sort: value as (typeof sortOptions)[number]["value"],
            })
          }
        >
          <SelectTrigger className="w-full rounded-[4px] border-border/60  hover:border-border/30 transition-colors">
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