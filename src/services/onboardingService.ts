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
  professionalFocus?: string;
  practiceAreas?: string[];
  workingLanguages?: string[];
  strategicGoals?: string[];
  collaborationInterests?: string[];
  privacyMode?: "private" | "contacts" | "public";
};

export type ProfileQuestionnairePayload = Omit<
  OnboardingPayload,
  "role" | "plan"
>;

function cleanList(values?: string[]) {
  return [
    ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))
  ];
}

export async function completeOnboarding(
  profileId: string,
  userId: string,
  payload: OnboardingPayload
) {
  const {
    role,
    plan,
    displayName,
    bio,
    location,
    website,
    professionalFocus,
    practiceAreas,
    workingLanguages,
    strategicGoals,
    collaborationInterests,
    privacyMode
  } = payload;

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
      website = coalesce(nullif(${website ?? ""}, ''), website),
      professional_focus = coalesce(nullif(${professionalFocus ?? ""}, ''), professional_focus),
      practice_areas = ${cleanList(practiceAreas)}::text[],
      working_languages = ${cleanList(workingLanguages)}::text[],
      strategic_goals = ${cleanList(strategicGoals)}::text[],
      collaboration_interests = ${cleanList(collaborationInterests)}::text[],
      privacy_mode = coalesce(${privacyMode ?? null}, privacy_mode)
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

export async function updateProfileQuestionnaire(
  profileId: string,
  userId: string,
  payload: ProfileQuestionnairePayload
) {
  const {
    displayName,
    bio,
    location,
    website,
    professionalFocus,
    practiceAreas,
    workingLanguages,
    strategicGoals,
    collaborationInterests,
    privacyMode
  } = payload;
  const [updated] = await sql`
    update profiles set
      display_name = coalesce(nullif(${displayName ?? ""}, ''), display_name),
      bio = coalesce(nullif(${bio ?? ""}, ''), bio),
      location = coalesce(nullif(${location ?? ""}, ''), location),
      website = coalesce(nullif(${website ?? ""}, ''), website),
      professional_focus = coalesce(nullif(${professionalFocus ?? ""}, ''), professional_focus),
      practice_areas = coalesce(${practiceAreas ? cleanList(practiceAreas) : null}::text[], practice_areas),
      working_languages = coalesce(${workingLanguages ? cleanList(workingLanguages) : null}::text[], working_languages),
      strategic_goals = coalesce(${strategicGoals ? cleanList(strategicGoals) : null}::text[], strategic_goals),
      collaboration_interests = coalesce(${collaborationInterests ? cleanList(collaborationInterests) : null}::text[], collaboration_interests),
      privacy_mode = coalesce(${privacyMode ?? null}, privacy_mode)
    where id = ${profileId}
    returning id
  `;
  await writeAuditLog({
    actorId: userId,
    entityType: "profile",
    entityId: profileId,
    action: "profile.questionnaire.update",
    payload: {
      privacyMode: privacyMode ?? null,
      practiceAreas: cleanList(practiceAreas),
      workingLanguages: cleanList(workingLanguages),
      strategicGoals: cleanList(strategicGoals),
      collaborationInterests: cleanList(collaborationInterests)
    }
  });
  return getOnboardingStatus(updated.id);
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
      professional_focus: string | null;
      practice_areas: string[];
      working_languages: string[];
      strategic_goals: string[];
      collaboration_interests: string[];
      privacy_mode: string;
    }[]
  >`
    select onboarding_completed, role, plan, display_name, bio, location, website,
           professional_focus, practice_areas, working_languages, strategic_goals,
           collaboration_interests, privacy_mode
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
