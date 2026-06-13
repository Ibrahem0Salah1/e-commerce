import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? "6");
  const minRating = Number(params.get("minRating") ?? "4");

  const reviews = await prisma.review.findMany({
    where: {
      isVisible: true,
      rating: { gte: minRating },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      verifiedPurchase: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ reviews });
}
