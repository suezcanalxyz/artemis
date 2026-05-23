You are continuing development of ARTEMIS.

Read first:

- `AGENTS.md`
- `ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md`
- `docs/ROADMAP.md`
- `HANDOFF.md`
- `NEXT_CODEX_PROMPT.md`

Use repository state as the source of truth.

Current milestone:

- `phase-f public landing slice complete`

Current state already completed:

- public landing routes exist at `/`, `/project`, `/how-to-use`, `/collaborate`, `/login`
- waitlist, whitelist exchange, and collaborator intake exist under `/api/landing`
- registration is invite-only outside test mode
- landing confirmation emails exist in `src/services/emailService.ts`
- authenticated workspace root is now `/artworks`
- latest pushed commit: `7dcac72 feat: add private beta landing flow`
- deploy smoke passed on `http://localhost:3010`

Next vertical slice:

1. Audit only:
   - `src/web/src/routes/profile.tsx`
   - `src/web/src/routes/index.tsx`
   - public landing and routing files only if needed
2. Continue Phase F with the first real public output:
   - public artist profile route
   - curated public artworks selection
   - first dossier/presentation page structure
3. Keep the system invite-only:
   - landing remains public
   - workspace remains authenticated
   - public outputs must expose only intentionally public records
4. Prefer small modules:
   - do not grow already-large files
   - extract helpers/components where needed
5. Re-run:
   - `npm.cmd run typecheck`
   - `npm.cmd run test:api`
   - `npm.cmd run build`
   - `$env:APP_URL='http://localhost:3010'; npm.cmd run deploy:smoke`

Constraints:

- no fake real-world data
- no uncontrolled scraping
- no committed `.env`, uploads, or logs
- use `apply_patch` for edits
- keep outputs provenance-bound and honest
