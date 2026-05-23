# ARTEMIS Handoff

## Reason

phase-f-landing-complete

## Current milestone

phase-f public landing slice

## Current subtask

Private beta entry flow with waitlist, whitelist, collaborator intake, and landing navigation

## Branch

main

## Last commit

`7dcac72 feat: add private beta landing flow`

## Completed in this session

- added a public landing structure with routes for `/`, `/project`, `/how-to-use`, `/collaborate`, and `/login`
- added invite-only beta entry flow with whitelist code exchange and invite token consumption
- added waitlist and collaborator intake API endpoints backed by PostgreSQL
- added confirmation email templates for waitlist and collaborator submissions
- changed workspace root routing so authenticated app users live under `/artworks`
- updated internal app navigation to avoid sending users back to the public landing by mistake
- added API coverage for waitlist, collaborator intake, whitelist token issuance, and invalid invite rejection
- rebuilt and smoke-tested the production-like stack on `http://localhost:3010`

## Changed files

- `README.md`
- `migrations/012_public_landing.sql`
- `src/app.ts`
- `src/routes/auth.ts`
- `src/routes/landing.ts`
- `src/services/authService.ts`
- `src/services/emailService.ts`
- `src/web/src/router.tsx`
- `src/web/src/styles/globals.css`
- `src/web/src/components/landing-*`
- `src/web/src/lib/landing-*`
- `src/web/src/routes/landing-*`
- `src/web/src/routes/artworks.$id.tsx`
- `src/web/src/routes/domains.tsx`
- `src/web/src/routes/index.tsx`
- `src/web/src/routes/knowledge.tsx`
- `src/web/src/routes/login.tsx`
- `src/web/src/routes/onboarding.tsx`
- `src/web/src/routes/opportunities.tsx`
- `src/web/src/routes/profile.tsx`
- `src/web/src/routes/requests.tsx`
- `tests/api.test.ts`
- `tests/setup.ts`

## Commands run

- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd run test:api`
- `git push origin main`
- `$env:HOST_PORT='3010'; docker compose -p artemis-prod -f docker-compose.prod.yml up -d --build`
- `$env:APP_URL='http://localhost:3010'; npm.cmd run deploy:smoke`
- `docker compose -p artemis-prod -f docker-compose.prod.yml ps`

## Passing checks

- `typecheck`
- `build`
- `test:api`
- deploy smoke at `http://localhost:3010`

## Deployment status

- `artemis-prod-app-1` healthy on `3010`
- `artemis-prod-postgres-1` healthy
- `artemis-prod-redis-1` healthy

## Known issues

- `src/services/requestDraftService.ts` and a few older app routes still exceed the `220` line target from `AGENTS.md`
- there is still no public profile/dossier output layer yet; the new landing is public, but artist-facing public pages are still a later Phase F slice

## Next task

Continue Phase F by turning saved profile and artwork data into a first public output surface:

- public profile page per artist
- controlled public artworks selection
- first presentation/dossier page
- keep it source-bound and consistent with the invite-only landing

## Safety note

This handoff does not bypass Codex/OpenAI usage limits. Resume manually when usage is available.
