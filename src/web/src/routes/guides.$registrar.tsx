import { Link, useParams } from "@tanstack/react-router";

const guides = {
  aruba: [
    "Open admin.aruba.it and enter DNS management for the domain.",
    "Create the TXT or CNAME record exactly as shown in Artemis.",
    "Save the change, then return to Artemis and run verification again."
  ],
  "register-it": [
    "Open Register.it domain control panel and choose DNS zone management.",
    "Insert the TXT or CNAME record from Artemis without changing the target.",
    "Wait for propagation, then retry verification from the Artemis domain screen."
  ],
  godaddy: [
    "Open the GoDaddy DNS page for the domain and add a new record.",
    "Use TXT for the strict ownership flow or CNAME for the delegated flow.",
    "Save, wait for propagation, and run Verify now in Artemis."
  ],
  namecheap: [
    "Open Advanced DNS in Namecheap and add the record from Artemis.",
    "Keep the TTL on automatic unless you already manage a custom policy.",
    "After propagation, come back to Artemis and trigger verification."
  ]
} as const;

export function RegistrarGuidePage() {
  const { registrar } = useParams({ from: "/guides/$registrar" });
  const steps = guides[registrar as keyof typeof guides] ?? guides.aruba;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link className="mb-6 inline-block text-sm underline" to="/domains">
        Back to domains
      </Link>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
        Registrar guide
      </p>
      <h1 className="mt-2 font-serif text-4xl capitalize">
        {registrar.replace("-", " ")}
      </h1>
      <div className="mt-8 space-y-4 border border-stone-200 bg-white p-6">
        {steps.map((step, index) => (
          <p key={step} className="text-sm leading-7">
            <span className="mr-3 font-mono text-[var(--accent)]">
              {index + 1}.
            </span>
            {step}
          </p>
        ))}
        <p className="border-t border-stone-200 pt-4 text-sm text-stone-600">
          Screenshot placeholders stay deferred for founder-provided captures.
        </p>
      </div>
    </main>
  );
}
