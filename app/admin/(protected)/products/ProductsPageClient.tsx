"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, X, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductList } from "@/components/admin/ProductList";
import {
  deleteProductAndInvalidate,
  toggleProductActiveAndInvalidate,
} from "@/lib/admin/actions";
import type { ProductListItem } from "@/lib/types";

type Props = {
  products: ProductListItem[];
};

export function ProductsPageClient({ products }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

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
    setLoading(productId);
    try {
      await deleteProductAndInvalidate(productId);
      toast.success("Product archived");
    } catch (err) {
      toast.error("Failed to archive product", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleToggleActive(productId: string) {
    setLoading(productId);
    try {
      await toggleProductActiveAndInvalidate(productId);
      toast.success("Product status updated");
    } catch (err) {
      toast.error("Failed to update product", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          {loading ? (
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
        <Button asChild className="cursor-pointer ml-3">
          <Link href="/admin/products/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {products.length} products
      </p>

      <ProductList
        products={filtered}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
