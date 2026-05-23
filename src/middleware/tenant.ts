import type { NextFunction, Request, Response } from "express";
import { sql } from "../lib/db.js";
import { redis } from "../lib/redis.js";

const controlPlaneHosts = new Set([
  "localhost",
  "127.0.0.1",
  "app.artemis.network",
  "artemis.network"
]);

async function lookupTenant(host: string) {
  const cacheKey = `tenant:host:${host}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as Request["tenant"];

  const [domain] = await sql<{ domain_id: string; profile_id: string }[]>`
    select domains.id as domain_id, domains.profile_id
    from domains
    where domains.host = ${host} and domains.is_verified = true
    limit 1
  `;
  if (!domain) return null;

  const tenant: Request["tenant"] = {
    host,
    mode: "tenant",
    profileId: domain.profile_id,
    domainId: domain.domain_id,
    isCustomDomain: !host.endsWith(".artemis.network")
  };
  await redis.set(cacheKey, JSON.stringify(tenant), "EX", 60);
  return tenant;
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const host = (req.headers.host ?? "").split(":")[0].toLowerCase();

  if (!host || controlPlaneHosts.has(host)) {
    req.tenant = { host: host || "localhost", mode: "control_plane" };
    next();
    return;
  }

  const tenant = await lookupTenant(host);
  if (tenant) {
    req.tenant = tenant;
    next();
    return;
  }

  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `No Artemis tenant found for ${host}`
    }
  });
}
