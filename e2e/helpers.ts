import { expect, type Page } from "@playwright/test";

export async function completeArtistOnboarding(page: Page) {
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 15000 });
  await page
    .getByRole("button", { name: "Select role Artist", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue ->" }).click();
  await page
    .getByRole("button", { name: "Select plan Studio", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue ->" }).click();
  await page.getByLabel("Display name").fill("Test Artist");
  await page.getByRole("button", { name: "Enter workspace ->" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
}
