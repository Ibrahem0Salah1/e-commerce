import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import prisma from "@/lib/config/prisma";
import {
  validateCheckoutInput,
  createOrderForUser,
} from "@/lib/orders/create-order";

/**
 * ⚠️ INTERNAL LOAD-TEST ENDPOINT — never exposed without LOADTEST_SECRET.
 *
 * Fails CLOSED: if LOADTEST_SECRET is unset, every request is rejected.
 * Requires a real authenticated session (k6 signs in during setup) so orders
 * are attributed to a real user and the full pipeline (validation →
 * idempotency → transactional execution) runs EXACTLY as production.
 *
 * Deliberately bypassed: checkout rate limits and Turnstile — we are measuring
 * database contention, not Upstash latency.
 */

const RESULT_STATUS: Record<string, number> = {
  AUTH: 401,
  VALIDATION: 400,
  OUT_OF_STOCK: 409,
  INVALID_ITEM: 409,
  DUPLICATE: 409,
  SHIPPING_INVALID: 409,
  FORBIDDEN: 403,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
};

function authorized(request: NextRequest): boolean {
  const secret = process.env.LOADTEST_SECRET;
  if (!secret) return false; // fail closed
  return request.headers.get("x-loadtest-secret") === secret;
}

/** Discovery: active shipping methods + loadtest products by slug. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slugsParam = request.nextUrl.searchParams.get("slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const [shippingMethods, products] = await Promise.all([
    prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, price: true },
    }),
    slugs.length > 0
      ? prisma.product.findMany({
          where: { slug: { in: slugs } },
          select: { id: true, slug: true, stock: true, isActive: true },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    shippingMethods: shippingMethods.map((m) => ({
      ...m,
      price: Number(m.price),
    })),
    products,
  });
}

/** Places an order through the REAL shared core pipeline. */
export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, code: "AUTH", error: "Sign-in required." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, code: "VALIDATION", error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const validated = validateCheckoutInput(body);
  if (!validated.success) {
    return NextResponse.json(
      {
        success: false,
        code: "VALIDATION",
        error: validated.error,
      },
      { status: 400 },
    );
  }

  const result = await createOrderForUser(validated.data, session.user.id);

  const status = result.success
    ? 200
    : (RESULT_STATUS[result.code] ?? 500);

  return NextResponse.json(result, { status });
}
