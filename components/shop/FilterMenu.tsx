"use client";

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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useProductFilters } from "@/hooks/use-product-filters";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import type { FiltersFormFields } from "@/lib/types";
const sortOptions = [
  { value: "name", label: "Name" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

const defaultValues: FiltersFormFields = {
  category: "",
  brand: "",
  featured: false,
  sort: "name",
  q: ""
};

export function FilterMenu({
  categories,
  brands,
}: {
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string; logo: string | null }[];
}) {
  const [filters, setFilters] = useProductFilters();
  const [open, setOpen] = useState(false);

  const { handleSubmit, control, reset } = useForm<FiltersFormFields>({
    // sync form to current URL state every time the sheet opens
    defaultValues: {
      category: filters.category,
      brand: filters.brand,
      featured: filters.featured,
      sort: filters.sort,
      q: filters.q
    },
  });

  const onSubmit: SubmitHandler<FiltersFormFields> = (data) => {
    setFilters({ ...data, page: 1 });
    setOpen(false);
  };

  function handleClear() {
    reset(defaultValues);
    setFilters({ ...defaultValues, page: 1 });
    setOpen(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // re-sync form to URL state every time the sheet opens,
        // so it never shows stale values from a previous open
        if (next) {
          reset({
            category: filters.category,
            brand: filters.brand,
            // q: filters.q,
            featured: filters.featured,
            sort: filters.sort,
          });
        }
        setOpen(next);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="max-w-sm px-6">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value || "all"}
                  onValueChange={(value) => field.onChange(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Brand</Label>
            <Controller
              control={control}
              name="brand"
              render={({ field }) => (
                <Select
                  value={field.value || "all"}
                  onValueChange={(value) => field.onChange(value === "all" ? "" : value)}
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
              )}
            />
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <Checkbox
                  id="mobile-featured"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="mobile-featured" className="font-normal">
              Featured products only
            </Label>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Controller
              control={control}
              name="sort"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => field.onChange(value as FiltersFormFields["sort"])}>
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
              )}
            />
          </div>

          <div className="flex flex-row gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClear} className="flex-1">
              <RotateCcw /> Reset
            </Button>
            <Button type="submit" size="sm" className="flex-1">
              Apply filters
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}