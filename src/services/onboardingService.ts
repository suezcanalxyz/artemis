import { sql } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { writeAuditLog } from "../lib/audit.js";

export type ProfileRole = "artist" | "gallery" | "collector" | "institution";

export type ProfilePlan =
  | "artist_free"
  | "artist_pro"
  | "artist_studio"
  | "gallery_essential"
  | "gallery_professional"
  | "gallery_institution"
  | "collector_curator"
  | "collector_patron"
  | "institution_archive"
  | "institution_enterprise";

// Plans available per role (free-tier is always first)
export const ROLE_PLANS: Record<ProfileRole, ProfilePlan[]> = {
  artist: ["artist_free", "artist_pro", "artist_studio"],
  gallery: ["gallery_essential", "gallery_professional", "gallery_institution"],
  collector: ["collector_curator", "collector_patron"],
  institution: ["institution_archive", "institution_enterprise"]
};

export type OnboardingPayload = {
  role: ProfileRole;
  plan: ProfilePlan;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
};

export async function completeOnboarding(
  profileId: string,
  userId: string,
  payload: OnboardingPayload
) {
  const { role, plan, displayName, bio, location, website } = payload;

  // Validate plan belongs to role
  const validPlans = ROLE_PLANS[role] as string[];
  if (!validPlans.includes(plan)) {
    throw new AppError(
      422,
      "INVALID_PLAN",
      `Plan '${plan}' is not available for role '${role}'`
    );
  }

  const [updated] = await sql<{ id: string; role: string; plan: string }[]>`
    update profiles set
      role = ${role}::profile_role,
      plan = ${plan}::profile_plan,
      onboarding_completed = true,
      display_name = coalesce(nullif(${displayName ?? ""}, ''), display_name),
      bio = coalesce(nullif(${bio ?? ""}, ''), bio),
      location = coalesce(nullif(${location ?? ""}, ''), location),
      website = coalesce(nullif(${website ?? ""}, ''), website)
    where id = ${profileId}
    returning id, role, plan
  `;

  await writeAuditLog({
    actorId: userId,
    entityType: "profile",
    entityId: profileId,
    action: "onboarding.complete",
    payload: { role, plan }
  });

  return updated;
}

export async function getOnboardingStatus(profileId: string) {
  const [profile] = await sql<
    {
      onboarding_completed: boolean;
      role: string;
      plan: string;
      display_name: string;
      bio: string | null;
      location: string | null;
      website: string | null;
    }[]
  >`
    select onboarding_completed, role, plan, display_name, bio, location, website
    from profiles where id = ${profileId}
  `;
  return profile ?? null;
}

export async function getPlanLimits(plan: ProfilePlan) {
  const [limits] = await sql`
    select * from plan_limits where plan = ${plan}::profile_plan
  `;
  return limits ?? null;
}
