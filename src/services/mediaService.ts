import { createHash } from "node:crypto";
import { mkdir, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { config } from "../config.js";
import { writeAuditLog } from "../lib/audit.js";
import { sql } from "../lib/db.js";
import { notFound, validationError } from "../lib/errors.js";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function attachArtworkMedia(
  profileId: string,
  artworkId: string,
  actorId: string,
  file: Express.Multer.File | undefined
) {
  if (!file)
    throw validationError("Image file is required", { file: "Required" });
  const [artwork] =
    await sql`select id from artworks where id = ${artworkId} and profile_id = ${profileId}`;
  if (!artwork) throw notFound("Artwork not found");

  const sourceBuffer = await readFile(file.path);
  const type = await fileTypeFromBuffer(sourceBuffer);
  if (!type || !allowed.has(type.mime)) {
    await unlink(file.path).catch(() => undefined);
    throw validationError("Unsupported file type", {
      file: "Use JPG, PNG, or WebP"
    });
  }

  await mkdir(config.UPLOAD_ROOT, { recursive: true });
  const base = `${artworkId}-${Date.now()}`;
  const extension = type.mime === "image/jpeg" ? "jpg" : type.ext;
  const originalName = `${base}.${extension}`;
  const smallName = `${base}-400.webp`;
  const largeName = `${base}-1200.webp`;
  const originalPath = path.join(config.UPLOAD_ROOT, originalName);
  await rename(file.path, originalPath);
  await Promise.all([
    sharp(originalPath)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(config.UPLOAD_ROOT, smallName)),
    sharp(originalPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(config.UPLOAD_ROOT, largeName))
  ]);

  const checksum = createHash("sha256")
    .update(await readFile(originalPath))
    .digest("hex");
  const [{ count }] = await sql<{ count: string }[]>`
    select count(*)::text as count from media_assets where artwork_id = ${artworkId}
  `;

  const [asset] = await sql`
    insert into media_assets (
      artwork_id, storage_key, thumbnail_key, thumbnail_small_key, original_filename,
      mime, size_bytes, sha256, sort_order, is_primary
    ) values (
      ${artworkId}, ${originalName}, ${largeName}, ${smallName}, ${file.originalname},
      ${type.mime}, ${file.size}, ${checksum}, ${Number(count)}, ${Number(count) === 0}
    )
    returning id, storage_key, thumbnail_key, thumbnail_small_key, mime, size_bytes, original_filename, sort_order, is_primary, created_at
  `;
  await writeAuditLog({
    actorId,
    entityType: "media_asset",
    entityId: asset.id,
    action: "media.create"
  });
  return asset;
}

export async function updateArtworkMedia(
  artworkId: string,
  mediaId: string,
  profileId: string,
  actorId: string,
  input: { sortOrder?: number; isPrimary?: boolean }
) {
  const [found] = await sql<{ id: string; sort_order: number }[]>`
    select media_assets.id
    , media_assets.sort_order
    from media_assets
    join artworks on artworks.id = media_assets.artwork_id
    where media_assets.id = ${mediaId} and media_assets.artwork_id = ${artworkId} and artworks.profile_id = ${profileId}
  `;
  if (!found) throw notFound("Media not found");

  if (input.isPrimary) {
    await sql`update media_assets set is_primary = false where artwork_id = ${artworkId}`;
  }
  if (input.sortOrder !== undefined && input.sortOrder !== found.sort_order) {
    await sql`
      update media_assets
      set sort_order = sort_order + 1
      where artwork_id = ${artworkId}
        and id <> ${mediaId}
        and sort_order >= ${input.sortOrder}
    `;
  }
  const [asset] = await sql`
    update media_assets
    set
      sort_order = coalesce(${input.sortOrder ?? null}, sort_order),
      is_primary = coalesce(${input.isPrimary ?? null}, is_primary)
    where id = ${mediaId}
    returning id, sort_order, is_primary
  `;
  await writeAuditLog({
    actorId,
    entityType: "media_asset",
    entityId: mediaId,
    action: "media.update"
  });
  return asset;
}

export async function deleteArtworkMedia(
  artworkId: string,
  mediaId: string,
  profileId: string,
  actorId: string
) {
  const [asset] = await sql<
    {
      id: string;
      storage_key: string;
      thumbnail_key: string;
      thumbnail_small_key: string | null;
      is_primary: boolean;
    }[]
  >`
    select media_assets.id, media_assets.storage_key, media_assets.thumbnail_key, media_assets.thumbnail_small_key, media_assets.is_primary
    from media_assets
    join artworks on artworks.id = media_assets.artwork_id
    where media_assets.id = ${mediaId} and media_assets.artwork_id = ${artworkId} and artworks.profile_id = ${profileId}
  `;
  if (!asset) throw notFound("Media not found");

  await sql`delete from media_assets where id = ${mediaId}`;
  await Promise.all(
    [asset.storage_key, asset.thumbnail_key, asset.thumbnail_small_key]
      .filter(Boolean)
      .map((file) =>
        unlink(path.join(config.UPLOAD_ROOT, file!)).catch(() => undefined)
      )
  );
  if (asset.is_primary) {
    await sql`
      update media_assets
      set is_primary = true
      where id = (
        select id from media_assets
        where artwork_id = ${artworkId}
        order by sort_order asc, created_at asc
        limit 1
      )
    `;
  }
  await writeAuditLog({
    actorId,
    entityType: "media_asset",
    entityId: mediaId,
    action: "media.delete"
  });
}
