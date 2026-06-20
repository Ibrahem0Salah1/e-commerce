"use client";

import { useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useProductFilters } from "@/hooks/use-product-filters";
import { useProducts } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";

export function SearchInput() {
  const [{ q }, setFilters] = useProductFilters();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // scoped to the actual products query — true only while a request
  // this component triggered (via filters) is in flight, not every
  // query in the app under a loose key prefix
  const { isFetching } = useProducts();

  function updateQuery(value: string) {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ q: value, page: 1 });
      debounceRef.current = null;
    }, 400);
  }

  function handleClear() {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (inputRef.current) inputRef.current.value = "";
    setFilters({ q: "", page: 1 });
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      {isFetching ? (
        <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
      ) : (
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}

      <Input
        ref={inputRef}
        defaultValue={q}
        onChange={(e) => updateQuery(e.target.value)}
        placeholder="Search products..."
        className="pl-10 pr-9"
      />

      {q && !isFetching && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}