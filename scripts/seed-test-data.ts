// scripts/seed-test-data.ts
// Seeds deterministic data used by the Playwright E2E suite against the real dev DB.
// Idempotent — safe to run repeatedly.
import { auth } from "@/lib/auth/server";
import prisma from "@/lib/config/prisma";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, getPublicUrl } from "@/lib/config/r2";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@1234";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

// Regular (non-admin) user used by the cart merge E2E specs.
export const CART_USER_EMAIL = "cart@example.com";
export const CART_USER_PASSWORD = "Cart@1234";
export const CART_USER_NAME = "Cart Tester";

const CATEGORY = { name: "E2E Restorative", slug: "e2e-restorative" };
const FAMILY = { name: "E2E Amalgam", slug: "e2e-amalgam" };
const BRAND = { name: "E2E Dentsply", slug: "e2e-dentsply" };
const EDIT_TARGET_SLUG = "e2e-edit-target";
const MERGE_TARGET_SLUG = "e2e-merge-target";
const R2_IMAGE_KEY = "products/e2e-test-image.png";

// The product schemas require at least one image, so the edit-target product
// gets a real R2 object (same fixture the E2E upload flow uses).
async function ensureR2Image(): Promise<string> {
  const file = readFileSync(
    path.join(__dirname, "..", "tests", "e2e", "fixtures", "test-image.png"),
  );
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: R2_IMAGE_KEY,
      Body: file,
      ContentType: "image/png",
    }),
  );
  return getPublicUrl(R2_IMAGE_KEY);
}

async function ensureAdmin(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", twoFactorEnabled: false, emailVerified: true },
    });
    return;
  }
  await auth.api.signUpEmail({
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
    },
    headers: new Headers(),
  });
  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { role: "ADMIN", twoFactorEnabled: false, emailVerified: true },
  });
}

async function ensureCartUser(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: CART_USER_EMAIL },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "USER", twoFactorEnabled: false, emailVerified: true },
    });
    return;
  }
  await auth.api.signUpEmail({
    body: {
      email: CART_USER_EMAIL,
      password: CART_USER_PASSWORD,
      name: CART_USER_NAME,
    },
    headers: new Headers(),
  });
  await prisma.user.update({
    where: { email: CART_USER_EMAIL },
    data: { role: "USER", twoFactorEnabled: false, emailVerified: true },
  });
}

async function ensureCatalog(): Promise<void> {
  const category = await prisma.category.upsert({
    where: { slug: CATEGORY.slug },
    update: { name: CATEGORY.name, isActive: true },
    create: { name: CATEGORY.name, slug: CATEGORY.slug, isActive: true },
  });

  const family = await prisma.productFamily.upsert({
    where: { slug: FAMILY.slug },
    update: { name: FAMILY.name, categoryId: category.id, isActive: true },
    create: {
      name: FAMILY.name,
      slug: FAMILY.slug,
      categoryId: category.id,
      isActive: true,
    },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: BRAND.slug },
    update: { name: BRAND.name, isActive: true },
    create: { name: BRAND.name, slug: BRAND.slug, isActive: true },
  });

  // Attribute types drive the form via ATTR_FIELD_MAP slugs (size/shade/color/unit).
  const attrTypes: {
    slug: string;
    name: string;
    displayOrder: number;
    values: string[];
  }[] = [
    { slug: "size", name: "Size", displayOrder: 1, values: ["1g", "2g"] },
    { slug: "shade", name: "Shade", displayOrder: 2, values: ["A1", "A2"] },
    { slug: "color", name: "Color", displayOrder: 3, values: ["Transparent"] },
    { slug: "unit", name: "Unit", displayOrder: 4, values: ["Pack"] },
  ];

  const typeIds = new Map<string, string>();
  for (const t of attrTypes) {
    const type = await prisma.attributeType.upsert({
      where: { slug: t.slug },
      update: { name: t.name, displayOrder: t.displayOrder },
      create: { slug: t.slug, name: t.name, displayOrder: t.displayOrder },
    });
    typeIds.set(t.slug, type.id);
    for (const value of t.values) {
      await prisma.attributeValue.upsert({
        where: {
          attributeTypeId_value: { attributeTypeId: type.id, value },
        },
        update: {},
        create: {
          attributeTypeId: type.id,
          value,
          slug: value.toLowerCase(),
        },
      });
    }
  }

  const size1g = await prisma.attributeValue.findFirstOrThrow({
    where: { attributeTypeId: typeIds.get("size")!, value: "1g" },
  });
  const shadeA1 = await prisma.attributeValue.findFirstOrThrow({
    where: { attributeTypeId: typeIds.get("shade")!, value: "A1" },
  });

  const imageUrl = await ensureR2Image();

  const product = await prisma.product.upsert({
    where: { slug: EDIT_TARGET_SLUG },
    update: {
      name: "E2E Amalgam Capsule",
      description: ["E2E description line one", "E2E description line two"],
      madeIn: "Germany",
      price: 99.5,
      stock: 10,
      sku: "E2E-SKU-001",
      images: [imageUrl],
      categoryId: category.id,
      familyId: family.id,
      brandId: brand.id,
      isActive: true,
      featured: false,
      bestSeller: false,
      archived: false,
    },
    create: {
      name: "E2E Amalgam Capsule",
      slug: EDIT_TARGET_SLUG,
      description: ["E2E description line one", "E2E description line two"],
      madeIn: "Germany",
      price: 99.5,
      stock: 10,
      sku: "E2E-SKU-001",
      images: [imageUrl],
      categoryId: category.id,
      familyId: family.id,
      brandId: brand.id,
      isActive: true,
      featured: false,
      bestSeller: false,
      archived: false,
    },
  });

  await prisma.productAttributeValue.deleteMany({
    where: { productId: product.id },
  });
  await prisma.productAttributeValue.createMany({
    data: [
      {
        productId: product.id,
        attributeTypeId: typeIds.get("size")!,
        attributeValueId: size1g.id,
      },
      {
        productId: product.id,
        attributeTypeId: typeIds.get("shade")!,
        attributeValueId: shadeA1.id,
      },
    ],
  });

  await prisma.specificationGroup.deleteMany({
    where: { productId: product.id },
  });
  await prisma.specificationGroup.createMany({
    data: [
      {
        productId: product.id,
        name: "Physical Properties",
        position: 0,
      },
      {
        productId: product.id,
        name: "Packaging",
        position: 1,
      },
    ],
  });
  const groups = await prisma.specificationGroup.findMany({
    where: { productId: product.id },
    orderBy: { position: "asc" },
  });
  await prisma.specification.createMany({
    data: [
      {
        groupId: groups[0].id,
        key: "Composition",
        value: "Silver alloy",
        position: 0,
      },
      {
        groupId: groups[1].id,
        key: "Quantity",
        value: "50 capsules",
        position: 0,
      },
    ],
  });

  // Second product used by the cart merge E2E specs (different stock/price).
  const mergeProduct = await prisma.product.upsert({
    where: { slug: MERGE_TARGET_SLUG },
    update: {
      name: "E2E Composite Kit",
      description: ["E2E composite starter kit"],
      madeIn: "USA",
      price: 200,
      stock: 5,
      sku: "E2E-SKU-002",
      images: [imageUrl],
      categoryId: category.id,
      familyId: family.id,
      brandId: brand.id,
      isActive: true,
      featured: false,
      bestSeller: false,
      archived: false,
    },
    create: {
      name: "E2E Composite Kit",
      slug: MERGE_TARGET_SLUG,
      description: ["E2E composite starter kit"],
      madeIn: "USA",
      price: 200,
      stock: 5,
      sku: "E2E-SKU-002",
      images: [imageUrl],
      categoryId: category.id,
      familyId: family.id,
      brandId: brand.id,
      isActive: true,
      featured: false,
      bestSeller: false,
      archived: false,
    },
  });
  await prisma.productAttributeValue.deleteMany({
    where: { productId: mergeProduct.id },
  });

  console.log("[seed-test-data] done", { category: category.slug, brand: brand.slug, product: product.slug, mergeProduct: mergeProduct.slug });
}

async function main() {
  await ensureAdmin();
  await ensureCartUser();
  await ensureCatalog();
}

main()
  .catch((err) => {
    console.error("[seed-test-data] failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
