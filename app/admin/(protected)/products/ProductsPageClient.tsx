"use client";

import { useState, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductList } from "@/components/admin/ProductList";
import { deleteProductAction } from "@/lib/products/admin-actions";
import type { ProductListItem } from "@/lib/types";

type Props = {
  products: ProductListItem[];
};

export function ProductsPageClient({ products }: Props) {
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      query
        ? products.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()),
          )
        : products,
    [products, query],
  );

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to archive this product?")) return;
    setDeleting(productId);
    await deleteProductAction(productId);
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        {deleting ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="pl-10 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {products.length} products
      </p>

      <ProductList products={filtered} onDelete={handleDelete} />
    </div>
  );
}
