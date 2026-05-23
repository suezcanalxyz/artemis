import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api } from "../lib/api";

type Domain = {
  id: string;
  host: string;
  kind: "subdomain" | "custom";
  is_verified: boolean;
  status: string;
  verification_method: "txt" | "cname";
  verification_token: string;
  verification_target: string | null;
  last_error: string | null;
};

const subdomainSchema = z.object({ subdomainLabel: z.string().min(3).max(63) });
const customSchema = z.object({
  host: z.string().min(3),
  verificationMethod: z.enum(["txt", "cname"]).default("txt")
});

export function DomainsPage() {
  const queryClient = useQueryClient();
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: () => api.get<Domain[]>("/api/domains")
  });
  const subdomainForm = useForm<z.infer<typeof subdomainSchema>>({
    resolver: zodResolver(subdomainSchema)
  });
  const customForm = useForm<z.infer<typeof customSchema>>({
    resolver: zodResolver(customSchema),
    defaultValues: { verificationMethod: "txt" }
  });
  const create = useMutation({
    mutationFn: (body: unknown) => api.post<Domain>("/api/domains", body),
    onSuccess: async (domain) => {
      queryClient.setQueryData<Domain[]>(["domains"], (current) => {
        if (!current) {
          return [domain];
        }

        return [...current, domain];
      });
      subdomainForm.reset();
      customForm.reset({ host: "", verificationMethod: "txt" });
      await queryClient.invalidateQueries({ queryKey: ["domains"] });
    }
  });
  const verify = useMutation({
    mutationFn: (id: string) => api.post(`/api/domains/${id}/verify`, {}),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["domains"] })
  });
  const health = useMutation({
    mutationFn: (id: string) => api.post(`/api/domains/${id}/health`, {}),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["domains"] })
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between border-b border-stone-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Domains
          </p>
          <h1 className="font-serif text-4xl">Publishing surface</h1>
        </div>
        <Link className="text-sm underline" to="/">
          Back to catalog
        </Link>
      </header>

      <section className="mb-8 grid gap-8 lg:grid-cols-2">
        <form
          className="space-y-4 border border-stone-200 bg-white p-6"
          onSubmit={subdomainForm.handleSubmit((v) =>
            create.mutate({ kind: "subdomain", ...v })
          )}
        >
          <h2 className="font-serif text-2xl">Scenario 1: Artemis subdomain</h2>
          <p className="text-sm text-stone-600">
            Instant publish on your Artemis-hosted domain.
          </p>
          <Input
            placeholder="studio-rossi"
            {...subdomainForm.register("subdomainLabel")}
          />
          <Button type="submit">Claim subdomain</Button>
        </form>

        <form
          className="space-y-4 border border-stone-200 bg-white p-6"
          onSubmit={customForm.handleSubmit((v) =>
            create.mutate({ kind: "custom", ...v })
          )}
        >
          <h2 className="font-serif text-2xl">Scenario 2: Custom domain</h2>
          <p className="text-sm text-stone-600">
            Use your own root domain or subdomain and verify ownership.
          </p>
          <Input
            placeholder="studio.example.com"
            {...customForm.register("host")}
          />
          <Select {...customForm.register("verificationMethod")}>
            <option value="txt">DNS TXT</option>
            <option value="cname">CNAME</option>
          </Select>
          <div className="flex gap-4 text-sm underline">
            <Link to="/guides/$registrar" params={{ registrar: "aruba" }}>
              Aruba
            </Link>
            <Link to="/guides/$registrar" params={{ registrar: "register-it" }}>
              Register.it
            </Link>
            <Link to="/guides/$registrar" params={{ registrar: "godaddy" }}>
              GoDaddy
            </Link>
            <Link to="/guides/$registrar" params={{ registrar: "namecheap" }}>
              Namecheap
            </Link>
          </div>
          <Button type="submit">Start verification</Button>
        </form>
      </section>

      <section className="space-y-4">
        {(domains.data ?? []).map((domain) => (
          <article
            key={domain.id}
            className="border border-stone-200 bg-white p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl">{domain.host}</h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                  {domain.kind} |{" "}
                  {domain.is_verified ? "verified" : domain.status}
                </p>
              </div>
              <div className="flex gap-2">
                {!domain.is_verified ? (
                  <Button
                    type="button"
                    onClick={() => verify.mutate(domain.id)}
                  >
                    Verify now
                  </Button>
                ) : null}
                {domain.is_verified ? (
                  <Button
                    type="button"
                    onClick={() => health.mutate(domain.id)}
                  >
                    Run health check
                  </Button>
                ) : null}
              </div>
            </div>
            {!domain.is_verified ? <VerificationBlock domain={domain} /> : null}
            {domain.last_error ? (
              <p className="mt-4 text-sm text-[var(--accent)]">
                {domain.last_error}
              </p>
            ) : null}
          </article>
        ))}
        {!domains.data?.length ? (
          <p className="border border-dashed border-stone-300 p-6 text-sm">
            No publishing domains yet. Start with a subdomain or a custom
            hostname.
          </p>
        ) : null}
      </section>
    </main>
  );
}

function VerificationBlock({ domain }: { domain: Domain }) {
  if (domain.verification_method === "txt") {
    return (
      <div className="mt-4 border-t border-stone-200 pt-4 text-sm">
        <p>Add this TXT record:</p>
        <p className="mt-2 font-mono">Name: _artemis-verify.{domain.host}</p>
        <p className="font-mono">Value: {domain.verification_token}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-stone-200 pt-4 text-sm">
      <p>Add this CNAME record:</p>
      <p className="mt-2 font-mono">Host: {domain.host}</p>
      <p className="font-mono">Target: {domain.verification_target}</p>
    </div>
  );
}
