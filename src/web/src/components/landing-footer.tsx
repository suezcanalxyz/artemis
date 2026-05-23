import { Link } from "@tanstack/react-router";

export function LandingFooter() {
  return (
    <footer className="border-t border-stone-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-400">
          Artemis - 2026
        </p>
        <Link
          to="/login"
          className="text-xs text-stone-400 underline transition-colors hover:text-stone-700"
        >
          Platform login
        </Link>
      </div>
    </footer>
  );
}
