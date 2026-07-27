"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/config/prisma";
import { checkoutSchema } from "@/lib/validations";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { Decimal } from "@prisma/client/runtime/library";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function createOrder(rawInput: unknown) {
  const validated = checkoutSchema.safeParse(rawInput);
  if (!validated.success) {
    return { error: "Invalid input", details: validated.error.flatten() };
  }
  const data = validated.data;

  const session = await getSession();
  const userId = session?.user?.id ?? null;

  if (!userId && (!data.guestEmail || !data.guestName)) {
    return { error: "Guest email and name are required" };
  }

  if (!userId && data.guestEmail) {
    const recent = await prisma.order.findFirst({
      where: {
        guestEmail: data.guestEmail,
        createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (recent) {
      return { error: "Please wait before placing another order." };
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: data.items.map((i) => i.productId) },
          isActive: true,
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      if (
        productMap.size !== new Set(data.items.map((i) => i.productId)).size
      ) {
        throw new Error("One or more items are no longer available.");
      }

      let subtotal = new Decimal(0);
      const orderItemsData = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        const unitPrice = product.price!;
        const totalPrice = unitPrice.mul(item.quantity);
        subtotal = subtotal.add(totalPrice);

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          variantName: product.name,
          unitPrice,
          totalPrice,
          quantity: item.quantity,
        });
      }

      let discountAmount = new Decimal(0);
      let couponId: string | null = null;

      if (data.couponCode) {
        const coupon = await tx.coupon.findFirst({
          where: {
            code: data.couponCode,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });

        if (!coupon) throw new Error("Invalid or expired coupon code.");
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          throw new Error("Coupon usage limit has been reached.");
        }
        if (coupon.minOrderAmount && subtotal.lt(coupon.minOrderAmount)) {
          throw new Error(
            `Minimum order of ${coupon.minOrderAmount} EGP required for this coupon.`,
          );
        }

        discountAmount =
          coupon.type === "PERCENTAGE"
            ? subtotal.mul(coupon.value).div(100)
            : coupon.value;

        couponId = coupon.id;

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const total = Decimal.max(subtotal.sub(discountAmount), new Decimal(0));

      const newOrder = await tx.order.create({
        data: {
          idempotencyKey: data.idempotencyKey,
          userId: userId ?? null,
          guestEmail: !userId ? data.guestEmail : null,
          guestName: !userId ? data.guestName : null,
          status: "PENDING",
          subtotal,
          discountAmount,
          total,
          couponId,
          couponCode: data.couponCode ?? null,
          shippingName: data.shippingName,
          shippingPhone: data.shippingPhone,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingNotes: data.shippingNotes ?? null,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      for (const item of data.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          const product = productMap.get(item.productId);
          throw new Error(
            `"${product?.name ?? item.productId}" just went out of stock. Please update your cart.`,
          );
        }
      }

      if (userId) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return newOrder;
    });

    try {
      // TODO: sendOrderConfirmationEmail(...)
    } catch (emailError) {
      console.error("Order confirmation email failed:", emailError);
    }

    return { success: true, order };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { items: true },
      });
      if (existing) return { success: true, order: existing };
    }

    console.error("Checkout failed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to process order. Please try again.",
    };
  }
}
