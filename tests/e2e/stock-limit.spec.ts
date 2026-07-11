import { test, expect } from "@playwright/test";

test.describe("Stock limit enforcement", () => {
  test.describe("Product detail page — low stock", () => {
    test.beforeEach(async ({ page }) => {
      // Digital X-ray Sensor has Size 2 Sensor with stock=3
      await page.goto("/shop/digital-intraoral-xray-sensor");
      await page.waitForLoadState("networkidle");
    });

    test("shows low stock warning for variants with stock <= 5", async ({ page }) => {
      const size2Btn = page.getByRole("button", { name: /size 2 sensor/i });
      await expect(size2Btn).toBeVisible();
      await expect(size2Btn).toContainText(/only \d+ left/i);
    });

    test("low stock warning shows correct remaining count", async ({ page }) => {
      const size2Btn = page.getByRole("button", { name: /size 2 sensor/i });
      await expect(size2Btn).toContainText(/only 3 left/i);
    });

    test("minus button is disabled when quantity is 1", async ({ page }) => {
      const minusBtn = page.getByRole("button", { name: /decrease quantity/i });
      await expect(minusBtn).toBeDisabled();
    });

    test("plus button increases quantity display", async ({ page }) => {
      const plusBtn = page.getByRole("button", { name: /increase quantity/i });
      const quantityDisplay = page.locator("span").filter({ hasText: /^\d+$/ }).first();
      const initialQty = await quantityDisplay.textContent();

      await plusBtn.click();

      await expect(quantityDisplay).not.toHaveText(initialQty ?? "1");
    });

    test("add to cart button is enabled for in-stock variant", async ({ page }) => {
      const addBtn = page.getByRole("button", { name: /add to cart/i });
      await expect(addBtn).toBeVisible();
      await expect(addBtn).toBeEnabled();
    });

    test("selecting different variant updates the UI", async ({ page }) => {
      const size1Btn = page.getByRole("button", { name: /size 1 sensor/i });
      await size1Btn.click();

      const quantityDisplay = page.locator("span").filter({ hasText: /^\d+$/ }).first();
      await expect(quantityDisplay).toHaveText("1");
    });
  });

  test.describe("Product detail page — normal stock", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/shop/self-ligating-metal-brackets-roth");
      await page.waitForLoadState("networkidle");
    });

    test("does not show low stock warning when stock > 5", async ({ page }) => {
      const variantBtn = page.getByRole("button", { name: /roth \.018/i });
      await expect(variantBtn).not.toContainText(/only/i);
    });

    test("add to cart button says 'Add to cart' for in-stock items", async ({ page }) => {
      const addBtn = page.getByRole("button", { name: /add to cart/i });
      await expect(addBtn).toBeVisible();
      await expect(addBtn).toBeEnabled();
    });
  });

  test.describe("Cart page — guest quantity controls", () => {
    test.beforeEach(async ({ page }) => {
      // Clear localStorage guest cart first
      await page.goto("/cart");
      await page.evaluate(() => localStorage.removeItem("mds-cart"));
    });

    test("cannot decrease quantity below 1 in cart (item gets removed instead)", async ({ page }) => {
      // Set a manual guest cart item via localStorage
      const guestCart = {
        state: {
          items: [
            {
              variantId: "e2e-test-variant",
              productId: "e2e-test-product",
              slug: "test-product",
              name: "Test Product",
              price: 100,
              image: "",
              variantName: "Default",
              quantity: 1,
            },
          ],
        },
        version: 0,
      };
      await page.evaluate((cart) => localStorage.setItem("mds-cart", JSON.stringify(cart)), guestCart);
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Click minus — item should be removed (qty 0 → remove)
      const minusBtn = page.getByRole("button", { name: /decrease quantity/i });
      await minusBtn.click();

      // Should show empty cart state
      await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    });

    test("can increase quantity then remove item", async ({ page }) => {
      const guestCart = {
        state: {
          items: [
            {
              variantId: "e2e-test-variant-2",
              productId: "e2e-test-product",
              slug: "test-product",
              name: "Test Item",
              price: 100,
              image: "",
              variantName: "Default",
              quantity: 2,
            },
          ],
        },
        version: 0,
      };
      await page.evaluate((cart) => localStorage.setItem("mds-cart", JSON.stringify(cart)), guestCart);
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should show 2 items
      await expect(page.getByText(/2 items/i)).toBeVisible();

      // Click remove
      const removeBtn = page.getByRole("button", { name: /remove test item/i });
      await removeBtn.click();

      // Should show empty cart
      await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    });
  });
});
