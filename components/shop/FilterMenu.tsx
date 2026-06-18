"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useProductFilters } from "@/hooks/use-product-filters";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export function FilterMenu({
  categories,
  brands,
}: {
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string; logo: string | null }[];
}) {
  const [filters, setFilters] = useProductFilters();
  const [draft, setDraft] = useState({ ...filters });
  const [open, setOpen] = useState(false);

  const updateDraft = (next: Partial<typeof draft>) => {
    setDraft((prev) => ({ ...prev, ...next }));
  };

  const apply = () => {
    setFilters({ ...draft, page: 1 });
    setOpen(false);
  };

  const clear = () => {
    const cleared = {
      category: "",
      brand: "",
      featured: false,
      sort: "name" as const,
    };
    setDraft((prev) => ({ ...prev, ...cleared }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className=" px-6 max-w-sm  ">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={draft.category || "all"}
              onValueChange={(value) =>
                updateDraft({ category: value === "all" ? "" : value })
              }
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
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Brand</Label>
            <RadioGroup
              value={draft.brand || "all"}
              onValueChange={(value) =>
                updateDraft({ brand: value === "all" ? "" : value })
              }
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="mobile-brand-all" value="all" />
                <Label htmlFor="mobile-brand-all" className="font-normal">
                  All brands
                </Label>
              </div>
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`mobile-brand-${brand.id}`}
                    value={brand.slug}
                  />
                  <Label
                    htmlFor={`mobile-brand-${brand.id}`}
                    className="font-normal"
                  >
                    {brand.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Checkbox
              id="mobile-featured"
              checked={draft.featured}
              onCheckedChange={(checked) =>
                updateDraft({ featured: checked === true })
              }
            />
            <Label htmlFor="mobile-featured" className="font-normal">
              Featured products only
            </Label>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select
              value={draft.sort}
              onValueChange={(value) =>
                updateDraft({
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

          <div className="flex flex-row gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={clear} className="flex-1">
              <RotateCcw />
              Reset
            </Button>
            <SheetClose asChild>
              <Button size="sm" onClick={apply} className="flex-1">
                Apply filters
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
