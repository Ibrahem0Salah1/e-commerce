import { NextRequest, NextResponse } from "next/server";
import { getAdminOrderMetrics } from "@/lib/orders/queries";
import { requireAdmin } from "@/lib/auth/authz";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const metrics = await getAdminOrderMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[API /admin/orders/metrics]", error);
    return NextResponse.json(
      { error: "Failed to fetch order metrics" },
      { status: 500 },
    );
  }
}
