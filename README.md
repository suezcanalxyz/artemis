# Artemis

Artemis is a workspace for artists and studios that currently includes:

- M0 foundation: auth, profiles, basic app wiring, PostgreSQL, Redis, migrations
- M1 foundation layer: audit log
- M2 catalog: artworks, media, visibility, relationships, projects
- M3 publishing surface: subdomains, custom domains, verification, Caddy ask, health checks
- M4A vertical slice: Artist Operating Desk requests and deterministic placeholder opportunity ingestion
- M4B verified source intake: source registry, opportunity review states, verified opportunity attachment to requests
- Phase C foundation: richer onboarding profile questionnaire with strategic, language, collaboration, and privacy fields

Current primary routes:

- `/` catalog
- `/onboarding` role, plan, and profile setup
- `/artworks/:id` artwork detail
- `/domains` domain management
- `/requests` Artist Operating Desk
- `/opportunities` verified source intake and opportunity review

API surface now includes:

- `/api/auth`
- `/api/artworks`
- `/api/domains`
- `/api/artist-requests`
- `/api/opportunities`
- `/api/opportunity-sources`
- `/api/onboarding`

Setup:

```bash
cp .env.example .env
docker compose up --build
```

The production-style stack is served behind Caddy at `http://localhost:8088`. The app container runs migrations automatically before the server starts.

Local development against Docker PostgreSQL and Redis:

```bash
cp .env.example .env
docker compose up -d postgres redis
npm run migrate
npm run dev
```

If `localhost:3000` is already in use on your machine, keep the checked-in
database and Redis ports (`5433` and `6380`) and temporarily override only the
app port for that shell:

```powershell
$env:PORT='3010'
$env:APP_URL='http://localhost:3010'
$env:WEB_URL='http://localhost:5173'
npm run dev
```

Local production build without Docker:

```bash
npm run build
npm run start
```

Verification:

```bash
npm run typecheck
npm run test:api
npm run test:e2e
npm run deploy:check-env
npm run deploy:smoke
curl http://localhost:8088/health
```

Notes:

- `.env` is ignored and should stay local.
- `.env.production` is also ignored and should stay local.
- Uploads are ignored except for `uploads/.gitkeep`.
- Docker Desktop must be running before `docker compose up -d postgres redis`
  or `docker compose up --build`, otherwise migrations and app startup will fail
  with connection-refused errors against PostgreSQL and Redis.
- The production compose stack can be moved off port `3000` by setting
  `HOST_PORT`, for example `HOST_PORT=3010`.
- Opportunity refresh uses a manual seed adapter only. It creates clearly labeled test opportunities and does not scrape external websites.
- Draft generation is deterministic. It only uses request `structured_input`, stored opportunities, and explicit request provenance.
- Request types in this slice are `opportunity_research`, `funding_research`, `tech_rider`, `procedure`, `presentation`, and `website_update`.
- Verified opportunities can be attached to requests as explicit provenance.
- `docker compose up --build` now produces a production-style app container that serves the built frontend and backend from the same process behind Caddy.
- Onboarding status now persists richer profile questionnaire fields such as professional focus, practice areas, working languages, strategic goals, collaboration interests, and privacy mode.
