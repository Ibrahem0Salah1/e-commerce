// tests/e2e/cart-merge.spec.ts
// THE core merge feature: a guest builds a cart (zustand + localStorage),
// then signs in. useCart must merge those items into the server cart via a
// single mergeCartAction, clear the guest store, and keep any over-stock
// items locally.
import { test, expect } from "@playwright/test";
import { loadEnv, prisma } from "./helpers";
import {
  CART_USER_EMAIL,
  CART_USER_PASSWORD,
  PRODUCTS,
  addFromCard,
  addFromDetail,
  signIn,
  cartQuantity,
  cartItemCard,
  setGuestCart,
  getGuestCartItems,
  waitForGuestCartCount,
  resetSeededCartProducts,
  expectToast,
} from "./cart-helpers";

test.use({ storageState: { cookies: [], origins: [] } });

const { amalgam, composite } = PRODUCTS;

// Both tests write to the same cart user in the real DB — they must never run
// in parallel with each other, or their carts will contaminate one another.
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
  const user = await prisma.user.findUnique({ where: { email: CART_USER_EMAIL } });
  if (!user) {
    throw new Error(
      `Cart test user ${CART_USER_EMAIL} is missing — run seed-test-data first.`,
    );
  }
  userId = user.id;

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

function guestItem(slug: keyof typeof PRODUCTS, quantity: number) {
  const p = PRODUCTS[slug];
  return {
    productId: productIds[p.slug],
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: "",
    quantity,
    stock: p.stock,
  };
}

test.describe("Merge guest cart on sign-in", () => {
  test.beforeEach(async () => {
    await prisma.cartItem.deleteMany({ where: { userId } });
    await resetSeededCartProducts(prisma);
  });

  test("merges a guest-built cart into the server cart and clears the guest store", async ({
    page,
  }) => {
    // Build a guest cart through the real UI.
    await page.goto("/shop?q=E2E");
    await addFromCard(page, amalgam.name);
    await addFromDetail(page, composite.slug, 2);
    await waitForGuestCartCount(page, 2);

    // Sign in — the merge effect must fire and sync the guest items.
    await signIn(page, CART_USER_EMAIL, CART_USER_PASSWORD);
    await expectToast(page, "Cart synced");

    // The merge must have written to the DB before we inspect the cart page.
    await expect.poll(() => dbQuantityBySlug(amalgam.slug), { timeout: 15000 }).toBe(1);
    await expect.poll(() => dbQuantityBySlug(composite.slug), { timeout: 15000 }).toBe(2);

    // Server cart now holds the merged items with the correct quantities.
    await page.goto("/cart");
    await expect(cartItemCard(page, amalgam.slug)).toBeVisible();
    await expect(cartItemCard(page, composite.slug)).toBeVisible();
    expect(await cartQuantity(page, amalgam.slug)).toBe(1);
    expect(await cartQuantity(page, composite.slug)).toBe(2);

    // Guest store was cleared.
    await waitForGuestCartCount(page, 0);

    // Reload: still there from the DB (idempotent, no duplicates).
    await page.reload();
    await expect(cartItemCard(page, amalgam.slug)).toBeVisible();
    expect(await cartQuantity(page, composite.slug)).toBe(2);

    expect(await dbQuantityBySlug(amalgam.slug)).toBe(1);
    expect(await dbQuantityBySlug(composite.slug)).toBe(2);
  });

  test("keeps over-stock items in the guest cart and syncs the rest", async ({
    page,
  }) => {
    // Inject a guest cart with one valid item and one that exceeds stock.
    await page.goto("/");
    await setGuestCart(page, [
      guestItem("amalgam", amalgam.stock + 2), // 12 > stock 10 → must fail
      guestItem("composite", 2),               // valid
    ]);
    await page.reload();
    await waitForGuestCartCount(page, 2);

    await signIn(page, CART_USER_EMAIL, CART_USER_PASSWORD);
    await expectToast(page, "Partially synced");

    // The valid item must be in the DB exactly once (no double-merge).
    await expect.poll(() => dbQuantityBySlug(composite.slug), { timeout: 15000 }).toBe(2);
    expect(await dbQuantityBySlug(amalgam.slug)).toBe(0);

    await page.goto("/cart");
    await expect(cartItemCard(page, composite.slug)).toBeVisible();
    await expect(cartItemCard(page, amalgam.slug)).toBeHidden();

    // The failed item stays in the local guest cart.
    await waitForGuestCartCount(page, 1);
    const remaining = await getGuestCartItems(page);
    expect(remaining[0]).toMatchObject({
      slug: amalgam.slug,
      quantity: amalgam.stock + 2,
    });

    // Only the valid item was written to the DB.
    expect(await dbQuantityBySlug(composite.slug)).toBe(2);
    expect(await dbQuantityBySlug(amalgam.slug)).toBe(0);
  });
});
