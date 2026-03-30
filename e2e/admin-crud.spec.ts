import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/connexion");
  await page.fill('input[type="email"]', "admin@gaspe.fr");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/admin", { timeout: 10000 });
}

test.describe("Admin dashboard", () => {
  test("loads with stats cards", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator("text=Tableau de bord")).toBeVisible();
  });
});

test.describe("Admin comptes", () => {
  test("loads account management page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/comptes");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Admin offres", () => {
  test("loads offers management page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/offres");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("new offer page loads with form", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/offres/new");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });
});

test.describe("Admin formations", () => {
  test("loads formations management", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/formations");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("new formation page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/formations/new");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Admin positions", () => {
  test("loads positions management", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/positions");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("new position page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/positions/new");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Admin agenda", () => {
  test("loads agenda management", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/agenda");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Admin documents", () => {
  test("loads documents management", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/documents");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Admin membres", () => {
  test("loads members management", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/membres");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Admin messages", () => {
  test("loads messages page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/messages");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Admin paramètres", () => {
  test("loads settings page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/parametres");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Admin CMS pages", () => {
  test("loads CMS editor page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/pages");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
