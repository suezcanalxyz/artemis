import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api } from "../lib/api";

type ArtistRequest = {
  id: string;
  type:
    | "opportunity_research"
    | "funding_research"
    | "tech_rider"
    | "procedure"
    | "presentation"
    | "website_update";
  status:
    | "draft"
    | "ready_for_processing"
    | "processing"
    | "needs_review"
    | "completed"
    | "archived";
  priority: string;
  title: string;
  structured_input: Record<string, unknown>;
  generated_output: Record<string, unknown>;
  human_notes: string | null;
  confidence_level: "unverified" | "partially_verified" | "verified";
  sources: Array<{
    id: string;
    source_kind: string;
    source_id: string | null;
    title: string | null;
    url: string | null;
    excerpt: string | null;
    fetched_at: string | null;
  }>;
};

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function RequestDetailPage() {
  const { id } = useParams({ from: "/requests/$id" });
  const queryClient = useQueryClient();
  const requestQuery = useQuery({
    queryKey: ["artist-request", id],
    queryFn: () => api.get<ArtistRequest>(`/api/artist-requests/${id}`)
  });

  const request = requestQuery.data;
  const verifiedOpportunities = useQuery({
    queryKey: ["opportunities", "verified-for-request"],
    queryFn: () =>
      api.get<
        Array<{
          id: string;
          title: string;
          organizer: string | null;
          geography: string | null;
          verified_at: string | null;
        }>
      >("/api/opportunities?reviewStatus=verified&limit=20")
  });
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState<ArtistRequest["status"]>("draft");
  const [humanNotes, setHumanNotes] = useState("");
  const [structuredInputText, setStructuredInputText] = useState("{}");

  useEffect(() => {
    if (!request) return;
    setTitle(request.title);
    setPriority(request.priority);
    setStatus(request.status);
    setHumanNotes(request.human_notes ?? "");
    setStructuredInputText(JSON.stringify(request.structured_input, null, 2));
  }, [request]);

  const save = useMutation({
    mutationFn: async () =>
      api.patch<ArtistRequest>(`/api/artist-requests/${id}`, {
        title,
        priority,
        status,
        human_notes: humanNotes,
        structured_input: JSON.parse(structuredInputText)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["artist-request", id] });
      await queryClient.invalidateQueries({ queryKey: ["artist-requests"] });
    }
  });

  const markReady = useMutation({
    mutationFn: () =>
      api.post<ArtistRequest>(`/api/artist-requests/${id}/mark-ready`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["artist-request", id] });
      await queryClient.invalidateQueries({ queryKey: ["artist-requests"] });
    }
  });

  const generateDraft = useMutation({
    mutationFn: () =>
      api.post<ArtistRequest>(`/api/artist-requests/${id}/generate-draft`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["artist-request", id] });
      await queryClient.invalidateQueries({ queryKey: ["artist-requests"] });
    }
  });

  const attachOpportunity = useMutation({
    mutationFn: (opportunityId: string) =>
      api.post<ArtistRequest>(
        `/api/artist-requests/${id}/sources/opportunities`,
        {
          opportunity_id: opportunityId
        }
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["artist-request", id] });
      await queryClient.invalidateQueries({ queryKey: ["artist-requests"] });
    }
  });

  if (!request) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link className="text-sm underline" to="/requests">
          Back to requests
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between border-b border-stone-200 pb-6">
        <div>
          <div className="mb-4 flex gap-4 text-sm underline">
            <Link to="/requests">Back to requests</Link>
            <Link to="/profile">Profile</Link>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            {titleCase(request.type)}
          </p>
          <h1 className="font-serif text-4xl">{request.title}</h1>
        </div>
        <div className="text-right text-sm text-stone-600">
          <p>{titleCase(request.status)}</p>
          <p>{titleCase(request.confidence_level)}</p>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <div className="space-y-4 border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-2xl">Request editor</h2>
            <label className="block space-y-2">
              <span className="text-sm">Title</span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm">Priority</span>
              <Input
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm">Status</span>
              <Select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ArtistRequest["status"])
                }
              >
                <option value="draft">Draft</option>
                <option value="ready_for_processing">
                  Ready for processing
                </option>
                <option value="processing">Processing</option>
                <option value="needs_review">Needs review</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </Select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm">Human notes</span>
              <textarea
                className="min-h-32 w-full border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900"
                value={humanNotes}
                onChange={(event) => setHumanNotes(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm">Structured input JSON</span>
              <textarea
                aria-label="Structured input JSON"
                className="min-h-80 w-full border border-stone-300 bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-stone-900"
                value={structuredInputText}
                onChange={(event) => setStructuredInputText(event.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => save.mutate()}>
                Save request
              </Button>
              <Button
                className="bg-white text-stone-900"
                type="button"
                onClick={() => markReady.mutate()}
              >
                Mark ready
              </Button>
              <Button type="button" onClick={() => generateDraft.mutate()}>
                Generate draft
              </Button>
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-2xl">Provenance</h2>
            <p className="mt-2 text-sm text-stone-600">
              Drafts only use request input and stored opportunity records.
              Every generated section remains tied to explicit provenance.
            </p>
            <div className="mt-4 space-y-4">
              {request.sources.map((source) => (
                <article
                  key={source.id}
                  className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                    {titleCase(source.source_kind)}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {source.title ?? "Untitled source"}
                  </p>
                  {source.url ? (
                    <a
                      className="mt-1 block text-sm underline"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.url}
                    </a>
                  ) : null}
                  {source.excerpt ? (
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-stone-600">
                      {source.excerpt}
                    </pre>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-6">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl">
                Attach verified opportunities
              </h2>
              <Link className="text-sm underline" to="/opportunities">
                Open opportunities
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {(verifiedOpportunities.data ?? []).map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{opportunity.title}</p>
                      <p className="text-sm text-stone-600">
                        {opportunity.organizer ?? "Unknown organizer"} |{" "}
                        {opportunity.geography ?? "No geography"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => attachOpportunity.mutate(opportunity.id)}
                    >
                      Attach
                    </Button>
                  </div>
                </article>
              ))}
              {!verifiedOpportunities.data?.length ? (
                <p className="text-sm text-stone-600">
                  No verified opportunities available yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-2xl">Generated draft</h2>
            {Object.keys(request.generated_output ?? {}).length ? (
              <GeneratedOutput output={request.generated_output} />
            ) : (
              <p className="mt-4 text-sm text-stone-600">
                No draft yet. Generate a deterministic draft from the structured
                input and archived sources.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function GeneratedOutput({ output }: { output: Record<string, unknown> }) {
  return (
    <div className="mt-4 space-y-5">
      {Object.entries(output).map(([key, value]) => (
        <section
          key={key}
          className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
        >
          <h3 className="font-serif text-2xl">{titleCase(key)}</h3>
          <div className="mt-3 text-sm text-stone-700">
            {renderValue(value)}
          </div>
        </section>
      ))}
    </div>
  );
}

function renderValue(value: unknown): ReactNode {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return <p>{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="border-l border-stone-300 pl-3">
            {renderValue(item)}
          </div>
        ))}
      </div>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className="space-y-3">
        {Object.entries(value as Record<string, unknown>).map(
          ([entryKey, entryValue]) => (
            <div key={entryKey}>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                {titleCase(entryKey)}
              </p>
              <div className="mt-1">{renderValue(entryValue)}</div>
            </div>
          )
        )}
      </div>
    );
  }

  return <p>None</p>;
}
