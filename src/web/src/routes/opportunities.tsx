import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api } from "../lib/api";

type OpportunitySource = {
  id: string;
  name: string;
  kind: "api" | "scrape" | "manual";
  base_url: string;
  reliability: string;
  description: string | null;
  is_active: boolean;
  last_refreshed_at: string | null;
};

type Opportunity = {
  id: string;
  title: string;
  organizer: string | null;
  url: string;
  geography: string | null;
  discipline: string[];
  description: string | null;
  deadline: string | null;
  funding_amount: string | null;
  eligibility: string | null;
  review_status: "pending_review" | "verified" | "rejected" | "archived";
  verified_at: string | null;
  source: { name: string; kind: string; reliability: string } | null;
};

export function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [geography, setGeography] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceKind, setSourceKind] =
    useState<OpportunitySource["kind"]>("manual");
  const [sourceBaseUrl, setSourceBaseUrl] = useState("");
  const [sourceReliability, setSourceReliability] = useState("unknown");
  const [sourceDescription, setSourceDescription] = useState("");

  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (geography) query.set("geography", geography);
  if (discipline) query.set("discipline", discipline);
  if (reviewStatus) query.set("reviewStatus", reviewStatus);

  const sources = useQuery({
    queryKey: ["opportunity-sources"],
    queryFn: () => api.get<OpportunitySource[]>("/api/opportunity-sources")
  });

  const opportunities = useQuery({
    queryKey: ["opportunities", search, geography, discipline, reviewStatus],
    queryFn: () =>
      api.get<Opportunity[]>(`/api/opportunities?${query.toString()}`)
  });

  const createSource = useMutation({
    mutationFn: () =>
      api.post<OpportunitySource>("/api/opportunity-sources", {
        name: sourceName,
        kind: sourceKind,
        base_url: sourceBaseUrl,
        reliability: sourceReliability,
        description: sourceDescription || undefined
      }),
    onSuccess: async () => {
      setSourceName("");
      setSourceBaseUrl("");
      setSourceReliability("unknown");
      setSourceDescription("");
      setSourceKind("manual");
      await queryClient.invalidateQueries({
        queryKey: ["opportunity-sources"]
      });
    }
  });

  const refresh = useMutation({
    mutationFn: () => api.post("/api/opportunities/refresh", {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      await queryClient.invalidateQueries({
        queryKey: ["opportunity-sources"]
      });
    }
  });

  const verify = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/opportunities/${id}/verify`, {
        reviewNotes: "Verified through the Artemis editorial intake workflow."
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    }
  });

  const reject = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/opportunities/${id}/reject`, {
        reviewNotes: "Rejected in the Artemis editorial intake workflow."
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    }
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between border-b border-stone-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Verified Source Intake
          </p>
          <h1 className="font-serif text-4xl">Opportunities</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Editorial intake for opportunity sources and manually reviewed
            opportunity records. This slice still uses the manual seed adapter
            for stored test opportunities and does not claim live calls.
          </p>
        </div>
        <div className="flex gap-4 text-sm underline">
          <Link to="/requests">Requests</Link>
          <Link to="/">Catalog</Link>
        </div>
      </header>

      <section className="mb-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        <form
          className="space-y-4 border border-stone-200 bg-white p-6"
          onSubmit={(event) => {
            event.preventDefault();
            createSource.mutate();
          }}
        >
          <h2 className="font-serif text-2xl">New source</h2>
          <Input
            placeholder="Source name"
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
          />
          <Select
            value={sourceKind}
            onChange={(event) =>
              setSourceKind(event.target.value as OpportunitySource["kind"])
            }
          >
            <option value="manual">Manual</option>
            <option value="api">API</option>
            <option value="scrape">Scrape</option>
          </Select>
          <Input
            placeholder="Base URL"
            value={sourceBaseUrl}
            onChange={(event) => setSourceBaseUrl(event.target.value)}
          />
          <Input
            placeholder="Reliability"
            value={sourceReliability}
            onChange={(event) => setSourceReliability(event.target.value)}
          />
          <label className="block space-y-2">
            <span className="text-sm">Description</span>
            <textarea
              className="min-h-28 w-full border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900"
              value={sourceDescription}
              onChange={(event) => setSourceDescription(event.target.value)}
            />
          </label>
          <Button type="submit">Create source</Button>
        </form>

        <div className="space-y-4">
          <div className="grid gap-3 border border-stone-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_180px_auto]">
            <Input
              placeholder="Search title, organizer, description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Input
              placeholder="Filter geography"
              value={geography}
              onChange={(event) => setGeography(event.target.value)}
            />
            <Input
              placeholder="Filter discipline"
              value={discipline}
              onChange={(event) => setDiscipline(event.target.value)}
            />
            <Select
              value={reviewStatus}
              onChange={(event) => setReviewStatus(event.target.value)}
            >
              <option value="">All review states</option>
              <option value="pending_review">Pending review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </Select>
            <Button type="button" onClick={() => refresh.mutate()}>
              Refresh seeded
            </Button>
          </div>

          <div className="border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-2xl">Source registry</h2>
            <div className="mt-4 space-y-4">
              {(sources.data ?? []).map((source) => (
                <article
                  key={source.id}
                  className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                        {source.kind} | {source.reliability} |{" "}
                        {source.is_active ? "active" : "inactive"}
                      </p>
                    </div>
                    <p className="text-xs text-stone-500">
                      {source.last_refreshed_at
                        ? new Date(source.last_refreshed_at).toLocaleString()
                        : "Not refreshed yet"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {source.base_url}
                  </p>
                  {source.description ? (
                    <p className="mt-1 text-sm text-stone-600">
                      {source.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border border-stone-200 bg-white p-6">
        <h2 className="font-serif text-2xl">Opportunity records</h2>
        <div className="mt-4 space-y-4">
          {(opportunities.data ?? []).map((opportunity) => (
            <article
              key={opportunity.id}
              className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl">{opportunity.title}</h3>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                    {opportunity.review_status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {opportunity.review_status !== "verified" ? (
                    <Button
                      type="button"
                      onClick={() => verify.mutate(opportunity.id)}
                    >
                      Verify
                    </Button>
                  ) : null}
                  {opportunity.review_status !== "rejected" ? (
                    <Button
                      className="bg-white text-stone-900"
                      type="button"
                      onClick={() => reject.mutate(opportunity.id)}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-sm text-stone-600">
                {opportunity.organizer ?? "Unknown organizer"} |{" "}
                {opportunity.geography ?? "No geography"}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {opportunity.discipline.join(", ") || "No discipline"}
              </p>
              {opportunity.description ? (
                <p className="mt-2 text-sm text-stone-600">
                  {opportunity.description}
                </p>
              ) : null}
              {opportunity.deadline ? (
                <p className="mt-1 text-sm text-stone-600">
                  Deadline: {new Date(opportunity.deadline).toLocaleString()}
                </p>
              ) : null}
              {opportunity.funding_amount ? (
                <p className="mt-1 text-sm text-stone-600">
                  Funding: {opportunity.funding_amount}
                </p>
              ) : null}
              {opportunity.eligibility ? (
                <p className="mt-1 text-sm text-stone-600">
                  Eligibility: {opportunity.eligibility}
                </p>
              ) : null}
              {opportunity.verified_at ? (
                <p className="mt-1 text-sm text-stone-600">
                  Verified at:{" "}
                  {new Date(opportunity.verified_at).toLocaleString()}
                </p>
              ) : null}
              <a
                className="mt-2 inline-block text-sm underline"
                href={opportunity.url}
                rel="noreferrer"
                target="_blank"
              >
                {opportunity.url}
              </a>
              {opportunity.source ? (
                <p className="mt-2 text-xs text-stone-500">
                  {opportunity.source.name} | {opportunity.source.kind} |{" "}
                  {opportunity.source.reliability}
                </p>
              ) : null}
            </article>
          ))}
          {!opportunities.data?.length ? (
            <p className="text-sm text-stone-600">
              No stored opportunities yet. Run the manual seed refresh to
              populate deterministic test records.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
