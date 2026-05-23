import { expect, test } from "@playwright/test";
import { completeArtistOnboarding } from "./helpers";

test("onboard, create a tech rider request, and generate a draft", async ({
  page,
  request
}) => {
  const email = `founder+${Date.now()}@example.com`;
  const appUrl = "http://localhost:3300";

  await expect
    .poll(async () => (await request.get(`${appUrl}/api/auth/me`)).status(), {
      timeout: 30000
    })
    .toBe(401);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await completeArtistOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "Catalog", exact: true })
  ).toBeVisible();
  await page.getByRole("link", { name: "Requests" }).click();
  await expect(page.getByRole("heading", { name: "Requests" })).toBeVisible();

  await page.getByPlaceholder("Request title").fill("Festival rider");
  await page.getByLabel("Structured input JSON").fill(`{
  "project_overview": "Two-screen projection with live narration.",
  "equipment": ["2 projectors", "4 speakers"],
  "installation_timeline": ["Day 1 setup", "Day 2 focus and audio check"],
  "transport": "Van delivery",
  "power": "2 dedicated circuits"
}`);
  await page.getByRole("button", { name: "Create request" }).click();

  await page.getByRole("link", { name: /Festival rider/i }).click();
  await page.getByRole("button", { name: "Generate draft" }).click();

  await expect(page.getByRole("heading", { name: "Equipment" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Installation Timeline" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Open Questions" })
  ).toBeVisible();
});
