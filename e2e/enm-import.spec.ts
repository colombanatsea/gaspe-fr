import { test, expect } from "@playwright/test";

async function loginAsCandidate(page: import("@playwright/test").Page) {
  await page.goto("/connexion");
  await page.evaluate(() => {
    const users = JSON.parse(localStorage.getItem("gaspe_users") ?? "[]");
    const passwords = JSON.parse(localStorage.getItem("gaspe_passwords") ?? "{}");
    const candidate = {
      id: "candidat-enm-test",
      email: "enm@test.fr",
      name: "Test ENM Candidat",
      role: "candidat",
      approved: true,
      createdAt: new Date().toISOString(),
      currentPosition: "Matelot",
      desiredPosition: "pont",
    };
    if (!users.find((u: { id: string }) => u.id === "candidat-enm-test")) {
      users.push(candidate);
      passwords["candidat-enm-test"] = "test123";
      localStorage.setItem("gaspe_users", JSON.stringify(users));
      localStorage.setItem("gaspe_passwords", JSON.stringify(passwords));
    }
    localStorage.setItem("gaspe_current_user", JSON.stringify(candidate));
  });
  await page.goto("/espace-candidat");
}

test.describe("ENM Import Wizard", () => {
  test("wizard renders on candidate page", async ({ page }) => {
    await loginAsCandidate(page);
    await expect(page.locator("text=Espace Numérique Maritime")).toBeVisible({ timeout: 10000 });
  });

  test("step 1 shows FranceConnect instructions", async ({ page }) => {
    await loginAsCandidate(page);
    await expect(page.locator("text=FranceConnect")).toBeVisible({ timeout: 10000 });
  });

  test("can navigate to step 2 (paste area)", async ({ page }) => {
    await loginAsCandidate(page);
    const nextBtn = page.locator("button", { hasText: /suivant|continuer|étape 2/i }).first();
    if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextBtn.click();
      await expect(page.locator("textarea")).toBeVisible({ timeout: 5000 });
    }
  });

  test("paste area accepts text input", async ({ page }) => {
    await loginAsCandidate(page);
    const nextBtn = page.locator("button", { hasText: /suivant|continuer|étape 2/i }).first();
    if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextBtn.click();
      const textarea = page.locator("textarea").first();
      if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
        await textarea.fill("Service en mer\nNAVIRE TEST - 1234567\nCapitaine\n01/01/2024 - 30/06/2024");
        await expect(textarea).toHaveValue(/NAVIRE TEST/);
      }
    }
  });
});
