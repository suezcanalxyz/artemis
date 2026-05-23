import { writeAuditLog } from "../lib/audit.js";
import { sql } from "../lib/db.js";
import { notFound } from "../lib/errors.js";
import { manualSeedAdapter } from "./opportunityAdapters/manualSeedAdapter.js";
import type { NormalizedOpportunity } from "./opportunityAdapters/types.js";

type OpportunityListFilters = {
  limit: number;
  geography?: string;
  discipline?: string;
  search?: string;
  reviewStatus?: "pending_review" | "verified" | "rejected" | "archived";
};

type OpportunityRow = {
  id: string;
  source_id: string | null;
  title: string;
  organizer: string | null;
  description: string | null;
  url: string;
  deadline: string | null;
  geography: string | null;
  discipline: string[];
  funding_amount: string | null;
  eligibility: string | null;
  raw_payload: Record<string, unknown> | string;
  fetched_at: string | null;
  verified_at: string | null;
  review_status: "pending_review" | "verified" | "rejected" | "archived";
  review_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  source_name: string | null;
  source_kind: string | null;
  source_reliability: string | null;
};

function mapOpportunity(row: OpportunityRow) {
  const rawPayload =
    typeof row.raw_payload === "string"
      ? (JSON.parse(row.raw_payload) as Record<string, unknown>)
      : row.raw_payload;

  return {
    id: row.id,
    source_id: row.source_id,
    title: row.title,
    organizer: row.organizer,
    description: row.description,
    url: row.url,
    deadline: row.deadline,
    geography: row.geography,
    discipline: row.discipline,
    funding_amount: row.funding_amount,
    eligibility: row.eligibility,
    raw_payload: rawPayload,
    fetched_at: row.fetched_at,
    verified_at: row.verified_at,
    review_status: row.review_status,
    review_notes: row.review_notes,
    reviewed_by: row.reviewed_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: row.source_name
      ? {
          name: row.source_name,
          kind: row.source_kind,
          reliability: row.source_reliability
        }
      : null
  };
}

export async function listOpportunities(filters: OpportunityListFilters) {
  const rows = await sql<OpportunityRow[]>`
    select
      opportunities.*,
      opportunity_sources.name as source_name,
      opportunity_sources.kind as source_kind,
      opportunity_sources.reliability as source_reliability
    from opportunities
    left join opportunity_sources on opportunity_sources.id = opportunities.source_id
    where (${filters.geography ?? null}::text is null or coalesce(opportunities.geography, '') ilike ${`%${filters.geography ?? ""}%`})
      and (${filters.discipline ?? null}::text is null or opportunities.discipline && ${[filters.discipline ?? ""]}::text[])
      and (
        ${filters.search ?? null}::text is null
        or opportunities.title ilike ${`%${filters.search ?? ""}%`}
        or coalesce(opportunities.organizer, '') ilike ${`%${filters.search ?? ""}%`}
        or coalesce(opportunities.description, '') ilike ${`%${filters.search ?? ""}%`}
      )
      and (${filters.reviewStatus ?? null}::opportunity_review_status is null or opportunities.review_status = ${filters.reviewStatus ?? null}::opportunity_review_status)
    order by opportunities.deadline asc nulls last, opportunities.updated_at desc
    limit ${filters.limit}
  `;

  return rows.map(mapOpportunity);
}

async function ensureManualSource() {
  const [source] = await sql<{ id: string }[]>`
    insert into opportunity_sources (name, kind, base_url, reliability, is_active)
    values (
      ${manualSeedAdapter.name},
      ${manualSeedAdapter.kind},
      ${"https://artemis.local/test-opportunities"},
      ${"test_only"},
      true
    )
    on conflict (name, base_url) do update
    set
      kind = excluded.kind,
      reliability = excluded.reliability,
      is_active = excluded.is_active
    returning id
  `;
  return source.id;
}

async function upsertOpportunity(
  sourceId: string,
  item: NormalizedOpportunity
) {
  const [row] = await sql<OpportunityRow[]>`
    insert into opportunities (
      source_id,
      title,
      organizer,
      description,
      url,
      deadline,
      geography,
      discipline,
      funding_amount,
      eligibility,
      raw_payload,
      fetched_at
    )
    values (
      ${sourceId},
      ${item.title},
      ${item.organizer},
      ${item.description},
      ${item.url},
      ${item.deadline},
      ${item.geography},
      ${item.discipline},
      ${item.fundingAmount},
      ${item.eligibility},
      ${JSON.stringify(item.rawPayload)}::jsonb,
      ${item.fetchedAt}
    )
    on conflict (url) do update
    set
      source_id = excluded.source_id,
      title = excluded.title,
      organizer = excluded.organizer,
      description = excluded.description,
      deadline = excluded.deadline,
      geography = excluded.geography,
      discipline = excluded.discipline,
      funding_amount = excluded.funding_amount,
      eligibility = excluded.eligibility,
      raw_payload = excluded.raw_payload,
      fetched_at = excluded.fetched_at,
      review_status = case
        when opportunities.review_status = 'verified' then opportunities.review_status
        else 'pending_review'::opportunity_review_status
      end
    returning
      opportunities.*,
      null::text as source_name,
      null::text as source_kind,
      null::text as source_reliability
  `;

  return row;
}

export async function refreshOpportunities(actorId: string) {
  const sourceId = await ensureManualSource();
  const seedItems = await manualSeedAdapter.fetch();
  const rows = await Promise.all(
    seedItems.map((item) => upsertOpportunity(sourceId, item))
  );
  await sql`
    update opportunity_sources
    set last_refreshed_at = now()
    where id = ${sourceId}
  `;

  await writeAuditLog({
    actorId,
    entityType: "opportunity_source",
    entityId: sourceId,
    action: "opportunity.refresh",
    payload: { adapter: manualSeedAdapter.name, inserted: rows.length }
  });

  return {
    adapter: manualSeedAdapter.name,
    inserted: rows.length,
    opportunities: rows.map(mapOpportunity)
  };
}

export async function verifyOpportunity(
  opportunityId: string,
  actorId: string,
  reviewNotes?: string
) {
  const [row] = await sql<OpportunityRow[]>`
    update opportunities
    set
      review_status = 'verified',
      review_notes = ${reviewNotes ?? null},
      reviewed_by = ${actorId},
      verified_at = now()
    where id = ${opportunityId}
    returning
      opportunities.*,
      null::text as source_name,
      null::text as source_kind,
      null::text as source_reliability
  `;
  if (!row) throw notFound("Opportunity not found");

  await writeAuditLog({
    actorId,
    entityType: "opportunity",
    entityId: row.id,
    action: "opportunity.verify",
    payload: { review_status: row.review_status }
  });

  return mapOpportunity(row);
}

export async function rejectOpportunity(
  opportunityId: string,
  actorId: string,
  reviewNotes?: string
) {
  const [row] = await sql<OpportunityRow[]>`
    update opportunities
    set
      review_status = 'rejected',
      review_notes = ${reviewNotes ?? null},
      reviewed_by = ${actorId}
    where id = ${opportunityId}
    returning
      opportunities.*,
      null::text as source_name,
      null::text as source_kind,
      null::text as source_reliability
  `;
  if (!row) throw notFound("Opportunity not found");

  await writeAuditLog({
    actorId,
    entityType: "opportunity",
    entityId: row.id,
    action: "opportunity.reject",
    payload: { review_status: row.review_status }
  });

  return mapOpportunity(row);
}
