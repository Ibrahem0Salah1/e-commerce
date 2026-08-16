// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminProducts } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth/authz";
import { filtersParsers } from "@/lib/products/filters";
import { createSearchParamsCache } from "nuqs/server";

const cache = createSearchParamsCache(filtersParsers);

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const filters = cache.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const result = await getAdminProducts(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /admin/products]", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
