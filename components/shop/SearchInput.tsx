"use client";

import { Input } from "@/components/ui/input";
import { useProductFilters } from "@/hooks/use-product-filters";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function SearchInput() {
  const [filters, setFilters] = useProductFilters();
  const [value, setValue] = useState(filters.q);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== filters.q) {
        setFilters({ q: value, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, filters.q, setFilters]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-10"
        placeholder="Search products..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
