import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section with heading and CTA buttons", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Premium dental supplies");
    const shopAllBtn = page.getByRole("link", { name: /shop all products/i });
    await expect(shopAllBtn).toBeVisible();
    await expect(shopAllBtn).toHaveAttribute("href", "/shop");

    const browseEqBtn = page.getByRole("link", { name: /browse equipment/i });
    await expect(browseEqBtn).toBeVisible();
    await expect(browseEqBtn).toHaveAttribute("href", "/shop?category=equipment");
  });

  test("displays trust indicators in hero", async ({ page }) => {
    await expect(page.getByText("Authentic products")).toBeVisible();
    await expect(page.getByText("Nationwide delivery")).toBeVisible();
    await expect(page.getByText("Cash on delivery")).toBeVisible();
  });

  test("navigates to shop via hero CTA", async ({ page }) => {
    await page.getByRole("link", { name: /shop all products/i }).click();
    await expect(page).toHaveURL(/\/shop/);
  });

  test("shows featured products section when products exist", async ({ page }) => {
    const featuredHeading = page.getByRole("heading", { name: /featured products/i });
    await expect(featuredHeading).toBeVisible();
  });

  test("shows testimonials section", async ({ page }) => {
    await expect(page.getByText(/what our customers say/i)).toBeVisible();
  });

  test("header navigation links are present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /shop/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /categories/i })).toBeVisible();
  });
});
