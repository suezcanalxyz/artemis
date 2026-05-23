import { writeAuditLog } from "../lib/audit.js";
import { sql } from "../lib/db.js";
import { notFound } from "../lib/errors.js";

type KnowledgeDocumentRow = {
  id: string;
  profile_id: string;
  title: string;
  kind: string;
  body: string;
  metadata: Record<string, unknown> | string;
  review_status: string;
  created_at: string;
  updated_at: string;
};

type KnowledgeChunkRow = {
  id: string;
  document_id: string;
  profile_id: string;
  ordinal: number;
  heading: string | null;
  content: string;
  search_text: string;
  metadata: Record<string, unknown> | string;
  created_at: string;
  updated_at: string;
};

type CreateKnowledgeDocumentInput = {
  title: string;
  kind: string;
  body: string;
  metadata?: Record<string, unknown>;
  review_status?: string;
};

type UpdateKnowledgeDocumentInput = Partial<CreateKnowledgeDocumentInput>;

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

function mapDocument(row: KnowledgeDocumentRow) {
  return {
    ...row,
    metadata: parseJsonRecord(row.metadata)
  };
}

function mapChunk(row: KnowledgeChunkRow) {
  return {
    ...row,
    metadata: parseJsonRecord(row.metadata)
  };
}

function chunkBody(body: string) {
  const parts = body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks = parts.length ? parts : [body.trim()].filter(Boolean);

  return chunks.map((content, index) => ({
    ordinal: index,
    heading: content.split("\n")[0]?.slice(0, 120) || null,
    content,
    searchText: content.toLowerCase()
  }));
}

async function reindexDocument(
  documentId: string,
  profileId: string,
  body: string,
  metadata: Record<string, unknown>
) {
  await sql`
    delete from knowledge_chunks
    where document_id = ${documentId} and profile_id = ${profileId}
  `;

  const chunks = chunkBody(body);
  for (const chunk of chunks) {
    await sql`
      insert into knowledge_chunks (
        document_id,
        profile_id,
        ordinal,
        heading,
        content,
        search_text,
        metadata
      )
      values (
        ${documentId},
        ${profileId},
        ${chunk.ordinal},
        ${chunk.heading},
        ${chunk.content},
        ${chunk.searchText},
        ${JSON.stringify(metadata)}::jsonb
      )
    `;
  }
}

export async function listKnowledgeDocuments(profileId: string) {
  const rows = await sql<KnowledgeDocumentRow[]>`
    select *
    from knowledge_documents
    where profile_id = ${profileId}
    order by updated_at desc, created_at desc
  `;
  return rows.map(mapDocument);
}

export async function createKnowledgeDocument(
  profileId: string,
  actorId: string,
  input: CreateKnowledgeDocumentInput
) {
  const metadata = input.metadata ?? {};
  const [row] = await sql<KnowledgeDocumentRow[]>`
    insert into knowledge_documents (
      profile_id,
      title,
      kind,
      body,
      metadata,
      review_status
    )
    values (
      ${profileId},
      ${input.title},
      ${input.kind},
      ${input.body},
      ${JSON.stringify(metadata)}::jsonb,
      ${input.review_status ?? "draft"}
    )
    returning *
  `;

  await reindexDocument(row.id, profileId, row.body, metadata);
  await writeAuditLog({
    actorId,
    entityType: "knowledge_document",
    entityId: row.id,
    action: "knowledge_document.create",
    payload: { kind: row.kind, title: row.title }
  });

  return getKnowledgeDocument(row.id, profileId);
}

export async function getKnowledgeDocument(
  documentId: string,
  profileId: string
) {
  const [row] = await sql<KnowledgeDocumentRow[]>`
    select *
    from knowledge_documents
    where id = ${documentId} and profile_id = ${profileId}
  `;
  if (!row) throw notFound("Knowledge document not found");

  const chunks = await sql<KnowledgeChunkRow[]>`
    select *
    from knowledge_chunks
    where document_id = ${documentId} and profile_id = ${profileId}
    order by ordinal asc
  `;

  return {
    ...mapDocument(row),
    chunks: chunks.map(mapChunk)
  };
}

export async function updateKnowledgeDocument(
  documentId: string,
  profileId: string,
  actorId: string,
  input: UpdateKnowledgeDocumentInput
) {
  const [row] = await sql<KnowledgeDocumentRow[]>`
    update knowledge_documents
    set
      title = coalesce(${input.title ?? null}, title),
      kind = coalesce(${input.kind ?? null}, kind),
      body = coalesce(${input.body ?? null}, body),
      metadata = coalesce(${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb, metadata),
      review_status = coalesce(${input.review_status ?? null}, review_status)
    where id = ${documentId} and profile_id = ${profileId}
    returning *
  `;
  if (!row) throw notFound("Knowledge document not found");

  await reindexDocument(
    row.id,
    profileId,
    row.body,
    parseJsonRecord(row.metadata)
  );
  await writeAuditLog({
    actorId,
    entityType: "knowledge_document",
    entityId: row.id,
    action: "knowledge_document.update",
    payload: { review_status: row.review_status }
  });

  return getKnowledgeDocument(row.id, profileId);
}

export async function searchKnowledge(
  profileId: string,
  query: string,
  limit: number
) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const rows = await sql<KnowledgeChunkRow[]>`
    select *
    from knowledge_chunks
    where profile_id = ${profileId}
    order by updated_at desc
    limit 200
  `;

  return rows
    .map((row) => {
      const haystack = row.search_text;
      const score = terms.reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0
      );
      return { row, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.row.ordinal - b.row.ordinal)
    .slice(0, limit)
    .map(({ row, score }) => ({
      ...mapChunk(row),
      score
    }));
}

export async function attachKnowledgeChunkToRequest(
  requestId: string,
  profileId: string,
  actorId: string,
  chunkId: string
) {
  const [request] = await sql<{ id: string }[]>`
    select id
    from artist_requests
    where id = ${requestId} and profile_id = ${profileId}
  `;
  if (!request) throw notFound("Artist request not found");

  const [chunk] = await sql<KnowledgeChunkRow[]>`
    select *
    from knowledge_chunks
    where id = ${chunkId} and profile_id = ${profileId}
  `;
  if (!chunk) throw notFound("Knowledge chunk not found");

  const [document] = await sql<KnowledgeDocumentRow[]>`
    select *
    from knowledge_documents
    where id = ${chunk.document_id} and profile_id = ${profileId}
  `;
  if (!document) throw notFound("Knowledge document not found");

  const snapshot = {
    document_title: document.title,
    document_kind: document.kind,
    chunk_heading: chunk.heading,
    chunk_content: chunk.content,
    document_review_status: document.review_status
  };

  const [existing] = await sql<{ id: string }[]>`
    select id
    from artist_request_sources
    where request_id = ${requestId} and source_kind = 'knowledge_chunk' and source_id = ${chunkId}
    limit 1
  `;

  if (existing) {
    await sql`
      update artist_request_sources
      set
        title = ${document.title},
        excerpt = ${chunk.content},
        fetched_at = now(),
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
        excerpt,
        fetched_at,
        source_snapshot,
        is_selected
      )
      values (
        ${requestId},
        'knowledge_chunk',
        ${chunkId},
        ${document.title},
        ${chunk.content},
        now(),
        ${JSON.stringify(snapshot)}::jsonb,
        true
      )
    `;
  }

  await writeAuditLog({
    actorId,
    entityType: "artist_request",
    entityId: requestId,
    action: "artist_request.attach_knowledge_chunk",
    payload: { chunkId, documentId: document.id }
  });
}
