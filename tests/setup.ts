import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { sql } from "../src/lib/db.js";
import { bullRedis, redis, redisPubSub } from "../src/lib/redis.js";

declare global {
  var __artemisTestHooksRegistered: boolean | undefined;
}

if (!globalThis.__artemisTestHooksRegistered) {
  globalThis.__artemisTestHooksRegistered = true;

  beforeAll(async () => {
    await sql.unsafe("drop schema public cascade; create schema public;");
    const files = (await readdir(path.resolve("migrations")))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    await sql`
      create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `;
    for (const file of files) {
      await sql.unsafe(await readFile(path.join("migrations", file), "utf8"));
      await sql`
        insert into schema_migrations (name)
        values (${file})
        on conflict (name) do nothing
      `;
    }
  });

  beforeEach(async () => {
    await sql`
      truncate table knowledge_chunks, knowledge_documents, artist_request_sources, artist_requests, opportunities, opportunity_sources,
      domain_health_checks, audit_log, artwork_projects, project_collaborators,
      projects, relationships, domains, media_assets, artworks, profiles, users
      restart identity cascade
    `;
    const keys = await redis.keys("*");
    if (keys.length) await redis.del(...keys);
  });

  afterAll(async () => {
    await bullRedis.quit();
    await redis.quit();
    await redisPubSub.quit();
    await sql.end();
  });
}
