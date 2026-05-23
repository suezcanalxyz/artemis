export type ProfileFormValues = {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  professionalFocus: string;
  practiceAreas: string;
  workingLanguages: string;
  strategicGoals: string;
  collaborationInterests: string;
  privacyMode: "private" | "contacts" | "public";
};

type OnboardingStatus = {
  display_name?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  professional_focus?: string | null;
  practice_areas?: string[] | null;
  working_languages?: string[] | null;
  strategic_goals?: string[] | null;
  collaboration_interests?: string[] | null;
  privacy_mode?: "private" | "contacts" | "public" | null;
};

function joinList(values?: string[] | null) {
  return (values ?? []).join(", ");
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createEmptyProfileForm(): ProfileFormValues {
  return {
    displayName: "",
    bio: "",
    location: "",
    website: "",
    professionalFocus: "",
    practiceAreas: "",
    workingLanguages: "",
    strategicGoals: "",
    collaborationInterests: "",
    privacyMode: "private"
  };
}

export function profileFormFromStatus(
  status?: OnboardingStatus | null
): ProfileFormValues {
  return {
    displayName: status?.display_name ?? "",
    bio: status?.bio ?? "",
    location: status?.location ?? "",
    website: status?.website ?? "",
    professionalFocus: status?.professional_focus ?? "",
    practiceAreas: joinList(status?.practice_areas),
    workingLanguages: joinList(status?.working_languages),
    strategicGoals: joinList(status?.strategic_goals),
    collaborationInterests: joinList(status?.collaboration_interests),
    privacyMode: status?.privacy_mode ?? "private"
  };
}

export function profilePayloadFromForm(values: ProfileFormValues) {
  return {
    displayName: values.displayName,
    bio: values.bio,
    location: values.location,
    website: values.website,
    professionalFocus: values.professionalFocus,
    practiceAreas: splitList(values.practiceAreas),
    workingLanguages: splitList(values.workingLanguages),
    strategicGoals: splitList(values.strategicGoals),
    collaborationInterests: splitList(values.collaborationInterests),
    privacyMode: values.privacyMode
  };
}
