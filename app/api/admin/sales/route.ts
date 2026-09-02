import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/authz";
import { salesQuerySchema } from "@/lib/validations";
import {
  getSalesSummary,
  getSalesTimeSeries,
  getProductProfitability,
} from "@/lib/sales/queries";
import { fromZonedTime } from "date-fns-tz";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = salesQuerySchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    granularity: searchParams.get("granularity") ?? "day",
    deliveredOnly: searchParams.get("deliveredOnly"),
    sortBy: searchParams.get("sortBy") ?? "profit",
    limit: searchParams.get("limit") ?? "20",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { from, to, granularity, deliveredOnly, sortBy, limit } = parsed.data;

  function parseCairo(v: string | null | undefined, endOfDay: boolean): Date | undefined {
    if (!v) return undefined;
    // from/to are already YYYY-MM-DD validated by Zod; no fallback to `new Date(v)` to avoid silent invalid handling
    const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
    const d = fromZonedTime(`${v}T${time}`, "Africa/Cairo");
    return isNaN(d.getTime()) ? undefined : d;
  }

  let validFrom = parseCairo(from, false);
  let validTo = parseCairo(to, true);
  // swap if from > to (same as page.tsx:64) instead of returning empty set
  if (validFrom && validTo && validFrom > validTo) {
    const tmp = validFrom;
    validFrom = validTo;
    validTo = tmp;
  }

  try {
    const [summary, timeSeries, products] = await Promise.all([
      getSalesSummary({ from: validFrom, to: validTo, deliveredOnly: deliveredOnly ?? false }),
      getSalesTimeSeries({
        from: validFrom,
        to: validTo,
        granularity: granularity as "day" | "week" | "month",
        deliveredOnly: deliveredOnly ?? false,
      }),
      getProductProfitability({
        from: validFrom,
        to: validTo,
        deliveredOnly: deliveredOnly ?? false,
        limit,
        sortBy: sortBy as "profit" | "revenue" | "qty",
      }),
    ]);
    return NextResponse.json({ summary, timeSeries, products });
  } catch (err) {
    console.error("[sales] query failed:", err);
    return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
  }
}
