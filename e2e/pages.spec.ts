import { test, expect } from "@playwright/test";

test.describe("Public pages load correctly", () => {
  const pages = [
    { url: "/", title: "compagnies maritimes" },
    { url: "/notre-groupement", title: "Notre Groupement" },
    { url: "/nos-adherents", title: "" }, // Map page, no h1
    { url: "/positions", title: "Positions" },
    { url: "/documents", title: "Documents" },
    { url: "/agenda", title: "Agenda" },
    { url: "/formations", title: "Formations" },
    { url: "/boite-a-outils", title: "Boîte à outils" },
    { url: "/nos-compagnies-recrutent", title: "" }, // Hero section
    { url: "/contact", title: "Contact" },
    { url: "/mentions-legales", title: "Mentions" },
    { url: "/confidentialite", title: "Politique" },
  ];

  for (const { url, title } of pages) {
    test(`${url} loads without errors`, async ({ page }) => {
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);
      if (title) {
        await expect(page.locator("h1").first()).toContainText(title);
      }
    });
  }
});

test.describe("Auth pages", () => {
  test("/connexion loads", async ({ page }) => {
    const response = await page.goto("/connexion");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Connexion");
  });

  test("/inscription/candidat loads", async ({ page }) => {
    const response = await page.goto("/inscription/candidat");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Candidat");
  });

  test("/inscription/adherent loads", async ({ page }) => {
    const response = await page.goto("/inscription/adherent");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Adhérent");
  });
});

test.describe("Member culture pages", () => {
  test("member detail page loads", async ({ page }) => {
    const response = await page.goto("/nos-adherents/compagnie-oceane");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Job detail pages", () => {
  test("job detail page loads with sidebar", async ({ page }) => {
    await page.goto("/nos-compagnies-recrutent/chef-mecanicien-3000-kw-manche-iles-express");
    await expect(page.locator("h1")).toContainText("Chef Mécanicien");
    await expect(page.locator("text=Postuler")).toBeVisible();
  });
});

test.describe("Dark mode toggle", () => {
  test("theme toggle switches between light and dark", async ({ page }) => {
    await page.goto("/");
    // Toggle button should exist
    const toggle = page.locator('button[aria-label*="mode"]');
    await expect(toggle.first()).toBeVisible();
    // Click to switch to dark mode
    await toggle.first().click();
    const theme = await page.locator("html").getAttribute("data-theme");
    expect(theme).toBe("dark");
    // Click again to switch back
    await toggle.first().click();
    const themeBack = await page.locator("html").getAttribute("data-theme");
    expect(themeBack).toBe("light");
  });
});
