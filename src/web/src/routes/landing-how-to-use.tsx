import { Link } from "@tanstack/react-router";
import { LandingFooter } from "../components/landing-footer";
import { LandingNav } from "../components/landing-nav";
import { HOW_TO_USE_STEPS } from "../lib/landing-content";

export function LandingHowToUsePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <LandingNav />

      <main className="mx-auto max-w-7xl px-6 py-20">
        <header className="mb-20 max-w-2xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.35em] text-[var(--accent)]">
            How to Use
          </p>
          <h1 className="mb-6 font-serif text-6xl leading-tight">
            From invite to catalog.
          </h1>
          <p className="text-base leading-relaxed text-stone-600">
            Artemis is designed to be straightforward. Here is the full flow,
            from receiving an invite to managing your profile and request work.
          </p>
        </header>

        <div className="max-w-3xl">
          {HOW_TO_USE_STEPS.map((step) => (
            <div
              key={step.number}
              className="grid grid-cols-[64px_1fr] gap-8 border-b border-stone-200 py-10"
            >
              <p className="pt-1 font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent)]">
                {step.number}
              </p>
              <div>
                <h2 className="mb-3 font-serif text-2xl">{step.title}</h2>
                <p className="mb-2 text-sm leading-relaxed text-stone-700">
                  {step.description}
                </p>
                {step.detail ? (
                  <p className="text-sm leading-relaxed text-stone-500">
                    {step.detail}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-xl border border-stone-200 p-8">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Ready?
          </p>
          <p className="mb-4 font-serif text-2xl">Get access to the beta.</p>
          <div className="flex gap-3">
            <Link
              to="/"
              className="border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm text-stone-50 transition-colors hover:bg-stone-700"
            >
              {"Enter whitelist ->"}
            </Link>
            <Link
              to="/"
              className="border border-stone-900 px-5 py-2.5 text-sm text-stone-900 transition-colors hover:bg-stone-100"
            >
              Join waitlist
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
