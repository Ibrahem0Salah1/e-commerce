import { test, expect } from "@playwright/test";

test.describe("Cart page", () => {
  test("shows empty cart state when no items", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    await expect(page.getByText(/looks like you haven't added anything yet/i)).toBeVisible();
  });

  test("empty cart has a continue shopping link to /shop", async ({ page }) => {
    await page.goto("/cart");
    const continueBtn = page.getByRole("link", { name: /continue shopping/i });
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toHaveAttribute("href", "/shop");
  });

  test("navigates from empty cart to shop", async ({ page }) => {
    await page.goto("/cart");
    await page.getByRole("link", { name: /continue shopping/i }).click();
    await expect(page).toHaveURL(/\/shop/);
  });

  test("displays cart header with back button", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /shopping cart/i })).toBeVisible();
    await expect(page.getByLabel(/go back/i)).toBeVisible();
  });
});
