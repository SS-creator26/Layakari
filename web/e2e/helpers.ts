import { expect, type Page } from "@playwright/test";

export const PASSWORD = "layakari-demo";

export async function signIn(page: Page, email: string, next = "/library") {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[?]/g, "\\?")));
}

export async function signOut(page: Page) {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
}
