import { NextRequest, NextResponse } from "next/server";
import { getProductsServer } from "@/lib/products";
import { filtersParsers } from "@/lib/products/filters";
import { createSearchParamsCache } from "nuqs/server";

const cache = createSearchParamsCache(filtersParsers);

export async function GET(request: NextRequest) {
  try {
    const filters = cache.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const data = await getProductsServer(filters);
    return NextResponse.json(data);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
