import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("compagnies maritimes");
    await expect(page.locator("text=En savoir plus")).toBeVisible();
  });

  test("search bar is functional", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.locator('input[placeholder*="Cherchez"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("CCN 3228");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/documents\?q=CCN/);
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Notre Groupement");
    await expect(page).toHaveURL("/notre-groupement");
    await expect(page.locator("h1")).toContainText("Notre Groupement");
  });

  test("stats section shows animated numbers", async ({ page }) => {
    await page.goto("/");
    const statsSection = page.locator("text=Le GASPE en chiffres");
    await statsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    // Le compteur affiche soit "1 951" (espace insécable) soit "1 951"
    // (espace simple) selon le rendu Intl. On accepte les deux variantes
    // via un sélecteur regex pour éviter la race condition de l'animation.
    await expect(page.getByText(/1[\s ]?951/).first()).toBeVisible();
  });
});
