// tests/e2e/new-product.spec.ts
// Creates a product end-to-end via the admin "Add New Product" form:
// real DB writes, real R2 image upload, spec group, then verifies the
// resulting admin detail page. Cleans up its own product afterwards.
import path from "node:path";
import { test, expect } from "@playwright/test";
import { loadEnv, prisma, selectInField } from "./helpers";

const IMAGE = path.join(__dirname, "fixtures", "test-image.png");

test.describe("Create product (admin)", () => {
  const ts = Date.now();
  const name = `E2E Flow ${ts}`;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const sku = `E2E-FLOW-${ts}`;

  test.afterAll(async () => {
    loadEnv();
    await prisma.product.deleteMany({ where: { slug } });
    await prisma.$disconnect();
  });

  test("creates a product with an image and spec group", async ({ page }) => {
    await page.goto("/admin/products/new");

    // Classification — auto-names the product from family + attributes.
    await selectInField(page, "Category", "E2E Restorative");
    await selectInField(page, "Product Family", "E2E Amalgam");
    await selectInField(page, "Size", "1g");
    await selectInField(page, "Shade", "A1");
    await selectInField(page, "Brand", "E2E Dentsply");

    // Override with a unique name (freezes auto-generation).
    await page.getByLabel("Product Name").fill(name);

    // Pricing & inventory.
    await page.getByLabel("Price (EGP)").fill("150");
    await page.getByLabel("Stock").fill("5");
    await page.getByLabel("SKU").fill(sku);
    await page.getByLabel("Made In").fill("Egypt");

    // Description.
    await page.getByLabel("Description").fill(
      "Flow line one\nFlow line two",
    );

    // Real R2 image upload (presigned PUT from /api/s3/upload).
    await page.locator('input[type="file"]').setInputFiles(IMAGE);
    await expect(page.getByAltText("Product preview").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/uploaded|reused from storage/)).toBeVisible({
      timeout: 30000,
    });

    // Spec group.
    await page.getByRole("button", { name: "Add group" }).click();
    await page.getByPlaceholder("e.g. Physical Properties").fill("Packaging");
    await page.getByPlaceholder("e.g. Slot Size").fill("Quantity");
    await page.getByPlaceholder("e.g. 0.022 inch").fill("10 boxes");

    await page.getByRole("button", { name: "Create Product" }).click();

    await page.waitForURL(`/admin/product/${slug}`, { timeout: 30000 });
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("Packaging", { exact: true })).toBeVisible();
    await expect(page.getByText("Quantity", { exact: true })).toBeVisible();
    await expect(page.getByText("10 boxes", { exact: true })).toBeVisible();
    await expect(page.getByAltText(`${name} 1`)).toBeVisible();
  });
});
