import { test, expect } from "@playwright/test";

async function loginAsCandidate(page: import("@playwright/test").Page) {
  await page.goto("/connexion");
  await page.evaluate(() => {
    const users = JSON.parse(localStorage.getItem("gaspe_users") ?? "[]");
    const passwords = JSON.parse(localStorage.getItem("gaspe_passwords") ?? "{}");
    const candidate = {
      id: "candidat-medical-test",
      email: "medical@test.fr",
      name: "Test Medical Candidat",
      role: "candidat",
      approved: true,
      createdAt: new Date().toISOString(),
    };
    if (!users.find((u: { id: string }) => u.id === "candidat-medical-test")) {
      users.push(candidate);
      passwords["candidat-medical-test"] = "test123";
      localStorage.setItem("gaspe_users", JSON.stringify(users));
      localStorage.setItem("gaspe_passwords", JSON.stringify(passwords));
    }
    localStorage.setItem("gaspe_current_user", JSON.stringify(candidate));
  });
  await page.goto("/espace-candidat");
}

test.describe("SSGM / Medical visits pages", () => {
  test("SSGM public page loads", async ({ page }) => {
    await page.goto("/ssgm");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });

  test("SSGM page shows medical centers", async ({ page }) => {
    await page.goto("/ssgm");
    await expect(page.locator("text=centre")).toBeVisible({ timeout: 10000 });
  });

  test("visites-medicales page loads", async ({ page }) => {
    await page.goto("/visites-medicales");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });

  test("visites-medicales shows visit types", async ({ page }) => {
    await page.goto("/visites-medicales");
    await page.waitForLoadState("networkidle");
    const content = await page.textContent("body");
    expect(content).toContain("aptitude");
  });
});

test.describe("Candidate medical profile", () => {
  test("candidate dashboard loads", async ({ page }) => {
    await loginAsCandidate(page);
    await expect(page.locator("text=Test Medical Candidat")).toBeVisible({ timeout: 10000 });
  });
});
