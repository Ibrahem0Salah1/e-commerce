import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const category = params.get("category");
  const brand = params.get("brand");
  const q = params.get("q");
  const featured = params.get("featured");
  const sort = params.get("sort");
  const page = Number(params.get("page") ?? "1");
  const limit = Number(params.get("limit") ?? "12");

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category && { category: { slug: category } }),
    ...(brand && { brand: { slug: brand } }),
    ...(featured === "true" && { featured: true }),
    ...(q && { name: { contains: q, mode: "insensitive" } }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { basePrice: "asc" }
      : sort === "price_desc"
        ? { basePrice: "desc" }
        : sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        images: true,
        featured: true,
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        variants: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          select: { id: true, name: true, price: true, stock: true },
        },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true, variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map(
    ({ reviews, _count, variants, basePrice, ...rest }) => {
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;

      return {
        ...rest,
        basePrice: Number(basePrice),
        variants: variants.map((v) => ({ ...v, price: Number(v.price) })),
        variantCount: _count.variants,
        reviewCount: _count.reviews,
        rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      };
    },
  );

  return NextResponse.json({
    products: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
