import { Link } from "@tanstack/react-router";
import { LandingFooter } from "../components/landing-footer";
import { LandingNav } from "../components/landing-nav";
import { LandingProjectCard } from "../components/landing-project-card";
import { PROJECT_CARDS, PROJECT_TICKER_WORDS } from "../lib/landing-content";
import { useParallax, useReveal } from "../lib/landing-hooks";

export function LandingProjectPage() {
  const heroParallax = useParallax<HTMLDivElement>(0.18);
  const introReveal = useReveal<HTMLDivElement>();
  const quoteReveal = useReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="grain-overlay" />
      <LandingNav />

      <section className="relative flex min-h-[70vh] items-end overflow-hidden px-[clamp(2rem,6vw,5rem)] pb-[clamp(3rem,6vw,5rem)]">
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-[55%]"
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, rgba(125,31,31,0.04) 100%)"
          }}
        />
        <div ref={heroParallax} className="max-w-4xl">
          <p
            className="mb-8 font-mono text-[10px] uppercase tracking-[0.45em] text-[var(--accent)]"
            style={{
              animation: "fade-up 0.9s cubic-bezier(0.2,0,0,1) 0.1s both"
            }}
          >
            Project
          </p>
          <h1
            className="font-serif leading-[0.9] text-[var(--fg)]"
            style={{
              fontSize: "clamp(3.5rem, 9vw, 10rem)",
              letterSpacing: "-0.025em",
              animation: "fade-up 0.9s cubic-bezier(0.2,0,0,1) 0.2s both"
            }}
          >
            A different
            <br />
            <em>kind</em> of archive.
          </h1>
        </div>
      </section>

      <div className="overflow-hidden border-y border-stone-200 bg-white py-[14px]">
        <div className="ticker-track">
          {PROJECT_TICKER_WORDS.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="font-mono whitespace-nowrap px-5 text-[11px] uppercase tracking-[0.2em]"
              style={{
                color: index % 2 === 1 ? "var(--accent)" : "var(--fg)"
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12">
        <div
          ref={introReveal}
          className="reveal mb-[clamp(3rem,6vw,6rem)] max-w-2xl"
        >
          <p className="text-[1.05rem] leading-relaxed text-stone-600">
            Artemis started from a simple frustration: artists deserve a space
            that takes their work as seriously as they do. Existing platforms
            behave like landlords. You pay with your data, your attention, and
            your independence.
          </p>
        </div>

        <div className="grid gap-px bg-stone-200 md:grid-cols-2">
          {PROJECT_CARDS.map((card, index) => (
            <LandingProjectCard
              key={card.index}
              delay={index}
              index={card.index}
              paragraphs={[...card.paragraphs]}
              pills={card.pills}
              title={card.title}
            >
              {card.index === "04 - When" ? (
                <div className="mt-4 flex gap-4">
                  <Link
                    to="/"
                    className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)] underline underline-offset-4 transition-colors hover:text-[var(--fg)]"
                  >
                    {"Get access ->"}
                  </Link>
                  <Link
                    to="/collaborate"
                    className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 underline underline-offset-4 transition-colors hover:text-[var(--fg)]"
                  >
                    {"Collaborate ->"}
                  </Link>
                </div>
              ) : null}
            </LandingProjectCard>
          ))}
        </div>

        <div
          ref={quoteReveal}
          className="reveal mt-24 max-w-2xl border-l-2 pl-8"
          style={{ borderColor: "var(--accent)" }}
        >
          <p
            className="font-serif leading-tight text-[var(--fg)]"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)" }}
          >
            "Your work deserves infrastructure that takes ownership as seriously
            as you do."
          </p>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
