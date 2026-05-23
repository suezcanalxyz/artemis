import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  updated_at: string;
  sources: Array<{
    id: string;
    source_kind: string;
    title: string | null;
  }>;
};

const createSchema = z.object({
  title: z.string().min(1),
  type: z.enum([
    "opportunity_research",
    "funding_research",
    "tech_rider",
    "procedure",
    "presentation",
    "website_update"
  ]),
  priority: z.string().min(1).default("normal"),
  human_notes: z.string().default(""),
  structured_input: z.string().default("{}")
});

function formatType(value: string) {
  return value.replaceAll("_", " ");
}

export function RequestsPage() {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ["artist-requests"],
    queryFn: () => api.get<ArtistRequest[]>("/api/artist-requests")
  });

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      type: "tech_rider",
      priority: "normal",
      human_notes: "",
      structured_input:
        '{\n  "project_overview": "",\n  "equipment": [],\n  "installation_timeline": []\n}'
    }
  });

  const createRequest = useMutation({
    mutationFn: async (values: z.infer<typeof createSchema>) => {
      const structuredInput = JSON.parse(values.structured_input) as Record<
        string,
        unknown
      >;
      return api.post<ArtistRequest>("/api/artist-requests", {
        title: values.title,
        type: values.type,
        priority: values.priority,
        human_notes: values.human_notes || undefined,
        structured_input: structuredInput
      });
    },
    onSuccess: async () => {
      form.reset({
        title: "",
        type: "tech_rider",
        priority: "normal",
        human_notes: "",
        structured_input:
          '{\n  "project_overview": "",\n  "equipment": [],\n  "installation_timeline": []\n}'
      });
      await queryClient.invalidateQueries({ queryKey: ["artist-requests"] });
    }
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between border-b border-stone-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Artist Operating Desk
          </p>
          <h1 className="font-serif text-4xl">Requests</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Editorial request records for opportunity and funding research,
            technical riders, procedures, presentations, and website
            implementation.
          </p>
        </div>
        <div className="flex gap-4 text-sm underline">
          <Link to="/profile">Profile</Link>
          <Link to="/artworks">Back to catalog</Link>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <form
          className="space-y-4 border border-stone-200 bg-white p-6"
          onSubmit={form.handleSubmit((values) => createRequest.mutate(values))}
        >
          <h2 className="font-serif text-2xl">New request</h2>
          <Input placeholder="Request title" {...form.register("title")} />
          <Select {...form.register("type")}>
            <option value="opportunity_research">Opportunity research</option>
            <option value="funding_research">Funding research</option>
            <option value="tech_rider">Technical rider</option>
            <option value="procedure">Procedure</option>
            <option value="presentation">Presentation</option>
            <option value="website_update">Website update</option>
          </Select>
          <Input placeholder="Priority" {...form.register("priority")} />
          <label className="block space-y-2">
            <span className="text-sm">Human notes</span>
            <textarea
              className="min-h-28 w-full border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900"
              {...form.register("human_notes")}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm">Structured input JSON</span>
            <textarea
              className="min-h-56 w-full border border-stone-300 bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-stone-900"
              {...form.register("structured_input")}
            />
          </label>
          <Button type="submit">Create request</Button>
        </form>

        <div className="space-y-4">
          {(requests.data ?? []).map((item) => (
            <Link
              key={item.id}
              className="block border border-stone-200 bg-white p-6 hover:border-stone-900"
              to="/requests/$id"
              params={{ id: item.id }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl">{item.title}</h2>
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                    {formatType(item.type)} | {item.status.replaceAll("_", " ")}{" "}
                    | {item.confidence_level.replaceAll("_", " ")}
                  </p>
                </div>
                <p className="text-sm text-stone-500">
                  {new Date(item.updated_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-3 text-sm text-stone-600">
                {item.sources.length} provenance source
                {item.sources.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
          {!requests.data?.length ? (
            <p className="border border-dashed border-stone-300 p-6 text-sm">
              No requests yet. Start with a rider, research brief, procedure,
              presentation brief, or website implementation note.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
