// tests/e2e/cart-user.spec.ts
// Cart flows for a signed-in user (uses the admin session from global-setup).
// Writes go through the server actions to the real DB, so we also verify the
// persisted quantities — including the regression where cartItem.create used
// to drop the requested quantity.
import { test, expect } from "@playwright/test";
import { loadEnv, prisma } from "./helpers";
import {
  PRODUCTS,
  addFromDetail,
  cartQuantity,
  cartItemCard,
  removeCartItem,
  increaseCartItemTo,
  openCartDrawer,
  resetSeededCartProducts,
} from "./cart-helpers";

const { amalgam } = PRODUCTS;

// All tests in this file write to the same admin cart in the real DB, so they
// must never run in parallel with each other.
test.describe.configure({ mode: "serial" });

let userId: string;
let productIds: Record<string, string>;

async function dbQuantityBySlug(slug: string): Promise<number> {
  const row = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId: productIds[slug] } },
  });
  return row?.quantity ?? 0;
}

test.beforeAll(async () => {
  loadEnv();
  const admin = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@example.com" },
  });
  if (!admin) throw new Error("Admin user is missing — run seed-test-data first.");
  userId = admin.id;

  const products = await prisma.product.findMany({
    where: { slug: { in: Object.values(PRODUCTS).map((p) => p.slug) } },
  });
  productIds = Object.fromEntries(products.map((p) => [p.slug, p.id]));

  await prisma.cartItem.deleteMany({ where: { userId } });
});

test.afterAll(async () => {
  await prisma.cartItem.deleteMany({ where: { userId } });
  await prisma.$disconnect();
});

test.describe("Signed-in cart", () => {
  test.beforeEach(async ({ page }) => {
    await prisma.cartItem.deleteMany({ where: { userId } });
    await resetSeededCartProducts(prisma);
  });

  test("adds a quantity to the server cart with the requested quantity (regression)", async ({
    page,
  }) => {
    await addFromDetail(page, amalgam.slug, 3);

    // The signed-in add may write via the server mutation or via a guest-store
    // merge; either way the DB must settle before we leave the page.
    await expect.poll(() => dbQuantityBySlug(amalgam.slug), { timeout: 15000 }).toBe(3);

    await page.goto("/cart");
    expect(await cartQuantity(page, amalgam.slug)).toBe(3);

    await page.reload();
    expect(await cartQuantity(page, amalgam.slug)).toBe(3);

    // Regression: create must persist quantity, not default to 1.
    expect(await dbQuantityBySlug(amalgam.slug)).toBe(3);
  });

  test("accumulates when adding the same product again", async ({ page }) => {
    await addFromDetail(page, amalgam.slug, 2);
    await expect.poll(() => dbQuantityBySlug(amalgam.slug), { timeout: 15000 }).toBe(2);

    await addFromDetail(page, amalgam.slug, 2);
    await expect.poll(() => dbQuantityBySlug(amalgam.slug), { timeout: 15000 }).toBe(4);

    await page.goto("/cart");
    expect(await cartQuantity(page, amalgam.slug)).toBe(4);
    expect(await dbQuantityBySlug(amalgam.slug)).toBe(4);
  });

  test("updates the quantity and persists after reload", async ({ page }) => {
    await addFromDetail(page, amalgam.slug, 1);
    await expect.poll(() => dbQuantityBySlug(amalgam.slug), { timeout: 15000 }).toBe(1);

    await page.goto("/cart");
    await increaseCartItemTo(page, amalgam.slug, 5);
    expect(await cartQuantity(page, amalgam.slug)).toBe(5);

    await page.reload();
    expect(await cartQuantity(page, amalgam.slug)).toBe(5);
    expect(await dbQuantityBySlug(amalgam.slug)).toBe(5);
  });

  test("removes an item and empties the cart", async ({ page }) => {
    await addFromDetail(page, amalgam.slug, 1);
    await expect.poll(() => dbQuantityBySlug(amalgam.slug), { timeout: 15000 }).toBe(1);

    await page.goto("/cart");
    await removeCartItem(page, amalgam.slug);

    await expect(page.getByText("Your procurement cart is empty")).toBeVisible({
      timeout: 10000,
    });
    expect(await dbQuantityBySlug(amalgam.slug)).toBe(0);
  });

  test("clears the whole cart from the drawer", async ({ page }) => {
    await addFromDetail(page, amalgam.slug, 2);
    await expect.poll(() => dbQuantityBySlug(amalgam.slug), { timeout: 15000 }).toBe(2);
    await page.goto("/cart");
    expect(await cartQuantity(page, amalgam.slug)).toBe(2);

    // The /cart page has no Header, so open the drawer from a header page.
    await page.goto("/shop?q=E2E");
    await openCartDrawer(page);
    await page.getByRole("button", { name: "Clear all" }).click();
    await page.getByRole("button", { name: "Confirm clear?" }).click();

    await expect(page.getByText("Cart cleared")).toBeVisible({ timeout: 10000 });
    await page.goto("/cart");
    await expect(page.getByText("Your procurement cart is empty")).toBeVisible({
      timeout: 10000,
    });
    expect(await dbQuantityBySlug(amalgam.slug)).toBe(0);
  });
});
