import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Table } from "../components/ui/table";
import { api } from "../lib/api";
import { authStore } from "../lib/auth";

type Artwork = {
  id: string;
  title: string;
  year: number | null;
  medium: string | null;
  visibility:
    | "private"
    | "shared_with_relationships"
    | "project_only"
    | "public";
  thumbnail_small_key: string | null;
};

const createSchema = z.object({
  title: z.string().min(1),
  year: z.coerce.number().int().min(0).max(9999),
  medium: z.string().min(1),
  description: z.string().default(""),
  visibility: z.enum([
    "private",
    "shared_with_relationships",
    "project_only",
    "public"
  ])
});

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [visibility, setVisibility] = useState("");
  const [medium, setMedium] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { visibility: "private", description: "" }
  });

  const query = new URLSearchParams();
  if (visibility) query.set("visibility", visibility);
  if (medium) query.set("medium", medium);
  if (deferredSearch) query.set("search", deferredSearch);

  const artworks = useQuery({
    queryKey: ["artworks", visibility, medium, deferredSearch],
    queryFn: () =>
      api.getWithMeta<Artwork[]>(`/api/artworks?${query.toString()}`)
  });

  const createArtwork = useMutation({
    mutationFn: (values: z.infer<typeof createSchema>) =>
      api.post<Artwork>("/api/artworks", values),
    onSuccess: async () => {
      form.reset({
        title: "",
        year: 2026,
        medium: "",
        description: "",
        visibility: "private"
      });
      await queryClient.invalidateQueries({ queryKey: ["artworks"] });
    }
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between border-b border-stone-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Artworks
          </p>
          <h1 className="font-serif text-4xl">Catalog</h1>
        </div>
        <div className="flex gap-4 text-sm underline">
          <Link to="/opportunities">Opportunities</Link>
          <Link to="/requests">Requests</Link>
          <Link to="/domains">Domains</Link>
          <button
            onClick={() => {
              authStore.clear();
              navigate({ to: "/login" });
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <section className="mb-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <form
          className="space-y-4 border border-stone-200 bg-white p-6"
          onSubmit={form.handleSubmit((v) => createArtwork.mutate(v))}
        >
          <h2 className="font-serif text-2xl">New artwork</h2>
          <Input
            aria-label="Artwork title"
            placeholder="Title"
            {...form.register("title")}
          />
          <Input
            aria-label="Artwork year"
            placeholder="Year"
            type="number"
            {...form.register("year")}
          />
          <Input
            aria-label="Artwork medium"
            placeholder="Medium"
            {...form.register("medium")}
          />
          <Input
            aria-label="Artwork short description"
            placeholder="Short description"
            {...form.register("description")}
          />
          <Select {...form.register("visibility")}>
            <option value="private">Private</option>
            <option value="shared_with_relationships">
              Shared with relationships
            </option>
            <option value="project_only">Project only</option>
            <option value="public">Public</option>
          </Select>
          <Button type="submit">Create artwork</Button>
        </form>

        <div className="space-y-4">
          <div className="grid gap-3 border border-stone-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_auto]">
            <Input
              aria-label="Search artworks"
              placeholder="Search title, medium, description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="">All visibility</option>
              <option value="private">Private</option>
              <option value="shared_with_relationships">
                Shared with relationships
              </option>
              <option value="project_only">Project only</option>
              <option value="public">Public</option>
            </Select>
            <Input
              aria-label="Filter medium"
              placeholder="Filter medium"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                className={view === "grid" ? "" : "bg-white text-stone-900"}
                type="button"
                onClick={() => setView("grid")}
              >
                Grid
              </Button>
              <Button
                className={view === "table" ? "" : "bg-white text-stone-900"}
                type="button"
                onClick={() => setView("table")}
              >
                Table
              </Button>
            </div>
          </div>
          {view === "grid" ? (
            <ArtworkGrid artworks={artworks.data?.data ?? []} />
          ) : (
            <ArtworkTable artworks={artworks.data?.data ?? []} />
          )}
        </div>
      </section>
    </main>
  );
}

function ArtworkGrid({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {artworks.map((artwork) => (
        <Link
          key={artwork.id}
          className="border border-stone-200 bg-white p-4 hover:border-stone-900"
          to="/artworks/$id"
          params={{ id: artwork.id }}
        >
          {artwork.thumbnail_small_key ? (
            <img
              alt={artwork.title}
              className="mb-4 h-52 w-full object-cover"
              src={`/uploads/${artwork.thumbnail_small_key}`}
            />
          ) : (
            <div className="mb-4 h-52 border border-dashed border-stone-300 bg-stone-50" />
          )}
          <h3 className="font-serif text-2xl">{artwork.title}</h3>
          <p className="text-sm text-stone-600">
            {artwork.year ?? "No year"} | {artwork.medium ?? "No medium"}
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            {artwork.visibility.replaceAll("_", " ")}
          </p>
        </Link>
      ))}
    </div>
  );
}

function ArtworkTable({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="border border-stone-200 bg-white p-4">
      <Table>
        <thead>
          <tr className="border-b border-stone-200">
            <th className="py-2">Title</th>
            <th className="py-2">Year</th>
            <th className="py-2">Medium</th>
            <th className="py-2">Visibility</th>
          </tr>
        </thead>
        <tbody>
          {artworks.map((artwork) => (
            <tr
              key={artwork.id}
              className="border-b border-stone-100 last:border-b-0"
            >
              <td className="py-3">
                <Link
                  className="underline"
                  to="/artworks/$id"
                  params={{ id: artwork.id }}
                >
                  {artwork.title}
                </Link>
              </td>
              <td className="py-3">{artwork.year ?? "-"}</td>
              <td className="py-3">{artwork.medium ?? "-"}</td>
              <td className="py-3">
                {artwork.visibility.replaceAll("_", " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
