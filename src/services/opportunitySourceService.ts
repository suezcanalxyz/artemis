import { writeAuditLog } from "../lib/audit.js";
import { sql } from "../lib/db.js";
import { notFound } from "../lib/errors.js";

type SourceKind = "api" | "scrape" | "manual";

type OpportunitySourceRow = {
  id: string;
  name: string;
  kind: SourceKind;
  base_url: string;
  reliability: string;
  description: string | null;
  is_active: boolean;
  last_refreshed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CreateOpportunitySourceInput = {
  name: string;
  kind: SourceKind;
  base_url: string;
  reliability?: string;
  description?: string;
  is_active?: boolean;
};

type UpdateOpportunitySourceInput = Partial<CreateOpportunitySourceInput>;

export async function listOpportunitySources() {
  return sql<OpportunitySourceRow[]>`
    select *
    from opportunity_sources
    order by is_active desc, updated_at desc, name asc
  `;
}

export async function createOpportunitySource(
  actorId: string,
  input: CreateOpportunitySourceInput
) {
  const [row] = await sql<OpportunitySourceRow[]>`
    insert into opportunity_sources (
      name,
      kind,
      base_url,
      reliability,
      description,
      is_active
    )
    values (
      ${input.name},
      ${input.kind},
      ${input.base_url},
      ${input.reliability ?? "unknown"},
      ${input.description ?? null},
      ${input.is_active ?? true}
    )
    returning *
  `;

  await writeAuditLog({
    actorId,
    entityType: "opportunity_source",
    entityId: row.id,
    action: "opportunity_source.create",
    payload: { kind: row.kind, name: row.name }
  });

  return row;
}

export async function updateOpportunitySource(
  sourceId: string,
  actorId: string,
  input: UpdateOpportunitySourceInput
) {
  const [row] = await sql<OpportunitySourceRow[]>`
    update opportunity_sources
    set
      name = coalesce(${input.name ?? null}, name),
      kind = coalesce(${input.kind ?? null}, kind),
      base_url = coalesce(${input.base_url ?? null}, base_url),
      reliability = coalesce(${input.reliability ?? null}, reliability),
      description = coalesce(${input.description ?? null}, description),
      is_active = coalesce(${input.is_active ?? null}, is_active)
    where id = ${sourceId}
    returning *
  `;
  if (!row) throw notFound("Opportunity source not found");

  await writeAuditLog({
    actorId,
    entityType: "opportunity_source",
    entityId: row.id,
    action: "opportunity_source.update",
    payload: { is_active: row.is_active, reliability: row.reliability }
  });

  return row;
}
