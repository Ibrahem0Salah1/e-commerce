// tests/e2e/global-setup.ts
// Runs once before all E2E specs: seeds the dev DB with deterministic data,
// then signs in as the admin through the real login UI and saves a storage state.
import { execSync } from "node:child_process";
import path from "node:path";
import { chromium } from "@playwright/test";

export const ADMIN_STORAGE_STATE = path.join(__dirname, ".auth", "admin.json");
export const BASE_URL = "http://localhost:3000";

export default async function globalSetup() {
  // loadEnvFile never overrides already-set vars; safe to always run.
  process.loadEnvFile(path.join(__dirname, "..", "..", ".env"));

  execSync("npx tsx scripts/seed-test-data.ts", {
    stdio: "inherit",
    cwd: path.join(__dirname, "..", ".."),
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/admin/login`);
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 });
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
  await browser.close();

  console.log("[e2e] global setup complete — admin session saved");
}
