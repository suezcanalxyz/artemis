import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "../lib/api";
import { authStore } from "../lib/auth";

type Role = "artist" | "gallery" | "collector" | "institution";
type Step = "role" | "plan" | "profile" | "done";

type PlanDef = {
  id: string;
  name: string;
  price: string;
  period: string;
  tag?: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const ROLES: { id: Role; label: string; sub: string; icon: string }[] = [
  {
    id: "artist",
    label: "Artist",
    sub: "Catalog your practice, manage works and media, and access opportunities.",
    icon: "[]"
  },
  {
    id: "gallery",
    label: "Gallery",
    sub: "Manage multiple artist profiles, exhibitions, and collector relations.",
    icon: "[ ]"
  },
  {
    id: "collector",
    label: "Collector",
    sub: "Track your collection and follow the artists and institutions you support.",
    icon: "()"
  },
  {
    id: "institution",
    label: "Institution",
    sub: "Run archive, research, and public access infrastructure for organisations.",
    icon: "[#]"
  }
];

const PLANS: Record<Role, PlanDef[]> = {
  artist: [
    {
      id: "artist_free",
      name: "Studio",
      price: "Free",
      period: "forever",
      features: [
        "Up to 10 artworks",
        "1 domain",
        "Basic catalog and media",
        "Visibility controls"
      ],
      cta: "Start free"
    },
    {
      id: "artist_pro",
      name: "Pro",
      price: "EUR15",
      period: "/ month",
      tag: "Most popular",
      highlight: true,
      features: [
        "Unlimited artworks",
        "3 custom domains",
        "10 AI requests / month",
        "Public portfolio site",
        "Client sharing"
      ],
      cta: "Start Pro"
    },
    {
      id: "artist_studio",
      name: "Studio+",
      price: "EUR35",
      period: "/ month",
      features: [
        "Everything in Pro",
        "10 domains",
        "50 AI requests / month",
        "Analytics dashboard",
        "Priority support"
      ],
      cta: "Start Studio+"
    }
  ],
  gallery: [
    {
      id: "gallery_essential",
      name: "Essential",
      price: "EUR79",
      period: "/ month",
      features: [
        "Up to 5 artist profiles",
        "2 domains",
        "Exhibition calendar",
        "20 AI requests / month"
      ],
      cta: "Start Essential"
    },
    {
      id: "gallery_professional",
      name: "Professional",
      price: "EUR149",
      period: "/ month",
      tag: "Most popular",
      highlight: true,
      features: [
        "Up to 20 artist profiles",
        "10 domains",
        "White-label portfolio",
        "CRM and collector notes",
        "100 AI requests / month",
        "Analytics"
      ],
      cta: "Start Professional"
    },
    {
      id: "gallery_institution",
      name: "Institution",
      price: "EUR349",
      period: "/ month",
      features: [
        "Unlimited artist profiles",
        "Unlimited domains",
        "Full API access",
        "Multi-venue support",
        "Dedicated onboarding"
      ],
      cta: "Contact sales"
    }
  ],
  collector: [
    {
      id: "collector_curator",
      name: "Curator",
      price: "EUR19",
      period: "/ month",
      features: [
        "Personal collection tracker",
        "Artwork valuations",
        "Artist notes and tags",
        "5 AI requests / month"
      ],
      cta: "Start Curator"
    },
    {
      id: "collector_patron",
      name: "Patron",
      price: "EUR49",
      period: "/ month",
      tag: "Most popular",
      highlight: true,
      features: [
        "Everything in Curator",
        "Portfolio valuation",
        "Market insights",
        "Early access to works",
        "Curated artist alerts",
        "20 AI requests / month"
      ],
      cta: "Start Patron"
    }
  ],
  institution: [
    {
      id: "institution_archive",
      name: "Archive",
      price: "EUR199",
      period: "/ month",
      features: [
        "Public archive",
        "5 domains",
        "Metadata export",
        "Embeddable widgets",
        "50 AI requests / month"
      ],
      cta: "Start Archive"
    },
    {
      id: "institution_enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "",
      tag: "Bespoke",
      highlight: true,
      features: [
        "Everything in Archive",
        "Unlimited domains and API",
        "Dedicated infrastructure",
        "SLA and compliance docs",
        "Full white-label"
      ],
      cta: "Contact us"
    }
  ]
};

const STEPS: Step[] = ["role", "plan", "profile", "done"];
const STEP_LABELS = ["Role", "Plan", "Profile", "Enter"];

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="mb-12 flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className="flex h-7 w-7 items-center justify-center font-mono text-xs transition-all duration-300"
            style={{
              border: `1px solid ${i <= idx ? "#7d1f1f" : "#333"}`,
              background: i < idx ? "#7d1f1f" : "transparent",
              color: i <= idx ? (i < idx ? "#faf8f4" : "#7d1f1f") : "#555"
            }}
          >
            {i < idx ? "OK" : i + 1}
          </div>
          <span
            className="ml-2 mr-4 hidden font-mono text-xs uppercase tracking-widest sm:block"
            style={{ color: i <= idx ? "#c8a8a8" : "#444" }}
          >
            {STEP_LABELS[i]}
          </span>
          {i < STEPS.length - 1 ? (
            <div
              className="mr-4 h-px w-8 transition-all duration-500"
              style={{ background: i < idx ? "#7d1f1f" : "#2a2a2a" }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RoleStep({
  selected,
  onSelect
}: {
  selected: Role | null;
  onSelect: (role: Role) => void;
}) {
  return (
    <div>
      <p
        className="mb-3 font-mono text-xs uppercase tracking-[0.2em]"
        style={{ color: "#7d1f1f" }}
      >
        Step 1 of 3
      </p>
      <h2 className="mb-2 font-serif text-4xl leading-tight md:text-5xl">
        Who are you
        <br />
        in the art world?
      </h2>
      <p className="mb-10 text-sm" style={{ color: "#888" }}>
        This shapes your workspace, feature access, and plan options.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ROLES.map((role) => {
          const isSelected = selected === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onSelect(role.id)}
              aria-label={`Select role ${role.label}`}
              className="group p-6 text-left transition-all duration-200"
              style={{
                border: `1px solid ${isSelected ? "#7d1f1f" : "#2a2a2a"}`,
                background: isSelected ? "rgba(125,31,31,0.08)" : "transparent",
                outline: "none"
              }}
              type="button"
            >
              <div
                className="mb-3 block font-mono text-2xl transition-colors"
                style={{ color: isSelected ? "#7d1f1f" : "#555" }}
              >
                {role.icon}
              </div>
              <div
                className="mb-1 font-serif text-xl transition-colors"
                style={{ color: isSelected ? "#faf8f4" : "#ccc" }}
              >
                {role.label}
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{ color: "#666" }}
              >
                {role.sub}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlanStep({
  role,
  selected,
  onSelect
}: {
  role: Role;
  selected: string | null;
  onSelect: (planId: string) => void;
}) {
  const plans = PLANS[role];
  const roleLabel = ROLES.find((entry) => entry.id === role)?.label ?? role;
  return (
    <div>
      <p
        className="mb-3 font-mono text-xs uppercase tracking-[0.2em]"
        style={{ color: "#7d1f1f" }}
      >
        Step 2 of 3 | {roleLabel}
      </p>
      <h2 className="mb-2 font-serif text-4xl leading-tight md:text-5xl">
        Choose your
        <br />
        plan.
      </h2>
      <p className="mb-10 text-sm" style={{ color: "#888" }}>
        You can change plans later without rebuilding the workspace.
      </p>
      <div
        className={`grid gap-4 ${
          plans.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              aria-label={`Select plan ${plan.name}`}
              className="relative p-6 text-left transition-all duration-200"
              style={{
                border: `1px solid ${isSelected ? "#7d1f1f" : plan.highlight ? "#3a2a2a" : "#2a2a2a"}`,
                background: isSelected
                  ? "rgba(125,31,31,0.1)"
                  : plan.highlight
                    ? "rgba(125,31,31,0.04)"
                    : "transparent",
                outline: "none"
              }}
              type="button"
            >
              {plan.tag ? (
                <div
                  className="absolute right-0 top-0 px-2 py-1 font-mono text-[10px] uppercase tracking-widest"
                  style={{ background: "#7d1f1f", color: "#faf8f4" }}
                >
                  {plan.tag}
                </div>
              ) : null}
              <div
                className="mb-1 font-serif text-lg"
                style={{ color: isSelected ? "#faf8f4" : "#ccc" }}
              >
                {plan.name}
              </div>
              <div className="mb-4 flex items-baseline gap-1">
                <span
                  className="font-mono text-2xl"
                  style={{ color: isSelected ? "#c8a8a8" : "#777" }}
                >
                  {plan.price}
                </span>
                <span className="text-xs" style={{ color: "#555" }}>
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs"
                    style={{ color: "#888" }}
                  >
                    <span style={{ color: "#7d1f1f", flexShrink: 0 }}>-</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div
                className="mt-5 font-mono text-xs uppercase tracking-widest"
                style={{ color: isSelected ? "#7d1f1f" : "#555" }}
              >
                {plan.cta} {isSelected ? "[selected]" : "->"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProfileStep({
  values,
  onChange
}: {
  values: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
  };
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <p
        className="mb-3 font-mono text-xs uppercase tracking-[0.2em]"
        style={{ color: "#7d1f1f" }}
      >
        Step 3 of 3
      </p>
      <h2 className="mb-2 font-serif text-4xl leading-tight md:text-5xl">
        Set up
        <br />
        your profile.
      </h2>
      <p className="mb-10 text-sm" style={{ color: "#888" }}>
        These fields are optional and can be updated later.
      </p>
      <div className="max-w-md space-y-5">
        {[
          {
            key: "displayName",
            label: "Display name",
            placeholder: "How you appear publicly"
          },
          { key: "location", label: "Location", placeholder: "City, country" },
          {
            key: "website",
            label: "Website",
            placeholder: "https://your-site.com"
          }
        ].map((field) => (
          <label key={field.key} className="block space-y-1.5">
            <span
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: "#777" }}
            >
              {field.label}
            </span>
            <input
              type="text"
              value={values[field.key as keyof typeof values]}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                border: "1px solid #2a2a2a",
                color: "#e8e0d8",
                caretColor: "#7d1f1f"
              }}
              onFocus={(event) => {
                event.target.style.borderColor = "#7d1f1f";
              }}
              onBlur={(event) => {
                event.target.style.borderColor = "#2a2a2a";
              }}
            />
          </label>
        ))}
        <label className="block space-y-1.5">
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: "#777" }}
          >
            Bio
          </span>
          <textarea
            rows={3}
            value={values.bio}
            onChange={(event) => onChange("bio", event.target.value)}
            placeholder="A short description of your practice or organisation"
            className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              border: "1px solid #2a2a2a",
              color: "#e8e0d8",
              caretColor: "#7d1f1f"
            }}
            onFocus={(event) => {
              event.target.style.borderColor = "#7d1f1f";
            }}
            onBlur={(event) => {
              event.target.style.borderColor = "#2a2a2a";
            }}
          />
        </label>
      </div>
    </div>
  );
}

function DoneStep({ role, plan }: { role: Role; plan: string }) {
  const roleLabel = ROLES.find((entry) => entry.id === role)?.label ?? role;
  const planDef = PLANS[role].find((entry) => entry.id === plan);
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <div
        className="mb-6 block font-mono text-5xl"
        style={{ color: "#7d1f1f" }}
      >
        []
      </div>
      <h2 className="mb-4 font-serif text-4xl leading-tight md:text-5xl">
        Welcome to
        <br />
        Artemis.
      </h2>
      <p className="mb-2 text-sm" style={{ color: "#888" }}>
        You are set up as <span style={{ color: "#c8a8a8" }}>{roleLabel}</span>
        {planDef ? (
          <>
            {" "}
            on the <span style={{ color: "#c8a8a8" }}>{planDef.name}</span>{" "}
            plan.
          </>
        ) : null}
      </p>
      <p className="font-mono text-xs" style={{ color: "#555" }}>
        Custody intact.
      </p>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    location: "",
    website: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleProfileChange(key: string, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    if (!selectedRole || !selectedPlan) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/api/onboarding/complete", {
        role: selectedRole,
        plan: selectedPlan,
        ...profile
      });
      authStore.updateUser({
        onboardingCompleted: true,
        role: selectedRole,
        plan: selectedPlan
      });
      setStep("done");
      window.setTimeout(() => {
        void navigate({ to: "/" });
      }, 2000);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  function canAdvance() {
    if (step === "role") return selectedRole !== null;
    if (step === "plan") return selectedPlan !== null;
    if (step === "profile") return true;
    return false;
  }

  function advance() {
    if (step === "role") {
      setSelectedPlan(null);
      setStep("plan");
      return;
    }
    if (step === "plan") {
      setStep("profile");
      return;
    }
    if (step === "profile") {
      void handleSubmit();
    }
  }

  function back() {
    if (step === "plan") setStep("role");
    if (step === "profile") setStep("plan");
  }

  const isDone = step === "done";

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ background: "#0c0b0a", color: "#e8e0d8" }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "128px"
        }}
      />

      <header className="flex items-center justify-between px-8 pb-4 pt-8">
        <span
          className="font-mono text-xs uppercase tracking-[0.25em]"
          style={{ color: "#7d1f1f" }}
        >
          Artemis
        </span>
        {!isDone ? (
          <span className="font-mono text-xs" style={{ color: "#444" }}>
            {STEPS.indexOf(step) + 1} / 3
          </span>
        ) : null}
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          {!isDone ? <StepBar current={step} /> : null}

          {step === "role" ? (
            <RoleStep selected={selectedRole} onSelect={setSelectedRole} />
          ) : null}
          {step === "plan" && selectedRole ? (
            <PlanStep
              role={selectedRole}
              selected={selectedPlan}
              onSelect={setSelectedPlan}
            />
          ) : null}
          {step === "profile" ? (
            <ProfileStep values={profile} onChange={handleProfileChange} />
          ) : null}
          {step === "done" && selectedRole && selectedPlan ? (
            <DoneStep role={selectedRole} plan={selectedPlan} />
          ) : null}

          {error ? (
            <p className="mt-4 font-mono text-sm" style={{ color: "#c05050" }}>
              {error}
            </p>
          ) : null}

          {!isDone ? (
            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={back}
                className="px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors"
                style={{
                  color: step === "role" ? "transparent" : "#555",
                  pointerEvents: step === "role" ? "none" : "auto",
                  border: "1px solid transparent"
                }}
                onMouseEnter={(event) => {
                  if (step !== "role")
                    (event.target as HTMLElement).style.color = "#888";
                }}
                onMouseLeave={(event) => {
                  if (step !== "role")
                    (event.target as HTMLElement).style.color = "#555";
                }}
                type="button"
              >
                {"<-"} Back
              </button>

              <button
                onClick={advance}
                disabled={!canAdvance() || loading}
                className="px-8 py-2.5 font-mono text-xs uppercase tracking-widest transition-all duration-200"
                style={{
                  background: canAdvance() && !loading ? "#7d1f1f" : "#1e1414",
                  color: canAdvance() && !loading ? "#faf8f4" : "#4a3535",
                  border: "1px solid transparent",
                  cursor: canAdvance() && !loading ? "pointer" : "not-allowed"
                }}
                type="button"
              >
                {loading
                  ? "Saving..."
                  : step === "profile"
                    ? "Enter workspace ->"
                    : "Continue ->"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="px-8 py-6 text-center">
        <span className="font-mono text-xs" style={{ color: "#333" }}>
          Catalog your practice with custody intact.
        </span>
      </footer>
    </main>
  );
}
