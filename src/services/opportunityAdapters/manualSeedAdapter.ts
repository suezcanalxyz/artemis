import type { NormalizedOpportunity, OpportunityAdapter } from "./types.js";

export const manualSeedAdapter: OpportunityAdapter = {
  name: "Manual Seed Adapter",
  kind: "manual",
  async fetch(): Promise<NormalizedOpportunity[]> {
    const fetchedAt = new Date().toISOString();

    return [
      {
        title: "Test Opportunity: Residency Planning Sandbox",
        organizer: "Artemis Editorial Seed",
        description:
          "Placeholder opportunity for testing request matching and provenance. Not a real open call.",
        url: "https://artemis.local/test-opportunities/residency-planning-sandbox",
        deadline: null,
        geography: "International",
        discipline: ["installation", "research"],
        fundingAmount: "Test data only",
        eligibility: "Internal Artemis test records only.",
        rawPayload: {
          seed: true,
          note: "This is placeholder data for M4A request drafting. Do not treat as a real opportunity."
        },
        fetchedAt
      },
      {
        title: "Test Opportunity: Exhibition Production Study Grant",
        organizer: "Artemis Editorial Seed",
        description:
          "Placeholder funding-style opportunity for deterministic draft generation. Not a real programme.",
        url: "https://artemis.local/test-opportunities/exhibition-production-study-grant",
        deadline: null,
        geography: "EU / Mediterranean",
        discipline: ["video", "performance"],
        fundingAmount: "Test data only",
        eligibility: "Internal Artemis test records only.",
        rawPayload: {
          seed: true,
          note: "This is placeholder data for M4A request drafting. Do not treat as a real grant."
        },
        fetchedAt
      }
    ];
  }
};
