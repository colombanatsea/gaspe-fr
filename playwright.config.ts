import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: isCI ? 2 : 1,
  use: {
    baseURL: isCI ? "http://localhost:3001" : "http://localhost:3001",
    headless: true,
    viewport: { width: 1280, height: 720 },
    locale: "fr-FR",
  },
  webServer: isCI
    ? {
        command: "npx serve out -l 3001 -s",
        port: 3001,
        reuseExistingServer: false,
        timeout: 30000,
      }
    : {
        command: "npm run dev",
        port: 3001,
        reuseExistingServer: true,
        timeout: 60000,
      },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 720 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 } } },
  ],
});
