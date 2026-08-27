// tests/e2e/cart-guest.spec.ts
// Cart flows for signed-out users. Guests use the zustand + localStorage
// store ("mds-cart"), so each test starts with a completely clean context.
import { test, expect } from "@playwright/test";
import { prisma } from "./helpers";
import {
  PRODUCTS,
  addFromCard,
  addFromDetail,
  cartQuantity,
  cartItemCard,
  openCartDrawer,
  removeCartItem,
  increaseCartItem,
  increaseCartItemTo,
  getGuestCartItems,
  cartBadgeText,
  resetSeededCartProducts,
} from "./cart-helpers";

// Guests have no cookies — start every test signed out.
test.use({ storageState: { cookies: [], origins: [] } });

const { amalgam, composite } = PRODUCTS;

// The /shop listing sorts by name and paginates at 20 — the seeded E2E
// products are not guaranteed to be on page 1, so always search for them.
const SHOP_SEEDED = "/shop?q=E2E";

test.beforeEach(async () => {
  await resetSeededCartProducts(prisma);
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("Guest cart", () => {
  test("adds an item from the product card without navigating (regression)", async ({
    page,
  }) => {
    await page.goto(SHOP_SEEDED);

    await addFromCard(page, amalgam.name);

    // Regression: the card add button must NOT trigger the wrapping <Link>.
    await expect(page).toHaveURL(/\/shop(\?.*)?$/);
    await expect(page.getByText("Added to cart", { exact: false }).first()).toBeVisible({
      timeout: 10000,
    });

    const items = await getGuestCartItems(page);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ quantity: 1 });
  });

  test("adds a specific quantity from the product detail page", async ({
    page,
  }) => {
    await addFromDetail(page, amalgam.slug, 3);

    await page.goto("/cart");
    await cartItemCard(page, amalgam.slug).getByRole("link", { name: amalgam.name });

    expect(await cartQuantity(page, amalgam.slug)).toBe(3);
    await expect(cartItemCard(page, amalgam.slug).getByText("298.5 EGP")).toBeVisible();
    await expect(page.getByText("Subtotal (3 items)")).toBeVisible();
  });

  test("shows correct totals for multiple products", async ({ page }) => {
    await page.goto(SHOP_SEEDED);
    await addFromCard(page, amalgam.name);
    await addFromDetail(page, composite.slug, 2);

    await page.goto("/cart");

    await expect(cartItemCard(page, amalgam.slug)).toBeVisible();
    await expect(cartItemCard(page, composite.slug)).toBeVisible();
    await expect(page.getByText("Subtotal (3 items)")).toBeVisible();
    // 99.5 + (200 * 2) = 499.5
    await expect(page.getByText("499.5 EGP")).toBeVisible();
  });

  test("updates the quantity from the cart page", async ({ page }) => {
    await page.goto(SHOP_SEEDED);
    await addFromCard(page, amalgam.name);

    await page.goto("/cart");
    await increaseCartItemTo(page, amalgam.slug, 2);

    expect(await cartQuantity(page, amalgam.slug)).toBe(2);
    await expect(cartItemCard(page, amalgam.slug).getByText("199 EGP")).toBeVisible();
  });

  test("enforces the stock limit in the guest cart stepper", async ({ page }) => {
    await addFromDetail(page, composite.slug, composite.stock);

    await page.goto("/cart");
    expect(await cartQuantity(page, composite.slug)).toBe(composite.stock);

    // At the stock cap the stepper's increase button is disabled entirely.
    await expect(
      cartItemCard(page, composite.slug).getByRole("button", {
        name: "Increase quantity",
      }),
    ).toBeDisabled();
    expect(await cartQuantity(page, composite.slug)).toBe(composite.stock);
  });

  test("blocks an over-stock add on the detail page", async ({ page }) => {
    // Composite stock is 5 — the detail stepper must cap the quantity at 5
    // (the stock notice only renders when stock <= 3, so assert the cap).
    await page.goto(`/shop/${composite.slug}`);

    for (let i = 1; i < composite.stock; i++) {
      await page.getByLabel("Increase quantity").click();
      await expect(page.getByTestId("detail-quantity")).toHaveText(String(i + 1));
    }
    await expect(page.getByLabel("Increase quantity")).toBeDisabled();
    await expect(page.getByTestId("detail-quantity")).toHaveText(String(composite.stock));
  });

  test("persists the guest cart across reloads", async ({ page }) => {
    await page.goto(SHOP_SEEDED);
    await addFromCard(page, amalgam.name);
    await addFromDetail(page, composite.slug, 2);

    await page.reload();
    await page.goto("/cart");

    await expect(cartItemCard(page, amalgam.slug)).toBeVisible();
    await expect(cartItemCard(page, composite.slug)).toBeVisible();
    expect(await cartQuantity(page, composite.slug)).toBe(2);
  });

  test("shows the cart count in the header drawer", async ({ page }) => {
    await page.goto(SHOP_SEEDED);
    await addFromCard(page, amalgam.name);

    await openCartDrawer(page);
    await expect(page.getByRole("dialog").getByText(amalgam.name)).toBeVisible();
    await expect.poll(async () => cartBadgeText(page)).toBe("1");
  });

  test("removes an item from the guest cart", async ({ page }) => {
    await page.goto(SHOP_SEEDED);
    await addFromCard(page, amalgam.name);
    await addFromDetail(page, composite.slug, 1);

    await page.goto("/cart");
    await removeCartItem(page, amalgam.slug);

    await expect(cartItemCard(page, amalgam.slug)).toBeHidden();
    await expect(cartItemCard(page, composite.slug)).toBeVisible();

    await removeCartItem(page, composite.slug);
    await expect(page.getByText("Your procurement cart is empty")).toBeVisible();
    expect(await getGuestCartItems(page)).toEqual([]);
  });
});
