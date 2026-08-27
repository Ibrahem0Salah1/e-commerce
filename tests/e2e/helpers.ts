// tests/e2e/helpers.ts
// Shared utilities for E2E specs (runs in the Playwright worker process).
import path from "node:path";
import type { Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

export function loadEnv(): void {
  if (!process.env.DATABASE_URL) {
    process.loadEnvFile(path.join(__dirname, "..", "..", ".env"));
  }
}

export const prisma = new PrismaClient();

// Radix <Select> triggers render as role="combobox" but carry NO accessible name
// (combobox does not get its name from content). The hidden native <select> is
// aria-hidden so it is excluded from role queries.
export function combobox(page: Page, text: string | RegExp) {
  return page.getByRole("combobox").filter({ hasText: text });
}

export async function selectOption(
  page: Page,
  triggerText: string | RegExp,
  optionName: string,
): Promise<void> {
  await combobox(page, triggerText).click();
  await page.getByRole("option", { name: optionName }).click();
}

// Scopes a Radix select trigger via its field wrapper ("div.space-y-1.5"),
// which both ClassificationSection and AttributesSection use per field.
export function selectField(page: Page, labelText: string) {
  return page
    .locator("div.space-y-1\\.5")
    .filter({ has: page.getByText(labelText, { exact: true }) });
}

export async function selectInField(
  page: Page,
  labelText: string,
  optionName: string,
): Promise<void> {
  await selectField(page, labelText).locator('[data-slot="select-trigger"]').click();
  await page.getByRole("option", { name: optionName }).click();
}
