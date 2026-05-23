export const PROJECT_TICKER_WORDS = [
  "Custody",
  "-",
  "Practice",
  "-",
  "Archive",
  "-",
  "Identity",
  "-",
  "Metadata",
  "-",
  "Ownership",
  "-",
  "No Lock-in",
  "-",
  "Your Domain",
  "-",
  "Custody",
  "-",
  "Practice",
  "-",
  "Archive",
  "-",
  "Identity",
  "-",
  "Metadata",
  "-",
  "Ownership",
  "-",
  "No Lock-in",
  "-",
  "Your Domain",
  "-"
];

export const PROJECT_CARDS = [
  {
    index: "01 - Why",
    title: "Platform noise kills context.",
    pills: ["Portability", "Export"],
    paragraphs: [
      "When the platform dies or pivots, your catalog disappears, or worse, stays up in a form you cannot control. Artemis is designed around custody from day one.",
      "Your data is yours: structured, exportable, connected to your own domain, and portable at any time. No lock-in, no engagement loops."
    ]
  },
  {
    index: "02 - What",
    title: "A minimal workspace.",
    pills: ["Artworks", "Media", "Metadata"],
    paragraphs: [
      "At its core: a catalog. Title, year, medium, description. Upload images. Control visibility per work: private, shared, or public.",
      "Layer on a custom domain, opportunity tracking, and collaborative requests. Nothing you do not need. No feed, no followers, no algorithmic interference."
    ]
  },
  {
    index: "03 - Where",
    title: "AI built on real practice.",
    pills: ["Model Training", "Consent-first"],
    paragraphs: [
      "The longer ambition is a model that understands artistic practice, not from scraped internet noise, but from structured, consented artist-contributed data.",
      "We want a system that can tell the difference between a sketch and a finished work, and help artists write about their practice in their own voice."
    ]
  },
  {
    index: "04 - When",
    title: "Private beta, 2026.",
    pills: ["Invite only"],
    paragraphs: [
      "Artemis is in private beta. A small group of artists use it, stress-test it, and tell us what is missing.",
      "Invitations are sent manually. If you do not have a code yet, join the waitlist or reach out directly."
    ]
  }
] as const;

export const HOW_TO_USE_STEPS = [
  {
    number: "01",
    title: "Request or receive an invite",
    description:
      "Artemis is currently in private beta. You will receive a unique invite code by email. Each code works once.",
    detail:
      "No code yet? Join the waitlist from the home page and we will reach out when a place opens."
  },
  {
    number: "02",
    title: "Enter your code and create an account",
    description:
      "On the landing page, enter your invite code. You will be taken directly to the registration form. Choose an email and password.",
    detail:
      "Your invite code is consumed on registration. It cannot be reused or shared."
  },
  {
    number: "03",
    title: "Complete your profile",
    description:
      "Tell us about your practice, your working languages, your goals, and how public your profile should be.",
    detail:
      "This profile context shapes your workspace and later feeds deterministic request drafting."
  },
  {
    number: "04",
    title: "Add works to your catalog",
    description:
      "Create artwork entries with title, year, medium, and a short description. Upload images as media assets.",
    detail:
      "Control visibility per work: private, shared with relationships, project-only, or fully public."
  },
  {
    number: "05",
    title: "Connect a custom domain",
    description:
      "Point a domain you own at Artemis and your catalog becomes available at your address.",
    detail:
      "The platform guides you through DNS configuration and verifies the connection automatically."
  },
  {
    number: "06",
    title: "Track opportunities and requests",
    description:
      "Log grants, residencies, commissions, and production requests with explicit source tracking.",
    detail:
      "Generated drafts stay tied to request input, verified opportunities, and saved profile context."
  }
] as const;

export const COLLABORATION_MODES = [
  {
    title: "Data contribution",
    description:
      "Annotate and structure your catalog data to help train the model."
  },
  {
    title: "Evaluation",
    description:
      "Test model outputs against your own practice and tell us where it fails."
  },
  {
    title: "Research partnership",
    description:
      "Co-author datasets, evaluate model behaviour, and help decide what gets built."
  }
] as const;
