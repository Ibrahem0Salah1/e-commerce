import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/config/prisma";
import { testimonialSelect } from "@/lib/reviews/selects";

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
    select: testimonialSelect,
  });

  return NextResponse.json({ reviews });
}
