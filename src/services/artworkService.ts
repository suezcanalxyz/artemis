import { unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { writeAuditLog } from "../lib/audit.js";
import { decodeCursor, encodeCursor } from "../lib/cursor.js";
import { sql } from "../lib/db.js";
import { forbidden, notFound, validationError } from "../lib/errors.js";
import { canViewArtwork } from "./artworkAccessService.js";

type Visibility =
  | "private"
  | "shared_with_relationships"
  | "project_only"
  | "public";

type ListInput = {
  profileId: string;
  cursor?: string;
  limit: number;
  visibility?: Visibility;
  medium?: string;
  yearFrom?: number;
  yearTo?: number;
  search?: string;
};

type ArtworkInput = {
  title?: string;
  year?: number;
  medium?: string;
  description?: string;
  visibility?: Visibility;
};

export async function listArtworks(input: ListInput) {
  const decoded = input.cursor ? decodeCursor(input.cursor) : null;
  if (input.cursor && !decoded) throw validationError("Invalid cursor");

  const rows = await sql<
    {
      id: string;
      title: string;
      year: number | null;
      medium: string | null;
      visibility: Visibility;
      created_at: string;
      thumbnail_small_key: string | null;
    }[]
  >`
    select
      artworks.id,
      artworks.title,
      artworks.year,
      artworks.medium,
      artworks.visibility,
      artworks.created_at,
      media.thumbnail_small_key
    from artworks
    left join lateral (
      select thumbnail_small_key
      from media_assets
      where media_assets.artwork_id = artworks.id and media_assets.is_primary = true
      limit 1
    ) media on true
    where artworks.profile_id = ${input.profileId}
      and (${input.visibility ?? null}::visibility_level is null or artworks.visibility = ${input.visibility ?? null}::visibility_level)
      and (${input.medium ?? null}::text is null or artworks.medium ilike ${input.medium ?? ""})
      and (${input.yearFrom ?? null}::int is null or artworks.year >= ${input.yearFrom ?? null})
      and (${input.yearTo ?? null}::int is null or artworks.year <= ${input.yearTo ?? null})
      and (
        ${input.search ?? null}::text is null
        or artworks.title ilike ${`%${input.search ?? ""}%`}
        or coalesce(artworks.medium, '') ilike ${`%${input.search ?? ""}%`}
        or coalesce(artworks.description, '') ilike ${`%${input.search ?? ""}%`}
      )
      and (
        ${decoded?.createdAt ?? null}::timestamptz is null
        or (artworks.created_at, artworks.id) < (${decoded?.createdAt ?? null}::timestamptz, ${decoded?.id ?? null}::uuid)
      )
    order by artworks.created_at desc, artworks.id desc
    limit ${input.limit + 1}
  `;

  const items = rows.slice(0, input.limit);
  const next = rows.length > input.limit ? rows[input.limit - 1] : null;
  return {
    items,
    nextCursor: next
      ? encodeCursor({ createdAt: next.created_at, id: next.id })
      : null
  };
}

export async function createArtwork(
  profileId: string,
  actorId: string,
  input: Required<ArtworkInput>
) {
  const [artwork] = await sql`
    insert into artworks (profile_id, title, year, medium, description, visibility)
    values (${profileId}, ${input.title}, ${input.year}, ${input.medium}, ${input.description}, ${input.visibility})
    returning id, title, year, medium, description, visibility, created_at
  `;
  await writeAuditLog({
    actorId,
    entityType: "artwork",
    entityId: artwork.id,
    action: "artwork.create",
    payload: { visibility: artwork.visibility }
  });
  return artwork;
}

export async function updateArtwork(
  artworkId: string,
  profileId: string,
  actorId: string,
  input: ArtworkInput
) {
  const [artwork] = await sql`
    update artworks
    set
      title = coalesce(${input.title ?? null}, title),
      year = coalesce(${input.year ?? null}, year),
      medium = coalesce(${input.medium ?? null}, medium),
      description = coalesce(${input.description ?? null}, description),
      visibility = coalesce(${input.visibility ?? null}::visibility_level, visibility)
    where id = ${artworkId} and profile_id = ${profileId}
    returning id, title, year, medium, description, visibility, created_at, updated_at
  `;
  if (!artwork) throw notFound("Artwork not found");
  await writeAuditLog({
    actorId,
    entityType: "artwork",
    entityId: artwork.id,
    action: "artwork.update"
  });
  return artwork;
}

export async function deleteArtwork(
  artworkId: string,
  profileId: string,
  actorId: string
) {
  const media = await sql<
    {
      storage_key: string;
      thumbnail_key: string;
      thumbnail_small_key: string | null;
    }[]
  >`
    select media_assets.storage_key, media_assets.thumbnail_key, media_assets.thumbnail_small_key
    from artworks
    join media_assets on media_assets.artwork_id = artworks.id
    where artworks.id = ${artworkId} and artworks.profile_id = ${profileId}
  `;
  const [deleted] = await sql`
    delete from artworks
    where id = ${artworkId} and profile_id = ${profileId}
    returning id
  `;
  if (!deleted) throw notFound("Artwork not found");

  await Promise.all(
    media.flatMap((asset) =>
      [asset.storage_key, asset.thumbnail_key, asset.thumbnail_small_key]
        .filter(Boolean)
        .map((file) =>
          unlink(path.join(config.UPLOAD_ROOT, file!)).catch(() => undefined)
        )
    )
  );
  await writeAuditLog({
    actorId,
    entityType: "artwork",
    entityId: artworkId,
    action: "artwork.delete"
  });
}

export async function getArtwork(artworkId: string, viewerProfileId?: string) {
  const [artwork] = await sql`
    select id, profile_id, title, year, medium, description, visibility, created_at, updated_at
    from artworks
    where id = ${artworkId}
  `;
  if (!artwork) throw notFound("Artwork not found");
  const visible = await canViewArtwork(artworkId, viewerProfileId);
  if (!visible) throw forbidden("Artwork is not visible to this viewer");

  const media = await sql`
    select
      id,
      storage_key,
      thumbnail_key,
      thumbnail_small_key,
      mime,
      original_filename,
      size_bytes,
      sort_order,
      is_primary,
      created_at
    from media_assets
    where artwork_id = ${artworkId}
    order by sort_order asc, created_at asc
  `;

  return { ...artwork, media };
}
