You are continuing development of ARTEMIS.

Read first:

- `AGENTS.md`
- `ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md`
- `docs/ROADMAP.md`
- `HANDOFF.md`
- `NEXT_CODEX_PROMPT.md`

Use the repository as source of truth. Do not restate the product vision.

Current milestone:

- `phase-c / phase-e bridge`

Current state already completed:

- richer profile questionnaire persisted in the backend
- profile-aware deterministic draft generation in `src/services/requestDraftService.ts`
- dedicated frontend profile editor at `/profile`
- shared questionnaire component and payload helpers
- tests, build, and deploy smoke passed
- latest pushed commit: `75e0c9f feat: make profiles editable and request-aware`

Next vertical slice:

1. Audit only:
   - `src/web/src/routes/requests.$id.tsx`
   - `src/services/requestDraftService.ts`
   - any new small UI helpers you introduce
2. Make `profile_context` a first-class section in the request detail UI:
   - summarize display name, focus, languages, goals, collaboration interests, privacy
   - separate it visually from generic generated output
   - keep provenance and confidence visible
3. Reduce file bloat where practical:
   - avoid making `requests.$id.tsx` or `requestDraftService.ts` larger
   - prefer extracting compact helper components/functions
4. Re-run:
   - `npm.cmd run typecheck`
   - `npm.cmd run test:api`
   - `npm.cmd run build`
   - `APP_URL=http://localhost:3010 npm.cmd run deploy:smoke`

Constraints:

- no fake real-world data
- no uncontrolled scraping
- keep changes vertical and production-verifiable
- use `apply_patch` for edits
- do not commit `.env`, uploads, logs, or generated artifacts
