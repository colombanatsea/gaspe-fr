import { test, expect } from "@playwright/test";

async function loginAsAdherent(page: import("@playwright/test").Page) {
  await page.goto("/connexion");
  await page.evaluate(() => {
    const users = JSON.parse(localStorage.getItem("gaspe_users") ?? "[]");
    const passwords = JSON.parse(localStorage.getItem("gaspe_passwords") ?? "{}");

    const adherent = {
      id: "adherent-e2e-test",
      email: "adherent@test.fr",
      name: "Test Adhérent",
      role: "adherent",
      phone: "0698765432",
      company: "Compagnie Test Maritime",
      approved: true,
      createdAt: new Date().toISOString(),
      companyRole: "dirigeant",
    };

    if (!users.find((u: { id: string }) => u.id === "adherent-e2e-test")) {
      users.push(adherent);
      passwords["adherent-e2e-test"] = "test123";
      localStorage.setItem("gaspe_users", JSON.stringify(users));
      localStorage.setItem("gaspe_passwords", JSON.stringify(passwords));
    }
    localStorage.setItem("gaspe_current_user", JSON.stringify(adherent));
  });
  await page.goto("/espace-adherent");
}

test.describe("Adherent space", () => {
  test("dashboard loads with adherent info", async ({ page }) => {
    await loginAsAdherent(page);
    await expect(page.locator("text=Test Adhérent")).toBeVisible({ timeout: 10000 });
  });

  test("profile page loads", async ({ page }) => {
    await loginAsAdherent(page);
    await page.goto("/espace-adherent/profil");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("annuaire page loads", async ({ page }) => {
    await loginAsAdherent(page);
    await page.goto("/espace-adherent/annuaire");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("documents page loads", async ({ page }) => {
    await loginAsAdherent(page);
    await page.goto("/espace-adherent/documents");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("offres page loads", async ({ page }) => {
    await loginAsAdherent(page);
    await page.goto("/espace-adherent/offres");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
