import { writeAuditLog } from "../lib/audit.js";
import { sql } from "../lib/db.js";
import { notFound } from "../lib/errors.js";
import { buildDraft } from "./requestDraftService.js";

type RequestType =
  | "opportunity_research"
  | "funding_research"
  | "tech_rider"
  | "procedure"
  | "presentation"
  | "website_update";

type RequestStatus =
  | "draft"
  | "ready_for_processing"
  | "processing"
  | "needs_review"
  | "completed"
  | "archived";

type ConfidenceLevel = "unverified" | "partially_verified" | "verified";

type RequestRow = {
  id: string;
  profile_id: string;
  type: RequestType;
  status: RequestStatus;
  priority: string;
  title: string;
  structured_input: Record<string, unknown> | string;
  generated_output: Record<string, unknown> | string;
  human_notes: string | null;
  confidence_level: ConfidenceLevel;
  created_at: string;
  updated_at: string;
};

type RequestSourceRow = {
  id: string;
  request_id: string;
  source_kind: string;
  source_id: string | null;
  title: string | null;
  url: string | null;
  excerpt: string | null;
  fetched_at: string | null;
  created_at: string;
};

type CreateArtistRequestInput = {
  type: RequestType;
  status?: RequestStatus;
  priority?: string;
  title: string;
  structured_input?: Record<string, unknown>;
  human_notes?: string;
};

type UpdateArtistRequestInput = {
  type?: RequestType;
  status?: RequestStatus;
  priority?: string;
  title?: string;
  structured_input?: Record<string, unknown>;
  human_notes?: string | null;
  confidence_level?: ConfidenceLevel;
};

function parseJsonRecord(value: Record<string, unknown> | string) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  return value;
}

function mapRequest(row: RequestRow, sources: RequestSourceRow[]) {
  return {
    ...row,
    structured_input: parseJsonRecord(row.structured_input),
    generated_output: parseJsonRecord(row.generated_output),
    source_profile_id: row.profile_id,
    sources
  };
}

async function upsertUserInputSource(
  requestId: string,
  title: string,
  structuredInput: Record<string, unknown>,
  humanNotes?: string | null
) {
  const excerpt = JSON.stringify(
    {
      structured_input: structuredInput,
      human_notes: humanNotes ?? null
    },
    null,
    2
  );

  const [updated] = await sql<{ id: string }[]>`
    update artist_request_sources
    set title = ${title}, excerpt = ${excerpt}, fetched_at = now()
    where request_id = ${requestId} and source_kind = 'user_input'
    returning id
  `;

  if (!updated) {
    await sql`
      insert into artist_request_sources (request_id, source_kind, title, excerpt, fetched_at)
      values (${requestId}, 'user_input', ${title}, ${excerpt}, now())
    `;
  }
}

async function getSources(requestId: string) {
  return sql<RequestSourceRow[]>`
    select id, request_id, source_kind, source_id, title, url, excerpt, fetched_at, created_at
    from artist_request_sources
    where request_id = ${requestId}
    order by created_at asc
  `;
}

async function getOwnedRequest(requestId: string, profileId: string) {
  const [row] = await sql<RequestRow[]>`
    select *
    from artist_requests
    where id = ${requestId} and profile_id = ${profileId}
  `;
  if (!row) throw notFound("Artist request not found");
  return row;
}

export async function listRequests(profileId: string) {
  const rows = await sql<RequestRow[]>`
    select *
    from artist_requests
    where profile_id = ${profileId}
    order by updated_at desc, created_at desc
  `;

  const ids = rows.map((row) => row.id);
  const sources = ids.length
    ? await sql<RequestSourceRow[]>`
        select id, request_id, source_kind, source_id, title, url, excerpt, fetched_at, created_at
        from artist_request_sources
        where request_id = any(${ids}::uuid[])
        order by created_at asc
      `
    : [];

  return rows.map((row) =>
    mapRequest(
      row,
      sources.filter((source) => source.request_id === row.id)
    )
  );
}

export async function createRequest(
  profileId: string,
  actorId: string,
  input: CreateArtistRequestInput
) {
  const structuredInput = input.structured_input ?? {};
  const [row] = await sql<RequestRow[]>`
    insert into artist_requests (
      profile_id,
      type,
      status,
      priority,
      title,
      structured_input,
      human_notes
    )
    values (
      ${profileId},
      ${input.type}::request_type,
      ${input.status ?? "draft"}::request_status,
      ${input.priority ?? "normal"},
      ${input.title},
      ${JSON.stringify(structuredInput)}::jsonb,
      ${input.human_notes ?? null}
    )
    returning *
  `;

  await upsertUserInputSource(
    row.id,
    row.title,
    structuredInput,
    row.human_notes
  );
  await writeAuditLog({
    actorId,
    entityType: "artist_request",
    entityId: row.id,
    action: "artist_request.create",
    payload: { type: row.type, status: row.status }
  });

  return mapRequest(row, await getSources(row.id));
}

export async function attachOpportunitySource(
  requestId: string,
  profileId: string,
  actorId: string,
  opportunityId: string
) {
  await getOwnedRequest(requestId, profileId);
  const [opportunity] = await sql<
    {
      id: string;
      title: string;
      url: string;
      description: string | null;
      verified_at: string | null;
      review_status: "pending_review" | "verified" | "rejected" | "archived";
      geography: string | null;
      discipline: string[];
    }[]
  >`
    select id, title, url, description, verified_at, review_status, geography, discipline
    from opportunities
    where id = ${opportunityId}
  `;
  if (!opportunity) throw notFound("Opportunity not found");

  const snapshot = {
    title: opportunity.title,
    url: opportunity.url,
    description: opportunity.description,
    verified_at: opportunity.verified_at,
    review_status: opportunity.review_status,
    geography: opportunity.geography,
    discipline: opportunity.discipline
  };

  const [existing] = await sql<{ id: string }[]>`
    select id
    from artist_request_sources
    where request_id = ${requestId} and source_kind = 'opportunity' and source_id = ${opportunityId}
    limit 1
  `;

  if (existing) {
    await sql`
      update artist_request_sources
      set
        title = ${opportunity.title},
        url = ${opportunity.url},
        excerpt = ${opportunity.description},
        fetched_at = ${opportunity.verified_at},
        source_snapshot = ${JSON.stringify(snapshot)}::jsonb,
        is_selected = true
      where id = ${existing.id}
    `;
  } else {
    await sql`
      insert into artist_request_sources (
        request_id,
        source_kind,
        source_id,
        title,
        url,
        excerpt,
        fetched_at,
        source_snapshot,
        is_selected
      )
      values (
        ${requestId},
        'opportunity',
        ${opportunityId},
        ${opportunity.title},
        ${opportunity.url},
        ${opportunity.description},
        ${opportunity.verified_at},
        ${JSON.stringify(snapshot)}::jsonb,
        true
      )
    `;
  }

  await writeAuditLog({
    actorId,
    entityType: "artist_request",
    entityId: requestId,
    action: "artist_request.attach_opportunity",
    payload: { opportunityId }
  });

  return getRequest(requestId, profileId);
}

export async function getRequest(requestId: string, profileId: string) {
  const row = await getOwnedRequest(requestId, profileId);
  return mapRequest(row, await getSources(row.id));
}

export async function updateRequest(
  requestId: string,
  profileId: string,
  actorId: string,
  input: UpdateArtistRequestInput
) {
  const existing = await getOwnedRequest(requestId, profileId);
  const structuredInput =
    input.structured_input ?? parseJsonRecord(existing.structured_input);
  const [row] = await sql<RequestRow[]>`
    update artist_requests
    set
      type = coalesce(${input.type ?? null}::request_type, type),
      status = coalesce(${input.status ?? null}::request_status, status),
      priority = coalesce(${input.priority ?? null}, priority),
      title = coalesce(${input.title ?? null}, title),
      structured_input = coalesce(${input.structured_input ? JSON.stringify(input.structured_input) : null}::jsonb, structured_input),
      human_notes = coalesce(${input.human_notes ?? null}, human_notes),
      confidence_level = coalesce(${input.confidence_level ?? null}::request_confidence, confidence_level)
    where id = ${requestId} and profile_id = ${profileId}
    returning *
  `;
  if (!row) throw notFound("Artist request not found");

  await upsertUserInputSource(
    row.id,
    row.title,
    structuredInput,
    row.human_notes
  );
  await writeAuditLog({
    actorId,
    entityType: "artist_request",
    entityId: row.id,
    action: "artist_request.update",
    payload: { status: row.status }
  });

  return mapRequest(row, await getSources(row.id));
}

export async function markReady(
  requestId: string,
  profileId: string,
  actorId: string
) {
  const [row] = await sql<RequestRow[]>`
    update artist_requests
    set status = 'ready_for_processing'
    where id = ${requestId} and profile_id = ${profileId}
    returning *
  `;
  if (!row) throw notFound("Artist request not found");

  await writeAuditLog({
    actorId,
    entityType: "artist_request",
    entityId: row.id,
    action: "artist_request.mark_ready",
    payload: { status: row.status }
  });

  return mapRequest(row, await getSources(row.id));
}

export async function generateDraft(
  requestId: string,
  profileId: string,
  actorId: string
) {
  await getOwnedRequest(requestId, profileId);
  const draft = await buildDraft(requestId, profileId);

  const [row] = await sql<RequestRow[]>`
    update artist_requests
    set
      generated_output = ${JSON.stringify(draft.generatedOutput)}::jsonb,
      confidence_level = ${draft.confidenceLevel}::request_confidence,
      status = 'needs_review'
    where id = ${requestId} and profile_id = ${profileId}
    returning *
  `;
  if (!row) throw notFound("Artist request not found");

  await writeAuditLog({
    actorId,
    entityType: "artist_request",
    entityId: row.id,
    action: "artist_request.generate_draft",
    payload: { status: row.status, confidence_level: row.confidence_level }
  });

  return mapRequest(row, await getSources(row.id));
}
