import { randomUUID } from "node:crypto";
import { writeAuditLog } from "../lib/audit.js";
import { sql } from "../lib/db.js";
import {
  conflict,
  forbidden,
  notFound,
  validationError
} from "../lib/errors.js";
import { domainHealthQueue, domainVerificationQueue } from "../lib/queues.js";
import { config } from "../config.js";
import {
  buildTxtRecordName,
  checkDomainVerification
} from "./domainDnsService.js";
import { sendTemplateEmail } from "./emailService.js";
import { runDomainHealthCheck } from "./domainHealthService.js";

type DomainInput = {
  kind: "subdomain" | "custom";
  host?: string;
  subdomainLabel?: string;
  verificationMethod?: "txt" | "cname";
};

type DomainRow = {
  id: string;
  host: string;
  is_verified: boolean;
  profile_id: string;
  status: string;
};
type VerificationRow = DomainRow & {
  kind: "subdomain" | "custom";
  verification_method: "txt" | "cname";
  verification_token: string;
  verification_target: string | null;
};

const slugPattern = /^[a-z0-9-]{3,63}$/;

function normalizeHost(host: string) {
  return host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function buildVerificationTarget(token: string) {
  return `${token}.${config.DOMAIN_VERIFICATION_CNAME_TARGET}`.replace(
    /\.\.+/g,
    "."
  );
}

async function getOwnerDomain(domainId: string, profileId: string) {
  const [domain] = await sql<DomainRow[]>`
    select id, host, is_verified, profile_id, status from domains
    where id = ${domainId} and profile_id = ${profileId}
  `;
  if (!domain) throw notFound("Domain not found");
  return domain;
}

export async function listDomains(profileId: string) {
  return sql`
    select id, host, kind, is_verified, status, verification_method, verification_token,
    verification_target, is_primary, is_artemis_subdomain, verified_at, last_health_check_at, last_error
    from domains where profile_id = ${profileId} order by created_at asc
  `;
}

export async function createDomain(
  profileId: string,
  userId: string,
  email: string,
  input: DomainInput
) {
  const token = randomUUID().replace(/-/g, "");
  const host =
    input.kind === "subdomain"
      ? `${input.subdomainLabel}.${config.ARTEMIS_BASE_DOMAIN}`
      : normalizeHost(input.host ?? "");
  if (
    input.kind === "subdomain" &&
    !slugPattern.test(input.subdomainLabel ?? "")
  ) {
    throw validationError(
      "Subdomain label must be 3-63 chars: a-z, 0-9, hyphen"
    );
  }
  if (input.kind === "custom" && !host.includes("."))
    throw validationError("Custom domain must be valid");

  const duplicate = await sql<
    { id: string }[]
  >`select id from domains where host = ${host}`;
  if (duplicate.length) throw conflict("Domain already exists");

  const existing = await sql<
    { id: string }[]
  >`select id from domains where profile_id = ${profileId}`;
  const verificationMethod = input.verificationMethod ?? "txt";
  const verificationTarget =
    input.kind === "custom" ? buildVerificationTarget(token) : null;
  const [domain] = await sql`
    insert into domains (
      profile_id, host, is_verified, verification_token, verification_method, verification_target,
      status, verified_at, is_primary, is_artemis_subdomain, kind
    ) values (
      ${profileId}, ${host}, ${input.kind === "subdomain"}, ${token}, ${verificationMethod}, ${verificationTarget},
      ${input.kind === "subdomain" ? "verified" : "pending"}, ${input.kind === "subdomain" ? sql`now()` : null},
      ${existing.length === 0}, ${input.kind === "subdomain"}, ${input.kind}
    ) returning *
  `;
  await writeAuditLog({
    actorId: userId,
    entityType: "domain",
    entityId: domain.id,
    action: "domain.create",
    payload: { host }
  });

  if (input.kind === "custom") {
    await sendTemplateEmail(email, "domain-started", [
      `Verification started for ${host}.`,
      verificationMethod === "txt"
        ? `Add TXT ${buildTxtRecordName(host)} = ${token}`
        : `Point ${host} to ${verificationTarget}`,
      "Artemis will keep polling for up to 24 hours."
    ]);
    await scheduleVerification(domain.id);
  }

  return domain;
}

export async function scheduleVerification(domainId: string) {
  await domainVerificationQueue.add(
    "verify-domain",
    { domainId },
    {
      jobId: `verify-${domainId}`,
      attempts: 12,
      backoff: { type: "exponential", delay: 60_000 },
      removeOnComplete: true,
      removeOnFail: 50
    }
  );
}

export async function verifyDomain(
  domainId: string,
  userId?: string,
  profileId?: string
) {
  const [domain] = await sql<
    VerificationRow[]
  >`select * from domains where id = ${domainId}`;
  if (!domain) throw notFound("Domain not found");
  if (profileId && domain.profile_id !== profileId)
    throw forbidden("Domain does not belong to this profile");
  if (domain.kind === "subdomain") return domain;

  const result = await checkDomainVerification(domain);
  const [updated] = await sql`
    update domains
    set verification_attempts = verification_attempts + 1,
        is_verified = ${result.ok},
        status = ${result.ok ? "verified" : "pending"},
        verified_at = ${result.ok ? sql`now()` : null},
        last_error = ${result.ok ? null : result.detail}
    where id = ${domainId}
    returning *
  `;
  if (userId) {
    await writeAuditLog({
      actorId: userId,
      entityType: "domain",
      entityId: domainId,
      action: "domain.verify",
      payload: result
    });
  }
  if (result.ok) {
    await domainHealthQueue.add(
      "health-domain",
      { domainId },
      { jobId: `health-${domainId}` }
    );
    await domainHealthQueue.add(
      "health-domain-repeat",
      { domainId },
      {
        jobId: `health-repeat-${domainId}`,
        repeat: { every: 21_600_000 }
      }
    );
  }
  return {
    ...updated,
    verification_ok: result.ok,
    verification_detail: result.detail
  };
}

export async function getHealthChecks(domainId: string, profileId: string) {
  const domain = await getOwnerDomain(domainId, profileId);
  return sql`select * from domain_health_checks where domain_id = ${domain.id} order by checked_at desc limit 10`;
}

export async function deleteDomain(
  domainId: string,
  profileId: string,
  userId: string
) {
  const domain = await getOwnerDomain(domainId, profileId);
  await sql`delete from domains where id = ${domain.id}`;
  await writeAuditLog({
    actorId: userId,
    entityType: "domain",
    entityId: domain.id,
    action: "domain.delete",
    payload: { host: domain.host }
  });
}

export async function triggerHealthCheck(
  domainId: string,
  profileId: string,
  userId: string
) {
  const domain = await getOwnerDomain(domainId, profileId);
  if (!domain.is_verified) throw forbidden("Domain must be verified first");
  const check = await runDomainHealthCheck(domain.id);
  await writeAuditLog({
    actorId: userId,
    entityType: "domain",
    entityId: domain.id,
    action: "domain.health",
    payload: {}
  });
  return check;
}
