// import { PrismaClient } from "@prisma/client";
// import fs from "node:fs";
// import path from "node:path";

// const prisma = new PrismaClient();

// const DATA_FILE = path.join(__dirname, "../restorative-dash-2.json");
// const CONCURRENCY = 8;

// interface ScrapedSpec {
//   key: string;
//   value: string;
//   position: number;
// }

// interface ScrapedSpecGroup {
//   name: string;
//   position: number;
//   specs: ScrapedSpec[];
// }

// interface ScrapedVariant {
//   name: string;
//   price: number;
//   stock: number;
// }

// interface ScrapedProduct {
//   name: string;
//   slug: string;
//   brand: string;
//   category: string;
//   basePrice: number;
//   images: string[];
//   variants: ScrapedVariant[];
//   madeIn?: string | null;
//   url?: string;
//   description: string[];
//   specGroups: ScrapedSpecGroup[];
// }

// function slugify(input: string): string {
//   return input
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "");
// }
// //hello

// const categoryCache = new Map<string, string>();
// const brandCache = new Map<string, string>();

// async function getCategoryId(name: string): Promise<string> {
//   const cached = categoryCache.get(name);
//   if (cached) return cached;

//   const slug = slugify(name);
//   const category = await prisma.category.upsert({
//     where: { slug },
//     update: {},
//     create: { name, slug },
//   });

//   categoryCache.set(name, category.id);
//   return category.id;
// }

// async function getBrandId(name: string): Promise<string> {
//   const cached = brandCache.get(name);
//   if (cached) return cached;

//   const slug = slugify(name);
//   const brand = await prisma.brand.upsert({
//     where: { slug },
//     update: {},
//     create: { name, slug },
//   });

//   brandCache.set(name, brand.id);
//   return brand.id;
// }

// function validateProduct(item: ScrapedProduct): string | null {
//   if (!item.slug) return "missing slug";
//   if (!item.name) return "missing name";
//   if (!item.brand) return "missing brand";
//   if (!item.category) return "missing category";
//   if (!item.variants || item.variants.length === 0) return "no variants";
//   if (
//     item.variants.some(
//       (v) => typeof v.price !== "number" || Number.isNaN(v.price),
//     )
//   ) {
//     return "variant with invalid price";
//   }
//   return null;
// }

// async function seedProduct(item: ScrapedProduct): Promise<void> {
//   const problem = validateProduct(item);
//   if (problem) {
//     throw new Error(`skipped — ${problem}`);
//   }

//   const [categoryId, brandId] = await Promise.all([
//     getCategoryId(item.category),
//     getBrandId(item.brand),
//   ]);

//   const lowestVariantPrice = Math.min(...item.variants.map((v) => v.price));
//   const totalStock = item.variants.reduce((sum, v) => sum + v.stock, 0);

//   const productData = {
//     name: item.name,
//     description: item.description ?? [],
//     madeIn: item.madeIn ?? null,
//     price: lowestVariantPrice,
//     stock: totalStock,
//     images: item.images ?? [],
//     categoryId,
//     brandId,
//   };

//   await prisma.$transaction(async (tx) => {
//     const product = await tx.product.upsert({
//       where: { slug: item.slug },
//       update: productData,
//       create: { ...productData, slug: item.slug },
//     });

//     await tx.specificationGroup.deleteMany({
//       where: { productId: product.id },
//     });
//     for (const group of item.specGroups ?? []) {
//       await tx.specificationGroup.create({
//         data: {
//           productId: product.id,
//           name: group.name,
//           position: group.position,
//           specs: {
//             create: group.specs.map((s) => ({
//               key: s.key,
//               value: s.value,
//               position: s.position,
//             })),
//           },
//         },
//       });
//     }
//   });
// }

// async function runWithConcurrency<T>(
//   items: T[],
//   limit: number,
//   fn: (item: T, index: number) => Promise<void>,
// ): Promise<void> {
//   let cursor = 0;
//   async function worker() {
//     while (cursor < items.length) {
//       const current = cursor++;
//       await fn(items[current], current);
//     }
//   }
//   await Promise.all(
//     Array.from({ length: Math.min(limit, items.length) }, worker),
//   );
// }

// async function main() {
//   if (!fs.existsSync(DATA_FILE)) {
//     throw new Error(
//       `Data file not found at ${DATA_FILE}. Update DATA_FILE at the top of seed.ts, or place your JSON there.`,
//     );
//   }

//   const raw = fs.readFileSync(DATA_FILE, "utf-8");
//   const products: ScrapedProduct[] = JSON.parse(raw);

//   console.log(`Loaded ${products.length} products from ${DATA_FILE}`);

//   let done = 0;
//   let failed = 0;

//   await runWithConcurrency(products, CONCURRENCY, async (item) => {
//     try {
//       await seedProduct(item);
//     } catch (err) {
//       failed++;
//       console.error(
//         `✗ Failed to seed "${item.slug}":`,
//         err instanceof Error ? err.message : err,
//       );
//     } finally {
//       done++;
//       if (done % 25 === 0 || done === products.length) {
//         console.log(`Progress: ${done}/${products.length} (${failed} failed)`);
//       }
//     }
//   });

//   console.log(`Done. ${products.length - failed} succeeded, ${failed} failed.`);
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
