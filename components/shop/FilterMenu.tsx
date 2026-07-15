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
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useProductFilters } from "@/hooks/use-product-filters";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
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
  family: "",
  brand: "",
  featured: false,
  sort: "name",
  q: "",
};

type FamilyOption = { id: string; name: string; slug: string };

type CategoryWithFamilies = {
  id: string;
  name: string;
  slug: string;
  families: FamilyOption[];
};

export function FilterMenu({
  categories,
  brands,
}: {
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string; logo: string | null }[];
}) {
  const [filters, setFilters] = useProductFilters();
  const [open, setOpen] = useState(false);

  const { handleSubmit, control, reset, watch, setValue } =
    useForm<FiltersFormFields>({
      defaultValues: {
        category: filters.category,
        family: filters.family,
        brand: filters.brand,
        featured: filters.featured,
        sort: filters.sort,
        q: filters.q,
      },
    });

  const watchedCategory = watch("category");

  const onSubmit: SubmitHandler<FiltersFormFields> = (data) => {
    setFilters({ ...data, page: 1 });
    setOpen(false);
  };

  // Keep internal form state synchronized with actual URL filters when drawer opens
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      reset({
        category: filters.category,
        family: filters.family,
        brand: filters.brand,
        featured: filters.featured,
        sort: filters.sort,
        q: filters.q,
      });
    }
    setOpen(nextOpen);
  }

  function handleClear() {
    reset(defaultValues);
    setFilters({ ...defaultValues, page: 1 });
    setOpen(false);
  }

  const selectedCategory = categories.find((c) => c.slug === watchedCategory);
  const families = selectedCategory?.families ?? [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="group flex items-center gap-2 rounded-[6px] border border-border/25 bg-background/50 hover:bg-secondary/40 text-xs font-semibold px-3.5 py-1.5 transition-all shadow-xs hover:border-border/50 hover:text-foreground"
        >
          <SlidersHorizontal className="h-3 w-3 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-screen max-w-none data-[side=right]:w-screen data-[side=right]:max-w-none sm:max-w-none border-l-0 p-0 duration-300 ease-out data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full flex flex-col"
      >
        {/* ───── STICKY HEADER ───── */}
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/15 bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <SheetTitle className="text-sm font-bold">Filters</SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            className="rounded-full text-muted-foreground hover:bg-secondary/60"
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 flex flex-col gap-0 overflow-y-auto overscroll-contain px-5 pb-24"
        >
          {/* CATEGORY */}
          <div className="py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both">
            <Label className="mb-2 block text-xs font-semibold text-muted-foreground/80">
              Category
            </Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value || "all"}
                  onValueChange={(value) => {
                    const catValue = value === "all" ? "" : value;
                    field.onChange(catValue);
                    setValue("family", "");
                  }}
                >
                  <SelectTrigger className="w-full rounded-[6px] border-border/15 hover:border-border/30 transition-colors">
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

          {families.length > 0 && (
            <div className="pb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both delay-75">
              <Label className="mb-2 block text-xs font-semibold text-muted-foreground/80">
                Family
              </Label>
              <Controller
                control={control}
                name="family"
                render={({ field }) => (
                  <Select
                    value={field.value || "all"}
                    onValueChange={(value) =>
                      field.onChange(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full rounded-[6px] border-border/15 hover:border-border/30 transition-colors">
                      <SelectValue placeholder="All families" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All families</SelectItem>
                      {families.map((fam) => (
                        <SelectItem key={fam.id} value={fam.slug}>
                          {fam.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <Separator className="bg-border/15" />

          {/* BRAND */}
          <div className="py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both delay-100">
            <Label className="mb-2 block text-xs font-semibold text-muted-foreground/80">
              Brand
            </Label>
            <Controller
              control={control}
              name="brand"
              render={({ field }) => (
                <Select
                  value={field.value || "all"}
                  onValueChange={(value) =>
                    field.onChange(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-full rounded-[6px] border-border/15 hover:border-border/30 transition-colors">
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

          <Separator className="bg-border/15" />

          {/* FEATURED */}
          <div className="flex items-center gap-2.5 py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both delay-150">
            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <Checkbox
                  id="mobile-featured"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  className="rounded-[4px] border-border/30"
                />
              )}
            />
            <Label
              htmlFor="mobile-featured"
              className="text-sm font-normal text-foreground/80"
            >
              Featured products only
            </Label>
          </div>

          <Separator className="bg-border/15" />

          {/* SORT */}
          <div className="py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both delay-200">
            <Label className="mb-2 block text-xs font-semibold text-muted-foreground/80">
              Sort by
            </Label>
            <Controller
              control={control}
              name="sort"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as FiltersFormFields["sort"])
                  }
                >
                  <SelectTrigger className="w-full rounded-[6px] border-border/15 hover:border-border/30 transition-colors">
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
        </form>

        {/* ───── STICKY FOOTER ───── */}
        <div className="sticky bottom-0 flex gap-2 border-t border-border/15 bg-background/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="flex-1 rounded-[6px] border-border/20 text-foreground/70 hover:bg-secondary/40 h-10 text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
          <Button
            type="submit"
            size="sm"
            className="flex-1 rounded-[6px] h-10 text-xs font-semibold"
            onClick={() => {
              const form = document.querySelector("form");
              form?.requestSubmit();
            }}
          >
            Apply filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
