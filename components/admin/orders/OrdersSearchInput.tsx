"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useOrdersFilters } from "@/hooks/useOrdersFilters";

/**
 * Debounced search bound to the `q` URL param of the admin orders page.
 * Resetting the page param on every query keeps pagination consistent.
 */
export function OrdersSearchInput() {
  const [filters, setFilters] = useOrdersFilters();
  const [value, setValue] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stay in sync when the URL changes externally (e.g. "Reset filters").
  useEffect(() => {
    setValue(filters.q);
  }, [filters.q]);

  // Clear any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, []);

  function update(value: string) {
    setValue(value);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ q: value || null, page: null });
      debounceRef.current = null;
    }, 350);
  }

  function clear() {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setValue("");
    setFilters({ q: null, page: null });
  }

  return (
    <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="Search ID, name, phone, city, email..."
        className="pl-9 pr-9"
        aria-label="Search orders"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
