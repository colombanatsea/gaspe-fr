import { test, expect } from "@playwright/test";

test.describe("Formations", () => {
  test("listing page loads with all formations", async ({ page }) => {
    await page.goto("/formations");
    await expect(page.locator("h1")).toContainText("Formations");
    // Should show 8 formation cards
    const cards = page.locator('a[href^="/formations/"]');
    await expect(cards).toHaveCount(8);
  });

  test("formation detail page loads", async ({ page }) => {
    await page.goto("/formations/cfbs-certificat-formation-base-securite");
    await expect(page.locator("h1")).toContainText("CFBS");
    await expect(page.locator("text=ENSM")).toBeVisible();
    await expect(page.locator("text=Le Havre")).toBeVisible();
  });

  test("capacity bar is displayed", async ({ page }) => {
    await page.goto("/formations/cfbs-certificat-formation-base-securite");
    await expect(page.locator("text=14/20 inscrits")).toBeVisible();
  });

  test("full formations show complet badge", async ({ page }) => {
    await page.goto("/formations/brevet-capitaine-200");
    await expect(page.locator("text=Complet")).toBeVisible();
  });

  test("back link returns to listing", async ({ page }) => {
    await page.goto("/formations/audit-interne-ism-isps");
    await page.click("text=Toutes les formations");
    await expect(page).toHaveURL("/formations");
  });
});
