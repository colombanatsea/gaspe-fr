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

  // Test « successful submission » skip en mode demo (sans NEXT_PUBLIC_API_URL,
  // le formulaire ne soumet rien). Il sera ré-activé quand un env de test
  // bridging vers un Brevo de test sera disponible. Cf. plan de test § 6 UAT.
  test.skip("successful submission (require API)", async ({ page }) => {
    await page.goto("/contact");
    await page.fill("#nom", "Test Utilisateur");
    await page.fill("#email", "test@example.fr");
    await page.selectOption("#sujet", "Question générale");
    await page.fill("#message", "Ceci est un message de test pour le formulaire de contact.");
    await page.click("button:text('Envoyer')");
    await expect(page.locator("text=Message envoyé")).toBeVisible({ timeout: 5000 });
  });
});
