import { NextRequest, NextResponse } from "next/server";
import { getProductsServer } from "@/lib/products/queries";
import { filtersParsers } from "@/lib/products/filters";
import { createSearchParamsCache } from "nuqs/server";

const cache = createSearchParamsCache(filtersParsers);

export async function GET(request: NextRequest) {
  // Read searchParams outside try/catch so the prerender bailout can propagate
  const filters = cache.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  try {
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