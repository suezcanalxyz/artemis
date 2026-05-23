import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api } from "../lib/api";

type ArtworkDetail = {
  id: string;
  title: string;
  year: number | null;
  medium: string | null;
  description: string | null;
  visibility:
    | "private"
    | "shared_with_relationships"
    | "project_only"
    | "public";
  media: Array<{
    id: string;
    thumbnail_key: string;
    thumbnail_small_key: string | null;
    original_filename: string;
    sort_order: number;
    is_primary: boolean;
  }>;
};

const schema = z.object({
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

export function ArtworkDetailPage() {
  const { id } = useParams({ from: "/artworks/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const artwork = useQuery({
    queryKey: ["artwork", id],
    queryFn: () => api.get<ArtworkDetail>(`/api/artworks/${id}`)
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: artwork.data
      ? {
          title: artwork.data.title,
          year: artwork.data.year ?? 2026,
          medium: artwork.data.medium ?? "",
          description: artwork.data.description ?? "",
          visibility: artwork.data.visibility
        }
      : undefined
  });

  const save = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      api.patch(`/api/artworks/${id}`, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["artwork", id] });
      await queryClient.invalidateQueries({ queryKey: ["artworks"] });
    }
  });
  const destroy = useMutation({
    mutationFn: () => api.delete(`/api/artworks/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["artworks"] });
      await navigate({ to: "/" });
    }
  });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.set("file", file);
      return api.post(`/api/artworks/${id}/media`, formData, true);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["artwork", id] });
      await queryClient.invalidateQueries({ queryKey: ["artworks"] });
    }
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link className="mb-6 inline-block text-sm underline" to="/">
        Back to artworks
      </Link>
      <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <form
          className="space-y-4 border border-stone-200 bg-white p-6"
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Artwork
          </p>
          <Input {...form.register("title")} />
          <Input type="number" {...form.register("year")} />
          <Input {...form.register("medium")} />
          <Input {...form.register("description")} />
          <Select {...form.register("visibility")}>
            <option value="private">Private</option>
            <option value="shared_with_relationships">
              Shared with relationships
            </option>
            <option value="project_only">Project only</option>
            <option value="public">Public</option>
          </Select>
          <div className="flex gap-3">
            <Button type="submit">Save</Button>
            <Button
              className="bg-white text-stone-900"
              type="button"
              onClick={() => destroy.mutate()}
            >
              Delete
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <label className="block border border-stone-200 bg-white p-6">
            <span className="mb-3 block text-sm">Add image</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="mb-4 block w-full text-sm"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
              }}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            {artwork.data?.media.map((asset) => (
              <MediaCard
                key={asset.id}
                artworkId={id}
                asset={asset}
                onChanged={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: ["artwork", id]
                  });
                  await queryClient.invalidateQueries({
                    queryKey: ["artworks"]
                  });
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function MediaCard({
  artworkId,
  asset,
  onChanged
}: {
  artworkId: string;
  asset: ArtworkDetail["media"][number];
  onChanged: () => Promise<void>;
}) {
  const patch = useMutation({
    mutationFn: (body: { sortOrder?: number; isPrimary?: boolean }) =>
      api.patch(`/api/artworks/${artworkId}/media/${asset.id}`, body),
    onSuccess: onChanged
  });
  const destroy = useMutation({
    mutationFn: () =>
      api.delete(`/api/artworks/${artworkId}/media/${asset.id}`),
    onSuccess: onChanged
  });

  return (
    <article className="border border-stone-200 bg-white p-4">
      <img
        alt={asset.original_filename}
        className="mb-4 w-full"
        src={`/uploads/${asset.thumbnail_key}`}
      />
      <p className="mb-3 text-sm">{asset.original_filename}</p>
      <div className="flex gap-2">
        <Button type="button" onClick={() => patch.mutate({ isPrimary: true })}>
          {asset.is_primary ? "Primary" : "Make primary"}
        </Button>
        <Button
          className="bg-white text-stone-900"
          type="button"
          onClick={() =>
            patch.mutate({ sortOrder: Math.max(asset.sort_order - 1, 0) })
          }
        >
          Up
        </Button>
        <Button
          className="bg-white text-stone-900"
          type="button"
          onClick={() => destroy.mutate()}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
