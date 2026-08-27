// scripts/seed-loadtest.ts
// Seeds deterministic data for the k6 load-test suite (tests/load/).
// Idempotent — safe to run repeatedly.
//
// Usage: npx tsx scripts/seed-loadtest.ts
import { auth } from "@/lib/auth/server";
import prisma from "@/lib/config/prisma";

const TEST_EMAIL = process.env.LOADTEST_EMAIL ?? "loadtester@mds.test";
const TEST_PASSWORD = process.env.LOADTEST_PASSWORD ?? "LoadTest123!";
const TEST_NAME = process.env.LOADTEST_NAME ?? "Load Tester";

const CATEGORY = { name: "Load Test", slug: "loadtest" };

const HOT_SLUG = "loadtest-hot";
const HOT_STOCK = Number(process.env.HOT_STOCK ?? 10_000);
const SPREAD_COUNT = Number(process.env.SPREAD_COUNT ?? 50);
const SPREAD_STOCK = Number(process.env.SPREAD_STOCK ?? 1_000);

const SHIPPING = { name: "LoadTest Standard", price: 50 };

const IMAGE_PLACEHOLDER = ["https://placehold.co/600x400"];

async function ensureCategory() {
  const existing = await prisma.category.findUnique({
    where: { slug: CATEGORY.slug },
  });
  if (existing) return existing;
  return prisma.category.create({ data: { ...CATEGORY } });
}

async function ensureUser() {
  const existing = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });
  if (existing) {
    console.log(`✔ user exists: ${TEST_EMAIL}`);
    return;
  }
  await auth.api.signUpEmail({
    body: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
  });
  console.log(`✔ created user: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
}

async function ensureShippingMethod() {
  const existing = await prisma.shippingMethod.findFirst({
    where: { name: SHIPPING.name },
  });
  if (existing) {
    await prisma.shippingMethod.update({
      where: { id: existing.id },
      data: { price: SHIPPING.price, isActive: true },
    });
    return;
  }
  await prisma.shippingMethod.create({
    data: { name: SHIPPING.name, price: SHIPPING.price, sortOrder: 99 },
  });
}

function spreadSlug(i: number) {
  return `loadtest-spread-${String(i).padStart(3, "0")}`;
}

async function ensureProducts(categoryId: string) {
  // Hot product — the contention target
  const hot = await prisma.product.findUnique({ where: { slug: HOT_SLUG } });
  if (hot) {
    await prisma.product.update({
      where: { id: hot.id },
      data: { stock: HOT_STOCK, isActive: true, archived: false },
    });
  } else {
    await prisma.product.create({
      data: {
        name: "LoadTest Hot Product",
        slug: HOT_SLUG,
        description: ["Hot contention target for the checkout load test"],
        price: 100,
        costPrice: 60,
        stock: HOT_STOCK,
        images: IMAGE_PLACEHOLDER,
        categoryId,
        isActive: true,
      },
    });
  }

  // Spread products — one per VU-ish request for the healthy-path scenario
  for (let i = 1; i <= SPREAD_COUNT; i++) {
    const slug = spreadSlug(i);
    const found = await prisma.product.findUnique({ where: { slug } });
    if (!found) {
      await prisma.product.create({
        data: {
          name: `LoadTest Spread ${i}`,
          slug,
          description: [`Spread product ${i} for the checkout load test`],
          price: 100 + i,
          costPrice: 60,
          stock: SPREAD_STOCK,
          images: IMAGE_PLACEHOLDER,
          categoryId,
          isActive: true,
        },
      });
    } else {
      await prisma.product.update({
        where: { id: found.id },
        data: { stock: Math.max(found.stock, SPREAD_STOCK), isActive: true },
      });
    }
  }
}

async function main() {
  console.log("Seeding load-test data…");
  const category = await ensureCategory();
  await ensureUser();
  await ensureShippingMethod();
  await ensureProducts(category.id);

  const [hot, spreadTotal] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: HOT_SLUG },
      select: { slug: true, stock: true },
    }),
    prisma.product.count({ where: { slug: { startsWith: "loadtest-spread-" } } }),
  ]);

  console.log("\n─────────────────────────────────────────────");
  console.log(`hot product   : ${hot?.slug} (stock: ${hot?.stock})`);
  console.log(`spread count  : ${spreadTotal}`);
  console.log(`shipping      : ${SHIPPING.name} @ ${SHIPPING.price} EGP`);
  console.log(`test user     : ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  console.log("─────────────────────────────────────────────");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
