import { sql } from "./db.js";

type AuditInput = {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  await sql`
    insert into audit_log (actor_id, entity_type, entity_id, action, payload)
    values (
      ${input.actorId ?? null},
      ${input.entityType},
      ${input.entityId},
      ${input.action},
      ${JSON.stringify(input.payload ?? {})}::jsonb
    )
  `;
}
