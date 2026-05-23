You are continuing development of ARTEMIS.

First read:

- AGENTS.md
- ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md
- docs/ROADMAP.md
- HANDOFF.md if present
- NEXT_CODEX_PROMPT.md if present

Do not re-explain the whole product. Use those files as project memory.

Current milestone:
phase-c

Current subtask:
Rich profile questionnaire foundation

Recent changed files:

- M README.md
- M src/routes/onboarding.ts
- M src/services/onboardingService.ts
- M tests/api.test.ts
- migrations/011_profile_questionnaire.sql

Operating rules:

- Keep planning short.
- Audit only files relevant to this milestone.
- Implement immediately after the plan.
- Work in vertical slices.
- Do not create fake real-world data.
- Do not scrape uncontrolled sources.
- Do not commit .env, node_modules, uploads, logs or test results.
- No file should exceed 220 lines.
- Every new feature must include validation, tests and docs where relevant.
- If context/credits are running low, stop implementation and write HANDOFF.md and NEXT_CODEX_PROMPT.md.

Start by auditing the relevant files, then continue the current subtask.
