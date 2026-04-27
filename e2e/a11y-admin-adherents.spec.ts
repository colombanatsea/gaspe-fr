import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/connexion");
  await page.fill('input[type="email"]', "admin@gaspe.fr");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/admin", { timeout: 10000 });
}

test.describe("/admin/adherents accessibility", () => {
  test("expanded view passes axe-core (no critical/serious)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/adherents");
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    if (blocking.length > 0) {
      console.log("\nViolations bloquantes (vue Détaillée) :");
      for (const v of blocking) {
        console.log(`  [${v.impact}] ${v.id} – ${v.description}`);
        console.log(`    aide : ${v.helpUrl}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    ${node.target.join(" > ")}`);
        }
      }
    }
    expect(blocking).toEqual([]);
  });

  test("compact (table) view passes axe-core", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/adherents");
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Tableau")');
    await page.waitForTimeout(300);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    if (blocking.length > 0) {
      console.log("\nViolations bloquantes (vue Tableau) :");
      for (const v of blocking) {
        console.log(`  [${v.impact}] ${v.id} – ${v.description}`);
        console.log(`    aide : ${v.helpUrl}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    ${node.target.join(" > ")}`);
        }
      }
    }
    expect(blocking).toEqual([]);
  });

  test("create modal passes axe-core (mode démo)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/adherents");
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Le bouton « Ajouter un adhérent » n'est rendu qu'en mode demo
    // (pas d'API_URL configuré dans les e2e)
    await page.click('button:has-text("Ajouter un adhérent")');
    await page.waitForSelector('h2:has-text("Nouvel adhérent")', { timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    if (blocking.length > 0) {
      console.log("\nViolations bloquantes (modal) :");
      for (const v of blocking) {
        console.log(`  [${v.impact}] ${v.id} – ${v.description}`);
        console.log(`    aide : ${v.helpUrl}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    ${node.target.join(" > ")}`);
        }
      }
    }
    expect(blocking).toEqual([]);
  });
});
