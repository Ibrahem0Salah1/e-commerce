import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          product: {
            select: { id: true, slug: true, name: true, images: true },
          },
        },
      },
    },
  });

  const items = cartItems.map((ci) => ({
    variantId: ci.variantId,
    productId: ci.variant.product.id,
    slug: ci.variant.product.slug,
    name: ci.variant.product.name,
    price: Number(ci.variant.price),
    image: ci.variant.product.images[0] ?? ci.variant.image ?? "",
    variantName: ci.variant.name,
    quantity: ci.quantity,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const { variantId, quantity = 1 } = (await request.json()) as {
    variantId: string;
    quantity?: number;
  };
  const variant = await prisma.variant.findUnique({ where: { id: variantId } });
  if (!variant || !variant.isActive || quantity < 1) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  await prisma.cartItem.upsert({
    where: { userId_variantId: { userId: session.user.id, variantId } },
    create: { userId: session.user.id, variantId, quantity },
    update: { quantity: { increment: quantity } },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const { variantId, quantity } = (await request.json()) as {
    variantId: string;
    quantity: number;
  };

  if (!variantId || typeof quantity !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id, variantId },
    });
  } else {
    await prisma.cartItem.updateMany({
      where: { userId: session.user.id, variantId },
      data: { quantity },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const variantId = request.nextUrl.searchParams.get("variantId");
  if (!variantId) {
    return NextResponse.json({ error: "variantId required" }, { status: 400 });
  }

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id, variantId },
  });

  return NextResponse.json({ success: true });
}
