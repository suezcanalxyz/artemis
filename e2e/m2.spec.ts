import { expect, test } from "@playwright/test";
import { completeArtistOnboarding } from "./helpers";

test("create and view an artwork in the catalog", async ({ page }) => {
  const email = `artist+${Date.now()}@example.com`;
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await completeArtistOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "Catalog", exact: true })
  ).toBeVisible();

  await page.getByLabel("Artwork title").fill("Courtyard Dusk");
  await page.getByLabel("Artwork year").fill("2025");
  await page.getByLabel("Artwork medium").fill("video");
  await page.getByRole("button", { name: "Create artwork" }).click();

  await expect(page.locator("h3", { hasText: "Courtyard Dusk" })).toBeVisible();

  await page.locator("a", { hasText: "Courtyard Dusk" }).click();
  await expect(page.getByRole("main").locator("input").first()).toHaveValue(
    "Courtyard Dusk"
  );
  await expect(
    page.getByRole("link", { name: "Back to artworks" })
  ).toBeVisible();
});

test("switch between grid and table view in the catalog", async ({ page }) => {
  const email = `artist-view+${Date.now()}@example.com`;
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await completeArtistOnboarding(page);

  await page.getByLabel("Artwork title").fill("Night Piece");
  await page.getByLabel("Artwork year").fill("2024");
  await page.getByLabel("Artwork medium").fill("painting");
  await page.getByRole("button", { name: "Create artwork" }).click();

  await expect(page.locator("h3", { hasText: "Night Piece" })).toBeVisible();

  await page.getByRole("button", { name: "Table" }).click();
  await expect(page.getByRole("cell", { name: "Night Piece" })).toBeVisible();

  await page.getByRole("button", { name: "Grid" }).click();
  await expect(page.locator("h3", { hasText: "Night Piece" })).toBeVisible();
});
