import { Link } from "@tanstack/react-router";

export function LandingNav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-stone-200 bg-[var(--bg)]"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)"
      }}
    >
      <div
        className="mx-auto flex items-center justify-between px-8 md:px-12"
        style={{ height: 56 }}
      >
        <Link
          to="/"
          className="font-mono transition-colors"
          style={{
            fontSize: 10,
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "var(--fg)"
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = "var(--fg)";
          }}
        >
          Artemis
        </Link>

        <div className="flex items-center gap-6">
          {[
            { label: "Project", to: "/project" },
            { label: "How to Use", to: "/how-to-use" },
            { label: "Collaborate", to: "/collaborate" }
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="hidden font-mono transition-colors md:inline"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#999"
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color = "var(--fg)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color = "#999";
              }}
            >
              {label}
            </Link>
          ))}

          <Link
            to="/login"
            className="font-mono transition-all"
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "1px solid #ccc",
              padding: "6px 14px",
              color: "#666"
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = "var(--fg)";
              event.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = "#ccc";
              event.currentTarget.style.color = "#666";
            }}
          >
            {"Platform ->"}
          </Link>
        </div>
      </div>
    </nav>
  );
}
