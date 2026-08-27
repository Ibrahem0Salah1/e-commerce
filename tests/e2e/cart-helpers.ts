// tests/e2e/cart-helpers.ts
// Shared helpers for the cart E2E specs. Must match the constants seeded by
// scripts/seed-test-data.ts.
import { expect, type Page } from "@playwright/test";
import type { PrismaClient } from "@prisma/client";

export const CART_USER_EMAIL = "cart@example.com";
export const CART_USER_PASSWORD = "Cart@1234";
export const ADMIN_USER_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";

export const PRODUCTS = {
  amalgam: {
    name: "E2E Amalgam Capsule",
    slug: "e2e-edit-target",
    price: 99.5,
    stock: 10,
  },
  composite: {
    name: "E2E Composite Kit",
    slug: "e2e-merge-target",
    price: 200,
    stock: 5,
  },
} as const;

// The edit-product spec mutates the seeded amalgam product (price/stock) in
// parallel, so the cart specs re-assert the seeded values before every test
// to stay deterministic.
export async function resetSeededCartProducts(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.product.updateMany({
    where: { slug: PRODUCTS.amalgam.slug },
    data: {
      stock: PRODUCTS.amalgam.stock,
      price: PRODUCTS.amalgam.price,
      sku: "E2E-SKU-001",
    },
  });
  await prisma.product.updateMany({
    where: { slug: PRODUCTS.composite.slug },
    data: {
      stock: PRODUCTS.composite.stock,
      price: PRODUCTS.composite.price,
      sku: "E2E-SKU-002",
    },
  });
}

// ── Auth ────────────────────────────────────────────────────────────────

export async function signIn(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("/", { timeout: 20000 });
}

// ── Guest cart (zustand persist, localStorage key "mds-cart") ────────────

export function guestCartStorage(items: unknown[]): string {
  return JSON.stringify({ state: { items }, version: 0 });
}

export async function setGuestCart(page: Page, items: unknown[]): Promise<void> {
  await page.evaluate(
    (raw) => localStorage.setItem("mds-cart", raw),
    guestCartStorage(items),
  );
}

export async function getGuestCartItems(page: Page): Promise<unknown[]> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("mds-cart");
    if (!raw) return [];
    return JSON.parse(raw).state.items ?? [];
  });
}

export async function waitForGuestCartCount(
  page: Page,
  count: number,
): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const raw = localStorage.getItem("mds-cart");
      if (!raw) return expected === 0;
      const items = JSON.parse(raw).state.items ?? [];
      return items.length === expected;
    },
    count,
    { timeout: 10000 },
  );
}

// ── Adding to cart via the UI ────────────────────────────────────────────

// The dev server streams HTML before React hydrates, so clicks can land on a
// button whose handler is not attached yet and be silently dropped. Every
// add/stepper interaction below therefore clicks repeatedly until its effect
// is actually visible (localStorage write / on-screen state change) instead
// of trusting a single click. This turns the hydration race into determinism.
async function clickUntil(
  locator: ReturnType<Page["locator"]>,
  isDone: () => Promise<boolean>,
  attempts = 10,
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    await locator.click();
    if (await isDone()) return;
    await locator.page().waitForTimeout(400);
  }
  throw new Error(`clickUntil: condition not met after ${attempts} attempts`);
}

export async function addFromCard(page: Page, productName: string): Promise<void> {
  const card = page.locator('[data-testid="product-card"]', {
    hasText: productName,
  });
  const btn = card.getByTestId("add-to-cart-btn");
  await clickUntil(btn, async () => {
    const items = (await getGuestCartItems(page)) as Array<{ name: string }>;
    return items.some((i) => i.name === productName);
  });
}

export async function addFromDetail(
  page: Page,
  slug: string,
  quantity: number,
): Promise<void> {
  await page.goto(`/shop/${slug}`);
  const stepperValue = page.getByTestId("detail-quantity");

  // If the product is already in the cart, the page shows an "N in cart"
  // indicator once the server cart query resolves. Wait for it before touching
  // the stepper: the component resets its local quantity to 1 on every cartQty
  // change, and a query resolving mid-interaction would silently shrink the add.
  const inCartIndicator = page.getByText(/\d+ in cart/);
  try {
    await inCartIndicator.waitFor({ state: "visible", timeout: 2000 });
  } catch {
    // Not in cart yet — no indicator. For a freshly-loaded empty cart the only
    // cartQty change (0) fires the reset before the stepper is interacted with.
  }

  for (let i = 1; i < quantity; i++) {
    const target = String(i + 1);
    await clickUntil(
      page.getByLabel("Increase quantity"),
      async () => (await stepperValue.textContent())?.trim() === target,
    );
  }

  // Safety net for the reset race above: re-assert the stepper value across a
  // settle window and re-click until it holds, so the add always sends the
  // requested quantity even if the cart query lands late.
  for (let attempt = 0; attempt < 20; attempt++) {
    const current = Number((await stepperValue.textContent())?.trim() ?? "1");
    if (current === quantity) {
      await page.waitForTimeout(400);
      if (Number((await stepperValue.textContent())?.trim() ?? "1") === quantity) {
        break;
      }
    }
    const inc = page.getByLabel("Increase quantity");
    if (await inc.isEnabled()) {
      await inc.click();
      await page.waitForTimeout(150);
    }
  }
  expect(Number((await stepperValue.textContent())?.trim() ?? "1")).toBe(quantity);

  // After a successful add the button flashes "Added to cart!" for ~1.5s, so
  // polling right after each click detects a real add and never double-adds.
  await clickUntil(
    page.getByRole("button", { name: /Add( \d+ more)? to cart/i }),
    async () => (await page.getByText("Added to cart!").count()) > 0,
  );
  await expect(page.getByText("Added to cart!")).toBeVisible({ timeout: 10000 });
}

// ── Cart page assertions ─────────────────────────────────────────────────

export function cartItemCard(page: Page, slug: string) {
  return page.getByTestId(`cart-item-${slug}`);
}

export async function cartQuantity(page: Page, slug: string): Promise<number> {
  return Number(
    await cartItemCard(page, slug).getByTestId("cart-item-quantity").inputValue(),
  );
}

export async function increaseCartItem(
  page: Page,
  slug: string,
): Promise<void> {
  await cartItemCard(page, slug)
    .getByRole("button", { name: "Increase quantity" })
    .click();
}

// Click + until the input reaches `target`. Each iteration waits for the
// previous click to be reflected, so server round trips (signed-in users)
// can't be lost to rapid-fire clicks or stale closures.
export async function increaseCartItemTo(
  page: Page,
  slug: string,
  target: number,
): Promise<void> {
  const input = cartItemCard(page, slug).getByTestId("cart-item-quantity");
  for (;;) {
    const current = Number(await input.inputValue());
    if (current >= target) break;
    const inc = cartItemCard(page, slug).getByRole("button", {
      name: "Increase quantity",
    });
    if (await inc.isDisabled()) break;
    await inc.click();
    await expect(input).toHaveValue(String(current + 1));
  }
}

export async function decreaseCartItem(
  page: Page,
  slug: string,
): Promise<void> {
  await cartItemCard(page, slug)
    .getByRole("button", { name: "Decrease quantity" })
    .click();
}

export async function removeCartItem(page: Page, slug: string): Promise<void> {
  await cartItemCard(page, slug)
    .getByRole("button", { name: /remove/i })
    .click();
}

// ── Toasts ───────────────────────────────────────────────────────────────

// Tolerant toast matcher. The merge toast can momentarily appear more than
// once (multiple useCart instances on the same page), so never assert strict
// single matches on it.
export function expectToast(page: Page, text: string) {
  return expect(page.getByText(text).first()).toBeVisible({ timeout: 20000 });
}

// ── Header cart drawer ───────────────────────────────────────────────────

export async function openCartDrawer(page: Page): Promise<void> {
  const trigger = page
    .locator("header button")
    .filter({ has: page.locator("svg.lucide-shopping-cart") });
  await trigger.click();
  await expect(page.getByText("Shopping Cart")).toBeVisible({ timeout: 10000 });
}

export async function cartBadgeText(page: Page): Promise<string | null> {
  const badge = page
    .locator("header button")
    .filter({ has: page.locator("svg.lucide-shopping-cart") })
    .locator("span.absolute");
  if ((await badge.count()) === 0) return null;
  return (await badge.textContent())?.trim() ?? null;
}
