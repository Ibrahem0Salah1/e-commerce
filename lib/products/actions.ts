"use server";

import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";

export async function createProductAndInvalidate(
  data: Prisma.ProductCreateInput,
) {
  const product = await prisma.product.create({ data });

  console.log("[CACHE INVALIDATE] createProductAndInvalidate");
  revalidateTag("products", "hours");

  return product;
}

// future: updateProductAndInvalidate, deleteProductAndInvalidate — same pattern
