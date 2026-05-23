export type NormalizedOpportunity = {
  title: string;
  organizer: string | null;
  description: string | null;
  url: string;
  deadline: string | null;
  geography: string | null;
  discipline: string[];
  fundingAmount: string | null;
  eligibility: string | null;
  rawPayload: Record<string, unknown>;
  fetchedAt: string;
};

export interface OpportunityAdapter {
  name: string;
  kind: "api" | "scrape" | "manual";
  fetch(): Promise<NormalizedOpportunity[]>;
}
