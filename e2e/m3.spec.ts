import { expect, test } from "@playwright/test";
import { completeArtistOnboarding } from "./helpers";

test("create an Artemis subdomain and confirm it is verified", async ({
  page
}) => {
  const email = `publisher+${Date.now()}@example.com`;
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await completeArtistOnboarding(page);
  await page.getByRole("link", { name: "Domains" }).click();
  await expect(
    page.getByRole("heading", { name: "Publishing surface", exact: true })
  ).toBeVisible();

  const label = `studio-${Date.now()}`;
  await page.getByPlaceholder("studio-rossi").fill(label);
  await page.getByRole("button", { name: "Claim subdomain" }).click();

  await expect(
    page.locator("h3", { hasText: `${label}.artemis.network` })
  ).toBeVisible();
  await expect(
    page.locator(`text=${label}.artemis.network`).locator("..").locator("p")
  ).toContainText("verified");
});

test("start custom domain verification and show TXT instructions", async ({
  page
}) => {
  const email = `custom-domain+${Date.now()}@example.com`;
  const host = `myatelier-${Date.now()}.example.com`;
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await completeArtistOnboarding(page);
  await page.getByRole("link", { name: "Domains" }).click();

  await page.getByPlaceholder("studio.example.com").fill(host);
  await page.getByRole("button", { name: "Start verification" }).click();

  await expect(page.locator("h3", { hasText: host })).toBeVisible();
  await expect(page.locator("text=Add this TXT record:")).toBeVisible();
  await expect(page.locator(`text=_artemis-verify.${host}`)).toBeVisible();
});
