import { test, expect } from "@playwright/test";

test.describe("Contact Form", () => {
  test("renders with all fields", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1")).toContainText("Contact");
    await expect(page.locator("#nom")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#sujet")).toBeVisible();
    await expect(page.locator("#message")).toBeVisible();
  });

  test("validates required fields", async ({ page }) => {
    await page.goto("/contact");
    await page.click("button:text('Envoyer')");
    await expect(page.locator("text=Le nom est requis")).toBeVisible();
    await expect(page.locator("text=L'email est requis")).toBeVisible();
  });

  test("successful submission", async ({ page }) => {
    await page.goto("/contact");
    await page.fill("#nom", "Test Utilisateur");
    await page.fill("#email", "test@example.fr");
    await page.selectOption("#sujet", "Question générale");
    await page.fill("#message", "Ceci est un message de test pour le formulaire de contact.");
    await page.click("button:text('Envoyer')");
    await expect(page.locator("text=Message envoyé")).toBeVisible({ timeout: 5000 });
  });
});
