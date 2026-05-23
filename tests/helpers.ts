import request from "supertest";
import { createApp } from "../src/app.js";

export const app = createApp();

export async function registerAndLogin(email: string) {
  const register = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "password123" });
  return {
    accessToken: register.body.data.accessToken as string,
    profileId: register.body.data.user.profileId as string
  };
}

export async function createArtwork(
  accessToken: string,
  visibility:
    | "private"
    | "shared_with_relationships"
    | "project_only"
    | "public",
  title = `${visibility} piece`,
  year = 2026,
  medium = "video"
) {
  const created = await request(app)
    .post("/api/artworks")
    .set("authorization", `Bearer ${accessToken}`)
    .send({ title, year, medium, description: "", visibility });
  return created.body.data.id as string;
}

export function authedGet(accessToken: string, artworkId: string) {
  return request(app)
    .get(`/api/artworks/${artworkId}`)
    .set("authorization", `Bearer ${accessToken}`);
}
