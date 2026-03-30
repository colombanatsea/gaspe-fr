import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.locator("text=Connexion")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("admin login works", async ({ page }) => {
    await page.goto("/connexion");
    await page.fill('input[type="email"]', "admin@gaspe.fr");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");
    await expect(page.locator("text=Tableau de bord")).toBeVisible();
  });

  test("candidat registration flow", async ({ page }) => {
    await page.goto("/inscription/candidat");
    await expect(page.locator("h1")).toContainText("Candidat");
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test("adherent registration flow", async ({ page }) => {
    await page.goto("/inscription/adherent");
    await expect(page.locator("h1")).toContainText("Adhérent");
  });
});
