# ARTEMIS — Codex Token Optimization & Full Deployment Workflow

## Purpose

This document defines the operating workflow for developing ARTEMIS with Codex while reducing duplicated calls, avoiding repeated context explanations, and moving session by session toward a live production platform.

It should be placed in the root of the ARTEMIS repository and treated as a permanent development protocol.

---

# 1. Core principle

Codex credits/tokens should be used for implementation, not for repeatedly re-explaining the project.

Every session should start from persistent local context:

1. `AGENTS.md`
2. `ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md`
3. `docs/ROADMAP.md`
4. `HANDOFF.md`
5. `NEXT_CODEX_PROMPT.md`
6. current repository state
7. existing tests and scripts

The developer should not paste the full product vision every time.

---

# 2. Safe session continuity

The project can include a local session orchestrator.

Allowed:

- write handoff summaries
- write next prompts
- run git status
- list changed files
- record manual usage notes
- remind the user to resume later

Not allowed:

- bypass usage limits
- automate login
- scrape Codex UI
- restart Codex automatically
- use hidden credentials
- perform paid actions

---

# 3. Token-saving strategy

## 3.1 Use repository memory

Codex should read project files instead of receiving the full context every time.

## 3.2 Use patch batches

Each session should target one vertical slice:

- migration
- backend service
- routes
- frontend
- tests
- docs

## 3.3 Avoid repeated audits

Audit only the relevant files for the milestone.

## 3.4 Keep files small

Large files cost more tokens to read and patch.

Rules:

- split files above 220 lines
- keep services modular
- keep route files thin
- keep UI components focused

## 3.5 Use strict handoff

At the end of every session Codex must write:

- `HANDOFF.md`
- `NEXT_CODEX_PROMPT.md`

---

# 4. Target platform

ARTEMIS is a Contemporary Art Production, Intelligence and Network OS.

It supports:

- artists
- galleries
- collectors
- curators
- journalists and critics
- archives
- foundations
- project spaces
- cultural NGOs
- studios
- estates
- producers
- institutions

Core product areas:

- rich customizable profiles
- deep profile questionnaire
- profile intelligence
- language intelligence
- file and archive intelligence
- public dossiers and presentation links
- website/public profile publishing
- call and funding intelligence
- strategic radar
- production intelligence
- tool marketplace
- technical rider builder
- project production mapper
- application support
- portfolio review
- networking and connection intelligence
- expert board model
- Ollama local assistant
- source-grounded outputs
- deployment on VPS

Business model for now:

- one plan only: `professional_workspace`
- profile kind customizes the workspace
- no complex tier billing until the platform is stable
- optional future limits centralized in `src/lib/planLimits.ts`

---

# 5. Recommended stack

## Application

- Node.js 20 LTS
- TypeScript strict
- Express 4
- PostgreSQL 16
- Redis
- BullMQ
- React 19
- Vite
- TanStack Router
- TanStack Query
- Tailwind
- Zod
- React Hook Form
- Pino
- Argon2
- JWT
- Multer
- file-type
- sharp

## AI

- Ollama optional local provider
- OpenAI-compatible provider abstraction later
- deterministic generation must remain available
- AI output must always be source-grounded
- no fake opportunities, news, contacts or claims

## Deploy

Preferred v1:

- Aruba VPS
- Docker Compose
- Coolify if useful as deployment manager
- Caddy or Traefik reverse proxy
- Postgres volume
- Redis volume
- uploads volume
- Resend for email
- UptimeRobot for health checks
- Sentry for error monitoring
- Lemon Squeezy later

---

# 6. Patch batching rules

Every Codex session should operate with one of these patch types:

## Patch type 1 — Repo workflow patch

Use for:

- AGENTS.md
- scripts
- docs
- handoff
- tests
- package scripts

## Patch type 2 — Database vertical patch

Use for:

- migrations
- services
- routes
- tests
- minimal UI if needed

## Patch type 3 — UI vertical patch

Use for:

- route
- components
- API client
- form validation
- empty/loading/error states
- Playwright test

## Patch type 4 — Deploy patch

Use for:

- Docker
- env examples
- health/readiness
- backup/restore
- smoke test
- docs

## Patch type 5 — Hardening patch

Use for:

- lint
- typecheck
- test fixes
- security
- refactor oversized files
- remove duplicates

---

# 7. Session prompt template

Use this at the start of each Codex session:

```text
You are continuing development of ARTEMIS.

First read:
- AGENTS.md
- ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md
- docs/ROADMAP.md
- HANDOFF.md if present
- NEXT_CODEX_PROMPT.md if present

Do not re-explain the whole product. Use those files as project memory.

Current goal:
[INSERT MILESTONE OR SUBTASK]

Operating rules:
- Keep planning short.
- Audit only relevant files.
- Implement immediately after the plan.
- Work in vertical slices.
- Do not create fake real-world data.
- Do not scrape uncontrolled sources.
- Do not commit .env, node_modules, uploads, logs or test results.
- No file should exceed 220 lines.
- Every new feature must include validation, tests and docs where relevant.
- If context/credits are running low, stop implementation and write HANDOFF.md and NEXT_CODEX_PROMPT.md.

Expected output:
1. Short audit
2. Short plan
3. Implementation
4. Tests/checks
5. Handoff update
6. Next prompt
```

---

# 8. Deployment checklist

Before live deployment:

- `.env` not committed
- `node_modules` not committed
- uploads not committed
- test outputs not committed
- logs not committed
- `AGENTS.md` present
- `HANDOFF.md` present
- `NEXT_CODEX_PROMPT.md` present
- docs updated
- `npm install` works
- `npm run typecheck` passes
- `npm run lint` passes
- API tests pass
- E2E tests pass
- production Docker build passes
- migrations run cleanly
- backup script works
- restore script tested locally
- `/api/health` returns ok
- `/api/ready` checks DB/Redis
- app restarts cleanly
- logs are structured
- uploads persist
- database persists
- public profile works
- public dossier works
- unpublished pages are hidden
- no private data leaks
