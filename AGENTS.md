# AGENTS.md — ARTEMIS Development Instructions

## Product

ARTEMIS is a Contemporary Art Production, Intelligence and Network OS for artists, galleries, collectors, curators, journalists, archives, foundations, cultural NGOs, studios, estates, producers and institutions.

It combines:

- rich professional profiles
- deep profile questionnaire
- profile intelligence
- language intelligence
- archive and portfolio management
- file intelligence
- public dossiers and presentation links
- website/public profile publishing
- opportunity and funding intelligence
- strategic radar
- production intelligence
- tool marketplace
- portfolio review
- application support
- technical rider generation
- connection intelligence
- expert board model
- optional Ollama local assistant

## Business model

Use one plan for now:

`professional_workspace`

Do not implement complex tier pricing unless explicitly requested.

Profile kind customizes the workspace. Pricing does not.

## Engineering rules

- TypeScript strict
- Zod validation for every input
- parameterized SQL only
- no `console.log`; use pino
- no file over 220 lines
- no fake real-world data
- no fake calls, news, competitors, people, galleries, collectors or funding
- no unsafe technical instructions
- no uncontrolled scraping
- no Cloudflare
- no committed `.env`
- no committed `node_modules`
- no committed uploads, logs or test results
- every generated output must include sources, assumptions, missing information and confidence level

## UX direction

Editorial, professional, archival.

Avoid SaaS hype.

Use language such as:

- profile
- dossier
- archive
- request
- source
- evidence
- production plan
- technical document
- portfolio review
- application
- public profile
- presentation link
- connection brief

Avoid:

- empower
- unlock
- magic
- seamless
- growth hack
- generic AI assistant hype

## Session protocol

Before implementation:

1. Read `ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md`
2. Read `docs/ROADMAP.md`
3. Read `HANDOFF.md` if present
4. Read `NEXT_CODEX_PROMPT.md` if present
5. Audit only files relevant to the current milestone
6. Make a short plan
7. Implement immediately

At session end:

1. Run relevant checks
2. Write `HANDOFF.md`
3. Write `NEXT_CODEX_PROMPT.md`
4. Report changed files, tests and known issues

## Safety

Do not build scripts that bypass Codex/OpenAI usage limits.

Allowed:

- local session handoff
- repo audit
- changed file summary
- next prompt generation
- deployment checklist generation

Not allowed:

- automated login
- UI scraping to detect hidden usage limits
- automatic restart designed to evade limits
- credential automation
- unattended paid actions
- destructive database operations without confirmation
