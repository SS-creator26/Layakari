import { expect, test } from "@playwright/test";

test("landing page leads into the catalogue", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Layakari/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/compositions");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('a[href^="/compositions/"]').first()).toBeVisible();
});

test("catalogue filters by taal and search", async ({ page }) => {
  await page.goto("/compositions?taal=jhaptaal");
  const links = page.locator('main a[href^="/compositions/"]');
  await expect(links.first()).toBeVisible();
  await expect(page.locator('main a[href="/compositions/jhaptaal-rela"]').first()).toBeVisible();
  await expect(page.locator('main a[href="/compositions/megh-malhar-paran"]')).toHaveCount(0);
  await page.goto("/compositions?q=zzzz-no-match");
  await expect(page.getByText(/no compositions|nothing matches/i)).toBeVisible();
});

test("a composition shows a free preview, locks the rest, and plays the theka", async ({ page }) => {
  await page.goto("/compositions/megh-malhar-paran");
  await expect(page.getByRole("heading", { level: 1, name: "Megh Malhar Paran" })).toBeVisible();
  await expect(page.getByText(/Any licence unlocks/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to license" })).toBeVisible();
  await page.getByRole("button", { name: "Play theka" }).first().click();
  await expect(page.getByRole("button", { name: /Pause theka/ }).first()).toBeVisible();
});

test("artist and academy pages render", async ({ page }) => {
  await page.goto("/artists");
  await page.getByRole("link", { name: /Nalini Sharma/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Nalini Sharma" })).toBeVisible();
  await page.goto("/academies");
  await page.getByRole("link", { name: /Nritya Sadhana Academy/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Nritya Sadhana Academy" })).toBeVisible();
});

test("signed-in pages send visitors to sign in", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fstudio/);
});
