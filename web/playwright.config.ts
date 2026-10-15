import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the local Supabase stack (scripts/local-supabase.sh) and seed data.
// They create accounts and licences, so reset the database before a local re-run: npm run db:reset.
const PORT = Number(process.env.PORT ?? 3000);
const chromium = process.env.CHROMIUM_PATH;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: chromium ? { executablePath: chromium } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
