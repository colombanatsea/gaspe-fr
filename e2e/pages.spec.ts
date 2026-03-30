import { test, expect } from "@playwright/test";

test.describe("Public pages load correctly", () => {
  const pages = [
    { url: "/", title: "compagnies maritimes" },
    { url: "/notre-groupement", title: "Notre Groupement" },
    { url: "/nos-adherents", title: "" },
    { url: "/positions", title: "Positions" },
    { url: "/documents", title: "Documents" },
    { url: "/agenda", title: "" },
    { url: "/formations", title: "Formations" },
    { url: "/boite-a-outils", title: "" },
    { url: "/nos-compagnies-recrutent", title: "" },
    { url: "/contact", title: "Contact" },
    { url: "/mentions-legales", title: "Mentions" },
    { url: "/confidentialite", title: "" },
    { url: "/cgu", title: "" },
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

test.describe("Member culture pages (SSG)", () => {
  const memberSlugs = [
    "compagnie-oceane",
    "manche-iles-express",
    "corsica-ferries",
    "blue-lines",
  ];

  for (const slug of memberSlugs) {
    test(`/nos-adherents/${slug} loads`, async ({ page }) => {
      const response = await page.goto(`/nos-adherents/${slug}`);
      expect(response?.status()).toBe(200);
    });
  }
});

test.describe("Job detail pages (SSG)", () => {
  const jobSlugs = [
    "chef-mecanicien-3000-kw-manche-iles-express",
    "capitaine-brevet-illimite-gironde",
    "capitaine-3000-ums-blaye-lamarque",
  ];

  for (const slug of jobSlugs) {
    test(`/nos-compagnies-recrutent/${slug} loads with sidebar`, async ({ page }) => {
      const response = await page.goto(`/nos-compagnies-recrutent/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("text=Postuler")).toBeVisible();
    });
  }
});

test.describe("Formation detail pages (SSG)", () => {
  const formationSlugs = [
    "cfbs-certificat-formation-base-securite",
    "brevet-capitaine-200",
    "brevet-mecanicien-750kw",
    "audit-interne-ism-isps",
    "transition-energetique-flottes",
    "recyclage-premiers-secours-mer",
    "management-equipage-leadership",
    "ccn-3228-mise-a-jour",
  ];

  for (const slug of formationSlugs) {
    test(`/formations/${slug} loads`, async ({ page }) => {
      const response = await page.goto(`/formations/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
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
  });
});

test.describe("Dark mode toggle", () => {
  test("theme toggle switches between light and dark", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator('button[aria-label*="mode"]');
    await expect(toggle.first()).toBeVisible();
    await toggle.first().click();
    const theme = await page.locator("html").getAttribute("data-theme");
    expect(theme).toBe("dark");
    await toggle.first().click();
    const themeBack = await page.locator("html").getAttribute("data-theme");
    expect(themeBack).toBe("light");
  });
});

test.describe("Redirect pages", () => {
  test("/actualites redirects to /positions content", async ({ page }) => {
    const response = await page.goto("/actualites");
    expect(response?.status()).toBe(200);
    await expect(page.locator("text=Positions")).toBeVisible();
  });

  test("/presse redirects to /positions content", async ({ page }) => {
    const response = await page.goto("/presse");
    expect(response?.status()).toBe(200);
    await expect(page.locator("text=Positions")).toBeVisible();
  });
});

test.describe("SEO metadata", () => {
  test("homepage has title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("GASPE");
  });

  test("formations page has title", async ({ page }) => {
    await page.goto("/formations");
    const title = await page.title();
    expect(title).toContain("Formations");
  });

  test("contact page has title", async ({ page }) => {
    await page.goto("/contact");
    const title = await page.title();
    expect(title).toContain("Contact");
  });
});
