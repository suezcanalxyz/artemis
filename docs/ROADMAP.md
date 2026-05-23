# ARTEMIS Roadmap to Live Platform

## Phase A — Stabilize development workflow

Goal:

- reduce repeated Codex context
- create repo instructions
- create session orchestrator
- create handoff files
- clean scripts
- clean ignored files
- stabilize tests

Deliverables:

- `AGENTS.md`
- `ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md`
- `docs/ROADMAP.md`
- `scripts/session-orchestrator/`
- `HANDOFF.md`
- `NEXT_CODEX_PROMPT.md`
- stable `package.json` scripts

## Phase B — Production foundations

Goal:

- make the app deployable
- ensure config is clean
- Docker production build
- database migration flow
- backup/restore
- health/readiness
- persistent volumes

Deliverables:

- `Dockerfile`
- `docker-compose.prod.yml`
- `.env.production.example`
- `scripts/deploy/check-env.ts`
- `scripts/deploy/backup-db.sh`
- `scripts/deploy/restore-db.sh`
- `scripts/deploy/smoke-test.sh`
- `/api/health`
- `/api/ready`

## Phase C — Rich profile system

Goal:

- detailed profile questionnaire
- profile kind customization
- profile intelligence
- language intelligence
- strategic preferences
- privacy profile

## Phase D — Archive and file intelligence

Goal:

- support multiple file types
- classify files
- extract safe text where possible
- attach files to requests, profiles, artworks, dossiers

## Phase E — Requests and tools

Goal:

- make requests powerful and profile-aware
- create tool marketplace
- implement production mapper
- implement technical system advisor
- implement portfolio review
- implement application readiness
- implement networking brief

## Phase F — Public outputs

Goal:

- generate public and semi-private presentation links
- public profiles
- viewing rooms
- HTML dossiers
- website templates

## Phase G — Radar and opportunities

Goal:

- source-based calls, funding, news, competitors, references
- weekly digest API
- no fake data
- no uncontrolled scraping

## Phase H — Expert board and model strategy

Goal:

- build the professional knowledge layer
- collect expert rubrics
- collect evaluations
- define permissioned training examples
- no fine-tuning yet

## Phase I — Ollama local assistant

Goal:

- local assistant using profile context and sources
- optional Ollama
- deterministic fallback
- source-grounded outputs

## Phase J — Connections

Goal:

- ethical matchmaking
- artists to curators
- artists to galleries
- galleries to artists
- journalists to projects
- collectors to artists
- institutions to projects

## Phase K — Domain publishing and deploy

Goal:

- Cargo-like publishing
- profile subdomains
- custom domains
- SSL
- live VPS deployment

## Phase L — Payment activation

Goal:

- activate one paid plan only when product is usable

Deliverables:

- Lemon Squeezy integration
- checkout
- webhook
- billing portal
- subscription status
- no complex tier model yet
