import { notFound } from "../lib/errors.js";
import { sql } from "../lib/db.js";

type RequestType =
  | "opportunity_research"
  | "funding_research"
  | "tech_rider"
  | "procedure"
  | "presentation"
  | "website_update";

type RequestRow = {
  id: string;
  profile_id: string;
  type: RequestType;
  title: string;
  structured_input: Record<string, unknown> | string;
};

type RequestSourceRow = {
  id: string;
  source_kind: string;
  source_id: string | null;
  title: string | null;
  url: string | null;
  excerpt: string | null;
  fetched_at: string | null;
};

type OpportunityMatchRow = {
  id: string;
  title: string;
  organizer: string | null;
  description: string | null;
  url: string;
  deadline: string | null;
  geography: string | null;
  discipline: string[];
  funding_amount: string | null;
  eligibility: string | null;
  fetched_at: string | null;
  verified_at: string | null;
  raw_payload: Record<string, unknown> | string;
  source_name: string | null;
  review_status: "pending_review" | "verified" | "rejected" | "archived";
};

type ProfileRow = {
  display_name: string;
  role: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  professional_focus: string | null;
  practice_areas: string[];
  working_languages: string[];
  strategic_goals: string[];
  collaboration_interests: string[];
  privacy_mode: string;
};

type SourceEntry = {
  kind: string;
  source_id: string | null;
  title: string | null;
  url: string | null;
  excerpt: string | null;
  fetched_at: string | null;
  source_name?: string | null;
};

type ProfileContext = {
  display_name: string;
  role: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  professional_focus: string | null;
  practice_areas: string[];
  working_languages: string[];
  strategic_goals: string[];
  collaboration_interests: string[];
  privacy_mode: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseRawPayload(value: Record<string, unknown> | string) {
  return typeof value === "string"
    ? (JSON.parse(value) as Record<string, unknown>)
    : value;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toSources(
  requestSources: RequestSourceRow[],
  opportunities: OpportunityMatchRow[]
) {
  const manualSources: SourceEntry[] = requestSources.map((source) => ({
    kind: source.source_kind,
    source_id: source.source_id,
    title: source.title,
    url: source.url,
    excerpt: source.excerpt,
    fetched_at: source.fetched_at
  }));

  const opportunitySources: SourceEntry[] = opportunities.map((item) => ({
    kind: "opportunity",
    source_id: item.id,
    title: item.title,
    url: item.url,
    excerpt: item.description,
    fetched_at: item.verified_at ?? item.fetched_at,
    source_name: item.source_name
  }));

  return [...manualSources, ...opportunitySources];
}

function toProfileContext(profile: ProfileRow): ProfileContext {
  return {
    display_name: profile.display_name,
    role: profile.role,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    professional_focus: profile.professional_focus,
    practice_areas: profile.practice_areas ?? [],
    working_languages: profile.working_languages ?? [],
    strategic_goals: profile.strategic_goals ?? [],
    collaboration_interests: profile.collaboration_interests ?? [],
    privacy_mode: profile.privacy_mode
  };
}

function determineConfidence(sources: SourceEntry[]) {
  if (!sources.length) return "unverified";
  if (
    sources.some((source) => source.kind === "opportunity" && source.fetched_at)
  )
    return "verified";
  return "partially_verified";
}

async function getMatchedOpportunities(input: Record<string, unknown>) {
  const disciplines = asStringArray(input.discipline);
  const geography = asString(input.geography);
  const searchTerms = [
    asString(input.search),
    asString(input.project_type),
    asString(input.project_summary)
  ]
    .filter(Boolean)
    .flatMap((term) => term.toLowerCase().split(/\s+/))
    .filter(Boolean);

  const rows = await sql<OpportunityMatchRow[]>`
    select
      opportunities.id,
      opportunities.title,
      opportunities.organizer,
      opportunities.description,
      opportunities.url,
      opportunities.deadline,
      opportunities.geography,
      opportunities.discipline,
      opportunities.funding_amount,
      opportunities.eligibility,
      opportunities.fetched_at,
      opportunities.verified_at,
      opportunities.review_status,
      opportunities.raw_payload,
      opportunity_sources.name as source_name
    from opportunities
    left join opportunity_sources on opportunity_sources.id = opportunities.source_id
    where (${geography || null}::text is null or coalesce(opportunities.geography, '') ilike ${`%${geography}%`})
      and (${disciplines.length ? disciplines : null}::text[] is null or opportunities.discipline && ${disciplines.length ? disciplines : []}::text[])
    order by opportunities.deadline asc nulls last, opportunities.updated_at desc
    limit 25
  `;

  return rows
    .filter((row) => {
      if (!searchTerms.length) return true;
      const haystack = [
        row.title,
        row.description ?? "",
        row.organizer ?? "",
        row.geography ?? "",
        row.discipline.join(" ")
      ]
        .join(" ")
        .toLowerCase();
      return searchTerms.some((term) => haystack.includes(term));
    })
    .slice(0, 5);
}

async function getProfileContext(profileId: string) {
  const [profile] = await sql<ProfileRow[]>`
    select display_name, role, bio, location, website, professional_focus,
           practice_areas, working_languages, strategic_goals,
           collaboration_interests, privacy_mode
    from profiles
    where id = ${profileId}
  `;
  if (!profile) throw notFound("Profile not found");
  return toProfileContext(profile);
}

function buildOpportunityResearch(
  title: string,
  input: Record<string, unknown>,
  requestSources: RequestSourceRow[],
  opportunities: OpportunityMatchRow[],
  profile: ProfileContext
) {
  const disciplines = asStringArray(input.discipline);
  const geography = asString(input.geography);
  const applicant =
    asString(input.applicant_profile) ||
    profile.display_name ||
    profile.professional_focus ||
    "";
  const sources = toSources(requestSources, opportunities);
  const missingInformation = [
    !applicant ? "Applicant profile or studio context" : null,
    !disciplines.length ? "Discipline or project medium" : null,
    !geography ? "Target geography" : null,
    !asString(input.timeline) ? "Timing and deadline constraints" : null
  ].filter(Boolean);

  return {
    summary:
      opportunities.length > 0
        ? `${title} currently matches ${opportunities.length} stored opportunities using only the request input and archived sources.`
        : `${title} does not yet match any stored opportunities. The draft is limited to the current request input and archived provenance.`,
    profile_context: profile,
    recommended_next_steps: [
      "Confirm discipline, geography, and deadline constraints in structured input.",
      "Review matched opportunities and discard any placeholder records that are not relevant.",
      "Attach verified source links or uploaded briefs before treating the shortlist as actionable."
    ],
    matched_opportunities: opportunities.map((item) => ({
      id: item.id,
      title: item.title,
      organizer: item.organizer,
      url: item.url,
      deadline: item.deadline,
      geography: item.geography,
      discipline: item.discipline,
      funding_amount: item.funding_amount,
      note:
        parseRawPayload(item.raw_payload)?.seed === true
          ? "Placeholder test opportunity from the manual seed adapter."
          : "Matched from stored opportunities.",
      provenance: {
        source_name: item.source_name,
        verified_at: item.verified_at
      }
    })),
    missing_information: missingInformation,
    sources
  };
}

function buildFundingResearch(
  input: Record<string, unknown>,
  requestSources: RequestSourceRow[],
  opportunities: OpportunityMatchRow[],
  profile: ProfileContext
) {
  const disciplines = asStringArray(input.discipline);
  const sources = toSources(requestSources, opportunities);

  return {
    profile_context: profile,
    funding_strategy:
      asString(input.project_summary) ||
      profile.professional_focus ||
      "No project summary was provided. Funding positioning should remain provisional until the project scope is stated explicitly.",
    possible_programme_types: [
      disciplines.length
        ? `${disciplines.join(", ")} production support`
        : "Production support",
      "Residency and research calls",
      "Travel and installation support",
      "Foundation-led commissions"
    ],
    missing_information: [
      !asString(input.budget_range) ? "Budget range" : null,
      !asString(input.timeline) ? "Project timeline" : null,
      !asString(input.geography) ? "Target geography" : null,
      !asString(input.legal_status) ? "Legal status of applicant" : null
    ].filter(Boolean),
    sources
  };
}

function buildTechRider(
  input: Record<string, unknown>,
  requestSources: RequestSourceRow[],
  opportunities: OpportunityMatchRow[],
  profile: ProfileContext
) {
  const sources = toSources(requestSources, opportunities);
  const equipment = asStringArray(input.equipment);
  const installationTimeline = asStringArray(input.installation_timeline);

  return {
    profile_context: profile,
    project_overview:
      asString(input.project_overview) ||
      profile.professional_focus ||
      asString(input.project_summary) ||
      "Project overview not provided.",
    space_requirements: {
      footprint: asString(input.footprint) || "Not specified",
      power: asString(input.power) || "Not specified",
      light: asString(input.light) || "Not specified",
      sound: asString(input.sound) || "Not specified"
    },
    equipment: equipment.length ? equipment : ["Equipment list not provided."],
    installation_timeline: installationTimeline.length
      ? installationTimeline
      : ["Installation timeline not provided."],
    staffing: asStringArray(input.staffing).length
      ? asStringArray(input.staffing)
      : ["Staffing requirements not provided."],
    safety: asStringArray(input.safety).length
      ? asStringArray(input.safety)
      : ["Safety requirements not provided."],
    transport:
      asString(input.transport) ||
      "Transport and handling requirements not provided.",
    open_questions: [
      !equipment.length ? "Confirm exact equipment list and ownership." : null,
      !installationTimeline.length
        ? "Confirm installation sequence and timing."
        : null,
      !asString(input.power)
        ? "Confirm electrical load and connector standards."
        : null,
      !asString(input.transport)
        ? "Confirm packing, transport, and storage needs."
        : null
    ].filter(Boolean),
    sources
  };
}

function buildProcedure(
  input: Record<string, unknown>,
  requestSources: RequestSourceRow[],
  opportunities: OpportunityMatchRow[],
  profile: ProfileContext
) {
  const sources = toSources(requestSources, opportunities);

  return {
    profile_context: profile,
    objective: asString(input.objective) || "Procedure objective not provided.",
    steps: asStringArray(input.steps).length
      ? asStringArray(input.steps)
      : ["No procedural steps supplied yet."],
    required_inputs: asStringArray(input.required_inputs).length
      ? asStringArray(input.required_inputs)
      : ["Required inputs not provided."],
    responsible_roles: asStringArray(input.responsible_roles).length
      ? asStringArray(input.responsible_roles)
      : ["Responsible roles not provided."],
    risks: asStringArray(input.risks).length
      ? asStringArray(input.risks)
      : ["Risks not provided."],
    verification_points: asStringArray(input.verification_points).length
      ? asStringArray(input.verification_points)
      : ["Verification points not provided."],
    sources
  };
}

function buildPresentation(
  input: Record<string, unknown>,
  requestSources: RequestSourceRow[],
  opportunities: OpportunityMatchRow[],
  profile: ProfileContext
) {
  const sources = toSources(requestSources, opportunities);

  return {
    profile_context: profile,
    title:
      asString(input.presentation_title) ||
      asString(input.title) ||
      "Presentation title not provided.",
    narrative_structure: asStringArray(input.narrative_structure).length
      ? asStringArray(input.narrative_structure)
      : ["Narrative structure not provided."],
    slide_outline: asStringArray(input.slide_outline).length
      ? asStringArray(input.slide_outline)
      : ["Slide outline not provided."],
    missing_assets: asStringArray(input.missing_assets).length
      ? asStringArray(input.missing_assets)
      : ["Missing assets not specified."],
    export_notes:
      asString(input.export_notes) ||
      "Export and formatting notes remain manual in this slice. No deck export is generated automatically.",
    sources
  };
}

function buildWebsiteUpdate(
  input: Record<string, unknown>,
  requestSources: RequestSourceRow[],
  opportunities: OpportunityMatchRow[],
  profile: ProfileContext
) {
  const sources = toSources(requestSources, opportunities);

  return {
    profile_context: profile,
    objective: asString(input.objective) || "Website objective not provided.",
    target_pages: asStringArray(input.target_pages).length
      ? asStringArray(input.target_pages)
      : ["Target pages not specified."],
    content_requirements: asStringArray(input.content_requirements).length
      ? asStringArray(input.content_requirements)
      : ["Content requirements not specified."],
    technical_tasks: asStringArray(input.technical_tasks).length
      ? asStringArray(input.technical_tasks)
      : ["Technical tasks not specified."],
    SEO_notes: asString(input.seo_notes) || "SEO notes not provided.",
    deployment_notes:
      asString(input.deployment_notes) ||
      "Deployment remains manual. This draft only captures scoped implementation requirements and provenance.",
    sources
  };
}

export async function buildDraft(requestId: string, profileId: string) {
  const [request] = await sql<RequestRow[]>`
    select id, profile_id, type, title, structured_input
    from artist_requests
    where id = ${requestId} and profile_id = ${profileId}
  `;
  if (!request) throw notFound("Artist request not found");

  const requestSources = await sql<RequestSourceRow[]>`
    select id, source_kind, source_id, title, url, excerpt, fetched_at
    from artist_request_sources
    where request_id = ${request.id}
    order by created_at asc
  `;

  const structuredInput = asRecord(request.structured_input);
  const opportunities = await getMatchedOpportunities(structuredInput);
  const profile = await getProfileContext(profileId);

  type Builder = (
    input: Record<string, unknown>,
    sources: RequestSourceRow[],
    opps: OpportunityMatchRow[],
    profile: ProfileContext
  ) => { sources: SourceEntry[]; [key: string]: unknown };

  const builders: Record<RequestType, Builder> = {
    opportunity_research: (i, s, o) =>
      buildOpportunityResearch(request.title, i, s, o, profile),
    funding_research: (i, s, o) => buildFundingResearch(i, s, o, profile),
    tech_rider: (i, s, o) => buildTechRider(i, s, o, profile),
    procedure: (i, s, o) => buildProcedure(i, s, o, profile),
    presentation: (i, s, o) => buildPresentation(i, s, o, profile),
    website_update: (i, s, o) => buildWebsiteUpdate(i, s, o, profile)
  };
  const generated = builders[request.type](
    structuredInput,
    requestSources,
    opportunities,
    profile
  );

  return {
    generatedOutput: generated,
    confidenceLevel: determineConfidence(generated.sources)
  };
}
