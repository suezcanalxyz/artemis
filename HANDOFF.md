# ARTEMIS Handoff

## Reason

phase-c-e-progress

## Current milestone

phase-c / phase-e bridge

## Current subtask

Profile-aware request workflow and reusable questionnaire editor

## Branch

main

## Last commit

`75e0c9f feat: make profiles editable and request-aware`

## Completed in this session

- made deterministic request drafts consume stored profile context
- added a dedicated `/profile` route for editing the questionnaire after onboarding
- extracted shared questionnaire logic into reusable frontend modules
- updated onboarding to reuse the shared questionnaire form
- added profile navigation from catalog and request surfaces
- verified prod-like health after push

## Changed files

- `README.md`
- `src/services/requestDraftService.ts`
- `src/web/src/components/profile-questionnaire-form.tsx`
- `src/web/src/lib/profileQuestionnaire.ts`
- `src/web/src/router.tsx`
- `src/web/src/routes/index.tsx`
- `src/web/src/routes/onboarding.tsx`
- `src/web/src/routes/profile.tsx`
- `src/web/src/routes/requests.$id.tsx`
- `src/web/src/routes/requests.tsx`
- `tests/api.test.ts`

## Commands run

- `npm.cmd run typecheck`
- `npm.cmd run test:api`
- `npm.cmd run build`
- `git push origin main`
- `docker compose -p artemis-prod -f docker-compose.prod.yml ps`
- `APP_URL=http://localhost:3010 npm.cmd run deploy:smoke`

## Passing checks

- `typecheck`
- `test:api`
- `build`
- deploy smoke at `http://localhost:3010`

## Deployment status

- `artemis-prod-app-1` healthy on host port `3010`
- `artemis-prod-postgres-1` healthy
- `artemis-prod-redis-1` healthy

## Known issues

- large legacy files still exceed the `220` line target from `AGENTS.md`, especially `src/web/src/routes/onboarding.tsx`, `src/web/src/routes/requests.$id.tsx`, and `src/services/requestDraftService.ts`
- the compose rebuild command exceeded terminal timeout once, but the running stack stayed healthy and smoke passed afterward

## Next task

Continue Phase E by turning the generated `profile_context` into first-class UI on request detail instead of only generic object rendering, then split oversized request/profile files into smaller modules.

## Safety note

This handoff does not bypass Codex/OpenAI usage limits. Resume manually when usage is available.
