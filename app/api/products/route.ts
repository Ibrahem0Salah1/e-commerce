// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getProductsServer,
  getProductsInventory,
  mergeInventoryIntoProducts,
} from "@/lib/products/queries";
import { filtersParsers } from "@/lib/products/filters";
import { createSearchParamsCache } from "nuqs/server";
import { ProductListItem } from "@/lib/types";

const cache = createSearchParamsCache(filtersParsers);

export async function GET(request: NextRequest) {
  const filters = cache.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  try {
    // 1. Heavy display data from Redis cache (joins, reviews, etc.)
    const displayData = await getProductsServer(filters);

    // 2. Fresh stock from DB (lightweight, no cache)
    const productIds = displayData.products.map((p: {id:string}) => p.id);
    const inventoryMap = await getProductsInventory(productIds);

    // 3. Merge so client always sees accurate stock
    const productsWithStock = mergeInventoryIntoProducts(
      displayData.products as ProductListItem[],
      inventoryMap as Map<string, number>,
    ) as ProductListItem[];

    return NextResponse.json({
      products: productsWithStock,
      pagination: displayData.pagination,
    });
  } catch (error) {
    console.error("[API /products]", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}