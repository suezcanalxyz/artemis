You are continuing development of ARTEMIS.

First read:

- AGENTS.md
- ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md
- docs/ROADMAP.md
- HANDOFF.md if present
- NEXT_CODEX_PROMPT.md if present

Do not re-explain the whole product. Use those files as project memory.

Current milestone:
workflow-install

Current subtask:
Install Codex workflow pack

Recent changed files:

- .dockerignore
- .env.example
- .env.production.example
- .gitignore
- .husky/
- .prettierrc.json
- AGENTS.md
- ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md
- Caddyfile
- Dockerfile
- README.md
- agents/
- "artemis-federated-cultural-backend (3).zip"
- commitlint.config.js
- desktop.ini
- docker-compose.prod.yml
- docker-compose.yml
- docs/
- e2e/
- eslint.config.js
- migrations/
- package-lock.json
- package.json
- playwright.config.ts
- scripts/
- src/
- tests/
- tsconfig.json
- uploads/
- vitest.config.ts

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
