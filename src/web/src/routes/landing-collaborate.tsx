import { LandingCollaboratorForm } from "../components/landing-collaborator-form";
import { LandingFooter } from "../components/landing-footer";
import { LandingNav } from "../components/landing-nav";
import { COLLABORATION_MODES } from "../lib/landing-content";

export function LandingCollaboratePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <LandingNav />

      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid max-w-5xl gap-16 md:grid-cols-2">
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.35em] text-[var(--accent)]">
              Collaborate
            </p>
            <h1 className="mb-6 font-serif text-5xl leading-tight">
              Help train a model that understands art.
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-stone-600">
              We are building an AI model grounded in real artistic practice,
              not scraped from the internet, but shaped with artists who choose
              to contribute.
            </p>
            <p className="mb-6 text-sm leading-relaxed text-stone-600">
              If you use Artemis, or want to, you can help shape what the model
              learns: how to describe a body of work, how to read a series, and
              how to write about process without flattening it.
            </p>
            <p className="mb-8 text-sm leading-relaxed text-stone-600">
              Tell us about your work and the kind of collaboration you have in
              mind. We will follow up directly.
            </p>

            <div className="space-y-4 border-l-2 border-stone-200 pl-4">
              {COLLABORATION_MODES.map((mode) => (
                <div key={mode.title}>
                  <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-stone-400">
                    {mode.title}
                  </p>
                  <p className="text-xs text-stone-500">{mode.description}</p>
                </div>
              ))}
            </div>
          </div>

          <LandingCollaboratorForm />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
