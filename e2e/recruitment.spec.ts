import { test, expect } from "@playwright/test";

test.describe("Recruitment Platform", () => {
  test("job listing page loads with filters", async ({ page }) => {
    await page.goto("/nos-compagnies-recrutent");
    await expect(page.locator("text=Rejoignez le")).toBeVisible();
    // Filters visible
    await expect(page.locator("text=Zone géographique")).toBeVisible();
    await expect(page.locator("text=Brevet requis")).toBeVisible();
    // Job cards visible
    await expect(page.locator("text=Chef Mécanicien")).toBeVisible();
  });

  test("zone filter works", async ({ page }) => {
    await page.goto("/nos-compagnies-recrutent");
    await page.selectOption('select:has-text("Toutes les zones")', "dom-tom");
    // Should show Guadeloupe jobs only
    await expect(page.locator("text=Guadeloupe")).toBeVisible();
  });

  test("contract type filter pills work", async ({ page }) => {
    await page.goto("/nos-compagnies-recrutent");
    await page.click("button:text('CDI')");
    await expect(page).toHaveURL(/contrat=CDI/);
  });

  test("job detail page loads", async ({ page }) => {
    await page.goto("/nos-compagnies-recrutent/chef-mecanicien-3000-kw-manche-iles-express");
    await expect(page.locator("h1")).toContainText("Chef Mécanicien");
    await expect(page.locator("text=Postuler par email")).toBeVisible();
  });

  test("text search works", async ({ page }) => {
    await page.goto("/nos-compagnies-recrutent");
    const searchInput = page.locator('input[placeholder*="Titre, compagnie"]');
    await searchInput.fill("capitaine");
    // Should filter to show only capitaine jobs
    await expect(page.locator("text=Capitaine")).toBeVisible();
  });
});
