import { Link } from "@tanstack/react-router";
import { LandingHomeAccess } from "../components/landing-home-access";

const LETTERS = "ARTEMIS".split("");
const BG = "#0c0a08";
const FG = "#f0ede8";

function LandingHeroWordmark() {
  return (
    <div className="overflow-hidden" aria-label="Artemis">
      <h1
        className="font-serif leading-none"
        style={{
          fontSize: "clamp(5rem, 16vw, 21rem)",
          letterSpacing: "-0.025em",
          fontStyle: "italic",
          color: FG
        }}
      >
        {LETTERS.map((letter, index) => (
          <span
            key={index}
            className="inline-block"
            style={{
              animation: `letter-up 0.85s cubic-bezier(0.2,0,0,1) ${index * 0.065}s both`
            }}
          >
            {letter}
          </span>
        ))}
      </h1>
    </div>
  );
}

export function LandingHomePage() {
  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: BG, color: FG }}
    >
      <div className="grain-overlay" />
      <div
        className="pointer-events-none absolute -right-[4%] -top-[8%]"
        style={{
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle, rgba(125,31,31,0.22) 0%, transparent 68%)",
          filter: "blur(70px)",
          animation: "orb-drift 18s ease-in-out infinite"
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-[18%] -left-[12%]"
        style={{
          width: 550,
          height: 550,
          background:
            "radial-gradient(circle, rgba(55,12,12,0.45) 0%, transparent 65%)",
          filter: "blur(90px)",
          animation: "orb-drift 22s ease-in-out infinite reverse"
        }}
      />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-14">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.45em]"
          style={{ color: `${FG}99` }}
        >
          Artemis
        </span>
        <div className="flex items-center gap-5">
          <Link
            to="/project"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white/90"
          >
            Project
          </Link>
          <Link
            to="/how-to-use"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white/90"
          >
            How to use
          </Link>
          <Link
            to="/collaborate"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white/90"
          >
            Collaborate
          </Link>
          <Link
            to="/login"
            className="border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 transition-colors hover:border-white/50 hover:text-white"
            style={{ borderColor: `${FG}18` }}
          >
            {"Login ->"}
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-8 pb-24 md:px-14 lg:px-20">
        <LandingHeroWordmark />
        <div
          className="mb-7 mt-5 h-px max-w-xs"
          style={{
            background: FG,
            opacity: 0,
            transformOrigin: "left",
            animation:
              "line-grow 1.1s cubic-bezier(0.2,0,0,1) 0.65s forwards, fade-up 0s linear 0.65s forwards"
          }}
        />
        <p
          className="mb-9 font-mono text-[10px] uppercase tracking-[0.45em] text-white/35"
          style={{
            animation: "fade-up 0.8s cubic-bezier(0.2,0,0,1) 0.85s both"
          }}
        >
          Private beta - 2026
        </p>
        <p
          className="mb-10 max-w-2xl text-base leading-relaxed text-white/65"
          style={{
            animation: "fade-up 0.8s cubic-bezier(0.2,0,0,1) 0.92s both"
          }}
        >
          A composed workspace for artists: catalog, requests, profile context,
          domains, and source-grounded drafting without platform noise.
        </p>
        <LandingHomeAccess />
      </main>

      <div
        className="pointer-events-none absolute bottom-8 right-10 font-mono text-[9px] uppercase tracking-[0.35em] text-white/10"
        style={{ writingMode: "vertical-rl" }}
      >
        Artemis - Artist Workspace - 2026
      </div>
    </div>
  );
}
