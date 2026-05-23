import { sql } from "../lib/db.js";

export async function canViewArtwork(
  artworkId: string,
  viewerProfileId?: string
) {
  const [artwork] = await sql<
    {
      id: string;
      profile_id: string;
      visibility:
        | "private"
        | "shared_with_relationships"
        | "project_only"
        | "public";
    }[]
  >`
    select id, profile_id, visibility
    from artworks
    where id = ${artworkId}
  `;
  if (!artwork) return false;
  if (viewerProfileId && artwork.profile_id === viewerProfileId) return true;
  if (artwork.visibility === "public") return true;
  if (!viewerProfileId) return false;

  if (artwork.visibility === "shared_with_relationships") {
    const [related] = await sql`
      select 1
      from relationships
      where status = 'accepted'
        and (
          (profile_id = ${artwork.profile_id} and related_profile_id = ${viewerProfileId})
          or
          (profile_id = ${viewerProfileId} and related_profile_id = ${artwork.profile_id})
        )
      limit 1
    `;
    return Boolean(related);
  }

  if (artwork.visibility === "project_only") {
    const [projectAccess] = await sql`
      select 1
      from artwork_projects
      join projects on projects.id = artwork_projects.project_id
      left join project_collaborators
        on project_collaborators.project_id = projects.id
      where artwork_projects.artwork_id = ${artworkId}
        and (
          projects.owner_profile_id = ${viewerProfileId}
          or project_collaborators.profile_id = ${viewerProfileId}
        )
      limit 1
    `;
    return Boolean(projectAccess);
  }

  return false;
}
