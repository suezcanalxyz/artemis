import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api } from "../lib/api";

type KnowledgeDocument = {
  id: string;
  title: string;
  kind: string;
  review_status: string;
  metadata: Record<string, unknown>;
  updated_at: string;
};

type SearchChunk = {
  id: string;
  document_id: string;
  heading: string | null;
  content: string;
  score: number;
};

export function KnowledgePage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("portfolio_review");
  const [reviewStatus, setReviewStatus] = useState("draft");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");

  const documents = useQuery({
    queryKey: ["knowledge-documents"],
    queryFn: () => api.get<KnowledgeDocument[]>("/api/knowledge")
  });

  const searchResults = useQuery({
    queryKey: ["knowledge-search", search],
    queryFn: () =>
      api.get<SearchChunk[]>(
        `/api/knowledge/search?q=${encodeURIComponent(search)}&limit=12`
      ),
    enabled: search.trim().length > 0
  });

  const createDocument = useMutation({
    mutationFn: () =>
      api.post("/api/knowledge", {
        title,
        kind,
        body,
        review_status: reviewStatus
      }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setKind("portfolio_review");
      setReviewStatus("draft");
      await queryClient.invalidateQueries({
        queryKey: ["knowledge-documents"]
      });
    }
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between border-b border-stone-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Artist Knowledge Base
          </p>
          <h1 className="font-serif text-4xl">Knowledge</h1>
        </div>
        <div className="flex gap-4 text-sm underline">
          <Link to="/requests">Requests</Link>
          <Link to="/opportunities">Opportunities</Link>
          <Link to="/">Catalog</Link>
        </div>
      </header>

      <section className="mb-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <form
          className="space-y-4 border border-stone-200 bg-white p-6"
          onSubmit={(event) => {
            event.preventDefault();
            createDocument.mutate();
          }}
        >
          <h2 className="font-serif text-2xl">New document</h2>
          <Input
            placeholder="Document title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Input
            placeholder="Document kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          />
          <Select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="internal_review">Internal review</option>
            <option value="approved">Approved</option>
          </Select>
          <label className="block space-y-2">
            <span className="text-sm">Body</span>
            <textarea
              className="min-h-96 w-full border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
          <Button type="submit">Store document</Button>
        </form>

        <div className="space-y-4">
          <div className="border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-2xl">Search internal evidence</h2>
            <Input
              className="mt-4"
              placeholder="Search portfolio, statements, reviews, technical notes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="mt-4 space-y-4">
              {(searchResults.data ?? []).map((chunk) => (
                <article
                  key={chunk.id}
                  className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="font-medium">
                    {chunk.heading ?? "Untitled chunk"}
                  </p>
                  <p className="mt-2 text-sm text-stone-600">{chunk.content}</p>
                </article>
              ))}
              {search.trim() && !searchResults.data?.length ? (
                <p className="text-sm text-stone-600">
                  No matching evidence yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-2xl">Document registry</h2>
            <div className="mt-4 space-y-4">
              {(documents.data ?? []).map((document) => (
                <article
                  key={document.id}
                  className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{document.title}</p>
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                        {document.kind} | {document.review_status}
                      </p>
                    </div>
                    <p className="text-xs text-stone-500">
                      {new Date(document.updated_at).toLocaleString()}
                    </p>
                  </div>
                </article>
              ))}
              {!documents.data?.length ? (
                <p className="text-sm text-stone-600">
                  No internal knowledge documents yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
