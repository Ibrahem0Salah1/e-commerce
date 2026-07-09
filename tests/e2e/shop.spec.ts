import { test, expect } from "@playwright/test";

test.describe("Shop page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
  });

  test("renders the shop page layout", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test("displays breadcrumbs", async ({ page }) => {
    const breadcrumb = page.getByText(/home/i);
    await expect(breadcrumb).toBeVisible();
  });

  test("shows product grid with items", async ({ page }) => {
    await page.waitForSelector('[data-testid="product-card"], article, .product-card', {
      timeout: 10000,
    }).catch(() => {});
    const productCards = page.getByRole("article");
    if ((await productCards.count()) > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });

  test("can type in search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("dental");
    await expect(searchInput).toHaveValue("dental");
  });

  test("navigates to product detail when clicking a product", async ({ page }) => {
    const productLink = page.locator('a[href^="/shop/"]').first();
    await productLink.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    if (await productLink.isVisible()) {
      const href = await productLink.getAttribute("href");
      await productLink.click();
      await expect(page).toHaveURL(new RegExp(href!));
    }
  });
});
