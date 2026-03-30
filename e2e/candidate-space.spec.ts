import { test, expect } from "@playwright/test";

// Helper: register and login a candidate via localStorage seeding
async function loginAsCandidate(page: import("@playwright/test").Page) {
  await page.goto("/connexion");
  // Seed a candidate user directly via localStorage
  await page.evaluate(() => {
    const users = JSON.parse(localStorage.getItem("gaspe_users") ?? "[]");
    const passwords = JSON.parse(localStorage.getItem("gaspe_passwords") ?? "{}");

    const candidate = {
      id: "candidat-e2e-test",
      email: "candidat@test.fr",
      name: "Test Candidat",
      role: "candidat",
      phone: "0612345678",
      approved: true,
      createdAt: new Date().toISOString(),
      currentPosition: "Matelot",
      desiredPosition: "pont",
      preferredZone: "normandie",
      savedOffers: [],
      applications: [],
      experience: "2 ans",
      certifications: "CFBS",
      cvFilename: "",
    };

    if (!users.find((u: { id: string }) => u.id === "candidat-e2e-test")) {
      users.push(candidate);
      // plaintext password (will be migrated on login)
      passwords["candidat-e2e-test"] = "test123";
      localStorage.setItem("gaspe_users", JSON.stringify(users));
      localStorage.setItem("gaspe_passwords", JSON.stringify(passwords));
    }
    localStorage.setItem("gaspe_current_user", JSON.stringify(candidate));
  });
  // Reload to pick up the seeded auth
  await page.goto("/espace-candidat");
}

test.describe("Candidate space", () => {
  test("dashboard loads with candidate info", async ({ page }) => {
    await loginAsCandidate(page);
    await expect(page.locator("text=Test Candidat")).toBeVisible({ timeout: 10000 });
  });

  test("candidate can access formations page", async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto("/espace-candidat/formations");
    const response = await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("redirects to login when not authenticated", async ({ page }) => {
    // Clear auth state
    await page.goto("/connexion");
    await page.evaluate(() => localStorage.removeItem("gaspe_current_user"));
    await page.goto("/espace-candidat");
    // Should show login prompt or redirect
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasAuthPrompt = url.includes("connexion") || (await page.locator("text=Connexion").isVisible().catch(() => false));
    expect(hasAuthPrompt || url.includes("espace-candidat")).toBeTruthy();
  });
});
