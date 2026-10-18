import { expect, test } from "@playwright/test";
import { signIn, signOut } from "./helpers";

test("a new composer signs up, sets up a profile and publishes a composition", async ({ page }) => {
  const email = `composer-${Date.now()}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("a-long-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Your name").fill("Test Composer");
  await page.getByLabel("City").fill("Ottawa, ON");
  await page.getByLabel("Composer").check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/studio/);
  await page.getByRole("link", { name: "New composition" }).first().click();
  await page.getByLabel("Title", { exact: true }).fill("Test Sandhya Tihai");
  await page.getByLabel("Form", { exact: true }).selectOption("Tihai");
  await page.getByLabel("Taal", { exact: true }).selectOption("jhaptaal");
  await page.getByLabel("Notation").fill("Dha Dhin Na | Dha Dhin Na\nTa Tin Na | Dha Dhin Na");
  await page.getByRole("button", { name: "Publish" }).click();

  await expect(page).toHaveURL(/\/studio\?published=/);
  await expect(page.getByRole("link", { name: "Test Sandhya Tihai" }).first()).toBeVisible();

  await page.goto("/compositions?q=Sandhya");
  await expect(page.getByRole("link", { name: /Test Sandhya Tihai/ }).first()).toBeVisible();
  await signOut(page);
});

test("a student licenses a piece and reads the full notation", async ({ page }) => {
  await signIn(page, "asha@example.com", "/compositions/chakradar-tihai-no-7");
  await expect(page.getByText(/Any licence unlocks/)).toBeVisible();
  await page.getByRole("button", { name: /Get Listen licence/ }).click();
  await expect(page.getByText(/Listen licence added/)).toBeVisible();
  await expect(page.getByText(/You hold a Listen licence/)).toBeVisible();
  await expect(page.getByText(/Any licence unlocks/)).toHaveCount(0);

  await page.goto("/library");
  await expect(page.getByRole("link", { name: "Chakradar Tihai No. 7" })).toBeVisible();
  await signOut(page);
});

test("a student asks to join an academy and the guru accepts and releases a piece", async ({ page }) => {
  // The seed data already has Asha waiting here, so withdraw that request and ask again.
  await signIn(page, "asha@example.com", "/academies/taal-ghar-tabla-school");
  await page.getByRole("button", { name: "Withdraw request" }).click();
  await page.getByRole("button", { name: /Ask to join/ }).click();
  await expect(page.getByText(/Request sent/)).toBeVisible();
  await signOut(page);

  await signIn(page, "kabir@example.com", "/academy");
  await expect(page.getByRole("heading", { name: "Asking to join" })).toBeVisible();
  await page.getByRole("button", { name: "Accept Asha Rao" }).click();
  await expect(page.getByText("Student placed.")).toBeVisible();
  const first = page.getByRole("switch").first();
  const wasOn = (await first.getAttribute("aria-checked")) === "true";
  if (!wasOn) {
    await first.click();
    await expect(page.getByText("Released to this level.")).toBeVisible();
  }
  await signOut(page);

  await signIn(page, "asha@example.com", "/library");
  await expect(page.getByRole("heading", { name: "Taal Ghar Tabla School" })).toBeVisible();
});

test("dialogs close with Escape and hand focus back", async ({ page }) => {
  await signIn(page, "nalini@example.com", "/academy");
  const trigger = page.getByRole("button", { name: "Edit details" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Academy details" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
