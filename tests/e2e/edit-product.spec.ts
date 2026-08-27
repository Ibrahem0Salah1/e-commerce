// tests/e2e/edit-product.spec.ts
// Exercises the admin product detail page and the Edit Product dialog
// against the real dev DB (data seeded by scripts/seed-test-data.ts).
import { test, expect } from "@playwright/test";
import { loadEnv } from "./helpers";

test.beforeEach(async ({ page }) => {
  loadEnv();
  await page.goto("/admin/product/e2e-edit-target");
});

test.describe("Edit product (admin)", () => {
  test("renders the seeded product detail", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "E2E Amalgam Capsule" }),
    ).toBeVisible();
    await expect(page.getByText("E2E Restorative", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E Amalgam", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E Dentsply", { exact: true })).toBeVisible();
    await expect(page.getByText(/99\.5 EGP/)).toBeVisible();
    await expect(page.getByText("E2E-SKU-001", { exact: true })).toBeVisible();
    await expect(page.getByText("Physical Properties", { exact: true })).toBeVisible();
    await expect(page.getByText("Silver alloy", { exact: true })).toBeVisible();
  });

  test("edits price, stock and description, then persists after reload", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Product" }),
    ).toBeVisible();

    await page.getByLabel("Price (EGP)").fill("120");
    await page.getByLabel("Stock").fill("25");
    await page.getByLabel("Description").fill(
      "Updated line one\nUpdated line two",
    );

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Product updated")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Edit Product" }),
    ).toBeHidden();

    // Server component page re-fetches from the DB on reload.
    await page.reload();
    await expect(page.getByText(/120 EGP/)).toBeVisible();
    await expect(page.getByText("25", { exact: true })).toBeVisible();
    await expect(page.getByText("Updated line one")).toBeVisible();
    await expect(
      page.getByText("E2E-SKU-001", { exact: true }),
    ).toBeVisible();
  });
});
