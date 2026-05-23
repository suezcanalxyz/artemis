import "./setup.js";
import express from "express";
import sharp from "sharp";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { config } from "../src/config.js";
import { sql } from "../src/lib/db.js";
import { rateLimit } from "../src/middleware/rateLimit.js";
import { setDomainDnsResolvers } from "../src/services/domainDnsService.js";
import { setDomainHealthFetch } from "../src/services/domainHealthService.js";
import { app, authedGet, createArtwork, registerAndLogin } from "./helpers.js";

describe("api", () => {
  it("registers, logs in, creates artwork, and fetches it", async () => {
    const session = await registerAndLogin("test@example.com");
    const created = await request(app)
      .post("/api/artworks")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Test Piece",
        year: 2026,
        medium: "video",
        description: "",
        visibility: "private"
      });
    expect(created.status).toBe(201);
    expect(
      (
        await request(app)
          .get(`/api/artworks/${created.body.data.id}`)
          .set("authorization", `Bearer ${session.accessToken}`)
      ).body.data.medium
    ).toBe("video");
  });

  it("rotates refresh tokens and rate limits", async () => {
    const limitedApp = express();
    const limitKey = `test-rate-limit-${Date.now()}`;
    limitedApp.use(
      rateLimit({ key: () => limitKey, limit: 1, windowMs: 60_000 })
    );
    limitedApp.get("/limited", (_req, res) => res.json({ ok: true }));
    const register = await request(app)
      .post("/api/auth/register")
      .send({ email: "rotate@example.com", password: "password123" });
    const refreshToken = register.body.data.refreshToken as string;
    expect(
      (await request(app).post("/api/auth/refresh").send({ refreshToken }))
        .status
    ).toBe(200);
    expect(
      (await request(app).post("/api/auth/refresh").send({ refreshToken }))
        .status
    ).toBe(401);
    expect((await request(limitedApp).get("/limited")).status).toBe(200);
    expect((await request(limitedApp).get("/limited")).status).toBe(429);
  });

  it("enforces artwork visibility across all levels", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const related = await registerAndLogin("related@example.com");
    const projectViewer = await registerAndLogin("project@example.com");
    const stranger = await registerAndLogin("stranger@example.com");
    const ids = {
      private: await createArtwork(owner.accessToken, "private"),
      shared: await createArtwork(
        owner.accessToken,
        "shared_with_relationships"
      ),
      project: await createArtwork(owner.accessToken, "project_only"),
      public: await createArtwork(owner.accessToken, "public")
    };
    await sql`insert into relationships (profile_id, related_profile_id, status) values (${owner.profileId}, ${related.profileId}, 'accepted')`;
    const [project] = await sql<
      { id: string }[]
    >`insert into projects (owner_profile_id, title) values (${owner.profileId}, 'Shared Project') returning id`;
    await sql`insert into project_collaborators (project_id, profile_id) values (${project.id}, ${projectViewer.profileId})`;
    await sql`insert into artwork_projects (artwork_id, project_id) values (${ids.project}, ${project.id})`;
    expect(
      (await request(app).get(`/api/artworks/${ids.private}`)).status
    ).toBe(403);
    expect((await authedGet(related.accessToken, ids.shared)).status).toBe(200);
    expect(
      (await authedGet(projectViewer.accessToken, ids.project)).status
    ).toBe(200);
    expect((await request(app).get(`/api/artworks/${ids.public}`)).status).toBe(
      200
    );
    expect((await authedGet(stranger.accessToken, ids.shared)).status).toBe(
      403
    );
  });

  it("filters, paginates, and manages artwork media", async () => {
    const session = await registerAndLogin("media@example.com");
    await createArtwork(
      session.accessToken,
      "public",
      "Alpha Video",
      2022,
      "video"
    );
    await createArtwork(
      session.accessToken,
      "private",
      "Beta Sculpture",
      2023,
      "sculpture"
    );
    const artworkId = await createArtwork(
      session.accessToken,
      "public",
      "Gamma Video",
      2024,
      "video"
    );
    const first = await request(app)
      .get("/api/artworks?limit=1&visibility=public&medium=video")
      .set("authorization", `Bearer ${session.accessToken}`);
    const second = await request(app)
      .get(
        `/api/artworks?limit=1&visibility=public&medium=video&cursor=${encodeURIComponent(first.body.meta.nextCursor)}&search=Alpha`
      )
      .set("authorization", `Bearer ${session.accessToken}`);
    expect(first.body.data).toHaveLength(1);
    expect(second.body.data[0].title).toContain("Alpha");
    const image = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
      .png()
      .toBuffer();
    const one = await request(app)
      .post(`/api/artworks/${artworkId}/media`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .attach("file", image, "one.png");
    const two = await request(app)
      .post(`/api/artworks/${artworkId}/media`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .attach("file", image, "two.png");
    await request(app)
      .patch(`/api/artworks/${artworkId}/media/${two.body.data.id}`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({ isPrimary: true, sortOrder: 0 });
    const fetched = await authedGet(session.accessToken, artworkId);
    expect(fetched.body.data.media[0].id).toBe(two.body.data.id);
    expect(one.body.data.thumbnail_small_key).toContain("-400.webp");
  });

  it("creates subdomains and protects caddy ask from unverified domains", async () => {
    const session = await registerAndLogin("domains@example.com");
    const subdomain = await request(app)
      .post("/api/domains")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({ kind: "subdomain", subdomainLabel: "studio-rossi" });
    const custom = await request(app)
      .post("/api/domains")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        kind: "custom",
        host: "studio.example.com",
        verificationMethod: "txt"
      });
    expect(subdomain.body.data.is_verified).toBe(true);
    expect(custom.body.data.is_verified).toBe(false);
    expect(
      (
        await request(app).get(
          `/internal/caddy/ask?token=${config.CADDY_ASK_TOKEN}&domain=studio-rossi.artemis.network`
        )
      ).status
    ).toBe(200);
    expect(
      (
        await request(app).get(
          `/internal/caddy/ask?token=${config.CADDY_ASK_TOKEN}&domain=studio.example.com`
        )
      ).status
    ).toBe(403);
  }, 15_000);

  it("verifies domains from DNS and records health checks", async () => {
    const session = await registerAndLogin("verify@example.com");
    const created = await request(app)
      .post("/api/domains")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        kind: "custom",
        host: "atelier.example.com",
        verificationMethod: "txt"
      });
    const domain = created.body.data as {
      id: string;
      verification_token: string;
    };
    setDomainDnsResolvers({
      resolveTxt: async () => [[domain.verification_token]],
      resolveCname: async () => []
    });
    setDomainHealthFetch(async () => new Response("ok", { status: 200 }));
    const verified = await request(app)
      .post(`/api/domains/${domain.id}/verify`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});
    const health = await request(app)
      .post(`/api/domains/${domain.id}/health`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});
    const checks = await request(app)
      .get(`/api/domains/${domain.id}/health`)
      .set("authorization", `Bearer ${session.accessToken}`);
    expect(verified.body.data.is_verified).toBe(true);
    expect(
      (
        await request(app).get(
          `/internal/caddy/ask?token=${config.CADDY_ASK_TOKEN}&domain=atelier.example.com`
        )
      ).status
    ).toBe(200);
    expect(health.body.data.ssl_ok).toBe(true);
    expect(checks.body.data).toHaveLength(1);
    setDomainDnsResolvers();
    setDomainHealthFetch();
  }, 15_000);

  it("creates an artist request", async () => {
    const session = await registerAndLogin("requests-create@example.com");
    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Museum installation rider",
        type: "tech_rider",
        structured_input: {
          project_overview: "Two-channel video installation",
          equipment: ["2 projectors"],
          installation_timeline: ["Day 1 rigging"]
        }
      });

    expect(created.status).toBe(201);
    expect(created.body.data.title).toBe("Museum installation rider");
    expect(created.body.data.sources[0].source_kind).toBe("user_input");
  });

  it("reports onboarding status and completes onboarding with a valid role plan", async () => {
    const session = await registerAndLogin("onboarding@example.com");

    const initial = await request(app)
      .get("/api/onboarding/status")
      .set("authorization", `Bearer ${session.accessToken}`);

    expect(initial.status).toBe(200);
    expect(initial.body.data.onboarding_completed).toBe(false);
    expect(initial.body.data.role).toBe("artist");
    expect(initial.body.data.plan).toBe("artist_free");

    const completed = await request(app)
      .post("/api/onboarding/complete")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        role: "gallery",
        plan: "gallery_professional",
        displayName: "Studio Rossi",
        location: "Valletta, Malta",
        website: "https://studiorossi.example"
      });

    expect(completed.status).toBe(200);
    expect(completed.body.data.role).toBe("gallery");
    expect(completed.body.data.plan).toBe("gallery_professional");

    const me = await request(app)
      .get("/api/auth/me")
      .set("authorization", `Bearer ${session.accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.data.onboarding_completed).toBe(true);
    expect(me.body.data.role).toBe("gallery");
    expect(me.body.data.plan).toBe("gallery_professional");
  });

  it("rejects onboarding plans that do not belong to the selected role", async () => {
    const session = await registerAndLogin("onboarding-invalid@example.com");

    const completed = await request(app)
      .post("/api/onboarding/complete")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        role: "artist",
        plan: "gallery_professional"
      });

    expect(completed.status).toBe(422);
    expect(completed.body.error.code).toBe("INVALID_PLAN");
  });

  it("updates artist request structured input", async () => {
    const session = await registerAndLogin("requests-update@example.com");
    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Procedure draft",
        type: "procedure",
        structured_input: { objective: "Initial" }
      });

    const updated = await request(app)
      .patch(`/api/artist-requests/${created.body.data.id}`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        structured_input: {
          objective: "Install exhibition safely",
          steps: ["Unload works", "Condition check", "Mount work"]
        }
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data.structured_input.steps).toContain("Mount work");
  });

  it("generates a deterministic tech rider draft from user input", async () => {
    const session = await registerAndLogin("requests-rider@example.com");
    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Courtyard projection rider",
        type: "tech_rider",
        structured_input: {
          project_overview: "Evening courtyard projection with stereo audio.",
          equipment: ["2 x 7000-lumen projectors", "Stereo PA"],
          installation_timeline: ["Day 1: rigging", "Day 2: calibration"],
          staffing: ["1 technician", "1 producer"],
          safety: ["Cable covers"],
          transport: "Van delivery in reusable crates",
          power: "2 dedicated 16A circuits"
        }
      });

    const generated = await request(app)
      .post(`/api/artist-requests/${created.body.data.id}/generate-draft`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});

    expect(generated.status).toBe(200);
    expect(generated.body.data.generated_output.equipment).toContain(
      "2 x 7000-lumen projectors"
    );
    expect(
      generated.body.data.generated_output.installation_timeline
    ).toContain("Day 1: rigging");
    expect(generated.body.data.generated_output.open_questions).toEqual([]);
  });

  it("generates opportunity research using only seeded test opportunity data", async () => {
    const session = await registerAndLogin(
      "requests-opportunities@example.com"
    );
    await request(app)
      .post("/api/opportunities/refresh")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});

    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Find open calls for a video installation",
        type: "opportunity_research",
        structured_input: {
          discipline: ["video"],
          geography: "EU",
          project_summary: "Video installation"
        }
      });

    const generated = await request(app)
      .post(`/api/artist-requests/${created.body.data.id}/generate-draft`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});

    expect(generated.status).toBe(200);
    expect(
      generated.body.data.generated_output.matched_opportunities[0].title
    ).toContain("Test Opportunity");
    expect(
      generated.body.data.generated_output.matched_opportunities[0].note
    ).toContain("Placeholder");
    expect(
      generated.body.data.generated_output.sources.some(
        (source: { kind: string }) => source.kind === "opportunity"
      )
    ).toBe(true);
  });

  it("creates an opportunity source in the verified intake registry", async () => {
    const session = await registerAndLogin("source-registry@example.com");
    const created = await request(app)
      .post("/api/opportunity-sources")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        name: "Curatorial Manual Register",
        kind: "manual",
        base_url: "https://artemis.local/manual-intake",
        reliability: "editorial_review",
        description: "Manual intake source for curated opportunity screening."
      });

    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe("Curatorial Manual Register");
    expect(created.body.data.kind).toBe("manual");
  });

  it("verifies a seeded opportunity through the intake workflow", async () => {
    const session = await registerAndLogin("verify-opportunity@example.com");
    const refreshed = await request(app)
      .post("/api/opportunities/refresh")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});

    const opportunityId = refreshed.body.data.opportunities[0].id as string;
    const verified = await request(app)
      .post(`/api/opportunities/${opportunityId}/verify`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({ reviewNotes: "Verified through intake test." });

    expect(verified.status).toBe(200);
    expect(verified.body.data.review_status).toBe("verified");
    expect(verified.body.data.verified_at).toBeTruthy();
  });

  it("attaches a verified opportunity to a request as explicit provenance", async () => {
    const session = await registerAndLogin("attach-verified@example.com");
    const refreshed = await request(app)
      .post("/api/opportunities/refresh")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});

    const opportunityId = refreshed.body.data.opportunities[0].id as string;
    await request(app)
      .post(`/api/opportunities/${opportunityId}/verify`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({ reviewNotes: "Verified for attach flow." });

    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Attach verified record",
        type: "opportunity_research",
        structured_input: {
          discipline: ["installation"],
          geography: "International"
        }
      });

    const attached = await request(app)
      .post(
        `/api/artist-requests/${created.body.data.id}/sources/opportunities`
      )
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({ opportunity_id: opportunityId });

    expect(attached.status).toBe(200);
    expect(
      attached.body.data.sources.some(
        (source: { source_kind: string; source_id: string | null }) =>
          source.source_kind === "opportunity" &&
          source.source_id === opportunityId
      )
    ).toBe(true);
  });

  it("includes sources and confidence level in generated output", async () => {
    const session = await registerAndLogin("requests-confidence@example.com");
    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Presentation deck brief",
        type: "presentation",
        structured_input: {
          presentation_title: "Studio dossier",
          slide_outline: ["Practice overview", "Selected works"]
        }
      });

    const generated = await request(app)
      .post(`/api/artist-requests/${created.body.data.id}/generate-draft`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});

    expect(["unverified", "partially_verified", "verified"]).toContain(
      generated.body.data.confidence_level
    );
    expect(generated.body.data.generated_output.sources.length).toBeGreaterThan(
      0
    );
    expect(generated.body.data.generated_output.sources[0].kind).toBe(
      "user_input"
    );
  });

  it("generates a funding research draft", async () => {
    const session = await registerAndLogin("requests-funding@example.com");
    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Funding brief for outdoor sculpture",
        type: "funding_research",
        structured_input: {
          discipline: ["sculpture"],
          project_summary: "Outdoor sculpture installation for public park",
          budget_range: "€20,000–€50,000",
          timeline: "Q3 2026",
          geography: "IT"
        }
      });

    const generated = await request(app)
      .post(`/api/artist-requests/${created.body.data.id}/generate-draft`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});

    expect(generated.status).toBe(200);
    expect(generated.body.data.generated_output.funding_strategy).toContain(
      "Outdoor sculpture installation"
    );
    expect(
      generated.body.data.generated_output.possible_programme_types
    ).toContain("sculpture production support");
    expect(
      generated.body.data.generated_output.missing_information
    ).not.toContain("Budget range");
  });

  it("generates a website update draft", async () => {
    const session = await registerAndLogin("requests-website@example.com");
    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Portfolio refresh",
        type: "website_update",
        structured_input: {
          objective: "Refresh homepage and add new works",
          target_pages: ["homepage", "artworks"],
          content_requirements: ["New video works", "Updated bio"],
          technical_tasks: ["Update grid layout", "Optimise images"]
        }
      });

    const generated = await request(app)
      .post(`/api/artist-requests/${created.body.data.id}/generate-draft`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});

    expect(generated.status).toBe(200);
    expect(generated.body.data.generated_output.objective).toContain(
      "Refresh homepage"
    );
    expect(generated.body.data.generated_output.target_pages).toContain(
      "homepage"
    );
    expect(generated.body.data.generated_output.technical_tasks).toContain(
      "Update grid layout"
    );
  });

  it("deletes an artwork and returns 403 on subsequent fetch", async () => {
    const session = await registerAndLogin("artwork-delete@example.com");
    const artworkId = await createArtwork(session.accessToken, "private");
    const deleted = await request(app)
      .delete(`/api/artworks/${artworkId}`)
      .set("authorization", `Bearer ${session.accessToken}`);
    expect(deleted.status).toBe(200);
    expect((await request(app).get(`/api/artworks/${artworkId}`)).status).toBe(
      404
    );
  });

  it("marks a request as ready for processing", async () => {
    const session = await registerAndLogin("requests-mark-ready@example.com");
    const created = await request(app)
      .post("/api/artist-requests")
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({
        title: "Procedure to mark ready",
        type: "procedure",
        structured_input: { objective: "Test" }
      });
    expect(created.body.data.status).toBe("draft");

    const marked = await request(app)
      .post(`/api/artist-requests/${created.body.data.id}/mark-ready`)
      .set("authorization", `Bearer ${session.accessToken}`)
      .send({});
    expect(marked.status).toBe(200);
    expect(marked.body.data.status).toBe("ready_for_processing");
  });

  it("serves health on both public paths", async () => {
    const health = await request(app).get("/health");
    const apiHealth = await request(app).get("/api/health");

    expect(health.status).toBe(200);
    expect(apiHealth.status).toBe(200);
    expect(health.body.data.ok).toBe(true);
    expect(apiHealth.body.data.services.database).toBe("ok");
  });

  it("serves readiness on both public paths", async () => {
    const ready = await request(app).get("/ready");
    const apiReady = await request(app).get("/api/ready");

    expect(ready.status).toBe(200);
    expect(apiReady.status).toBe(200);
    expect(ready.body.data.ok).toBe(true);
    expect(apiReady.body.data.services.redis).toBe("ok");
  });
});
