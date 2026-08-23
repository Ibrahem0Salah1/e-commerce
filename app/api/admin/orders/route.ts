import { NextRequest, NextResponse } from "next/server";
import { getAdminOrders } from "@/lib/orders/queries";
import { requireAdmin } from "@/lib/auth/authz";
import { orderFiltersCache, resolveAdminOrderFilters } from "@/lib/orders/filters";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const filters = await orderFiltersCache.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const result = await getAdminOrders(resolveAdminOrderFilters(filters));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /admin/orders]", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
